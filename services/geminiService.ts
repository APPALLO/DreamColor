import { GoogleGenAI, Type, Chat } from "@google/genai";
import { ChatMessage } from "../types";

// Helper to get the AI client instance.
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Step 1: Generate 5 distinct coloring book page descriptions based on the theme.
 * Uses a faster model (Flash) for text planning.
 */
export const generatePagePrompts = async (theme: string): Promise<string[]> => {
  const ai = getAiClient();
  const prompt = `
    I am creating a coloring book for children with the theme: "${theme}".
    Please generate 5 distinct, creative, and fun descriptions for 5 different coloring pages based on this theme.
    The descriptions should be visual and simple, suitable for converting into an image prompt.
    Return ONLY a JSON array of strings. Do not include markdown formatting.
    Example: ["A cute dinosaur eating a leaf", "A rocket ship flying past the moon"]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text response from model");
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Error generating prompts:", error);
    // Fallback if JSON parsing fails
    return [
      `${theme} scene 1`,
      `${theme} scene 2`,
      `${theme} scene 3`,
      `${theme} scene 4`,
      `${theme} scene 5`,
    ];
  }
};

/**
 * Step 2: Generate a single image using the Flash Image model (Free tier compatible).
 */
export const generateColoringPage = async (sceneDescription: string): Promise<string> => {
  const ai = getAiClient();
  
  // Specific prompt engineering for coloring book style
  const imagePrompt = `
    A professional children's coloring book page of ${sceneDescription}.
    Strictly black and white line art. 
    White background. 
    Thick, clean, distinct black lines. 
    No shading, no greyscale, no fill, no colors. 
    Simple, cute, high contrast, vector style illustration.
    Centered composition.
  `;

  // Using gemini-2.5-flash-image for standard/free tier usage
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: imagePrompt }]
    },
    config: {
      // aspectRatio is supported by flash-image, but imageSize is not.
      // We rely on the model's default resolution (usually 1024x1024)
      // Note: While config parameters might vary, strictly passing supported ones is best.
    }
  });

  // Extract image from response parts
  if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("No image generated in response");
};

/**
 * Chat functionality using Gemini 2.5 Flash
 */
export const sendChatMessage = async (history: ChatMessage[], newMessage: string): Promise<string> => {
  const ai = getAiClient();
  
  // Map history to GoogleGenAI chat history format
  const chatHistory = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  const chat: Chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    history: chatHistory,
    config: {
      systemInstruction: "You are a helpful assistant for a coloring book generator app. You help parents and kids come up with creative themes for their coloring books. Keep answers concise and friendly.",
    }
  });

  const response = await chat.sendMessage({ message: newMessage });
  return response.text || "I'm not sure how to respond to that.";
};

/**
 * Checks bypassed for free tier usage
 */
export const checkApiKeySelection = async (): Promise<boolean> => {
  return true; 
};

export const promptApiKeySelection = async (): Promise<void> => {
  // No-op for free/standard usage
};
