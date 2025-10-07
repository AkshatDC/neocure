# Drug Interaction Checker (openFDA + RAG + LLM) — Hackathon Demo

## Overview
Streamlit demo that:
- fetches FDA label sections for given drugs via openFDA,
- stores/retrieves label text in a mini RAG pipeline (FAISS or fallback),
- summarizes potential interactions using an LLM (OpenAI),
- shows transparent debug logs & errors for troubleshooting.

## Setup
1. Copy `.env.template` to `.env` and add your `OPENAI_API_KEY`.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
