
import { GoogleGenAI, Type } from "@google/genai";
import { GenerationParams } from "../types";

export const generateIEPGoals = async (params: GenerationParams): Promise<any[]> => {
  // 嚴格從 process.env 獲取 API KEY
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("系統未偵測到 API_KEY。請檢查佈署環境的環境變數設定。");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `你是一位資深的特教老師。請根據以下資訊，產出符合「台灣特殊教育課程綱領」的教學目標。
領域：${params.subject}
學生障礙類別：${params.disabilityType}
年級：${params.gradeLevel}
單元名稱：${params.unit}
學生起點行為/程度：${params.studentLevel}

請產出一個 JSON 陣列，每個物件代表一個學年目標 (title)，其下包含細部指標陣列 (subGoals)。
每個指標需包含：編號 (code)、具體內容與評量標準 (content)、學習策略 (strategy)。`;

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

    // 根據最新 SDK 規範，使用 response.text 屬性獲取字串
    const jsonStr = response.text;
    if (!jsonStr) {
      throw new Error("AI 未回傳任何內容");
    }

    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // 針對常見的 401 或 403 錯誤提供更友善的提示
    if (error.message?.includes('401') || error.message?.includes('key')) {
      throw new Error("API Key 無效或已過期，請更換 Key 後再試。");
    }
    throw new Error(error.message || "AI 生成失敗，請檢查網路連線或 API 設定。");
  }
};
