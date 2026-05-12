# Tech Stack Compliance

This project is shaped for the iNextLabs problem statement: AI-Powered Multi-Agent System for Smart Catering Operations.

## Implemented in the live React demo

- Customer Interaction Agent
- Knowledge Base & RAG Agent with local catering playbooks
- Dietary & Allergens Agent
- Weather Intelligence Agent
- Menu Planning Agent
- Inventory & Procurement Agent
- Logistics Planning Agent
- Pricing & Optimization Agent
- Real-Time Simulation Agent
- Monitoring Agent
- Shared Memory Ledger for visible agent-to-agent handoffs

## Required Microsoft stack path

- Microsoft Agent Framework: see `microsoft-agent-framework/catering_workflow.py`.
- Microsoft Foundry: set `FOUNDRY_PROJECT_ENDPOINT` and `FOUNDRY_MODEL`, then run the Agent Framework workflow.
- Azure AI Search: configure `AZURE_AI_SEARCH_ENDPOINT`, `AZURE_AI_SEARCH_INDEX`, and `AZURE_AI_SEARCH_KEY`; the server endpoint `/api/rag/search` will call Azure AI Search. Without those values, the app uses `src/services/knowledgeBase.ts` as the local RAG fallback.

## Current honesty note

The browser demo currently runs on the existing Vite/Express app and Gemini-compatible API key. The Microsoft Agent Framework implementation is present as the backend blueprint and can become the primary orchestrator once Azure/Foundry credentials are provided.
