import re
import logging
from app.config import settings

logger = logging.getLogger(__name__)

# Standard stop words list to filter out common conversational pronouns and prepositions
STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "arent", "as", "at",
    "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "cant", "cannot", "could",
    "couldnt", "did", "didnt", "do", "does", "doesnt", "doing", "dont", "down", "during", "each", "few", "for",
    "from", "further", "had", "hadnt", "has", "hasnt", "have", "havent", "having", "he", "hed", "hell", "hes",
    "her", "here", "heres", "hers", "herself", "him", "himself", "his", "how", "hows", "i", "id", "ill", "im",
    "ive", "if", "in", "into", "is", "isnt", "it", "its", "itself", "lets", "me", "more", "most", "mustnt", "my",
    "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours",
    "ourselves", "out", "over", "own", "same", "shant", "she", "shed", "shell", "shes", "should", "shouldnt",
    "so", "some", "such", "than", "that", "thats", "the", "their", "theirs", "them", "themselves", "then",
    "there", "theres", "these", "they", "theyd", "theyll", "theyre", "theyve", "this", "those", "through",
    "to", "too", "under", "until", "up", "very", "was", "wasnt", "we", "wed", "well", "were", "weve", "werent",
    "what", "whats", "when", "whens", "where", "wheres", "which", "while", "who", "whos", "whom", "why", "whys",
    "with", "wont", "would", "wouldnt", "you", "youd", "youll", "youre", "youve", "your", "yours", "yourself",
    "yourselves", "work", "do", "how", "what", "can", "work", "works", "use", "using", "workings"
}

class TaggerService:
    @staticmethod
    def _extract_offline_tags(question: str, answer: str) -> str:
        """Analyze content and extract 4-8 technical keywords using offline heuristics."""
        combined_text = f"{question} {answer}".lower()
        
        # Clean text: remove special characters, keep letters and spaces
        cleaned = re.sub(r"[^\w\s\-]", " ", combined_text)
        
        # Split into words
        words = cleaned.split()
        
        # Build candidate tags (nouns, compound nouns, or technical phrases)
        candidates = []
        
        # 1. Look for specific multi-word patterns (bi-grams) commonly used in technology
        bigrams = []
        for i in range(len(words) - 1):
            w1, w2 = words[i], words[i+1]
            if w1 not in STOP_WORDS and w2 not in STOP_WORDS:
                bigrams.append(f"{w1} {w2}")
                
        # 2. Singular terms filtering out stop words and short elements
        single_words = []
        for w in words:
            if len(w) > 3 and w not in STOP_WORDS:
                # Basic singularization helper
                if w.endswith("ies"):
                    w = w[:-3] + "y"
                elif w.endswith("s") and not w.endswith("ss"):
                    w = w[:-1]
                single_words.append(w)
                
        # Count frequencies
        from collections import Counter
        single_counter = Counter(single_words)
        bigram_counter = Counter(bigrams)
        
        # Grab top bi-grams as they are highly specific (e.g. "partner referrals", "database indexing")
        for bg, count in bigram_counter.most_common(3):
            candidates.append(bg)
            
        # Add single keywords
        for sg, count in single_counter.most_common(10):
            if sg not in candidates:
                candidates.append(sg)
                
        # Filter overlapping tags (e.g., if we have 'partner referral', remove 'referral' or 'partner' unless very frequent)
        final_tags = []
        for cand in candidates:
            # Check if candidate is a substring of an already selected larger tag
            is_subset = False
            for existing in final_tags:
                if cand in existing and cand != existing:
                    is_subset = True
                    break
            if not is_subset and cand.strip():
                final_tags.append(cand.strip())
                
        # Ensure we have between 4 and 8 tags
        # If we have less, fill up with domain default tags based on text content
        domain_mapping = {
            "referral": ["referrals", "partner", "agency", "marketing", "referral logic"],
            "password": ["security", "passwords", "credentials", "compliance", "authentication"],
            "database": ["database", "indexing", "sql", "performance", "optimization"],
            "staging": ["ci/cd", "deployment", "pipelines", "release", "devops"],
            "api": ["api", "endpoints", "fastapi", "rest", "integration"],
            "docker": ["docker", "containers", "deployment", "infrastructure"]
        }
        
        for keyword, fillers in domain_mapping.items():
            if keyword in combined_text:
                for f in fillers:
                    if f not in final_tags:
                        final_tags.append(f)
                        
        # Crop tags to range [4, 8]
        final_tags = final_tags[:8]
        if len(final_tags) < 4:
            # Absolute fallback in case text was too short
            defaults = ["technical", "faq", "database", "chatbot"]
            for d in defaults:
                if d not in final_tags:
                    final_tags.append(d)
                    
        return ", ".join(final_tags[:8])

    @classmethod
    async def _generate_llm_tags(cls, question: str, answer: str, provider: str, api_key: str) -> str:
        """Call external LLM to generate precise tags."""
        import httpx
        try:
            prompt = (
                f"Analyze the following Question and Answer and generate between 4 to 8 highly relevant, short, "
                f"focused, technical tags. Output ONLY as a comma-separated string, nothing else.\n\n"
                f"Question: \"{question}\"\n"
                f"Answer: \"{answer}\"\n\n"
                f"Tags (comma-separated):"
            )
            
            if provider == "openai":
                headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
                payload = {
                    "model": "gpt-3.5-turbo",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1
                }
                async with httpx.AsyncClient() as client:
                    resp = await client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers, timeout=5.0)
                    if resp.status_code == 200:
                        return resp.json()["choices"][0]["message"]["content"].strip()
                        
            elif provider == "gemini":
                headers = {"Content-Type": "application/json"}
                payload = {"contents": [{"parts": [{"text": prompt}]}]}
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                async with httpx.AsyncClient() as client:
                    resp = await client.post(url, json=payload, headers=headers, timeout=5.0)
                    if resp.status_code == 200:
                        return resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception:
            pass
        return ""

    @classmethod
    async def generate_tags(cls, question: str, answer: str) -> str:
        """Central entry point to analyze input and generate 4-8 comma-separated tags."""
        tags = ""
        if settings.OPENAI_API_KEY:
            tags = await cls._generate_llm_tags(question, answer, "openai", settings.OPENAI_API_KEY)
        elif settings.GEMINI_API_KEY:
            tags = await cls._generate_llm_tags(question, answer, "gemini", settings.GEMINI_API_KEY)
            
        if not tags:
            tags = cls._extract_offline_tags(question, answer)
            
        # Standardize formatting: lowercase, strip, remove duplicates
        cleaned_tags = []
        for t in tags.split(","):
            cleaned_term = t.strip().lower()
            if cleaned_term and cleaned_term not in cleaned_tags:
                cleaned_tags.append(cleaned_term)
                
        return ", ".join(cleaned_tags[:8])
