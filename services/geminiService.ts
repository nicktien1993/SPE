
import { GoogleGenAI, Type } from "@google/genai";
import { GenerationParams } from "../types";

export const generateIEPGoals = async (params: GenerationParams): Promise<any[]> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("系統連線尚未設定。");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  let contextualInstruction = '';
  if (params.disabilityType === '學習障礙' && params.subtype) {
    contextualInstruction += `特別注意：該學生為「${params.subtype}」類型之學習障礙，目標應針對此特定困難點進行補救教學與策略指導。`;
  } else if (params.disabilityType === '資賦優異' && params.subtype) {
    contextualInstruction += `特別注意：該學生為「${params.subtype}」類型之資賦優異，目標應側重於「加深加廣」、「創造力開發」或「領導潛能培育」。`;
  }

  // 整合班導師的期望
  if (params.teacherExpectations) {
    contextualInstruction += `\n【班級導師之特別期望】："${params.teacherExpectations}"。請務必在設計目標或教學策略時，將此期望納入核心考量，讓特教教學能有效支援普教課堂。`;
  }

  const systemInstruction = `你是一位精通特殊教育教學設計與整合教育（Inclusion）的資深專家。

【核心任務】：
根據老師輸入的單元名稱、年級、學生起點能力以及班導師的期待，產出具備「具體、可測量、可達成」特性的 IEP 目標。
${contextualInstruction}

【目標結構規則】：
1. **分散式目標**：請將該單元內容拆解為 2 到 4 個具體的「學年目標」(title)。每個學年目標應代表一個核心概念或能力維度。
2. **層級化目標**：每個學年目標下，應包含 2 到 3 個「學期目標」(subGoals)，由淺入深排列。
3. **正確率標準**：請回傳 0 到 100 之間的整數（例如 80）。

【內容風格】：
請使用台灣特殊教育專業術語。

【格式要求】：
- 返回 JSON 陣列，包含物件 { title, subGoals }。不需要生成編號，編號將由系統自動處理。`;

  const prompt = `領域：${params.subject}
單元：${params.unit}
年級：${params.gradeLevel}
障別：${params.disabilityType} ${params.subtype ? `(${params.subtype})` : ''}
起點能力：${params.studentLevel}
班導師期望：${params.teacherExpectations || '無特別說明'}

請產出約 3 個學年目標及其對應的學期目標。`;

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
              title: { type: Type.STRING, description: "學年目標標題" },
              subGoals: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    content: { type: Type.STRING, description: "學期目標內容" },
                    strategy: { type: Type.STRING, description: "教學策略或調整" },
                    targetAccuracy: { type: Type.NUMBER, description: "通過標準百分比" }
                  },
                  required: ["content", "strategy", "targetAccuracy"]
                }
              }
            },
            required: ["title", "subGoals"]
          }
        }
      },
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) throw new Error("AI 生成內容為空");
    let parsed = JSON.parse(jsonStr);
    
    return parsed.map((p: any) => ({
      ...p,
      subGoals: (p.subGoals || []).map((s: any) => ({
        ...s,
        targetAccuracy: s.targetAccuracy <= 1 ? Math.round(s.targetAccuracy * 100) : s.targetAccuracy
      }))
    }));
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error("生成目標時發生錯誤，請稍後再試。");
  }
};
