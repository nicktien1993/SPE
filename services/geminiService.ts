
import { GoogleGenAI, Type } from "@google/genai";
import { GenerationParams } from "../types";

export const generateIEPGoals = async (params: GenerationParams): Promise<any[]> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("環境變數中缺少 API_KEY。");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `你是一位精通「台灣特教適性教學」的資深專家。
你的任務是為「${params.gradeLevel}」的「${params.disabilityType}」學生產出細步化目標。

【適性調整核心規則】：
1. 【量化目標】：針對「${params.unit}」，每個學年目標下產出 5 個學期目標。
2. 【智慧標準設定】：不要全部設定為 80%！請根據任務性質判斷：
   - 安全/關鍵技能（如：過馬路、識別危險）：目標值應設為 100%。
   - 初階嘗試技能（如：嘗試仿說）：目標值可設為 60%。
   - 穩定發展技能（如：計算、認字）：目標值可設為 80%。
3. 【通過條件描述】：內容應包含明確的通過條件（例如：在口頭提示下、連續兩週、正確率達 X%）。
4. 【針對性策略】：根據學生的特質提供「輔助減退」或「環境調整」策略。
5. 【嚴格 JSON】：請務必依照指定的 JSON 格式回傳。`;

  const prompt = `單元：${params.unit}
起點能力：${params.studentLevel}
請產出至少一個學年目標，內含 5 個細部學期目標。

請回傳以下格式的 JSON，其中 targetAccuracy 請填入你認為適合該學生的百分比數字(0-100)：
[
  {
    "title": "學年目標名稱",
    "subGoals": [
      { 
        "code": "1-1", 
        "content": "具體行為目標(含標準)", 
        "strategy": "教學策略", 
        "targetAccuracy": 80 
      }
    ]
  }
]`;

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

    const jsonStr = response.text;
    if (!jsonStr) throw new Error("AI 未回傳內容");
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error("AI 生成失敗，請稍後再試。");
  }
};
