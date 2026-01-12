
import { GoogleGenAI, Type } from "@google/genai";
import { GenerationParams } from "../types.ts";

export const generateIEPGoals = async (params: GenerationParams): Promise<any[]> => {
  // 優先從環境變數取得 API KEY (Vercel 後台可設定)
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
  
  if (!apiKey) {
    throw new Error("API Key 缺失。請在環境變數中設定 API_KEY。");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `你是一位資深的特教老師。請根據以下資訊，產出符合「台灣特殊教育課程綱領」的教學目標。
領域：${params.subject}
學生障礙類別：${params.disabilityType}
年級：${params.gradeLevel}
單元名稱：${params.unit}
學生起點行為/程度：${params.studentLevel}

請產出一個 JSON 陣列，每個物件代表一個學年目標 (title)，其下包含細部指標陣列 (subGoals)，每個指標需有編號 (code)、具體內容與評量標準 (content) 以及建議的學習策略 (strategy)。`;

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
    throw new Error("AI 生成失敗，請確認網路或 API Key 設定。");
  }
};
