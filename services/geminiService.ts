
import { GoogleGenAI, Type } from "@google/genai";
import { VisitReport, SupervisionItem } from "../types.ts";

export const generateAIReport = async (
  report: Partial<VisitReport>,
  formItems: SupervisionItem[],
  teacherSubject: string
) => {
  // استخدام المفتاح من المتغيرات المحقونة تلقائياً
  const API_KEY = process.env.API_KEY || "";

  if (!API_KEY) {
    console.error("Gemini API Key is missing. Please ensure it's configured.");
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

  const prompt = `أنت خبير تربوي وموجه فني. قم بتحليل بيانات الزيارة الصفية التالية لإنشاء تقرير مهني للمادة ${teacherSubject} وعنوان الدرس ${report.lessonTitle}.
  البيانات الحالية للتقييم:
  ${ratingsContext}
  
  المطلوب:
  1. ذكر أفضل 3 جوانب إجادة.
  2. ذكر أسوأ 4 جوانب تحتاج لتحسين (إذا كانت الدرجة أقل من متميز).
  3. تقديم توصيات عملية مرتبطة بعنوان الدرس.
  4. كتابة خلاصة عامة.`;

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
