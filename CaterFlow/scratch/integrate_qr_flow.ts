import fs from 'fs';

const filePath = 'c:/Users/Aron/Desktop/caterFlow/CaterFlow/src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports
const qrImports = `import { OrderQR } from './components/plan/OrderQR';
import { PublicOrderView } from './components/plan/PublicOrderView';
`;
content = content.replace("import { MarketplaceChat } from './components/chat/MarketplaceChat';", "import { MarketplaceChat } from './components/chat/MarketplaceChat';\n" + qrImports);

// 2. Add URL detection state
const statesAnchor = "const [selectedShop, setSelectedShop] = useState<any>(null);";
const qrStates = `
  const [publicOrderId, setPublicOrderId] = useState<string | null>(new URLSearchParams(window.location.search).get('orderId'));
`;
content = content.replace(statesAnchor, statesAnchor + qrStates);

// 3. Update dashboardView type to include 'qr'
const oldViewType = "const [dashboardView, setDashboardView] = useState<'conversation' | 'blueprint' | 'discovery' | 'marketplace-chat' | 'summary' | 'operations' | 'finance' | 'admin-dashboard' | 'admin-inbox' | 'shop-setup' | 'inventory-planner' | 'menu-editor' | 'checkout' | 'staff-tasks' | 'delivery'>('conversation');";
const newViewType = "const [dashboardView, setDashboardView] = useState<'conversation' | 'blueprint' | 'discovery' | 'marketplace-chat' | 'qr' | 'summary' | 'operations' | 'finance' | 'admin-dashboard' | 'admin-inbox' | 'shop-setup' | 'inventory-planner' | 'menu-editor' | 'checkout' | 'staff-tasks' | 'delivery'>('conversation');";

if (content.includes(oldViewType)) {
    content = content.replace(oldViewType, newViewType);
}

// 4. Update the main render to check for publicOrderId first
const renderStart = "return (";
const publicRender = `
  if (publicOrderId) {
    return <PublicOrderView orderId={publicOrderId} />;
  }

  return (`;

if (content.includes(renderStart)) {
    content = content.replace(renderStart, publicRender);
}

// 5. Update MarketplaceChat usage to handle QR trigger
const chatMatch = `{dashboardView === 'marketplace-chat' && selectedShop && (
                  <MarketplaceChat 
                    eventId={activeConversationId || ''} 
                    shop={selectedShop} 
                    currentUser={user}
                    eventData={eventData}
                    menuItems={localMenu}
                  />
                )}`;

const chatWithQRLink = `{dashboardView === 'marketplace-chat' && selectedShop && (
                  <div className="space-y-6">
                    <MarketplaceChat 
                      eventId={activeConversationId || ''} 
                      shop={selectedShop} 
                      currentUser={user}
                      eventData={eventData}
                      menuItems={localMenu}
                    />
                    <div className="flex justify-center">
                      <button 
                        onClick={() => setDashboardView('qr')}
                        className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm flex items-center gap-2"
                      >
                        <QrCode className="w-4 h-4" />
                        Generate Order QR Code
                      </button>
                    </div>
                  </div>
                )}
                {dashboardView === 'qr' && activeConversationId && (
                  <div className="py-10">
                    <OrderQR orderId={activeConversationId} orderData={{ menu: localMenu, event: eventData }} />
                    <div className="mt-8 text-center">
                      <button onClick={() => setDashboardView('marketplace-chat')} className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">
                        Back to Chat
                      </button>
                    </div>
                  </div>
                )}`;

if (content.includes(chatMatch)) {
    content = content.replace(chatMatch, chatWithQRLink);
}

fs.writeFileSync(filePath, content);
console.log("✓ Successfully integrated Order QR flow into App.tsx");
