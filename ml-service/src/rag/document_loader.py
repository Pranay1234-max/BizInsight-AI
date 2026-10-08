import os
import json

class DocumentLoader:
    """
    Responsible for loading raw business documents, company policies,
    and historical reports from the file system. These documents will
    form the knowledge base for the RAG pipeline.
    """
    def __init__(self, docs_dir="data/documents"):
        self.docs_dir = docs_dir
        os.makedirs(self.docs_dir, exist_ok=True)

    def load_documents(self):
        """
        Loads all .txt and .json documents from the documents directory.
        Returns a list of dictionaries containing 'filename' and 'content'.
        """
        documents = []
        if not os.path.exists(self.docs_dir):
            return documents
            
        for filename in os.listdir(self.docs_dir):
            filepath = os.path.join(self.docs_dir, filename)
            
            if filename.endswith(".txt"):
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    documents.append({"filename": filename, "content": content})
                    
            elif filename.endswith(".json"):
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Convert JSON to string representation so it can be chunked and embedded
                    content = json.dumps(data, indent=2)
                    documents.append({"filename": filename, "content": content})
                    
        return documents

if __name__ == "__main__":
    # Setup and Test the Document Loader
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    
    loader = DocumentLoader()
    
    # Create a sample business document to test the loader
    sample_filepath = os.path.join(loader.docs_dir, "business_rules.txt")
    
    with open(sample_filepath, "w", encoding="utf-8") as f:
        f.write("BUSINESS RULES AND POLICIES\n")
        f.write("1. All sales forecasts must be generated using the XGBoost or Linear Regression model.\n")
        f.write("2. Any profit margin falling below 15% in the West region must be immediately flagged for VP review.\n")
        f.write("3. The standard 7-day rolling mean is the source of truth for weekly performance tracking.\n")
        
    print(f"Scanning directory: {loader.docs_dir}")
    docs = loader.load_documents()
    
    print(f"Successfully loaded {len(docs)} document(s).")
    for doc in docs:
        print(f"\n--- Document: {doc['filename']} ---")
        print(doc['content'])
