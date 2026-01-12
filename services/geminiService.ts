
import { GoogleGenAI, Type } from "@google/genai";
import { GenerationParams } from "../types";

export const generateIEPGoals = async (params: GenerationParams): Promise<any[]> => {
  // Use process.env.API_KEY directly as per guidelines.
  // A new instance is created right before making the API call to ensure it uses the most up-to-date key.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("系統設定尚未完成，請聯絡管理員。");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `你是一位精通「台灣特教適性教學」的資深專家。
你的任務是為「${params.gradeLevel}」的「${params.disabilityType}」學生產出細步化、可量化的 IEP 目標。

【適性調整核心規則】：
1. 【結構化內容】：針對「${params.unit}」，產出 1 個學年目標及對應的 5 個學期細步目標。
2. 【智慧標準判定】：
   - 涉及安全之技能（如：辨識危險）：標準 100%。
   - 初階動作或認知（如：仿說）：標準 60%。
   - 穩定發展之技能（如：認讀數字）：標準 80%。
3. 【精準描述】：目標內容必須包含具體行為、條件與通過標準。
4. 【教學策略】：提供 1-2 句實用的特教教學提示（輔助減退或環境調整）。
5. 【格式】：嚴格遵守 JSON 格式。`;

  const prompt = `單元名稱：${params.unit}
學生起點能力：${params.studentLevel}
請產出適性化的特教目標，targetAccuracy 需為 0-100 的數字。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
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
                    strategy: { type: Type.STRING },
                    targetAccuracy: { type: Type.NUMBER }
                  },
                  required: ["code", "content", "strategy", "targetAccuracy"]
                }
              }
            },
            required: ["title", "subGoals"]
          }
        }
      },
    });

    // Access .text property directly (not a method) as per guidelines.
    const jsonStr = response.text?.trim();
    if (!jsonStr) throw new Error("AI 生成內容為空");
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const errorMessage = error.message || "";
    
    if (errorMessage.includes("429")) {
      throw new Error("目前使用人數較多，系統額度暫時用完，請稍後幾分鐘再試。");
    }
    
    // Handle "Requested entity was not found" by prompting for key selection
    if (errorMessage.includes("Requested entity was not found")) {
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        await (window as any).aistudio.openSelectKey();
      }
      throw new Error("API 金鑰失效或專案未啟動，已重新開啟設定視窗，請重新選擇金鑰。");
    }
    
    throw new Error("系統生成時發生一點小問題，請再試一次。");
  }
};
