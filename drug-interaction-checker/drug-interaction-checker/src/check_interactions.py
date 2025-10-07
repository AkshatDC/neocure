#!/usr/bin/env python3
"""
Standalone script to check drug interactions
Called by Node.js backend via subprocess
"""
import sys
import json
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from fda_api import fetch_fda_label
from rag_pipeline import run_rag_pipeline
from utils import load_sample_labels

def check_interactions(drug_list):
    """
    Check interactions for a list of drugs
    Returns JSON result
    """
    try:
        # Fetch FDA labels
        all_texts = []
        fda_results = {}
        
        for drug in drug_list:
            try:
                result = fetch_fda_label(drug)
                fda_results[drug] = result
                if result.get('success') and result.get('text'):
                    all_texts.append(f"{drug}:\n{result.get('text')}")
            except Exception as e:
                print(f"Error fetching {drug}: {e}", file=sys.stderr)
        
        # Fallback to sample labels if needed
        if not all_texts:
            sample_labels_path = Path(__file__).parent.parent / 'data' / 'sample_labels.json'
            sample_labels = load_sample_labels(str(sample_labels_path))
            for drug in drug_list:
                label_text = sample_labels.get(drug, f"No data for {drug}")
                all_texts.append(f"{drug}:\n{label_text}")
        
        # Run RAG pipeline
        rag_result = run_rag_pipeline(all_texts, drug_list, top_k=5)
        
        # Parse severity from LLM response
        severity = parse_severity(rag_result.get('answer', ''))
        
        # Determine if interaction detected
        interaction_detected = severity not in ['NONE', 'MILD']
        
        # Extract alternatives if mentioned
        safer_alternatives = extract_alternatives(rag_result.get('answer', ''))
        
        return {
            'success': True,
            'interactionDetected': interaction_detected,
            'severity': severity,
            'description': rag_result.get('answer', 'No analysis available'),
            'summary': rag_result.get('answer', ''),
            'llm_summary': rag_result.get('answer', ''),
            'saferAlternatives': safer_alternatives,
            'alternatives': safer_alternatives,
            'fdaData': fda_results,
            'source': 'openFDA + RAG + LLM',
            'debug': rag_result.get('debug', {})
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'interactionDetected': False,
            'severity': 'UNKNOWN',
            'description': f'Error during analysis: {str(e)}'
        }

def parse_severity(text):
    """Extract severity from LLM response"""
    text_lower = text.lower()
    if 'critical' in text_lower or 'contraindicated' in text_lower:
        return 'CRITICAL'
    elif 'severe' in text_lower or 'major' in text_lower:
        return 'SEVERE'
    elif 'moderate' in text_lower:
        return 'MODERATE'
    elif 'mild' in text_lower or 'minor' in text_lower:
        return 'MILD'
    elif 'no interaction' in text_lower or 'no significant' in text_lower:
        return 'NONE'
    else:
        return 'MODERATE'  # Default to moderate if unclear

def extract_alternatives(text):
    """Try to extract alternative drug suggestions from LLM response"""
    alternatives = []
    
    # Simple keyword-based extraction
    if 'alternative' in text.lower() or 'instead' in text.lower():
        # This is a simple heuristic; could be improved with NLP
        lines = text.split('\n')
        for line in lines:
            if 'alternative' in line.lower() or 'consider' in line.lower():
                # Extract drug names (very basic)
                words = line.split()
                for word in words:
                    if word[0].isupper() and len(word) > 3:
                        alternatives.append(word.strip('.,;:'))
    
    return alternatives[:3]  # Return max 3 alternatives

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'No drugs provided. Usage: python check_interactions.py \'["drug1", "drug2"]\''
        }))
        sys.exit(1)
    
    try:
        # Parse drug list from command line argument
        drugs_json = sys.argv[1]
        drugs = json.loads(drugs_json)
        
        if not isinstance(drugs, list) or len(drugs) < 2:
            print(json.dumps({
                'success': False,
                'error': 'Please provide at least 2 drugs as a JSON array'
            }))
            sys.exit(1)
        
        # Check interactions
        result = check_interactions(drugs)
        
        # Output JSON result
        print(json.dumps(result))
        sys.exit(0)
    
    except json.JSONDecodeError as e:
        print(json.dumps({
            'success': False,
            'error': f'Invalid JSON input: {str(e)}'
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        }))
        sys.exit(1)
