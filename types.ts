export interface GeneratedImage {
  id: string;
  url: string; // Base64 data URL
  prompt: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type GenerationStatus = 'idle' | 'planning' | 'generating' | 'complete' | 'error';
