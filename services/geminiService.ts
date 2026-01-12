
import { GoogleGenAI, Type } from "@google/genai";
import { GenerationParams } from "../types";

// 安全地取得 API Key，避免在 process 未定義的環境崩潰
const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export const generateIEPGoals = async (params: GenerationParams): Promise<any[]> => {
  const prompt = `你是一位資長的特教老師。請根據以下資訊，產出符合「台灣特教領綱」與「特殊教育課程實施規範」的教學目標。
領域/學科：${params.subject}
障礙類別：${params.disabilityType}
年級：${params.gradeLevel}
單元名稱：${params.unit}
學生個別化程度描述：${params.studentLevel}

要求：
1. 結構必須包含「大目標 (title)」與其下的「細部指標陣列 (subGoals)」。
2. 針對該單元內容，請務必提供 3 到 5 個細部指標 (subGoals)，以便老師從中挑選最適合學生的項目。
3. 每個細部指標請提供具體的「學習策略 (strategy)」，需考慮學生的【障礙類別】。例如對自閉症學生多用視覺提示，對學習障礙學生多用多感官教學。
4. 目標內容必須包含具體的評量標準，如「正確率達 80%」等。
5. 產出請務必嚴格遵守 JSON 格式。`;

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

    const text = response.text;
    if (!text) return [];
    
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("AI 生成失敗，請檢查網路或 API Key 設定。");
  }
};
