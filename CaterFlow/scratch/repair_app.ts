import fs from 'fs';

const filePath = 'c:/Users/Aron/Desktop/caterFlow/CaterFlow/src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const anchor = "import { hasCurrencyMarker } from './services/budget';";
const restoration = `
import { GeoOpsLeafletMap } from './components/GeoOpsLeafletMap';
import { CustomerPlanner } from './components/plan/CustomerPlanner';
import { AdminInbox } from './components/admin/AdminInbox';
import { AdminShopSetup } from './components/admin/AdminShopSetup';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { StaffTaskBoard } from './components/operations/StaffTaskBoard';
import { DriverView } from './operations/DriverView';
import { BlueprintSummary } from './components/plan/BlueprintSummary';

interface AgentStep {
  agent: string;
  data: any;
}`;

if (content.includes(anchor)) {
    content = content.replace(anchor, anchor + restoration);
    fs.writeFileSync(filePath, content);
    console.log("✓ Successfully restored App.tsx imports");
} else {
    console.log("✗ Could not find anchor in App.tsx");
}
