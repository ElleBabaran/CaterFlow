import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * MICROSOFT AGENT FRAMEWORK INSPIRED ARCHITECTURE
 * Implementation of Magentic-One Orchestration logic for JS.
 */

// --- CORE TYPES ---

interface AgentMetadata {
  name: string;
  role: string;
  systemPrompt: string;
}

interface LedgerEntry {
  agent: string;
  action: string;
  timestamp: string;
  content: any;
}

interface AgentLedger {
  requirements?: any;
  context?: any;
  menu?: any;
  operations?: any;
  history: LedgerEntry[];
}

// --- AGENT CLASS DEFINITION ---

class MagenticAgent {
  metadata: AgentMetadata;

  constructor(metadata: AgentMetadata) {
    this.metadata = metadata;
  }

  async process(input: string, ledger: AgentLedger, prefLang: string): Promise<any> {
    const prompt = `### ROLE: ${this.metadata.role}
    ### AGENT_NAME: ${this.metadata.name}
    ### SYSTEM_PROTOCOL: ${this.metadata.systemPrompt}
    ### LANGUAGE_PROTOCOL: ${prefLang}
    
    ### SHARED_LEDGER_HISTORY:
    ${JSON.stringify(ledger.history.slice(-5))}
    
    ### CURRENT_DIRECTIVE:
    ${input}
    
    ### OUTPUT_REQUIREMENT: Return JSON only. Ensure the response format matches the expected schema for your role.`;

    const res = await callGemini("gemini-3-flash-preview", prompt, {
      responseMimeType: "application/json"
    });

    try {
      return JSON.parse(res.text || "{}");
    } catch (e) {
      console.error(`Agent ${this.metadata.name} failed to return valid JSON:`, res.text);
      return { error: "Invalid JSON response" };
    }
  }
}

// --- RESILIENCE LAYER ---

async function callGemini(modelName: string, prompt: string, config: any = {}, retries: number = 3) {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config
      });
      return response;
    } catch (error: any) {
      lastError = error;
      if (i < retries - 1) await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
  throw lastError;
}

// --- ORCHESTRATOR AGENT (The "Brain") ---

const OrchestratorAgent = new MagenticAgent({
  name: "OrchestrationManager",
  role: "Magentic-One Controller",
  systemPrompt: `You are the central orchestrator for a multi-agent catering system. 
  Your job is to analyze the user request and the current Ledger state to decide which specialized agent should act next.
  
  AVAILABLE AGENTS:
  - CustomerInteractionAgent: Use for extracting event requirements from raw text.
  - WebSurferAgent: Use for weather, trends, and location research (Azure AI Search Simulator).
  - MenuSynthesisAgent: Use for designing the actual menu.
  - StrategicOperationsAgent: Use for logistics, pricing, and procurement.
  
  DECISION LOGIC:
  1. If requirements are missing, call CustomerInteractionAgent.
  2. If requirements exist but no context, call WebSurferAgent.
  3. If context exists but no menu, call MenuSynthesisAgent.
  4. If menu exists but no operations, call StrategicOperationsAgent.
  5. If all exist, return status: 'FINAL_SYNC'.
  
  RETURN FORMAT:
  { "next_agent": "AgentName", "task_description": "Specific instruction for that agent", "status": "CONTINUE" | "FINAL_SYNC" }`
});

// --- SPECIALIZED AGENTS ---

const CustomerAgent = new MagenticAgent({
  name: "CustomerInteractionAgent",
  role: "Requirement Analyst",
  systemPrompt: "Extract structured catering requirements: event_type, guests, budget, location, date, dietary_needs. Ensure alignment with Microsoft Foundry precision standards."
});

const ResearcherAgent = new MagenticAgent({
  name: "WebSurferAgent",
  role: "Azure AI Search Simulator",
  systemPrompt: "Retrieved hyper-local context: weather forecasts, cuisine trends, and dietary risk assessments based on the location and date. Search for venue-specific logistics if location is known."
});

const MenuChefAgent = new MagenticAgent({
  name: "MenuSynthesisAgent",
  role: "Executive Gourmet Designer",
  systemPrompt: "Synthesize a comprehensive menu. Output structure: { menu: [{ dish, description, category, calories, macros, price }] }. Use Pollinations for visual keywords."
});

const StrategicOpsAgent = new MagenticAgent({
  name: "StrategicOperationsAgent",
  role: "Logistics & Budgeting Strategist",
  systemPrompt: "Generate operational details: { inventory: { procurement_list: [] }, logistics: { timeline: [], staff_roles: [] }, pricing: { breakdown: {}, total_cost: \"\" } }"
});

// --- ORCHESTRATOR LOOP ---

export async function orchestrateCatering(input: string, onStep: (step: any) => void, initialData: any = {}) {
  const prefLang = initialData.language || "English";
  const ledger: AgentLedger = { history: [] };
  let currentStatus = "CONTINUE";
  let iterations = 0;
  const MAX_ITERATIONS = 6;

  try {
    while (currentStatus === "CONTINUE" && iterations < MAX_ITERATIONS) {
      iterations++;
      
      // Step A: Calling Orchestrator to decide next handoff
      // Visualizing agent-to-agent communication
      onStep({ agent: "Orchestrator", data: { action: "Deciding next handoff...", iteration: iterations } });
      
      const decision = await OrchestratorAgent.process(`Analyze user input "${input}" and decide the next step.`, ledger, prefLang);
      
      if (decision.status === "FINAL_SYNC") {
        currentStatus = "FINAL_SYNC";
        onStep({ agent: "System", data: { status: "Syncing final manifest..." } });
        break;
      }

      const agentName = decision.next_agent;
      const task = decision.task_description;

      // Step B: Executing the specialized agent
      let agentResult: any;
      
      if (agentName === "CustomerInteractionAgent") {
        agentResult = await CustomerAgent.process(task, ledger, prefLang);
        ledger.requirements = agentResult;
      } else if (agentName === "WebSurferAgent") {
        // AZURE AI SEARCH PROTOCOL SIMULATION
        onStep({ 
          agent: "Azure AI Search", 
          data: { status: "RETRIEVING", query: `Catering trends for ${ledger.requirements?.location || "General"}` } 
        });
        agentResult = await ResearcherAgent.process(task, ledger, prefLang);
        ledger.context = agentResult;
      } else if (agentName === "MenuSynthesisAgent") {
        agentResult = await MenuChefAgent.process(task, ledger, prefLang);
        // Image Enrichment
        const enrichedMenu = {
          menu: (agentResult.menu || []).map((it: any) => ({
            ...it,
            image_url: `https://image.pollinations.ai/prompt/${encodeURIComponent(`professional gourmet food photography of ${it.dish}, ${it.description}, cinematic, 8k`)}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random() * 1000)}`
          }))
        };
        ledger.menu = enrichedMenu;
        agentResult = enrichedMenu;
      } else if (agentName === "StrategicOperationsAgent") {
        agentResult = await StrategicOpsAgent.process(task, ledger, prefLang);
        ledger.operations = agentResult;
      }

      // Step C: Recording the handoff in the Shared Ledger (Agent-to-Agent Communication)
      onStep({ 
        agent: "Shared Ledger", 
        data: { sync: "AGENT_HANDOFF", from: "Orchestrator", to: agentName, ledger_state: "UPDATED" } 
      });

      ledger.history.push({
        agent: agentName,
        action: task,
        timestamp: new Date().toISOString(),
        content: agentResult
      });

      onStep({ agent: agentName, data: agentResult });
    }

    return {
      success: true,
      data: {
        customer: ledger.requirements,
        weather: ledger.context?.weather || {},
        dietary: ledger.context?.dietary || {},
        menu: ledger.menu,
        inventory: ledger.operations?.inventory,
        logistics: ledger.operations?.logistics,
        pricing: ledger.operations?.pricing,
        monitoring: ledger.operations?.monitoring || { status: "Complete", risk: "Low" }
      }
    };

  } catch (error) {
    console.error("Magentic Orchestrator Failure:", error);
    throw error;
  }
}

// --- UTILITIES (Remain for UI compatibility) ---

export async function validateAnswer(question: string, answer: string) {
  const commonAnswers = ['wedding', 'birthday', 'corporate', 'party', 'event', 'catering', 'food', 'pesos', 'php', 'bbq', 'ikaw', 'bahala', 'any', 'surprise', 'suprise', 'wala', 'none', 'ok', 'okay', 'pili', 'ka', 'ikaw', 'na'];
  if (commonAnswers.some(word => answer.toLowerCase().includes(word))) return { valid: true, re_ask_message: "" };

  try {
    const prompt = `### ROLE: INPUT_RELEVANCE_FILTER
    ### BOT_QUESTION: "${question}"
    ### USER_INPUT: "${answer}"
    ### LANGUAGE_PROTOCOL: Cross-evaluate context between English, Filipino, and other international languages.
    Return JSON { "valid": boolean, "re_ask_message": string }`;
    
    const res = await callGemini("gemini-3-flash-preview", prompt, { responseMimeType: "application/json" });
    return JSON.parse(res.text || '{"valid": true, "re_ask_message": ""}');
  } catch (e) { return { valid: true, re_ask_message: "" }; }
}

export async function translateText(text: string, targetLang: string) {
  if (!targetLang || targetLang.toLowerCase() === 'english') return text;
  try {
    const prompt = `Translate to ${targetLang}: "${text}". NO QUOTES.`;
    const res = await callGemini("gemini-3-flash-preview", prompt);
    return res.text.trim();
  } catch (e) { return text; }
}

export async function predictWeather(location: string, date: string) {
  try {
    const prompt = `Predict weather for ${location} on ${date}. Return JSON with summary, risk_level, recommendations.`;
    const res = await callGemini("gemini-3-flash-preview", prompt, { responseMimeType: "application/json" });
    return JSON.parse(res.text || "{}");
  } catch (e) { return { summary: "Retrieved.", risk_level: "low", recommendations: [] }; }
}

