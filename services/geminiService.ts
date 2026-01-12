import { GoogleGenAI, Type } from "@google/genai";
import { GenerationParams } from "../types";

export const generateIEPGoals = async (params: GenerationParams): Promise<any[]> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("環境變數中缺少 API_KEY。");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `你是一位精通「台灣十二年國教特殊教育課程綱領」的資深特教專家。
你的任務是將老師輸入的單元名稱（${params.unit}）拆解成數個「獨立且具體」的【學年目標】。

撰寫規則：
1. 【獨立拆分】：嚴禁將不同性質的目標混在一起。如果單元包含「計算」、「測量」、「幾何」，請拆分成三個獨立的【學年目標】。
2. 【學年目標】：每個目標必須是一個獨立的長期發展方向（例如：「能理解並應用四位數加減法」）。
3. 【學期目標（內容）】：每個學年目標下，需產出 2-3 個具體的【學期目標】。
4. 【通過標準】：每個學期目標結尾必須包含量化的通過標準（例如：正確率達 80% 以上）。
5. 針對「${params.disabilityType}」學生提供對應的教學策略。`;

  const prompt = `請針對以下資訊產出教育目標：
領域：${params.subject}
單元內容：${params.unit}
年級：${params.gradeLevel}
學生能力現況：${params.studentLevel}

請回傳一個 JSON 陣列，每個元素代表一個「獨立的學年目標區塊」：
[
  {
    "title": "獨立學年目標 1 (例如：能認識 10000 以內的數)",
    "subGoals": [
      { "code": "1-1", "content": "學期目標內容 + 標準", "strategy": "教學策略" },
      { "code": "1-2", "content": "學期目標內容 + 標準", "strategy": "教學策略" }
    ]
  },
  {
    "title": "獨立學年目標 2 (例如：能進行四位數加減運算)",
    "subGoals": [
      { "code": "2-1", "content": "學期目標內容 + 標準", "strategy": "教學策略" }
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

    const jsonStr = response.text;
    if (!jsonStr) throw new Error("AI 未回傳內容");
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error("AI 生成失敗，請檢查網路或稍後再試。");
  }
};