import os
import json
import traceback
import streamlit as st
from dotenv import load_dotenv
from src.fda_api import fetch_fda_label
from src.rag_pipeline import run_rag_pipeline
from src.utils import load_sample_labels, logger, show_api_status

# -------------------------------
# Load environment
# -------------------------------
load_dotenv()

# -------------------------------
# Streamlit page config
# -------------------------------
st.set_page_config(page_title="Drug Interaction Checker", layout="wide", page_icon="💊")
st.title("Drug Interaction Checker — openFDA + RAG + LLM (Hackathon Demo)")

st.markdown(
    """
Enter drug names (comma separated) or use the example.  
The app fetches openFDA label text (fallback to sample dataset),  
retrieves relevant chunks (FAISS or fallback), then asks an LLM to summarize interactions.  
All steps are logged and visible in the Debug panel.
"""
)

# -------------------------------
# 🔍 API Connectivity Check (NEW)
# -------------------------------
st.markdown("---")
show_api_status()
st.markdown("---")

# -------------------------------
# Sidebar
# -------------------------------
with st.sidebar:
    st.header("Inputs & Actions")
    example = st.button("Load example: Amoxicillin + Warfarin")
    st.write("Ensure you set `OPENAI_API_KEY` and/or `GOOGLE_API_KEY` in `.env` for LLM features.")
    st.write("Logs are stored in `logs/app.log` and shown in the Debug area here.")

if example:
    st.session_state["drug_input"] = "Amoxicillin, Warfarin"

drug_input = st.text_input(
    "Drug names (comma separated):",
    value=st.session_state.get("drug_input", "Amoxicillin, Warfarin")
)

# -------------------------------
# Sample labels
# -------------------------------
sample_labels_path = os.path.join("data", "sample_labels.json")
sample_labels = load_sample_labels(sample_labels_path)

# -------------------------------
# Columns
# -------------------------------
col1, col2 = st.columns([2, 1])

with col1:
    if st.button("Check Interactions"):
        drug_list = [d.strip() for d in drug_input.split(",") if d.strip()]
        st.info(f"Checking: {', '.join(drug_list)}")

        all_texts = []
        fetch_results = {}
        for d in drug_list:
            try:
                res = fetch_fda_label(d)
                fetch_results[d] = res
                if res.get("success") and res.get("text"):
                    all_texts.append(f"{d}:\n{res.get('text')}")
                else:
                    st.warning(
                        f"No label text for '{d}'. "
                        f"Reason: {res.get('error')[:200] if res.get('error') else 'unknown'}"
                    )
            except Exception as e:
                logger.exception("Unhandled exception while fetching %s: %s", d, e)
                st.error(f"Unhandled error fetching {d}: {e}")

        if not all_texts:
            # fallback to sample_labels
            used_sample = True
            for d in drug_list:
                label_text = sample_labels.get(d, f"No sample data for {d}")
                all_texts.append(f"{d}:\n{label_text}")
            st.markdown(
                "<h1 style='color:red;'>⚠️ Using Sample Labels (fallback)</h1>",
                unsafe_allow_html=True,
            )
        else:
            used_sample = False
            st.markdown(
                "<h2 style='color:green;'>✅ OpenFDA data fetched</h2>",
                unsafe_allow_html=True,
            )

        # Run RAG pipeline
        st.info("Running RAG pipeline (this may take a few seconds)...")
        try:
            result = run_rag_pipeline(all_texts, drug_list, top_k=5)
            if result.get("success"):
                st.subheader("Summary (LLM / fallback):")
                st.write(result.get("answer"))
            else:
                st.error("RAG pipeline failed. See Debug for details.")

            # Show debug info
            st.subheader("Debug")
            st.write("Pipeline debug summary:")
            st.json(result.get("debug", {}))

        except Exception as e:
            st.error(f"❌ RAG pipeline failed: {e}")
            logger.exception("Pipeline failure: %s", e)

        st.markdown("---")
        st.write("Fetch results per drug (brief):")
        for d, r in fetch_results.items():
            st.write(f"**{d}** — source: {r.get('source')}, success: {r.get('success')}")
            if not r.get("success"):
                st.write("  Error: " + str(r.get("error") or "unknown"))

with col2:
    st.subheader("Debug → Logs")
    try:
        # display last 200 lines of log safely
        log_path = os.path.join(os.path.dirname(__file__), "logs", "app.log")
        if os.path.exists(log_path):
            with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()[-200:]
                st.text("".join(lines))
        else:
            st.text("No log file yet. Logs will appear here after you run a check.")
    except Exception as e:
        st.write("Error reading log file: " + str(e))
        logger.exception("Error reading log file: %s", e)

st.markdown("---")
st.caption(
    "This is a demo/hackathon app and not clinical decision support. "
    "For production, use licensed DDI data and clinical validation."
)
