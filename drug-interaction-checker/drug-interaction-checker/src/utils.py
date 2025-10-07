import os
import json
import logging
from pathlib import Path
from dotenv import load_dotenv

# External APIs
import openai
import google.generativeai as genai

# -------------------------------
# Logging setup
# -------------------------------
LOG_DIR = Path(__file__).resolve().parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / "app.log"

logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s — %(levelname)s — %(name)s — %(message)s",
)
logger = logging.getLogger("drug_rag_app")

# -------------------------------
# Env
# -------------------------------
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

# -------------------------------
# Utility functions
# -------------------------------
def clean_drug_name(name: str) -> str:
    """Normalize drug name for caching and API calls."""
    return name.strip().lower().replace(" ", "_")


def save_cache(drug: str, data: dict, cache_dir="cache"):
    """Save FDA result to cache."""
    cache_dir = Path(cache_dir)
    cache_dir.mkdir(exist_ok=True)
    path = cache_dir / f"{clean_drug_name(drug)}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def load_cache(drug: str, cache_dir="cache"):
    """Load cached FDA result if available."""
    path = Path(cache_dir) / f"{clean_drug_name(drug)}.json"
    if path.exists():
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning("Cache load failed for %s: %s", drug, e)
    return None


def load_sample_labels(sample_file):
    """Load sample labels from a file (ensures Path)."""
    sample_file = Path(sample_file)
    if sample_file.exists():
        try:
            with open(sample_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error("Failed to read sample labels: %s", e)
            return {}
    return {}

# -------------------------------
# Gemini helper
# -------------------------------
def list_gemini_models():
    """Return a list of available Gemini models."""
    try:
        if not GOOGLE_API_KEY:
            return ["❌ No GOOGLE_API_KEY set"]
        models = genai.list_models()
        return [m.name for m in models if "generateContent" in m.supported_generation_methods]
    except Exception as e:
        logger.error("Gemini model listing failed: %s", e)
        return [f"Error: {e}"]

# -------------------------------
# API connectivity check
# -------------------------------
def show_api_status():
    import streamlit as st

    st.subheader("🔌 API Connectivity Check")

    # Test OpenAI
    openai_status = "❌ Not available"
    if OPENAI_API_KEY:
        try:
            resp = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=5,
            )
            msg = resp.choices[0].message.content.strip()
            openai_status = f"✅ OpenAI working: '{msg}'"
        except Exception as e:
            openai_status = f"⚠️ OpenAI error: {str(e)[:120]}"
    st.markdown(f"<h3 style='color:blue;'>{openai_status}</h3>", unsafe_allow_html=True)

    # Test Gemini
    gemini_status = "❌ Not available"
    if GOOGLE_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            resp = model.generate_content("Hello Gemini!")
            msg = resp.text.strip()
            gemini_status = f"✅ Gemini working: '{msg}'"
        except Exception as e:
            gemini_status = f"⚠️ Gemini error: {str(e)[:120]}"
    st.markdown(f"<h3 style='color:green;'>{gemini_status}</h3>", unsafe_allow_html=True)

    # Show available Gemini models
    st.write("Available Gemini models:")
    st.json(list_gemini_models())
