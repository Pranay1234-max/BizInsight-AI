class DocumentChunker:
    """
    Splits large documents into smaller, manageable chunks.
    This is essential for creating high-quality vector embeddings and
    ensuring that the context window of the LLM is not exceeded during retrieval.
    """
    def __init__(self, chunk_size: int = 200, chunk_overlap: int = 50):
        # Using character count for simplicity, but could be adapted to token count
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_text(self, text: str):
        """
        Splits a single string into overlapping chunks.
        """
        chunks = []
        if not text:
            return chunks
            
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + self.chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            
            # Move the start forward by chunk_size, then step back by chunk_overlap
            start += (self.chunk_size - self.chunk_overlap)
            
        return chunks

    def chunk_documents(self, documents: list):
        """
        Takes a list of document dictionaries (from DocumentLoader)
        and returns a list of chunk dictionaries with metadata.
        """
        chunked_docs = []
        for doc in documents:
            text = doc.get("content", "")
            filename = doc.get("filename", "unknown")
            
            text_chunks = self.chunk_text(text)
            
            for i, chunk_text in enumerate(text_chunks):
                chunked_docs.append({
                    "filename": filename,
                    "chunk_id": f"{filename}_chunk_{i}",
                    "content": chunk_text
                })
                
        return chunked_docs


if __name__ == "__main__":
    import os
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    
    from src.rag.document_loader import DocumentLoader
    
    print("Loading documents...")
    loader = DocumentLoader()
    docs = loader.load_documents()
    
    print(f"Loaded {len(docs)} document(s).")
    
    # We use a small chunk size here to demonstrate the splitting
    print("Initializing chunker (chunk_size=150, overlap=30)...")
    chunker = DocumentChunker(chunk_size=150, chunk_overlap=30)
    
    chunked_docs = chunker.chunk_documents(docs)
    
    print(f"\nCreated {len(chunked_docs)} chunks from the documents.")
    
    for chunk in chunked_docs:
        print(f"\n--- {chunk['chunk_id']} ---")
        print(chunk['content'])
