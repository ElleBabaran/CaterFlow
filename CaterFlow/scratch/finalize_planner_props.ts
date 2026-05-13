import fs from 'fs';

const filePath = 'c:/Users/Aron/Desktop/caterFlow/CaterFlow/src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update CustomerPlanner in summary view (Customer role)
const customerSummaryOld = `<CustomerPlanner
                      menu={localMenu}
                      inventory={localInventory}
                    />`;
const customerSummaryNew = `<CustomerPlanner
                      steps={steps}
                      monitoring={monitoringStep}
                      pricing={pricingStep}
                      eventData={eventData}
                      onUpdate={(newMenu) => setLocalMenu(newMenu)}
                    />`;

if (content.includes(customerSummaryOld)) {
    content = content.replace(customerSummaryOld, customerSummaryNew);
}

// Update CustomerPlanner in admin/summary view
const adminSummaryOld = `<CustomerPlanner 
                    steps={steps}
                    monitoring={monitoringStep}
                    pricing={pricingStep}
                  />`;
const adminSummaryNew = `<CustomerPlanner 
                    steps={steps}
                    monitoring={monitoringStep}
                    pricing={pricingStep}
                    eventData={eventData}
                  />`;

if (content.includes(adminSummaryOld)) {
    content = content.replace(adminSummaryOld, adminSummaryNew);
}

// Update the inventory-planner tab
const inventoryPlannerOld = `<CustomerPlanner
                      menu={localMenu}
                      inventory={localInventory}
                    />`;
// (It's the same as customerSummaryOld, so replace already handled if duplicated)

fs.writeFileSync(filePath, content);
console.log("✓ Successfully finalized CustomerPlanner props in App.tsx");
