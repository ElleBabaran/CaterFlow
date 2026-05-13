import autogen
import os
from dotenv import load_dotenv

load_dotenv()

config_list = [
    {
        "model": "gemini-1.5-flash",
        "api_key": os.environ.get("GEMINI_API_KEY"),
        "api_type": "google"
    }
]

assistant = autogen.AssistantAgent("assistant", llm_config={"config_list": config_list})
user_proxy = autogen.UserProxyAgent("user_proxy", code_execution_config=False)

# This is just a test to see if autogen is working
print("AutoGen imported and initialized successfully.")
