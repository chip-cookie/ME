from typing import Dict, List, Any
import logging
from collections import Counter

# Try to import kiwipiepy, fallback gracefully if not installed
try:
    from kiwipiepy import Kiwi
    # Initialize Kiwi (load default dictionary)
    kiwi = Kiwi()
    KIWI_AVAILABLE = True
except ImportError:
    KIWI_AVAILABLE = False
    kiwi = None

logger = logging.getLogger(__name__)

def analyze_morphology(text: str) -> Dict[str, Any]:
    """
    Analyzes the text using Kiwi morphological analyzer.
    Extracts ending suffixes (어미) and frequent chunk patterns.
    """
    if not KIWI_AVAILABLE or not text:
        return {
            "ending_suffixes": [],
            "frequent_chunks": [],
            "nlp_status": "unavailable_or_empty"
        }
        
    try:
        # Tokenize text
        tokens = kiwi.tokenize(text)
        
        # 1. Extract Ending Suffixes (종결 어미 - EF)
        ef_tokens = [t.form for t in tokens if t.tag == 'EF']
        ef_counter = Counter(ef_tokens)
        top_efs = [item[0] + "다/요" for item in ef_counter.most_common(5)] # Format for readability
        
        # 2. Extract Frequent Chunks
        # Simplified chunking: Noun + Verb/Adjective or Noun + Particle
        chunks = []
        for i in range(len(tokens) - 1):
            t1 = tokens[i]
            t2 = tokens[i+1]
            if t1.tag.startswith('N') and t2.tag.startswith(('V', 'J')):
                chunks.append(f"{t1.form}{t2.form}")
                
        chunk_counter = Counter(chunks)
        top_chunks = [item[0] for item in chunk_counter.most_common(5)]
        
        return {
            "ending_suffixes": [f"-{ef}" for ef in top_efs] if top_efs else [],
            "frequent_chunks": top_chunks,
            "nlp_status": "success"
        }
    except Exception as e:
        logger.error(f"Kiwi NLP Analysis failed: {e}")
        return {
            "ending_suffixes": [],
            "frequent_chunks": [],
            "nlp_status": "error"
        }
