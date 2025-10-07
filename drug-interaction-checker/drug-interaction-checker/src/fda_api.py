import requests
import os
import traceback
from typing import Dict, Any, Optional

from .utils import (
    clean_drug_name,
    save_cache,
    load_cache,
    load_sample_labels,
    logger,
)

OPENFDA_BASE = "https://api.fda.gov/drug/label.json"

def _make_label_text_from_result(result: Dict[str, Any]) -> str:
    pieces = []
    fields = ["warnings", "drug_interactions", "contraindications", "precautions"]
    for f in fields:
        if f in result:
            try:
                if isinstance(result[f], list):
                    pieces.append(f"{f.upper()}:\n" + "\n".join(result[f]))
                else:
                    pieces.append(f"{f.upper()}:\n" + str(result[f]))
            except Exception:
                pieces.append(f"{f.upper()}:\n" + str(result[f]))
    return "\n\n".join(pieces).strip()

def fetch_fda_label(drug_name: str, use_cache: bool = True, logger_debug: bool = True) -> Dict[str, Any]:
    drug_clean = clean_drug_name(drug_name)
    debug = {"steps": [], "errors": []}

    # 1. Try cache
    try:
        if use_cache:
            cached = load_cache(drug_clean)
            if cached:
                debug["steps"].append("Loaded from local cache")
                if logger_debug:
                    logger.debug("Loaded %s from cache", drug_clean)
                return {
                    "success": True,
                    "drug": drug_clean,
                    "text": cached.get("text"),
                    "source": "cache",
                    "raw": cached.get("raw"),
                    "debug": debug,
                }
    except Exception as e:
        debug["errors"].append(f"cache_error: {str(e)}")
        logger.exception("Cache load error for %s", drug_clean)

    # 2. Try openFDA
    try:
        params = {"search": f'openfda.generic_name:"{drug_name}"', "limit": 1}
        resp = requests.get(OPENFDA_BASE, params=params, timeout=10)
        debug["steps"].append(f"openfda_request: {resp.url} (status {resp.status_code})")
        if resp.status_code != 200:
            err = f"openFDA HTTP {resp.status_code} - {resp.text[:200]}"
            debug["errors"].append(err)
            logger.warning("openFDA non-200 for %s: %s", drug_clean, err)
        else:
            j = resp.json()
            if "results" in j and len(j["results"]) > 0:
                raw = j["results"][0]
                label_text = _make_label_text_from_result(raw)
                try:
                    save_cache(drug_clean, {"text": label_text, "raw": raw})
                except Exception:
                    logger.exception("Failed to save cache.")
                debug["steps"].append("Fetched from openFDA and cached")
                return {
                    "success": True,
                    "drug": drug_clean,
                    "text": label_text,
                    "source": "openfda",
                    "raw": raw,
                    "debug": debug,
                }
            else:
                debug["errors"].append("openFDA returned no results")
    except requests.exceptions.Timeout:
        debug["errors"].append("openFDA_timeout")
        logger.exception("openFDA timeout for %s", drug_clean)
    except Exception as e:
        logger.exception("openFDA exception for %s: %s", drug_clean, e)
        debug["errors"].append(f"openFDA_exception: {str(e)}\n{traceback.format_exc()}")

    # 3. Fallback to sample labels
    try:
        sample = load_sample_labels()
        if drug_clean in sample:
            entry = sample[drug_clean]
            sections = entry.get("sections", {})
            texts = []
            for k, v in sections.items():
                if isinstance(v, list):
                    texts.append(f"{k.upper()}:\n" + "\n".join(v))
                else:
                    texts.append(f"{k.upper()}:\n" + str(v))
            label_text = "\n\n".join(texts)
            debug["steps"].append("Loaded from sample dataset")
            if logger_debug:
                logger.info("Using sample label for %s", drug_clean)
            return {
                "success": True,
                "drug": drug_clean,
                "text": label_text,
                "source": "sample",
                "raw": entry,
                "debug": debug,
            }
        else:
            debug["errors"].append("No sample entry found")
    except Exception as e:
        logger.exception("Failed to load sample labels: %s", e)
        debug["errors"].append(f"sample_load_exception: {str(e)}")

    # final failure
    err_msg = f"No label found for '{drug_name}'. Steps: {debug['steps']}. Errors: {debug['errors']}"
    logger.warning(err_msg)
    return {
        "success": False,
        "drug": drug_clean,
        "text": None,
        "source": None,
        "error": err_msg,
        "debug": debug,
    }
