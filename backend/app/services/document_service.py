import os
from datetime import datetime
from bson import ObjectId
from app.database.connection import get_db
from app.utils.text_processor import TextProcessor
from app.vectorstore.store import vector_store

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class DocumentService:
    @staticmethod
    async def upload_document(filename: str, file_bytes: bytes, db) -> dict:
        """Process an uploaded document, generate vector embeddings, and save to DB/disk."""
        # 1. Check if document with same filename already exists, remove it first to overwrite
        existing = await db.documents.find_one({"filename": filename})
        if existing:
            await DocumentService.delete_document(str(existing["_id"]), db)

        # 2. Save file to disk
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(file_bytes)

        # 3. Extract text content
        text_content = TextProcessor.extract_text(filename, file_bytes)
        
        # 4. Segment text into chunks
        chunks = TextProcessor.split_text_into_chunks(text_content, chunk_size=800, chunk_overlap=150)
        chunks_count = len(chunks)
        
        # 5. Embed chunks and save in vector database
        if chunks_count > 0:
            vector_store.add_documents(filename, chunks)

        # 6. Save metadata to MongoDB
        doc_entry = {
            "filename": filename,
            "filetype": os.path.splitext(filename)[1].lower().replace(".", ""),
            "uploadDate": datetime.utcnow(),
            "documentPath": file_path,
            "chunksCount": chunks_count
        }
        
        result = await db.documents.insert_one(doc_entry)
        doc_entry["_id"] = str(result.inserted_id)
        return doc_entry

    @staticmethod
    async def delete_document(doc_id: str, db) -> bool:
        """Delete document from database, vector storage, and local disk."""
        try:
            # 1. Fetch document metadata
            doc = await db.documents.find_one({"_id": ObjectId(doc_id)})
            if not doc:
                return False

            filename = doc["filename"]
            file_path = doc["documentPath"]

            # 2. Remove document chunks from active Vector Store
            vector_store.delete_documents(filename)

            # 3. Remove physical file from disk
            if os.path.exists(file_path):
                os.remove(file_path)

            # 4. Delete document entry from MongoDB
            await db.documents.delete_one({"_id": ObjectId(doc_id)})
            return True
        except Exception:
            return False

    @staticmethod
    async def list_documents(db) -> list[dict]:
        """Fetch all indexed documents from MongoDB."""
        docs = []
        async for doc in db.documents.find():
            doc["_id"] = str(doc["_id"])
            docs.append(doc)
        return docs
