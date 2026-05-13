import fs from 'fs';

const filePath = 'c:/Users/Aron/Desktop/caterFlow/CaterFlow/src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update dashboardView type
const oldViewType = "const [dashboardView, setDashboardView] = useState<'conversation' | 'summary' | 'operations' | 'finance' | 'admin-dashboard' | 'admin-inbox' | 'shop-setup' | 'inventory-planner' | 'menu-editor' | 'checkout' | 'staff-tasks' | 'delivery'>('conversation');";
const newViewType = "const [dashboardView, setDashboardView] = useState<'conversation' | 'blueprint' | 'summary' | 'operations' | 'finance' | 'admin-dashboard' | 'admin-inbox' | 'shop-setup' | 'inventory-planner' | 'menu-editor' | 'checkout' | 'staff-tasks' | 'delivery'>('conversation');";

if (content.includes(oldViewType)) {
    content = content.replace(oldViewType, newViewType);
}

// 2. Update chat completion logic to switch to blueprint
const oldChatEnd = `      setIsConfirming(true);
      setShowSummary(true);
      setMessages(prev => [...prev, {
        id: \`sys-review-\${Date.now()}\`,
        role: 'bot',
        content: "I've gathered all the details! Please review the summary below. Is everything correct, or would you like to add anything else?",
        timestamp: new Date()
      }]);`;

const newChatEnd = `      setMessages(prev => [...prev, {
        id: \`sys-review-\${Date.now()}\`,
        role: 'bot',
        content: "I've gathered all the details! Please review the summary below. Is everything correct, or would you like to add anything else?",
        timestamp: new Date()
      }]);
      setDashboardView('blueprint');`;

if (content.includes(oldChatEnd)) {
    content = content.replace(oldChatEnd, newChatEnd);
}

// 3. Update JSX to include BlueprintSummary case
// We look for {dashboardView === 'conversation' && ( and its closing part
// and we also need to update how 'summary' is rendered to pass props

const summaryMatch = `{dashboardView === 'summary' && (
                  <CustomerPlanner 
                    steps={steps}
                    monitoring={monitoringStep}
                    pricing={pricingStep}
                  />
                )}`;

const newSummaryAndBlueprint = `{dashboardView === 'conversation' && (
                  <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* CHAT_UI_CONTENT */}
                  </div>
                )}
                {dashboardView === 'blueprint' && (
                  <BlueprintSummary 
                    eventData={eventData} 
                    onNext={handleConfirmOrder}
                    onBack={() => setDashboardView('conversation')}
                  />
                )}
                {dashboardView === 'summary' && (
                  <CustomerPlanner 
                    steps={steps}
                    monitoring={monitoringStep}
                    pricing={pricingStep}
                    eventData={eventData}
                  />
                )}`;

// Since the CHAT_UI_CONTENT is large, I'll do a more targeted injection for blueprint
const conversationStart = "{dashboardView === 'conversation' && (";
if (content.includes(conversationStart) && content.includes(summaryMatch)) {
    content = content.replace(summaryMatch, `{dashboardView === 'blueprint' && (
                  <BlueprintSummary 
                    eventData={eventData} 
                    onNext={handleConfirmOrder}
                    onBack={() => setDashboardView('conversation')}
                  />
                )}
                {dashboardView === 'summary' && (
                  <CustomerPlanner 
                    steps={steps}
                    monitoring={monitoringStep}
                    pricing={pricingStep}
                    eventData={eventData}
                  />
                )}`);
}

fs.writeFileSync(filePath, content);
console.log("✓ Successfully updated App.tsx logic and JSX");
