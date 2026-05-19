
with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

replacement = '''  setAgreementStatus(item.eventData?.agreement_status === 'finalized' ? 'finalized' : 'none');
  setConversationTitle(item.title || item.rawInput || \'Untitled Plan\');
  setQIndex(item.qIndex || 0);
  setInput(\'\');

  // Restore sub-component results states from steps
  let restoredMenu: any[] = [];
  let restoredInventory: any[] = [];
  let restoredTimeline: any[] = [];

  loadedSteps.forEach((step: any) => {
    if ((step.agent.includes('Head Chef') || step.agent.includes('Phase 2')) && (step.data.menu || step.data.dishes || step.data.recommendations)) {
      restoredMenu = step.data.menu || step.data.dishes || step.data.recommendations;
    }
    if (step.agent.includes('Inventory') && step.data.procurement_list) {
      restoredInventory = step.data.procurement_list;
    }
    if ((step.agent.includes('Logistics') || step.agent.includes('Phase 4')) && step.data.timeline) {
      restoredTimeline = step.data.timeline;
    }
  });

  setLocalMenu(restoredMenu);
  setLocalInventory(restoredInventory);
  setLocalTimeline(restoredTimeline);
  setStaffTasks(restoredTimeline.map((t: any) => ({ ...t, completed: false })));

  if (loadedSteps.length > 0) {
    setIsChatting(false);
    setDashboardView('summary');
    setFullScreenResult(true);
    setIsConfirming(false);
    setShowSummary(false);
  } else {
    setIsChatting(true);
    setDashboardView('conversation');
    setFullScreenResult(false);
    setIsConfirming(false);
    setShowSummary(false);
  }

  setShowHistory(false);
  setCurrentStepIndex(loadedSteps.length || -1);
};
'''

new_lines = lines[:1103] + [replacement] + lines[1138:]

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

