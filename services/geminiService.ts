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

撰寫關鍵規則：
1. 【量化目標】：針對「${params.unit}」，每個獨立的【學年目標】下，必須產出「至少 5 個」具體、細分且連續的【學期目標】。
2. 【工作分析法】：請將大目標拆解成極細小的教學步驟（Small Steps）。例如：「認識10以內的數」應拆解為：讀、寫、數數、量詞結合、比大小等細項。
3. 【通過標準】：每個學期目標結尾必須包含量化的通過標準（例如：連續三次正確率達 80%）。
4. 【針對性策略】：根據學生的「${params.disabilityType}」特質，提供視覺提示、分解步驟或結構化教學等特教策略。
5. 【嚴格 JSON】：請務必依照指定的 JSON 格式回傳，確保資料能正確匯入系統。`;

  const prompt = `請針對以下資訊，為這位「${params.gradeLevel}」的「${params.disabilityType}」學生產出至少 5 個細部學期目標：
領域：${params.subject}
單元：${params.unit}
起點能力：${params.studentLevel}

請回傳一個 JSON 陣列，確保每個學年目標 (title) 下的 subGoals 陣列長度至少為 5：
[
  {
    "title": "學年目標名稱",
    "subGoals": [
      { "code": "1-1", "content": "細部步驟 1 + 標準", "strategy": "具體特教策略 1" },
      { "code": "1-2", "content": "細部步驟 2 + 標準", "strategy": "具體特教策略 2" },
      { "code": "1-3", "content": "細部步驟 3 + 標準", "strategy": "具體特教策略 3" },
      { "code": "1-4", "content": "細部步驟 4 + 標準", "strategy": "具體特教策略 4" },
      { "code": "1-5", "content": "細部步驟 5 + 標準", "strategy": "具體特教策略 5" }
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
    throw new Error("AI 生成失敗，請稍後再試。");
  }
};