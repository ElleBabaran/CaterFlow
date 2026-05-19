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
  isWeatherChoice?: boolean;
  isWeatherForecast?: boolean;
  weatherData?: any;
  weatherSummary?: string;
  weatherLocation?: string;
  isMenuCompositionChoice?: boolean;
  isFoodChoiceMode?: boolean;
  isPortionControlMode?: boolean;
  isProteinChoice?: boolean;
  timestamp: Date;
}

export type WorkspaceRole = 'customer' | 'admin' | 'staff';
