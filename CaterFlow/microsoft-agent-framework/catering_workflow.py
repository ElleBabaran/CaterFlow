import os
import json
import asyncio
import re
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_agentchat.conditions import MaxMessageTermination
from agents import create_caterflow_agents

async def run_catering_workflow(customer_brief: str):
    agents = create_caterflow_agents()
    
    # Termination condition: Max turns to ensure it finishes
    termination = MaxMessageTermination(len(agents) + 1)
    
    # Team orchestration
    team = RoundRobinGroupChat(agents, termination_condition=termination)

    # Execute the multi-agent collaboration
    result = await team.run(task=f"Catering Planning Request: {customer_brief}")
    
    # Extract JSON from the messages
    # We look from the end to find the most complete blueprint
    final_blueprint = {}
    for message in reversed(result.messages):
        content = message.content if hasattr(message, 'content') else str(message)
        json_match = re.search(r'(\{.*\})', content, re.DOTALL)
        if json_match:
            try:
                candidate = json.loads(json_match.group(1))
                # If it looks like a full blueprint, use it
                if "menu" in candidate or "customer" in candidate:
                    final_blueprint = candidate
                    break
            except:
                continue

    if not final_blueprint:
        final_blueprint = {
            "status": "partial_success",
            "raw_log": [str(m) for m in result.messages[-3:]],
            "message": "Full JSON blueprint not found in agent conversation."
        }
    
    return final_blueprint

if __name__ == "__main__":
    import sys
    brief = sys.argv[1] if len(sys.argv) > 1 else "Wedding for 100 guests in BGC"
    # Set dummy env vars for local testing if needed
    if "GEMINI_API_KEY" not in os.environ:
        os.environ["GEMINI_API_KEY"] = "placeholder"
        
    print(json.dumps(asyncio.run(run_catering_workflow(brief))))
