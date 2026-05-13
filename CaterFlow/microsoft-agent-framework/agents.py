from __future__ import annotations
import os
import json
from typing import Any, List
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient

def get_model_client():
    endpoint = os.environ.get("FOUNDRY_PROJECT_ENDPOINT", "https://mock-foundry.azure.com")
    model = os.environ.get("FOUNDRY_MODEL", "gpt-4o-mini")
    api_key = os.environ.get("AZURE_AI_SEARCH_KEY", "placeholder")
    
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
            Provide your output as a clear JSON block."""
        ),
        AssistantAgent(
            name="DietarySpecialist",
            model_client=client,
            system_message="Identify dietary labels (halal, vegan) and allergens to avoid. Suggest safety controls."
        ),
        AssistantAgent(
            name="HeadChefAgent",
            model_client=client,
            system_message="Design a 6-dish catering menu. Include nutrition approximations (calories, protein)."
        ),
        AssistantAgent(
            name="InventorySpecialist",
            model_client=client,
            system_message="Convert the menu into a procurement list with estimated weights (kg) and quantities."
        ),
        AssistantAgent(
            name="LogisticsLeadAgent",
            model_client=client,
            system_message="Create a T-minus execution timeline (T-48h to T-1h) and identify equipment/staffing needs."
        ),
        AssistantAgent(
            name="AccountantAgent",
            model_client=client,
            system_message="Audit the entire plan. Calculate an optimized quote in PHP and estimate profit margin."
        ),
        AssistantAgent(
            name="MonitoringAgent",
            model_client=client,
            system_message="""Act as the Final Orchestrator. 
            Aggregate ALL information from previous agents into a single, comprehensive JSON blueprint.
            The JSON MUST have these top-level keys: customer, menu, inventory, dietary, logistics, pricing, suppliers, weather.
            Ensure the format is strictly valid JSON."""
        )
    ]
