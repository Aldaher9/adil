
import { GoogleGenAI, Type } from "@google/genai";
import { VisitReport, SupervisionItem } from "../types";

// تأمين الكود ليعمل في المتصفح بدون خطأ process undefined
const getApiKey = () => {
  try {
    return process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const generateAIReport = async (
  report: Partial<VisitReport>,
  formItems: SupervisionItem[],
  teacherSubject: string
) => {
  const ratingsContext = Object.entries(report.ratings || {})
    .map(([id, rating]) => {
      const item = formItems.find(i => i.id === id);
      const ratingLabel = rating === 1 ? 'متميز' : rating === 2 ? 'جيد' : rating === 3 ? 'ملائم' : rating === 4 ? 'ضعيف' : 'تدخل';
      const behavioralDesc = item?.descriptions[rating as 1|2|3|4|5] || "";
      return `- ${item?.category}: الدرجة (${ratingLabel}) - الوصف السلوكي: "${behavioralDesc}"`;
    })
    .join("\n");

  const prompt = `
    أنت خبير تربوي وموجه فني. قم بتحليل بيانات الزيارة الصفية التالية لإنشاء تقرير مهني.
    
    بيانات المعلم والموقف التعليمي:
    - الاسم: ${report.teacherName}
    - المادة: ${teacherSubject}
    - عنوان الدرس: ${report.lessonTitle}
    
    التقييمات المسجلة مع توصيفاتها السلوكية المرجعية:
    ${ratingsContext}
    
    المطلوب:
    1. استخراج أفضل 3 جوانب إجادة (بناءً على تقييم 1 و 2) وربطها بذكاء بمحتوى الدرس "${report.lessonTitle}".
    2. استخراج أقل 4 جوانب تحتاج لتحسين (تقييم 3 أو أقل) وصياغتها كأولويات تطوير بأسلوب تربوي بناء.
    3. صياغة توصيات عملية محددة قابلة للتطبيق فوراً في الحصة القادمة.
    4. كتابة خلاصة (Summary) تشكر فيها المعلم بأسلوب يتناسب مع متوسط أداء الحصة.
    
    يجب أن تكون الصياغة مهنية، تربوية، وباللغة العربية الفصحى.
  `;

  try {
    if (!getApiKey()) {
      throw new Error("API Key is missing. Please configure it in your environment.");
    }

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

    const jsonText = response.text?.trim() || "{}";
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("AI Generation Error:", error);
    return null;
  }
};
