from __future__ import annotations
import os
import json
from typing import Any, List
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient

def get_model_client():
    endpoint = os.environ.get("FOUNDRY_PROJECT_ENDPOINT") or os.environ.get("AZURE_OPENAI_ENDPOINT")
    model = os.environ.get("FOUNDRY_MODEL") or os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME")
    api_key = os.environ.get("FOUNDRY_API_KEY") or os.environ.get("AZURE_OPENAI_API_KEY")
    if not endpoint or not model or not api_key:
        raise RuntimeError("Azure AI Foundry/OpenAI credentials are required")
    
    return OpenAIChatCompletionClient(
        model=model,
        base_url=f"{endpoint.rstrip('/')}/v1",
        api_key=api_key
    )

def create_caterflow_agents() -> List[AssistantAgent]:
    client = get_model_client()
    
    return [
        AssistantAgent(
            name="ConciergeAgent",
            model_client=client,
            system_message="""You are the CaterFlow Concierge. 
            Extract structured event requirements: event_type, guests, budget, location, date, cultural_profile.
            Provide your output as a clear JSON block. 
            NEVER use example data like 'Wedding for 50' if the user didn't specify it."""
        ),
        AssistantAgent(
            name="DietarySpecialist",
            model_client=client,
            system_message="Identify dietary labels (halal, vegan) and allergens to avoid. Suggest safety controls based ONLY on the current user brief."
        ),
        AssistantAgent(
            name="HeadChefAgent",
            model_client=client,
            system_message="""Design a unique, contextual catering menu based ONLY on the user's brief. 
            CRITICAL: Do NOT use hardcoded Filipino favorites like 'Kare-Kare', 'Adobo', or 'Chicken Inasal' unless specifically requested by the user. 
            Be creative and generate unique dish names that fit the specific event context.
            Include nutrition approximations (calories, protein)."""
        ),
        AssistantAgent(
            name="InventorySpecialist",
            model_client=client,
            system_message="Convert the menu into a procurement list with estimated weights (kg) and quantities. Ensure items match the dynamic menu exactly."
        ),
        AssistantAgent(
            name="LogisticsLeadAgent",
            model_client=client,
            system_message="Create a T-minus execution timeline (T-48h to T-1h) and identify equipment/staffing needs tailored to the specific event scale."
        ),
        AssistantAgent(
            name="AccountantAgent",
            model_client=client,
            system_message="Audit the entire plan. Calculate an optimized quote in the user's currency and estimate profit margin. Do NOT use flat rates; calculate based on the specific menu items."
        ),
        AssistantAgent(
            name="MonitoringAgent",
            model_client=client,
            system_message="""Act as the Final Orchestrator. 
            Aggregate ALL information from previous agents into a single, comprehensive JSON blueprint.
            The JSON MUST have these top-level keys: customer, menu, inventory, dietary, logistics, pricing, suppliers, weather.
            CRITICAL: Ensure NO placeholder data or repeated examples are present in the final output. 
            Ensure the format is strictly valid JSON."""
        )
    ]
