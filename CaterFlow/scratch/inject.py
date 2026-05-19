import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add PostFinalizationView import
if 'PostFinalizationView' not in content:
    content = re.sub(
        r"(import\s+\{\s*CheckoutPortal\s*\}\s*from\s*'[^']+';)",
        r"\1\nimport { PostFinalizationView } from './components/plan/PostFinalizationView';",
        content
    )

# 2. Add handleFinalizeAgreement function near saveConversation
if 'const handleFinalizeAgreement = async ()' not in content:
    handler = '''
  const handleFinalizeAgreement = async () => {
    if (!activeConversationId) return;
    try {
      const budgetDetails = pricingStep?.pricing_analysis?.financial_summary?.total_cost || 0;
      const finalBudget = budgetDetails > 0 ? budgetDetails : (eventData.budget || '');
      
      const payload = {
        eventData: {
          ...eventData,
          agreement_status: 'finalized',
          budget: finalBudget,
          finalized_at: new Date().toISOString()
        }
      };
      await mongoService.updateEvent(activeConversationId, payload);
      setAgreementStatus('finalized');
      setEventData(payload.eventData);
      setDashboardView('post-finalization');
    } catch (err) {
      console.error('Finalize error', err);
    }
  };
'''
    content = content.replace('  const saveConversation = async () => {', handler + '\n  const saveConversation = async () => {')

# 3. Replace CheckoutPortal JSX block
target_jsx = """                {dashboardView === 'checkout' && (
                  <CheckoutPortal
                    eventId={activeConversationId || ''}
                    shop={matchedShop || {}}
                    event={eventData}
                    blueprint={steps}
                    status={agreementStatus}
                    onAccept={() => setAgreementStatus('accepted')}
                    onFinalize={() => setAgreementStatus('finalized')}
                  />
                )}"""
replacement_jsx = """                {dashboardView === 'checkout' && (
                  <CheckoutPortal
                    eventId={activeConversationId || ''}
                    shop={matchedShop || {}}
                    event={eventData}
                    blueprint={steps}
                    status={agreementStatus}
                    localMenu={localMenu}
                    onAccept={() => setAgreementStatus('accepted')}
                    onFinalize={handleFinalizeAgreement}
                  />
                )}
                {dashboardView === 'post-finalization' && (
                  <div className="overflow-y-auto max-h-[calc(100vh-160px)] custom-scrollbar px-2 py-4">
                    <PostFinalizationView
                      eventData={eventData}
                      orderId={activeConversationId || ''}
                      onChatWithShop={(shop: any) => {
                        setSelectedShop(shop);
                        setDashboardView('marketplace-chat');
                      }}
                    />
                  </div>
                )}"""

content = content.replace(target_jsx, replacement_jsx)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Injection complete.")
