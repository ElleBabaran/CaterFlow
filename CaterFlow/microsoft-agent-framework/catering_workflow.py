import json
import os
import urllib.request
import asyncio

def call_gemini(system_instruction, user_prompt):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not found"}
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
    
    payload = {
        "contents": [{
            "parts": [
                {"text": f"SYSTEM: {system_instruction}"},
                {"text": f"USER: {user_prompt}\nIMPORTANT: Respond ONLY with a valid JSON object. No markdown, no preamble."}
            ]
        }],
        "generationConfig": {
            "temperature": 0.2,
            "topP": 0.8
        }
    }
    
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            text_response = res_data["candidates"][0]["content"]["parts"][0]["text"]
            clean_text = text_response.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:-3].strip()
            elif clean_text.startswith("```"):
                clean_text = clean_text[3:-3].strip()
            return json.loads(clean_text)
    except Exception as e:
        return {"error": str(e)}

async def run_catering_workflow(customer_brief):
    # Phase 1: Concierge (User Input & Intent)
    concierge_inst = "Extract event details: guests, budget, location, cuisine, dietary. Return JSON."
    concierge = call_gemini(concierge_inst, customer_brief)
    
    # Phase 2: Head Chef (Menu Creation)
    chef_inst = "Plan a 6-dish menu. Return JSON with keys: menu (array of {dish, description, portion_per_guest})."
    head_chef = call_gemini(chef_inst, json.dumps(concierge))

    # Specialists Analysis
    async def get_inventory():
        inst = "Convert menu to procurement_list (item, qty, estimated_cost_php). Return JSON."
        return call_gemini(inst, f"Menu: {json.dumps(head_chef)}")

    async def get_weather():
        inst = "Simulate weather for the location. Return JSON with risk_level."
        return call_gemini(inst, f"Location: {concierge.get('location')}")

    async def get_suppliers():
        inst = "Recommend 3 shops nearby. Return JSON array."
        return call_gemini(inst, f"Location: {concierge.get('location')}")

    tasks = [get_inventory(), get_weather(), get_suppliers()]
    inventory, weather, suppliers = await asyncio.gather(*tasks)

    # Phase 4: Logistics Lead (Logistics Planning)
    logistics_inst = "Create a T-minus timeline. Return JSON with key: timeline."
    logistics = call_gemini(logistics_inst, f"Brief: {json.dumps(concierge)}\nInventory: {json.dumps(inventory)}")

    # Phase 3: Accountant (Cost Optimization)
    accountant_inst = "Calculate optimized_quote, profit_margin. Return JSON."
    accountant = call_gemini(accountant_inst, f"Inventory: {json.dumps(inventory)}\nLogistics: {json.dumps(logistics)}")

    blueprint = {
        "customer": concierge,
        "menu": head_chef,
        "inventory": inventory,
        "weather": weather,
        "suppliers": suppliers,
        "logistics": logistics,
        "pricing": accountant,
        "status": "ready",
        "workflow": "CaterFlow 4-Phase Orchestration"
    }
    
    return blueprint

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        result = asyncio.run(run_catering_workflow(sys.argv[1]))
        print(json.dumps(result))
