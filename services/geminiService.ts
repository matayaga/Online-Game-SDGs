
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getStrategistAdvice(
  currentTable: number[],
  remainingDeckSize: number,
  playerHand: number[]
) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a strategic advisor for the SDG Cooperative Game.
      Current table cards (SDG IDs): [${currentTable.join(", ")}]
      Remaining cards in deck: ${remainingDeckSize}
      Active player hand (SDG IDs): [${playerHand.join(", ")}]
      
      Goal: Total team score 63+. Everyone needs SDGs 1, 2, and 17.
      
      Provide a very short, punchy recommendation (max 20 words) for the current player. Should they flip again or collect?`,
      config: {
        temperature: 0.7,
      },
    });
    return response.text || "Continue if you're feeling lucky, Agent.";
  } catch (error) {
    console.error("Gemini Advice Error:", error);
    return "The future depends on your decision.";
  }
}

export async function getSDGInsight(goalId: number) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a single, inspiring, one-sentence fact about United Nations Sustainable Development Goal #${goalId}. Make it relevant to why we must achieve it.`,
      config: {
        temperature: 0.8,
      },
    });
    return response.text;
  } catch (error) {
    return null;
  }
}
