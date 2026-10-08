import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import os

class DocumentRetriever:
    """
    Queries the VectorStore and retrieves the most relevant document chunks
    based on mathematical similarity (Cosine Similarity).
    """
    def __init__(self):
        from src.rag.vector_store import VectorStore
        from src.rag.embeddings import EmbeddingService
        
        self.vector_store = VectorStore()
        self.embedder = EmbeddingService()
        
    def retrieve(self, query: str, top_k: int = 2):
        """
        Embeds the query and performs a similarity search against the vector database.
        """
        if self.vector_store.embeddings is None or len(self.vector_store.chunks) == 0:
            raise ValueError("Vector store is empty. Please ingest documents first.")
            
        # 1. Embed the query
        query_embedding = self.embedder.embed_query(query)
        
        # 2. Compute Cosine Similarity between query vector and all document vectors
        similarities = cosine_similarity([query_embedding], self.vector_store.embeddings)[0]
        
        # 3. Get top_k indices
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        # 4. Fetch the chunks and their scores
        results = []
        for idx in top_indices:
            score = similarities[idx]
            if score > 0: # Only return if there is some relevance
                chunk_data = self.vector_store.chunks[idx]
                results.append({
                    "chunk_id": chunk_data["chunk_id"],
                    "content": chunk_data["content"],
                    "score": score
                })
                
        return results

if __name__ == "__main__":
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    
    retriever = DocumentRetriever()
    
    test_queries = [
        "What is the VP approval rule for profit margins?",
        "Which machine learning model should I use for forecasting?"
    ]
    
    for query in test_queries:
        print(f"\n==========================================")
        print(f"QUERY: {query}")
        print(f"==========================================")
        
        results = retriever.retrieve(query, top_k=2)
        
        if not results:
            print("No relevant documents found.")
            
        for i, res in enumerate(results, 1):
            print(f"\n[Match {i} | Score: {res['score']:.4f}]")
            print(f"Source: {res['chunk_id']}")
            print(f"Content: {res['content']}")
