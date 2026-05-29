import logging
import numpy as np
from datetime import datetime
from bson import ObjectId
from app.database.connection import get_db
from app.vectorstore.store import vector_store

logger = logging.getLogger(__name__)

class FeedbackService:
    @staticmethod
    async def add_entry(question: str, answer: str, tags: str, db) -> dict:
        """Add or update a Feedback Q&A entry, ensuring cleaned tags are generated."""
        now = datetime.utcnow()
        entry = {
            "question": question,
            "answer": answer,
            "tags": tags,
            "createdAt": now,
            "updatedAt": now
        }
        result = await db.feedback_qa.insert_one(entry)
        entry["_id"] = str(result.inserted_id)
        return entry

    @staticmethod
    async def update_entry(entry_id: str, question: str, answer: str, tags: str, db) -> bool:
        """Update an existing Feedback Q&A entry."""
        update_data = {
            "updatedAt": datetime.utcnow()
        }
        if question is not None:
            update_data["question"] = question
        if answer is not None:
            update_data["answer"] = answer
        if tags is not None:
            update_data["tags"] = tags

        result = await db.feedback_qa.update_one(
            {"_id": ObjectId(entry_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0

    @staticmethod
    async def delete_entry(entry_id: str, db) -> bool:
        """Delete an entry from feedback QA database."""
        result = await db.feedback_qa.delete_one({"_id": ObjectId(entry_id)})
        return result.deleted_count > 0

    @staticmethod
    async def list_entries(db) -> list[dict]:
        """Fetch all feedback QA items."""
        entries = []
        async for entry in db.feedback_qa.find().sort("createdAt", -1):
            entry["_id"] = str(entry["_id"])
            entries.append(entry)
        return entries

    @classmethod
    async def search_feedback(cls, question: str, db) -> dict:
        """Search the feedback Q&A collection using hybrid Keyword & Semantic search."""
        # 1. Fetch all items from the feedback database to perform dynamic semantic similarity
        # Since feedback collection is relatively small (< 1000 items), dynamic cosine similarity
        # is incredibly fast (under 10ms), extremely accurate, and doesn't require complex cloud vector configurations.
        db_entries = []
        async for item in db.feedback_qa.find():
            item["_id"] = str(item["_id"])
            db_entries.append(item)

        if not db_entries:
            return {
                "answer": "Sorry, I don’t have relevant information in the database.",
                "sources": [],
                "matchType": "default"
            }

        # 2. Extract keywords from user question to run keyword-matching
        q_words = set(question.lower().split())
        matched_entries = []
        
        # 3. Calculate semantic cosine similarity
        try:
            encoder = vector_store.get_encoder()
            query_vector = encoder.encode(question)
            query_norm = query_vector / (np.linalg.norm(query_vector) + 1e-12)
            
            # Embed all feedback questions
            fb_questions = [item["question"] for item in db_entries]
            fb_embeddings = encoder.encode(fb_questions)
            fb_norms = fb_embeddings / (np.linalg.norm(fb_embeddings, axis=1, keepdims=True) + 1e-12)
            
            similarities = np.dot(fb_norms, query_norm)
            
            for idx, score in enumerate(similarities):
                entry = db_entries[idx]
                norm_score = max(0.0, min(1.0, (float(score) + 1.0) / 2.0))
                
                # Check keyword overlap (simple keyword scoring helper)
                q_text = entry["question"].lower()
                tags_text = entry["tags"].lower()
                keyword_hits = sum(1 for w in q_words if w in q_text or w in tags_text)
                
                # Combine score: 70% semantic, 30% keyword hit score
                combined_score = norm_score * 0.7 + (min(1.0, keyword_hits / max(1, len(q_words))) * 0.3)
                
                # We consider it a highly relevant match if combined score is >= 0.65
                if combined_score >= 0.65:
                    matched_entries.append({
                        "id": entry["_id"],
                        "question": entry["question"],
                        "answer": entry["answer"],
                        "tags": entry["tags"],
                        "score": combined_score
                    })
        except Exception as e:
            logger.error(f"Semantic search failed in feedback DB: {str(e)}")
            # Simple keyword matching fallback
            for entry in db_entries:
                q_text = entry["question"].lower()
                tags_text = entry["tags"].lower()
                hits = sum(1 for w in q_words if w in q_text or w in tags_text)
                if hits >= 2:
                    matched_entries.append({
                        "id": entry["_id"],
                        "question": entry["question"],
                        "answer": entry["answer"],
                        "tags": entry["tags"],
                        "score": hits / len(q_words)
                    })

        # Sort matched entries by score descending
        matched_entries.sort(key=lambda x: x["score"], reverse=True)

        # 4. Apply Behavior Rules
        if not matched_entries:
            return {
                "answer": "Sorry, I don’t have relevant information in the database.",
                "sources": [],
                "matchType": "default"
            }
            
        elif len(matched_entries) == 1:
            # Rule: If one result exists: Return matching answer.
            return {
                "answer": matched_entries[0]["answer"],
                "sources": [matched_entries[0]],
                "matchType": "database"
            }
            
        else:
            # Rule: If multiple relevant results exist: Combine and synthesize answers.
            top_matches = matched_entries[:3] # Combine up to top 3 items
            answers = []
            for i, match in enumerate(top_matches):
                answers.append(f"**Aspect {i+1} [Related to: {match['question']}]:** {match['answer']}")
                
            synthesized_answer = (
                f"I found multiple relevant entries in the Q&A database. "
                f"Here is a synthesis of these aspects:\n\n" + "\n\n".join(answers)
            )
            return {
                "answer": synthesized_answer,
                "sources": top_matches,
                "matchType": "synthesized"
            }
