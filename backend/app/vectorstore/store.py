import os
import pickle
import logging
import numpy as np
from sentence_transformers import SentenceTransformer
from app.config import settings

logger = logging.getLogger(__name__)

# Attempt to import FAISS for high performance. Fall back gracefully to Numpy.
try:
    import faiss
    FAISS_AVAILABLE = True
    logger.info("FAISS vector database library is available.")
except ImportError:
    FAISS_AVAILABLE = False
    logger.warning("FAISS not found. Falling back to pure Numpy cosine-similarity search engine.")

class VectorStoreManager:
    _encoder = None
    
    @classmethod
    def get_encoder(cls) -> SentenceTransformer:
        """Singleton accessor for the local sentence transformer model."""
        if cls._encoder is None:
            logger.info("Initializing SentenceTransformer Model (all-MiniLM-L6-v2)...")
            # This loads the model locally. If not found, it downloads it once and caches it.
            cls._encoder = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("SentenceTransformer model loaded successfully!")
        return cls._encoder

    def __init__(self):
        self.storage_dir = settings.VECTOR_STORAGE_DIR
        self.index_file = os.path.join(self.storage_dir, "faiss_index.bin")
        self.metadata_file = os.path.join(self.storage_dir, "metadata.pkl")
        
        # In-memory storage for numpy fallback and metadata tracking
        self.chunks = []      # list of str (raw texts)
        self.metadata = []    # list of dict ({"filename": str, "chunk_index": int})
        self.embeddings = None # numpy array of shape (N, 384)
        
        # FAISS Index
        self.faiss_index = None
        
        # Load existing index on startup
        self.load()

    def add_documents(self, filename: str, text_chunks: list[str]):
        """Generate embeddings for list of text chunks and append them to the vector store."""
        if not text_chunks:
            return
            
        encoder = self.get_encoder()
        logger.info(f"Generating embeddings for {len(text_chunks)} chunks of document '{filename}'...")
        new_embeddings = encoder.encode(text_chunks, show_progress_bar=False)
        new_embeddings = np.array(new_embeddings, dtype=np.float32)
        
        new_metadata = [{"filename": filename, "chunk_index": idx} for idx in range(len(text_chunks))]
        
        # Append to our in-memory cache
        self.chunks.extend(text_chunks)
        self.metadata.extend(new_metadata)
        
        if self.embeddings is None:
            self.embeddings = new_embeddings
        else:
            self.embeddings = np.vstack([self.embeddings, new_embeddings])
            
        # Re-build/update active index
        self._rebuild_index()
        self.save()
        logger.info(f"Document '{filename}' successfully embedded and stored.")

    def delete_documents(self, filename: str):
        """Remove all text chunks matching specific filename and rebuild index."""
        if not self.chunks:
            return
            
        # Keep indexes that are NOT from this document
        keep_indices = [i for i, meta in enumerate(self.metadata) if meta["filename"] != filename]
        
        if not keep_indices:
            # Clear everything
            self.chunks = []
            self.metadata = []
            self.embeddings = None
            self.faiss_index = None
        else:
            self.chunks = [self.chunks[i] for i in keep_indices]
            self.metadata = [self.metadata[i] for i in keep_indices]
            if self.embeddings is not None:
                self.embeddings = self.embeddings[keep_indices]
                
            self._rebuild_index()
            
        self.save()
        logger.info(f"Document '{filename}' successfully deleted from vector store.")

    def _rebuild_index(self):
        """Build or rebuild vector index based on stored embeddings."""
        if self.embeddings is None or len(self.embeddings) == 0:
            self.faiss_index = None
            return
            
        if FAISS_AVAILABLE:
            dimension = self.embeddings.shape[1]
            # Standard L2 index. To perform Cosine Similarity, we normalize vectors and use Inner Product
            # Normalize vectors to unit length
            norms = np.linalg.norm(self.embeddings, axis=1, keepdims=True)
            normalized_embeddings = self.embeddings / np.where(norms == 0, 1e-12, norms)
            
            self.faiss_index = faiss.IndexFlatIP(dimension)
            self.faiss_index.add(normalized_embeddings.astype(np.float32))
            logger.info("FAISS Index successfully rebuilt.")
        else:
            logger.info("Numpy search cache prepared (FAISS inactive).")

    def search(self, query: str, top_k: int = 4) -> list[dict]:
        """Query vector database for similar chunks. Returns list of matches with similarity scores."""
        if self.embeddings is None or len(self.embeddings) == 0:
            return []
            
        top_k = min(top_k, len(self.chunks))
        encoder = self.get_encoder()
        query_vector = encoder.encode([query], show_progress_bar=False)
        query_vector = np.array(query_vector, dtype=np.float32)
        
        # Normalize query vector for cosine similarity
        query_norm = np.linalg.norm(query_vector, axis=1, keepdims=True)
        normalized_query = query_vector / np.where(query_norm == 0, 1e-12, query_norm)
        
        results = []
        
        if FAISS_AVAILABLE and self.faiss_index is not None:
            # Perform FAISS search
            scores, indices = self.faiss_index.search(normalized_query, top_k)
            for score, idx in zip(scores[0], indices[0]):
                if idx < 0 or idx >= len(self.chunks):
                    continue
                results.append({
                    "filename": self.metadata[idx]["filename"],
                    "score": float(score),
                    "snippet": self.chunks[idx]
                })
        else:
            # Fallback: Pure Numpy Cosine Similarity calculation
            # Normalize stored embeddings
            norms = np.linalg.norm(self.embeddings, axis=1, keepdims=True)
            normalized_embeddings = self.embeddings / np.where(norms == 0, 1e-12, norms)
            
            # Matrix dot-product to compute cosine similarities
            similarities = np.dot(normalized_embeddings, normalized_query.T).flatten()
            
            # Sort top indices descending
            top_indices = np.argsort(similarities)[::-1][:top_k]
            for idx in top_indices:
                results.append({
                    "filename": self.metadata[idx]["filename"],
                    "score": float(similarities[idx]),
                    "snippet": self.chunks[idx]
                })
                
        # Filter negative or extremely low scores to ensure relevance
        # Scores are between -1 and 1 since vectors are normalized. Normalizing score to 0 to 1 range
        for res in results:
            res["score"] = max(0.0, min(1.0, (res["score"] + 1.0) / 2.0))
            
        return results

    def save(self):
        """Serialize index and metadata to disk."""
        try:
            os.makedirs(self.storage_dir, exist_ok=True)
            
            # Save raw chunks and metadata
            with open(self.metadata_file, "wb") as f:
                pickle.dump((self.chunks, self.metadata, self.embeddings), f)
                
            if FAISS_AVAILABLE and self.faiss_index is not None:
                faiss.write_index(self.faiss_index, self.index_file)
                
            logger.info("Vector database saved to disk.")
        except Exception as e:
            logger.error(f"Failed to save vector database: {str(e)}")

    def load(self):
        """Load index and metadata from disk."""
        try:
            if not os.path.exists(self.metadata_file):
                logger.info("No prior vector storage found. Initializing empty vector database.")
                return
                
            with open(self.metadata_file, "rb") as f:
                self.chunks, self.metadata, self.embeddings = pickle.load(f)
                
            if FAISS_AVAILABLE and os.path.exists(self.index_file):
                self.faiss_index = faiss.read_index(self.index_file)
                logger.info("Loaded FAISS index from disk.")
            else:
                self._rebuild_index()
                
            logger.info(f"Vector store loaded successfully: {len(self.chunks)} chunks cataloged.")
        except Exception as e:
            logger.error(f"Failed to load vector database: {str(e)}")
            # Reset values on corruption
            self.chunks = []
            self.metadata = []
            self.embeddings = None
            self.faiss_index = None

# Global instance of vector store manager
vector_store = VectorStoreManager()
