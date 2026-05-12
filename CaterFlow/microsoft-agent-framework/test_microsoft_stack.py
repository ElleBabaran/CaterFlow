import os
import json
import urllib.request
from dotenv import load_dotenv

load_dotenv()

def test_azure_search():
    print("\n--- Testing Azure AI Search ---")
    endpoint = os.getenv("AZURE_AI_SEARCH_ENDPOINT")
    key = os.getenv("AZURE_AI_SEARCH_KEY")
    index = os.getenv("AZURE_AI_SEARCH_INDEX", "caterflow-index")
    
    if not endpoint or not key:
        print("✗ Azure AI Search credentials missing in .env")
        return False
    
    clean_endpoint = endpoint.rstrip("/")
    url = f"{clean_endpoint}/indexes/{index}/docs/search?api-version=2024-07-01"
    payload = {"search": "*", "top": 1}
    
    try:
        req = urllib.request.Request(
            url, 
            data=json.dumps(payload).encode("utf-8"), 
            headers={"Content-Type": "application/json", "api-key": key}
        )
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                print(f"✓ Azure AI Search Connected (Index: {index})")
                return True
    except Exception as e:
        print(f"✗ Azure AI Search Failed: {e}")
    return False

def test_gemini():
    print("\n--- Testing Gemini AI (Foundry Fallback) ---")
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        print("✗ GEMINI_API_KEY missing in .env")
        return False
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={key}"
    payload = {"contents": [{"parts": [{"text": "Hello"}]}]}
    
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                print("✓ Gemini AI Connected")
                return True
    except Exception as e:
        print(f"✗ Gemini AI Failed: {e}")
    return False

if __name__ == "__main__":
    test_azure_search()
    test_gemini()
