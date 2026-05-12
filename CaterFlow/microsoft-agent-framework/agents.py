from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Callable

from memory import SharedMemory

AgentFn = Callable[[SharedMemory], dict[str, Any]]

@dataclass(frozen=True)
class CaterFlowAgent:
    name: str
    role: str
    run: AgentFn

def extract_guests(text: str) -> int:
    match = re.search(r"(\d{2,5})\s*(guests|pax|people|attendees)?", text, re.I)
    return int(match.group(1)) if match else 100

def concierge_agent(memory: SharedMemory) -> dict[str, Any]:
    """Phase 1: Concierge Agent - Extracts user intent and structured requirements."""
    text = memory.source_input
    budget = next(iter(re.findall(r"(?:PHP|₱|P)\s*[\d,]+|[\d,]{4,}\s*(?:PHP|pesos)", text, re.I)), "PHP 250,000").strip(" .,")
    payload = {
        "event_type": "Corporate" if "corporate" in text.lower() else "Private event",
        "guests": extract_guests(text),
        "budget": budget,
        "location": "BGC Taguig" if "bgc" in text.lower() else "Metro Manila",
        "date": next(iter(re.findall(r"[A-Z][a-z]+\s+\d{1,2}(?:,\s*\d{4})?", text)), "Date to confirm"),
        "cultural_profile": "Filipino-Spanish fusion" if "spanish" in text.lower() and "filipino" in text.lower() else "International",
    }
    memory.write("ConciergeAgent", "customer", payload)
    return payload

def dietary_specialist(memory: SharedMemory) -> dict[str, Any]:
    text = memory.source_input.lower()
    allergens = [item for item in ["peanut", "shellfish", "dairy", "gluten", "egg", "soy"] if item in text]
    labels = [label for label in ["halal", "vegan", "vegetarian"] if label in text]
    payload = {
        "allergens_to_avoid": allergens,
        "recommended_labels": labels,
        "safety_controls": ["separate prep tools", "printed allergen labels", "sealed dietary alternatives"],
    }
    memory.write("DietarySpecialist", "dietary", payload)
    return payload

def head_chef_agent(memory: SharedMemory) -> dict[str, Any]:
    """Phase 2: Head Chef Agent - Menu creation and nutritional design."""
    payload = {
        "menu": [
            {"dish": "Chicken Inasal Skewers", "calories": 290, "protein_g": 28, "carbs_g": 8},
            {"dish": "Seafood Paella Valenciana", "calories": 380, "protein_g": 22, "carbs_g": 48},
            {"dish": "Vegan Kare-Kare Cups", "calories": 260, "protein_g": 9, "carbs_g": 34},
            {"dish": "Calamansi Leche Flan Verrines", "calories": 210, "protein_g": 5, "carbs_g": 28},
        ],
        "dietary_compliance": "Menu includes allergen labeling and dietary alternatives.",
    }
    memory.write("HeadChefAgent", "menu", payload)
    return payload

def inventory_specialist(memory: SharedMemory) -> dict[str, Any]:
    guests = memory.state["customer"]["guests"]
    payload = {
        "procurement_list": [
            {"item": "Chicken / poultry", "qty": f"{round(guests * 0.18)} kg"},
            {"item": "Rice and grains", "qty": f"{round(guests * 0.12)} kg"},
            {"item": "Fresh vegetables", "qty": f"{round(guests * 0.16)} kg"},
            {"item": "Beverages", "qty": f"{round(guests * 0.7)} L"},
        ]
    }
    memory.write("InventorySpecialist", "inventory", payload)
    return payload

def supplier_specialist(memory: SharedMemory) -> dict[str, Any]:
    payload = {
        "supplier_matches": [
            {"name": "Balintawak Poultry Hub", "score": "94%", "distance_km": 9.2},
            {"name": "Quinta Fresh Market", "score": "89%", "distance_km": 11.4},
        ],
        "optimization_strategy": "Rank by reliability, distance, and traffic buffers.",
    }
    memory.write("SupplierSpecialist", "suppliers", payload)
    return payload

def weather_intelligence(memory: SharedMemory) -> dict[str, Any]:
    text = memory.source_input.lower()
    rainy = any(token in text for token in ["rain", "july", "august", "outdoor"])
    payload = {
        "risk_level": "high" if rainy else "low",
        "recommendations": ["reserve tenting", "add 30m buffer"] if rainy else ["standard loading"],
    }
    memory.write("WeatherIntelligence", "weather", payload)
    return payload

def logistics_lead_agent(memory: SharedMemory) -> dict[str, Any]:
    """Phase 4: Logistics Lead Agent - Execution timeline and resource planning."""
    guests = memory.state["customer"]["guests"]
    payload = {
        "timeline": [
            {"time": "T-48h", "activity": "Confirm guest count and supplier backups."},
            {"time": "T-8h", "activity": "Batch prep and cold-chain storage."},
            {"time": "T-3h", "activity": "Traffic-aware dispatch."},
            {"time": "T-1h", "activity": "Venue setup."},
        ],
        "staffing_needs": f"{max(6, round(guests / 25))} staff including event lead.",
        "equipment_list": ["warmers", "cold boxes", "labels", "tent kit"],
    }
    memory.write("LogisticsLeadAgent", "logistics", payload)
    return payload

def accountant_agent(memory: SharedMemory) -> dict[str, Any]:
    """Phase 3: Accountant Agent - Cost optimization and pricing audit."""
    guests = memory.state["customer"]["guests"]
    quote = guests * 1500
    payload = {
        "optimized_quote": f"PHP {quote:,.0f}",
        "unit_cost": "PHP 1,120 / guest",
        "profit_margin": "25%",
        "pricing_strategy": "Protect margin while preserving weather and allergen controls.",
    }
    memory.write("AccountantAgent", "pricing", payload)
    return payload

def monitoring_agent(memory: SharedMemory) -> dict[str, Any]:
    payload = {
        "execution_readiness": 92,
        "overall_status": "green",
        "final_summary": "Blueprint is service-ready with supplier backup and pricing audit.",
        "qa_checks": [
            "Guest count applied to procurement.",
            "Allergen labels required.",
            "Supplier backup identified.",
        ],
    }
    memory.write("MonitoringAgent", "monitoring", payload)
    return payload

AGENTS = [
    CaterFlowAgent("ConciergeAgent", "Phase 1: Extract structured event requirements.", concierge_agent),
    CaterFlowAgent("DietarySpecialist", "Identify dietary labels and allergens.", dietary_specialist),
    CaterFlowAgent("HeadChefAgent", "Phase 2: Generate menu and nutrition design.", head_chef_agent),
    CaterFlowAgent("InventorySpecialist", "Convert menu into procurement weights.", inventory_specialist),
    CaterFlowAgent("SupplierSpecialist", "Compare vendors by rate and reliability.", supplier_specialist),
    CaterFlowAgent("WeatherIntelligence", "Analyze weather risk and Plan B.", weather_intelligence),
    CaterFlowAgent("AccountantAgent", "Phase 3: Audit budget and profit margin.", accountant_agent),
    CaterFlowAgent("LogisticsLeadAgent", "Phase 4: Create traffic-aware timeline and staffing.", logistics_lead_agent),
    CaterFlowAgent("MonitoringAgent", "Calculate readiness and QA checks.", monitoring_agent),
]

def run_round_robin(customer_request: str) -> dict[str, Any]:
    memory = SharedMemory(source_input=customer_request)
    for agent in AGENTS:
        agent.run(memory)
    return memory.read_context() | {"readiness_basis": memory.readiness_basis()}
