import { Logger } from './logger';

const logger = new Logger('config');

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  mongodbUri: string;
  geminiApiKey: string | null;
  azureAiSearchEndpoint: string | null;
  azureAiSearchKey: string | null;
  azureAiSearchIndex: string | null;
  openWeatherMapKey: string | null;
  foundryProjectEndpoint: string | null;
  foundryModel: string | null;
}

export function loadConfig(): AppConfig {
  const config: AppConfig = {
    nodeEnv: (process.env.NODE_ENV as any) || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/caterflow',
    geminiApiKey: process.env.GEMINI_API_KEY || null,
    azureAiSearchEndpoint: process.env.AZURE_AI_SEARCH_ENDPOINT || null,
    azureAiSearchKey: process.env.AZURE_AI_SEARCH_KEY || null,
    azureAiSearchIndex: process.env.AZURE_AI_SEARCH_INDEX || null,
    openWeatherMapKey: process.env.OPENWEATHERMAP_API_KEY || null,
    foundryProjectEndpoint: process.env.FOUNDRY_PROJECT_ENDPOINT || null,
    foundryModel: process.env.FOUNDRY_MODEL || 'gpt-5.4-mini',
  };

  // Validate critical config in production
  if (config.nodeEnv === 'production') {
    const required = ['MONGODB_URI'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  logger.info('Configuration loaded', {
    nodeEnv: config.nodeEnv,
    port: config.port,
    mongodbConfigured: !!config.mongodbUri,
    geminiConfigured: !!config.geminiApiKey,
    azureAiSearchConfigured: !!config.azureAiSearchEndpoint,
  });

  return config;
}
