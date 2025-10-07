import os
import math
import json
import traceback
import requests
from typing import List, Dict, Any
from .utils import logger, clean_drug_name

# try to import langchain pieces; if they fail we'll provide a clear fallback
_langchain_available = True
try:
    from langchain.chat_models import ChatOpenAI
    from langchain.embeddings import OpenAIEmbeddings
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain.vectorstores import FAISS
    from langchain.chains import RetrievalQA
except Exception as e:
    _langchain_available = False
    logger.warning("LangChain components not available: %s", e)

# try import Google Gemini library
_gemini_available = True
try:
    import google.generativeai as genai
    if os.getenv("GOOGLE_API_KEY"):
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    else:
        raise RuntimeError("GOOGLE_API_KEY not set in environment for Gemini fallback")
except Exception as e:
    _gemini_available = False
    logger.warning("Gemini API not available: %s", e)

# try import openai library as final LLM fallback
_openai_available = True
try:
    import openai
except Exception:
    _openai_available = False
    logger.warning("openai package not available; install it for fallback LLM usage.")

# ------------------ Allergy-specific integration ------------------
ALLERGY_TERMS = [
    "allergic reaction", "rash", "hives", "urticaria",
    "anaphylaxis", "angioedema"
]

def query_openfda_allergies(drug_name: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Query openFDA FAERS for allergy-related adverse events for a given drug.
    Returns a list of dicts with 'drug', 'reaction', and 'serious'.
    """
    base_url = "https://api.fda.gov/drug/event.json"
    results = []
    for term in ALLERGY_TERMS:
        query = f'patient.drug.medicinalproduct:{drug_name}+AND+patient.reaction.reactionmeddrapt:"{term}"'
        url = f"{base_url}?search={query}&limit={limit}"
        try:
            r = requests.get(url, timeout=5)
            if r.status_code == 200:
                data = r.json()
                for item in data.get("results", []):
                    reaction_list = item.get("patient", {}).get("reaction", [])
                    for rct in reaction_list:
                        if term.lower() in rct.get("reactionmeddrapt", "").lower():
                            results.append({
                                "drug": drug_name,
                                "reaction": rct.get("reactionmeddrapt"),
                                "serious": rct.get("serious", None)
                            })
        except Exception as e:
            logger.warning(f"Failed to query openFDA for {drug_name}: {e}")
    return results

def allergy_summary_context(drug_list: List[str]) -> List[str]:
    """
    Build textual allergy context for each drug from openFDA data.
    Includes explicit note if no allergic reactions are reported.
    """
    contexts = []
    for drug in drug_list:
        allergy_data = query_openfda_allergies(drug)
        if allergy_data:
            for a in allergy_data:
                contexts.append(
                    f"openFDA reports: {a['drug']} caused {a['reaction']}"
                    + (f", serious: {a['serious']}" if a['serious'] else "")
                )
        else:
            # Explicit note that no allergy was reported
            contexts.append(f"openFDA reports: No allergic reactions found for {drug}.")
    return contexts

# ------------------ Prompt / fallback helpers ------------------
def _safe_prompt_for_llm(drug_list: List[str], contexts: List[str]) -> str:
    header = (
        "You are an assistant that summarizes potential drug interactions using "
        "the provided authoritative extracts. Use plain language suitable for a non-medical audience. "
        "If evidence indicates no interaction, say 'No major interaction found based on the provided sources.' "
    )
    drug_line = f"Drugs to evaluate: {', '.join(drug_list)}\n\n"
    ctx = "\n\n---\n\n".join(contexts[:8])  # limit contexts
    prompt = f"{header}\n\n{drug_line}\n\nRelevant extracts:\n{ctx}\n\nNow, summarize the potential interactions and the confidence of the evidence. Give a one-line top-level verdict and a short explanation. Cite 'openFDA' or 'sample' where appropriate if present in the extracts."
    return prompt

def _simple_fallback_summary(drug_list: List[str], contexts: List[str]) -> str:
    combined = " ".join(contexts).lower()
    verdict = "No major interaction found based on the provided extracts."
    reasons = []
    if "antibiotic" in combined and "anticoagulant" in combined:
        verdict = "Potential interaction: Antibiotics may increase the effect of anticoagulants (bleeding risk)."
        reasons.append("Texts mention antibiotics and anticoagulants together.")
    if "cyp3a4" in combined or "cyp3a4 inhibitors" in combined:
        verdict = "Potential interaction: CYP3A4-mediated interaction (one drug may change levels of the other)."
        reasons.append("CYP3A4 inhibitors/substrates mentioned in label text.")
    if "qt" in combined or "qtc" in combined or "torsade" in combined:
        verdict = "Potential interaction: Combined QT-prolonging risk."
        reasons.append("QT prolongation terms found in extracts.")
    if not reasons:
        reasons.append("No specific mechanism or interaction terms found in extracts.")
    return f"{verdict}\n\nReasoning:\n- " + "\n- ".join(reasons)

# ------------------ Main RAG pipeline ------------------
def run_rag_pipeline(all_texts: List[str], drug_list: List[str], top_k: int = 5, use_openai: bool = True) -> Dict[str, Any]:
    """
    Runs the RAG pipeline with:
      - LangChain embeddings + FAISS retrieval if available
      - LLM summarization via LangChain, Gemini, or OpenAI
      - Allergy-specific context from openFDA
      - Fallback to simple summary if all else fails
    """
    debug = {"steps": [], "errors": [], "notes": []}
    try:
        # -----------------------------
        # 1) Split texts into chunks
        # -----------------------------
        debug["steps"].append("splitting_texts")
        if _langchain_available:
            try:
                text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=80)
                docs = text_splitter.create_documents(all_texts)
                contexts = [d.page_content for d in docs]
                debug["steps"].append(f"langchain_split: created {len(contexts)} chunks")
            except Exception as e:
                debug["errors"].append(f"text_split_error: {repr(e)}")
                logger.exception("Text splitting failed: %s", e)
                contexts = all_texts.copy()
        else:
            contexts = []
            for t in all_texts:
                if not t:
                    continue
                size = 1000
                for i in range(0, len(t), size):
                    contexts.append(t[i:i+size])
            debug["steps"].append(f"naive_split: created {len(contexts)} chunks")

        # -----------------------------
        # 2) Retrieve relevant contexts
        # -----------------------------
        retrieved_contexts = []
        if _langchain_available:
            try:
                debug["steps"].append("attempting_langchain_embeddings_and_faiss")
                embeddings = OpenAIEmbeddings()
                try:
                    db = FAISS.from_documents([type("D", (), {"page_content": c})() for c in contexts], embeddings)
                    retriever = db.as_retriever(search_kwargs={"k": top_k})
                    query = " ".join(drug_list)
                    retrieved_docs = retriever.get_relevant_documents(query)
                    retrieved_contexts = [d.page_content for d in retrieved_docs]
                    debug["steps"].append(f"faiss_retrieved: {len(retrieved_contexts)}")
                except Exception as e:
                    debug["errors"].append(f"faiss_error: {repr(e)}")
                    logger.exception("FAISS creation/retrieval failed: %s", e)
                    debug["steps"].append("fallback_to_embed_similarity")
                    doc_vecs = embeddings.embed_documents(contexts)
                    query_vec = embeddings.embed_query(" ".join(drug_list))
                    def cosine(a, b):
                        dot = sum(x * y for x, y in zip(a, b))
                        na = math.sqrt(sum(x * x for x in a))
                        nb = math.sqrt(sum(y * y for y in b))
                        return dot / (na * nb + 1e-12)
                    sims = [(i, cosine(query_vec, v)) for i, v in enumerate(doc_vecs)]
                    sims.sort(key=lambda x: x[1], reverse=True)
                    top = sims[:top_k]
                    retrieved_contexts = [contexts[i] for i, _ in top]
                    debug["steps"].append(f"embed_similarity_retrieved: {len(retrieved_contexts)}")
            except Exception as e:
                debug["errors"].append(f"embeddings_or_faiss_error: {repr(e)}")
                logger.exception("Embeddings or FAISS path failed: %s", e)
        else:
            debug["steps"].append("no_langchain: naive retrieval")
            q = " ".join(drug_list).lower()
            scored = []
            for i, c in enumerate(contexts):
                score = sum(1 for token in q.split() if token in c.lower())
                scored.append((i, score))
            scored.sort(key=lambda x: x[1], reverse=True)
            retrieved_contexts = [contexts[i] for i, s in scored[:top_k]]
            debug["steps"].append(f"naive_retrieved: {len(retrieved_contexts)}")

        if not retrieved_contexts:
            debug["notes"].append("no_context_retrieved_using_all_texts")
            retrieved_contexts = contexts[:min(len(contexts), top_k)]

        # -----------------------------
        # 2a) Integrate openFDA allergy data
        # -----------------------------
        allergy_contexts = allergy_summary_context(drug_list)
        if allergy_contexts:
            debug["steps"].append(f"allergy_contexts_added: {len(allergy_contexts)}")
            retrieved_contexts.extend(allergy_contexts)
        else:
            debug["notes"].append("no_allergy_context_found_in_openfda")

        # -----------------------------
        # 3) Build prompt
        # -----------------------------
        prompt = _safe_prompt_for_llm(drug_list, retrieved_contexts)
        debug["steps"].append("built_prompt_for_llm")

        # -----------------------------
        # 4) Try LangChain ChatOpenAI
        # -----------------------------
        if _langchain_available and use_openai:
            try:
                debug["steps"].append("attempting_langchain_llm_call")
                llm = ChatOpenAI(model_name="gpt-4o-mini", temperature=0.0)
                try:
                    answer = llm.predict(prompt)
                except Exception:
                    answer = llm(prompt)
                debug["steps"].append("langchain_llm_success")
                return {"success": True, "answer": answer, "debug": debug}
            except Exception as e:
                debug["errors"].append(f"langchain_llm_error: {repr(e)}")
                logger.exception("LangChain LLM call failed: %s", e)

        # -----------------------------
        # 5) Try Gemini API
        # -----------------------------
        if _gemini_available:
            try:
                debug["steps"].append("attempting_gemini_api_call")
                model = genai.GenerativeModel("models/gemini-flash-latest")
                resp = model.generate_content(prompt)
                answer = getattr(resp, "text", None) or getattr(resp.candidates[0].content.parts[0], "text", "")
                answer = answer.strip() if answer else None
                if answer:
                    debug["steps"].append("gemini_api_success")
                    return {"success": True, "answer": answer, "debug": debug}
            except Exception as e:
                debug["errors"].append(f"gemini_api_error: {repr(e)}\n{traceback.format_exc()}")
                logger.exception("Gemini API path failed: %s", e)

        # -----------------------------
        # 6) Direct OpenAI fallback
        # -----------------------------
        if _openai_available and use_openai:
            try:
                debug["steps"].append("attempting_openai_api_call")
                key = os.getenv("OPENAI_API_KEY", None)
                if not key:
                    raise RuntimeError("OPENAI_API_KEY not set in environment for openai fallback")
                openai.api_key = key

                model = "gpt-4o-mini"
                try:
                    resp = openai.chat.completions.create(
                        model=model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.0,
                        max_tokens=650
                    )
                except Exception as e:
                    logger.warning("openai model %s failed: %s, falling back to gpt-3.5-turbo", model, e)
                    resp = openai.chat.completions.create(
                        model="gpt-3.5-turbo",
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.0,
                        max_tokens=650
                    )
                answer = resp["choices"][0]["message"]["content"].strip()
                debug["steps"].append("openai_api_success")
                return {"success": True, "answer": answer, "debug": debug}
            except Exception as e:
                debug["errors"].append(f"openai_api_error: {repr(e)}\n{traceback.format_exc()}")
                logger.exception("OpenAI API path failed: %s", e)

        # -----------------------------
        # 7) Final fallback
        # -----------------------------
        fallback = _simple_fallback_summary(drug_list, retrieved_contexts)
        debug["notes"].append("used_simple_fallback_summary")
        return {"success": True, "answer": fallback, "debug": debug}

    except Exception as e:
        logger.exception("Unexpected error in run_rag_pipeline: %s", e)
        debug["errors"].append(f"unexpected_error: {repr(e)}\n{traceback.format_exc()}")
        return {"success": False, "answer": None, "debug": debug}
