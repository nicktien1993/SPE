
import { GoogleGenAI, Type } from "@google/genai";
import { GenerationParams } from "../types.ts";

const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export const generateIEPGoals = async (params: GenerationParams): Promise<any[]> => {
  const prompt = `你是一位資長的特教老師。請根據以下資訊，產出符合「台灣特教領綱」的教學目標。
領域：${params.subject}
障礙：${params.disabilityType}
年級：${params.gradeLevel}
單元：${params.unit}
程度：${params.studentLevel}

要求：格式為 JSON 陣列，包含 title (學年目標) 與 subGoals (細部指標陣列，含 code, content, strategy)。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subGoals: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    code: { type: Type.STRING },
                    content: { type: Type.STRING },
                    strategy: { type: Type.STRING }
                  },
                  required: ["code", "content", "strategy"]
                }
              }
            },
            required: ["title", "subGoals"]
          }
        }
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("生成失敗。");
  }
};
