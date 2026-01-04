
import { GoogleGenAI, Type } from "@google/genai";
import { VisitReport, SupervisionItem } from "../types.ts";

/**
 * Generates an analytical report for school supervision using Gemini AI
 */
export const generateAIReport = async (
  report: Partial<VisitReport>,
  formItems: SupervisionItem[],
  teacherSubject: string
) => {
  // Use the API key directly from process.env.API_KEY as per mandatory guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    // Calling generateContent with the model name and prompt directly
    // Using gemini-3-pro-preview for complex pedagogical analysis and reporting
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        // Pedagogical analysis benefits from reasoning budget for higher quality insights
        thinkingConfig: { thinkingBudget: 4000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.STRING },
            summary: { type: Type.STRING }
          },
          required: ["strengths", "improvements", "recommendations", "summary"],
          // Fix: Explicitly defining property ordering for structured output consistency
          propertyOrdering: ["strengths", "improvements", "recommendations", "summary"]
        }
      }
    });

    // Access text directly from the property (not a method call)
    const jsonStr = response.text;
    return jsonStr ? JSON.parse(jsonStr) : null;
  } catch (error) {
    console.error("AI Generation Error:", error);
    return null;
  }
};
