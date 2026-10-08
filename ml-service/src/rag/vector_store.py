import numpy as np
import joblib
import os

class VectorStore:
    """
    A lightweight, local vector database to store document chunks and their embeddings.
    Acts as the storage layer for the RAG pipeline.
    """
    def __init__(self, store_dir="data/vector_store"):
        self.store_dir = store_dir
        os.makedirs(self.store_dir, exist_ok=True)
        self.db_path = os.path.join(self.store_dir, "vector_db.joblib")
        
        self.chunks = []
        self.embeddings = None
        
        self.load()

    def add_documents(self, chunks: list, embeddings: np.ndarray):
        """
        Adds new chunked documents and their corresponding vector embeddings to the store.
        """
        if len(chunks) != embeddings.shape[0]:
            raise ValueError("Number of chunks must match number of embeddings.")
            
        if self.embeddings is None:
            self.embeddings = embeddings
            self.chunks = chunks
        else:
            self.embeddings = np.vstack([self.embeddings, embeddings])
            self.chunks.extend(chunks)
            
        self.save()

    def save(self):
        data = {
            "chunks": self.chunks,
            "embeddings": self.embeddings
        }
        joblib.dump(data, self.db_path)

    def load(self):
        if os.path.exists(self.db_path):
            data = joblib.load(self.db_path)
            self.chunks = data["chunks"]
            self.embeddings = data["embeddings"]

if __name__ == "__main__":
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    
    from src.rag.document_loader import DocumentLoader
    from src.rag.chunker import DocumentChunker
    from src.rag.embeddings import EmbeddingService
    
    print("Building Vector Store End-to-End...")
    
    loader = DocumentLoader()
    docs = loader.load_documents()
    
    chunker = DocumentChunker()
    chunked_docs = chunker.chunk_documents(docs)
    
    embedder = EmbeddingService()
    texts = [chunk["content"] for chunk in chunked_docs]
    embeddings = embedder.fit_and_embed(texts)
    
    vector_store = VectorStore()
    vector_store.embeddings = None 
    vector_store.chunks = []
    
    print("Adding chunks and embeddings to Vector Database...")
    vector_store.add_documents(chunked_docs, embeddings)
    print(f"Successfully saved {len(vector_store.chunks)} documents to {vector_store.db_path}")
