
import { GoogleGenAI, Type } from "@google/genai";
import { VisitReport, SupervisionItem } from "../types.ts";

// نستخدم قيمة افتراضية أو نطلبها من المستخدم لاحقاً
const API_KEY = ""; 

export const generateAIReport = async (
  report: Partial<VisitReport>,
  formItems: SupervisionItem[],
  teacherSubject: string
) => {
  if (!API_KEY) {
    console.warn("AI API Key is missing");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const ratingsContext = Object.entries(report.ratings || {})
    .map(([id, rating]) => {
      const item = formItems.find(i => i.id === id);
      const ratingLabel = rating === 1 ? 'متميز' : rating === 2 ? 'جيد' : rating === 3 ? 'ملائم' : rating === 4 ? 'ضعيف' : 'تدخل';
      const behavioralDesc = item?.descriptions[rating as 1|2|3|4|5] || "";
      return `- ${item?.category}: الدرجة (${ratingLabel}) - الوصف السلوكي: "${behavioralDesc}"`;
    })
    .join("\n");

  const prompt = `أنت خبير تربوي وموجه فني. قم بتحليل بيانات الزيارة الصفية التالية لإنشاء تقرير مهني للمادة ${teacherSubject} وعنوان الدرس ${report.lessonTitle}. البيانات: ${ratingsContext}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.STRING },
            summary: { type: Type.STRING }
          },
          required: ["strengths", "improvements", "recommendations", "summary"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Generation Error:", error);
    return null;
  }
};
