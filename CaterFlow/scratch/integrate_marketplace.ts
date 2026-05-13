import fs from 'fs';

const filePath = 'c:/Users/Aron/Desktop/caterFlow/CaterFlow/src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports
const imports = `import { ShopDiscovery } from './components/discovery/ShopDiscovery';
import { ShopDetailsModal } from './components/discovery/ShopDetailsModal';
import { MarketplaceChat } from './components/chat/MarketplaceChat';
`;
content = content.replace("import { BlueprintSummary } from './components/plan/BlueprintSummary';", "import { BlueprintSummary } from './components/plan/BlueprintSummary';\n" + imports);

// 2. Update dashboardView type
const oldViewType = "const [dashboardView, setDashboardView] = useState<'conversation' | 'blueprint' | 'summary' | 'operations' | 'finance' | 'admin-dashboard' | 'admin-inbox' | 'shop-setup' | 'inventory-planner' | 'menu-editor' | 'checkout' | 'staff-tasks' | 'delivery'>('conversation');";
const newViewType = "const [dashboardView, setDashboardView] = useState<'conversation' | 'blueprint' | 'discovery' | 'marketplace-chat' | 'summary' | 'operations' | 'finance' | 'admin-dashboard' | 'admin-inbox' | 'shop-setup' | 'inventory-planner' | 'menu-editor' | 'checkout' | 'staff-tasks' | 'delivery'>('conversation');";

if (content.includes(oldViewType)) {
    content = content.replace(oldViewType, newViewType);
}

// 3. Add necessary states
const statesAnchor = "const [showSummary, setShowSummary] = useState(false);";
const newStates = `
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [showShopDetails, setShowShopDetails] = useState<string | null>(null);
  const [isConversationSaved, setIsConversationSaved] = useState(false);
`;
content = content.replace(statesAnchor, statesAnchor + newStates);

// 4. Update handleConfirmOrder to go to Discovery instead of Summary
const oldConfirmOrder = `  const handleConfirmOrder = () => {
    setShowSummary(true);
    setDashboardView('summary');
  };`;

const newConfirmOrder = `  const handleConfirmOrder = () => {
    setShowSummary(true);
    setDashboardView('discovery');
  };`;

if (content.includes(oldConfirmOrder)) {
    content = content.replace(oldConfirmOrder, newConfirmOrder);
}

// 5. Add Save Conversation Logic
const saveLogic = `
  const handleSaveConversation = async () => {
    if (!activeConversationId) return;
    try {
      await fetch(\`/api/events/\${activeConversationId}/save-prompt\`, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${localStorage.getItem('token')}\`,
          'Content-Type': 'application/json'
        }
      });
      setIsConversationSaved(true);
      alert("Conversation saved to your history!");
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const handleRestartWithPrompt = () => {
    if (!isConversationSaved && messages.length > 2) {
      if (window.confirm("Do you want to save this conversation before clearing?")) {
        handleSaveConversation().then(restartChat);
        return;
      }
    }
    restartChat();
  };
`;
content = content.replace("const restartChat = () => {", saveLogic + "\n  const restartChat = () => {");

// 6. Update JSX to include the new views
const discoveryJSX = `
                {dashboardView === 'discovery' && (
                  <ShopDiscovery 
                    eventData={eventData} 
                    onSelectShop={(id) => setShowShopDetails(id)} 
                  />
                )}
                {dashboardView === 'marketplace-chat' && selectedShop && (
                  <MarketplaceChat 
                    eventId={activeConversationId || ''} 
                    shop={selectedShop} 
                    currentUser={user}
                    eventData={eventData}
                    menuItems={localMenu}
                  />
                )}
`;

content = content.replace("{dashboardView === 'summary' && (", discoveryJSX + "\n                {dashboardView === 'summary' && (");

// 7. Add Modal to the bottom of the main container
const modalJSX = `
      {showShopDetails && (
        <ShopDetailsModal 
          shopId={showShopDetails} 
          onClose={() => setShowShopDetails(null)} 
          onStartChat={(shop) => {
            setSelectedShop(shop);
            setShowShopDetails(null);
            setDashboardView('marketplace-chat');
          }}
        />
      )}
`;

// Insert modal before the closing tag of the main container
const lastDiv = "</div>\n    </div>\n  );\n}";
content = content.replace(lastDiv, modalJSX + lastDiv);

fs.writeFileSync(filePath, content);
console.log("✓ Successfully integrated Marketplace Flow into App.tsx");
