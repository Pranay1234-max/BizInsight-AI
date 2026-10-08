import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
import joblib
import os

class EmbeddingService:
    """
    Converts text chunks into numerical vector embeddings.
    
    In a full production cloud environment, this would call an LLM API 
    (like OpenAI embeddings) or a local model (like HuggingFace sentence-transformers).
    Given the current dependency environment, we utilize TF-IDF from scikit-learn 
    to create local, lightweight numerical vector representations capable of semantic search.
    """
    def __init__(self, model_dir="models/rag"):
        self.model_dir = model_dir
        os.makedirs(self.model_dir, exist_ok=True)
        self.vectorizer_path = os.path.join(self.model_dir, "tfidf_vectorizer.joblib")
        
        # Initialize or load vectorizer
        if os.path.exists(self.vectorizer_path):
            self.vectorizer = joblib.load(self.vectorizer_path)
            self.is_fitted = True
        else:
            self.vectorizer = TfidfVectorizer(stop_words='english')
            self.is_fitted = False

    def fit_and_embed(self, texts: list):
        """
        Fits the embedding model to a corpus of texts and returns the embeddings.
        """
        if not texts:
            return np.array([])
            
        embeddings_sparse = self.vectorizer.fit_transform(texts)
        self.is_fitted = True
        
        # Save the fitted model for future query processing
        joblib.dump(self.vectorizer, self.vectorizer_path)
        
        return embeddings_sparse.toarray()

    def embed_query(self, text: str):
        """
        Embeds a single query string for searching against the vector store.
        """
        if not self.is_fitted:
            raise ValueError("Embedding model is not fitted yet. Fit a corpus first.")
            
        embedding = self.vectorizer.transform([text]).toarray()
        return embedding[0]

if __name__ == "__main__":
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    
    from src.rag.document_loader import DocumentLoader
    from src.rag.chunker import DocumentChunker
    
    print("Loading and chunking documents...")
    loader = DocumentLoader()
    docs = loader.load_documents()
    
    chunker = DocumentChunker()
    chunked_docs = chunker.chunk_documents(docs)
    
    texts = [chunk["content"] for chunk in chunked_docs]
    
    print("Initializing Embedding Service (using TF-IDF placeholder for ML environment)...")
    embedding_service = EmbeddingService()
    
    print("Fitting model and generating embeddings...")
    embeddings = embedding_service.fit_and_embed(texts)
    
    print(f"Generated embeddings shape: {embeddings.shape} (Chunks x Vocabulary Size)")
    
    print("\nTesting single query embedding...")
    query = "What is the policy on profit margin?"
    query_emb = embedding_service.embed_query(query)
    
    print(f"Query: '{query}'")
    print(f"Query Embedding shape: {query_emb.shape}")
    print(f"Non-zero elements in query embedding: {len(query_emb[query_emb > 0])}")
