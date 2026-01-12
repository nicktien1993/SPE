
import { GoogleGenAI, Type } from "@google/genai";
import { GenerationParams } from "../types.ts";

const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env?.API_KEY) return process.env.API_KEY;
  if ((window as any).process?.env?.API_KEY) return (window as any).process.env.API_KEY;
  return '';
};

export const generateIEPGoals = async (params: GenerationParams): Promise<any[]> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key 尚未設定。請確認環境變數中已填入 API_KEY。");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `你是一位資長的特教老師。請根據以下資訊，產出符合「台灣特教領綱」的教學目標。
領域：${params.subject}
障礙：${params.disabilityType}
年級：${params.gradeLevel}
單元：${params.unit}
程度：${params.studentLevel}

要求：產出格式必須為 JSON 陣列，包含 title (學年目標) 與 subGoals (細部指標陣列)。`;

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
    console.error("Gemini API Error:", error);
    throw new Error("生成失敗，請檢查網路連線或 API Key 是否正確。");
  }
};
