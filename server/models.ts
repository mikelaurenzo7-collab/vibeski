// AI Provider types for Field of Dreams
// Raptor maps to gpt-4.1-mini via OpenAI SDK — no @replit/ai-integrations needed
export type ProviderName = 'raptor' | 'openai' | 'anthropic' | 'grok' | 'gemini';

// Model ID mappings for each provider
export const MODEL_IDS: Record<ProviderName, string> = {
  raptor: 'gpt-4.1-mini',   // Primary — fast, capable, cost-efficient
  openai: 'gpt-4o-mini',    // OpenAI fallback
  anthropic: 'claude-sonnet-4-5', // Premium 5x credit model
  grok: 'grok-3-mini-fast', // xAI model
  gemini: 'gemini-2.5-flash', // Google fallback
};
