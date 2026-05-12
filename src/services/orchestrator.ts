import { GoogleGenerativeAI } from '@google/genai';

interface EventData {
  event_type?: string;
  guest_count?: number;
  event_location?: string;
  event_date?: string;
  budget?: number;
  currency?: string;
  cuisine_preference?: string;
  dietary_restrictions?: string[];
  specific_food_items?: string[];
  preferred_language?: string;
}

interface AgentStep {
  agent: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  data: any;
  timestamp: Date;
}

// Initialize Gemini client
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateConversationalPrompt(
  userInput: string,
  eventData: EventData,
  language: string = 'English'
): Promise<string> {
  const contextStr = JSON.stringify(eventData, null, 2);
  
  return `You are a friendly AI catering assistant. Help the user plan their catering event.

Current Event Context:
${contextStr}

User Message: ${userInput}
Preferred Language: ${language}

Provide a helpful, conversational response in the user's preferred language.`;
}

export async function orchestrateCatering(request: string, eventData?: EventData): Promise<{
  steps: AgentStep[];
  finalPlan: any;
  summary: string;
}> {
  const steps: AgentStep[] = [];
  
  try {
    // Step 1: Requirement Gathering Agent
    steps.push({
      agent: 'Customer Interaction Agent',
      status: 'in_progress',
      data: { input: request },
      timestamp: new Date()
    });
    
    const model = genai.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(`
      Analyze this catering request and extract structured data:
      "${request}"
      
      Return JSON with these fields:
      - event_type: type of event
      - guest_count: number of guests
      - event_location: location
      - event_date: date
      - budget: estimated budget
      - currency: currency
      - cuisine_preference: cuisine type
      - dietary_restrictions: array of restrictions
      - special_requests: array of special requests
    `);
    
    let extractedData = {};
    try {
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[^{}]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Error parsing Gemini response:', e);
      extractedData = { raw_input: request };
    }
    
    steps[0].status = 'completed';
    steps[0].data = extractedData;
    
    // Step 2: Menu Planning Agent
    steps.push({
      agent: 'Menu Planning Agent',
      status: 'completed',
      data: {
        suggested_menus: generateMenuSuggestions(extractedData),
        dietary_compliant: true
      },
      timestamp: new Date()
    });
    
    // Step 3: Inventory & Procurement Agent
    steps.push({
      agent: 'Inventory & Procurement Agent',
      status: 'completed',
      data: {
        estimated_items: calculateInventory(extractedData),
        supplier_recommendations: [
          { name: 'Premium Caterer Co.', specialty: 'Fine Dining' },
          { name: 'Fresh Ingredients Ltd.', specialty: 'Organic' },
          { name: 'Quick Catering Service', specialty: 'Fast Service' }
        ]
      },
      timestamp: new Date()
    });
    
    // Step 4: Logistics Planning Agent
    steps.push({
      agent: 'Logistics Planning Agent',
      status: 'completed',
      data: {
        delivery_timeline: generateTimeline(extractedData),
        transport_requirements: 'Standard refrigerated truck',
        setup_time_required: '2-3 hours'
      },
      timestamp: new Date()
    });
    
    // Step 5: Pricing & Optimization Agent
    steps.push({
      agent: 'Pricing & Optimization Agent',
      status: 'completed',
      data: {
        estimated_cost: calculatePricing(extractedData),
        cost_breakdown: {
          food: '60%',
          labor: '25%',
          logistics: '10%',
          contingency: '5%'
        },
        price_range: `${Math.floor((extractedData as any).budget * 0.9)} - ${Math.floor((extractedData as any).budget * 1.1)}`
      },
      timestamp: new Date()
    });
    
    // Step 6: Risk Simulation Agent
    steps.push({
      agent: 'Real-Time Risk Simulation Agent',
      status: 'completed',
      data: {
        identified_risks: [
          { risk: 'Weather delays', probability: 'low', mitigation: 'Indoor venue backup' },
          { risk: 'Supplier shortage', probability: 'low', mitigation: 'Multiple suppliers' },
          { risk: 'Guest count variance', probability: 'medium', mitigation: '±10% buffer' }
        ],
        overall_risk_level: 'low'
      },
      timestamp: new Date()
    });
    
    const finalPlan = {
      event_details: extractedData,
      menu: steps[1].data,
      inventory: steps[2].data,
      logistics: steps[3].data,
      pricing: steps[4].data,
      risks: steps[5].data,
      status: 'ready_for_review'
    };
    
    return {
      steps,
      finalPlan,
      summary: `Catering plan for ${(extractedData as any).guest_count || '?'} guests prepared. Estimated cost: ${steps[4].data.estimated_cost}. Risk level: ${steps[5].data.overall_risk_level}`
    };
  } catch (error) {
    console.error('Orchestration error:', error);
    throw error;
  }
}

export function validateUserResponse(response: string, expectedType: string): { valid: boolean; error?: string } {
  if (!response || response.trim().length === 0) {
    return { valid: false, error: 'Response cannot be empty' };
  }
  
  if (response.length > 5000) {
    return { valid: false, error: 'Response too long (max 5000 characters)' };
  }
  
  // Type-specific validation
  if (expectedType === 'guest_count') {
    const num = parseInt(response);
    if (isNaN(num) || num < 1 || num > 10000) {
      return { valid: false, error: 'Guest count must be between 1 and 10,000' };
    }
  }
  
  if (expectedType === 'budget') {
    const match = response.match(/[\d.,]+/);
    if (!match) {
      return { valid: false, error: 'Invalid budget format' };
    }
  }
  
  return { valid: true };
}

function generateMenuSuggestions(eventData: any): string[] {
  const menus = [
    'Classic Elegance: Roasted chicken, seasonal vegetables, artisan bread',
    'Modern Fusion: Asian-inspired dishes with local ingredients',
    'Premium Showcase: Multi-course tasting menu with wine pairing'
  ];
  
  if (eventData.cuisine_preference) {
    return [`${eventData.cuisine_preference} specialties menu`, ...menus.slice(1)];
  }
  
  return menus;
}

function calculateInventory(eventData: any): any[] {
  const guestCount = eventData.guest_count || 50;
  return [
    { item: 'Main protein', quantity: guestCount, unit: 'servings' },
    { item: 'Vegetables', quantity: Math.ceil(guestCount * 1.5), unit: 'portions' },
    { item: 'Beverages', quantity: Math.ceil(guestCount * 2), unit: 'servings' },
    { item: 'Desserts', quantity: guestCount, unit: 'portions' }
  ];
}

function generateTimeline(eventData: any): string[] {
  const eventDate = new Date(eventData.event_date || Date.now());
  const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  return [
    `D-${daysUntil}: Event day - Final confirmations`,
    `D-${Math.max(1, daysUntil - 2)}: Delivery and setup`,
    `D-${Math.max(1, daysUntil - 7)}: Final menu confirmation`,
    `D-${Math.max(1, daysUntil - 14)}: Initial planning and supplier contact`
  ];
}

function calculatePricing(eventData: any): string {
  const guestCount = eventData.guest_count || 50;
  const budgetPerGuest = (eventData.budget || 5000) / guestCount;
  const totalEstimate = budgetPerGuest * guestCount * 0.95; // 5% discount
  
  return `$${Math.round(totalEstimate)} (approx $${Math.round(budgetPerGuest)}/guest)`;
}
