export interface AgentStep {
  agent: string;
  data: any;
}

export interface Message {
  id: string;
  role: 'bot' | 'user' | 'system';
  content: string;
  agent?: string;
  qKey?: string;
  timestamp: Date;
}

export type WorkspaceRole = 'customer' | 'admin' | 'staff';
