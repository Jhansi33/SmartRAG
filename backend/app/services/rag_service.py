import logging
from datetime import datetime
from bson import ObjectId
from app.config import settings
from app.database.connection import get_db
from app.vectorstore.store import vector_store
from app.utils.evaluator import RAGEvaluator

logger = logging.getLogger(__name__)

class RAGService:
    @staticmethod
    def _generate_offline_answer(question: str, sources: list[dict]) -> str:
        """Synthesize a beautiful, professional markdown response using retrieved sources locally."""
        if not sources:
            return "I could not find relevant information in the knowledge base."
            
        # Standardize matching concepts to construct sentences
        paragraphs = []
        for i, src in enumerate(sources[:3]): # Use top 3 sources for synthesis
            snippet = src["snippet"].strip()
            # Clean up whitespace and capitalize nicely
            if not snippet.endswith((".", "!", "?")):
                snippet += "..."
            paragraphs.append(f"- **From {src['filename']} (Confidence: {int(src['score']*100)}%):** {snippet}")
            
        intro = f"Based on the enterprise database, here is the relevant information regarding your query about *\"{question}\"*:\n\n"
        details = "\n\n".join(paragraphs)
        conclusion = "\n\nIf you need more specific assistance, please feel free to review the attached document references or ask another follow-up question!"
        
        return f"{intro}{details}{conclusion}"

    @staticmethod
    async def _generate_llm_answer(question: str, context: str, provider: str, api_key: str) -> str:
        """Generate advanced synthesis utilizing external LLM (OpenAI or Gemini) if keys are provided."""
        # Simple, robust implementations using standard HTTP requests to avoid langchain dependency bugs
        import httpx
        try:
            prompt = (
                f"You are a professional enterprise Q&A assistant. Answer the user's question clearly and truthfully "
                f"using ONLY the provided context. If the answer is not in the context, output exactly: "
                f"\"I could not find relevant information in the knowledge base.\"\n\n"
                f"Context:\n{context}\n\n"
                f"Question: {question}\n\n"
                f"Answer (formatted as clean markdown):"
            )
            
            if provider == "openai":
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {"role": "system", "content": "You are a professional assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2
                }
                async with httpx.AsyncClient() as client:
                    resp = await client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers, timeout=10.0)
                    if resp.status_code == 200:
                        return resp.json()["choices"][0]["message"]["content"].strip()
                        
            elif provider == "gemini":
                # Standard Google Gemini API call
                headers = {"Content-Type": "application/json"}
                payload = {
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }]
                }
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                async with httpx.AsyncClient() as client:
                    resp = await client.post(url, json=payload, headers=headers, timeout=10.0)
                    if resp.status_code == 200:
                        return resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception as e:
            logger.warning(f"Failed to generate response using {provider} LLM: {str(e)}. Falling back to offline synthesis.")
            
        return ""

    @classmethod
    async def ask_chatbot(cls, user_id: str, question: str, limit: int = 10, db = None) -> dict:
        """RAG core pipeline: Query -> Retrieve -> Evaluate -> Synthesize -> Log -> Respond."""
        # 1. Retrieve top 4 similar chunks from the vector database
        retrieved = vector_store.search(question, top_k=4)
        
        # 2. Check if relevant content is found (Score threshold of 0.55)
        # Score is normalized between 0.0 and 1.0 (where 0.5 is neutral)
        has_relevance = len(retrieved) > 0 and retrieved[0]["score"] >= 0.55
        
        if not has_relevance:
            answer = "I could not find relevant information in the knowledge base."
            sources = []
        else:
            sources = retrieved
            # 3. Generate answer: Try LLM first if environment keys exist, otherwise fall back offline
            answer = ""
            context_str = "\n\n".join([f"Source [{s['filename']}]: {s['snippet']}" for s in sources])
            
            if settings.OPENAI_API_KEY:
                answer = await cls._generate_llm_answer(question, context_str, "openai", settings.OPENAI_API_KEY)
            elif settings.GEMINI_API_KEY:
                answer = await cls._generate_llm_answer(question, context_str, "gemini", settings.GEMINI_API_KEY)
                
            if not answer:
                answer = cls._generate_offline_answer(question, sources)

        # 4. Generate dynamic suggested questions based on question keywords
        suggested = cls._generate_suggested_questions(question)

        # 5. Evaluate response performance
        metrics = RAGEvaluator.calculate_metrics(question, answer, sources)
        
        # 6. Save evaluation log to MongoDB
        eval_log = {
            "retrievalAccuracy": metrics["retrievalAccuracy"],
            "precisionAtK": metrics["precisionAtK"],
            "recallAtK": metrics["recallAtK"],
            "answerRelevance": metrics["answerRelevance"],
            "responseQuality": metrics["responseQuality"],
            "createdAt": datetime.utcnow()
        }
        await db.evaluations.insert_one(eval_log)

        # 7. Format sources for history log
        history_sources = [{"filename": s["filename"], "score": s["score"], "snippet": s["snippet"]} for s in sources]

        # 8. Save chat item to conversation history
        chat_log = {
            "userId": user_id,
            "question": question,
            "response": answer,
            "retrievedSources": history_sources,
            "timestamp": datetime.utcnow()
        }
        await db.chat_history.insert_one(chat_log)

        return {
            "answer": answer,
            "sources": sources,
            "suggestedQuestions": suggested
        }

    @staticmethod
    def _generate_suggested_questions(question: str) -> list[str]:
        """Generate contextual questions to prompt interaction."""
        q = question.lower()
        if "referral" in q or "partner" in q:
            return ["How are referral leads tracked?", "What is the partner commission structure?", "Are contractors eligible for commissions?"]
        elif "security" in q or "password" in q or "access" in q:
            return ["How are database credentials encrypted?", "What is the policy for password rotations?", "How do I request admin access?"]
        elif "deployment" in q or "ci/cd" in q or "pipeline" in q:
            return ["What steps occur in the staging pipeline?", "Who approves production hotfixes?", "Where are docker build logs stored?"]
        else:
            return ["What security protocols are standard?", "Can you explain the partner referral guidelines?", "How does database indexing work?"]
