import os
from google import genai
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

class LLMService:
    """
    Connects to Google Gemini.
    This service takes the user's query, injects the RAG context
    and Business Insights into the prompt, and generates a natural language recommendation.
    """
    def __init__(self):
        # Fetch the key you just added to .env
        self.api_key = os.getenv("GEMINI_API_KEY")
        
        if not self.api_key:
            print("WARNING: GEMINI_API_KEY not found in environment. Please ensure it's in the .env file.")
            self.has_key = False
        else:
            self.client = genai.Client(api_key=self.api_key)
            self.has_key = True
        
    def generate_recommendation(self, user_query: str, context_chunks: list, business_insights: list):
        """
        Constructs the final prompt and queries Google Gemini for a recommendation.
        """
        # 1. Format Business Insights
        if isinstance(business_insights, dict):
            insights_text = "EXECUTIVE SUMMARY:\n" + business_insights.get("executive_summary", "") + "\n\n"
            insights_text += "KEY DRIVERS:\n" + "\n".join([f"- {i}" for i in business_insights.get("key_drivers", [])]) + "\n\n"
            insights_text += "TRENDS & OPPORTUNITIES:\n" + "\n".join([f"- {i}" for i in business_insights.get("positive_trends", [])]) + "\n" + "\n".join([f"- {i}" for i in business_insights.get("negative_trends", [])])
            
            # If generic dataset, add the hidden raw sample to context
            if "raw_sample" in business_insights:
                insights_text += "\n\nRAW DATA SAMPLE:\n" + business_insights["raw_sample"]
        else:
            insights_text = "\n".join([f"- {item['category']}: {item['insight']}" for item in business_insights])
        
        # 2. Format Retrieved RAG Documents
        rag_text = "\n".join([f"[Source: {chunk['chunk_id']}]\n{chunk['content']}" for chunk in context_chunks])
        
        # 3. Construct the Master Prompt
        prompt_context = f"""You are the BizInsight AI, an expert business intelligence assistant.
Answer the user's question using ONLY the provided context and business insights below. Keep the response professional, concise, and highly actionable.

==================================
CURRENT BUSINESS INSIGHTS:
{insights_text}
==================================

==================================
RELEVANT KNOWLEDGE BASE DOCUMENTS:
{rag_text}
==================================

USER QUESTION: {user_query}
"""

        print("\n[LLM_SERVICE] Calling Google Gemini API (v2 SDK)...")
        
        if not self.has_key:
            return "Error: GEMINI_API_KEY is not configured in the .env file."
            
        try:
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt_context,
            )
            return response.text
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
            return f"I encountered an error connecting to Gemini: {str(e)}"

if __name__ == "__main__":
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    
    from src.rag.retriever import DocumentRetriever
    
    # Simulate business insights
    mock_insights = [
        {"category": "Overall Performance", "insight": "Total sales reached $654,194,443.41 with a profit margin of 18.5%."},
        {"category": "Regional Performance", "insight": "West is the most profitable region."}
    ]
    
    retriever = DocumentRetriever()
    llm = LLMService()
    
    query = "What is the VP approval rule for profit margins, and are we currently above it overall?"
    print(f"\nUSER QUERY: {query}\n")
    
    print("Retrieving context from Vector Store...")
    retrieved_chunks = retriever.retrieve(query, top_k=2)
    
    print("\nGenerating LIVE Gemini Recommendation...")
    final_answer = llm.generate_recommendation(query, retrieved_chunks, mock_insights)
    
    print("\n==========================================")
    print("        BIZINSIGHT AI RECOMMENDATION      ")
    print("==========================================")
    print(final_answer)
