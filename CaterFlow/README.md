# CaterFlow

AI-powered multi-agent catering operations system for the iNextLabs hackathon problem statement.

The app simulates a digital catering team that captures customer requirements, plans menus, calculates inventory, schedules logistics, optimizes pricing, runs execution-risk simulation, and produces a final monitoring report.

## Hackathon Requirements Covered

- Multi-agent orchestration with visible agent-to-agent handoffs
- Customer requirement gathering and structured event extraction
- Menu planning, dietary/allergen handling, and portion sizing
- Inventory and procurement planning with supplier context
- Logistics scheduling and execution timeline
- Pricing optimization and cost insights
- Shared memory ledger, local RAG playbooks, and real-time risk simulation
- Role-based signup for Admin and Staff workspaces
- Bonus features retained: supplier map, language/cultural adaptation, voice input, weather API path, nutrition table, and plan history

## Required Tech Stack

- Microsoft Agent Framework: backend blueprint in `microsoft-agent-framework/catering_workflow.py` plus local architecture files `agents.py`, `main.py`, `memory.py`, and `database.py`
- Microsoft Foundry: configure `FOUNDRY_PROJECT_ENDPOINT` and `FOUNDRY_MODEL`
- Azure AI Search: configure `AZURE_AI_SEARCH_ENDPOINT`, optional `AZURE_AI_SEARCH_INDEX`, and `AZURE_AI_SEARCH_KEY`. Without a single index value, the app searches `menus` and `suppliers`.
- Live demo runtime: Vite + Express + React with the existing Gemini-compatible API path

See `docs/TECH_STACK_COMPLIANCE.md` for the honest implementation status and setup path.

## Run Locally

Prerequisites: Node.js

1. Install dependencies:
   `npm install`
2. Optional: set `GEMINI_API_KEY` for the browser demo LLM path. Without it, CaterFlow uses deterministic local fallback logic for demo continuity.
3. Optional Microsoft/Azure credentials:
   `FOUNDRY_PROJECT_ENDPOINT`, `FOUNDRY_MODEL`, `AZURE_AI_SEARCH_ENDPOINT`, `AZURE_AI_SEARCH_KEY`, and optional `AZURE_AI_SEARCH_INDEX`.
4. Run the app:
   `npm run dev`
5. Open:
   `http://localhost:3000`

## Microsoft Agent Framework Path

Prerequisites: Python and Azure CLI login.

1. Install:
   `pip install -r microsoft-agent-framework/requirements.txt`
2. Set:
   `FOUNDRY_PROJECT_ENDPOINT=https://your-foundry-service.services.ai.azure.com/api/projects/your-project`
3. Optional:
   `FOUNDRY_MODEL=gpt-5.4-mini`
4. Run:
   `python microsoft-agent-framework/catering_workflow.py`

The app also exposes `/api/stack` so judges can verify the required stack status from the running demo.
