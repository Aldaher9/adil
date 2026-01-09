/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { GoogleGenAI } = require("@google/genai");
const cors = require("cors")({ origin: true });

// تهيئة تطبيق المدير للتحقق من التوكن
admin.initializeApp();

/**
 * دالة سحابية آمنة لتحسين النصوص الإشرافية
 * تتطلب توكن مصادقة (Bearer Token)
 */
exports.improveText = onRequest({ cors: true, secrets: ["GEMINI_API_KEY"] }, (req, res) => {
  // استخدام مكتبة CORS للسماح بالطلبات من المتصفح
  return cors(req, res, async () => {
    try {
      // 1. التحقق من طريقة الطلب
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      // 2. التحقق من المصادقة (Security Layer)
      const authHeader = req.headers.authorization || "";
      if (!authHeader.startsWith("Bearer ")) {
        console.warn("Unauthorized access attempt: Missing token");
        return res.status(401).json({ error: "Unauthorized: Missing Token" });
      }

      const idToken = authHeader.split("Bearer ")[1];
      let decodedToken;
      
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(403).json({ error: "Unauthorized: Invalid Token", details: error.message });
      }

      // 3. استخراج البيانات من الطلب
      const { text, gender, specialization, topic } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Missing text content" });
      }

      // 4. إعداد الاتصال بـ Gemini
      const apiKey = process.env.GEMINI_API_KEY; 
      if (!apiKey) {
        console.error("CRITICAL: GEMINI_API_KEY is not set in functions secrets.");
        return res.status(500).json({ error: "Server Configuration Error: API Key Missing" });
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });

      // 5. بناء التوجيه (Prompt Engineering)
      const modelId = "gemini-2.5-flash";
      
      const systemInstruction = `
        أنت خبير تربوي وموجه فني أول في وزارة التربية والتعليم بسلطنة عمان.
        مهمتك هي مراجعة وصياغة تقارير الزيارات الصفية للمعلمين لتكون بأسلوب مهني، بناء، ومحفز.
        
        السياق:
        - التخصص: ${specialization || "عام"}
        - عنوان الدرس: ${topic || "عام"}
        - جنس المدرسة: ${gender === 'female' ? 'مدرسة إناث' : 'مدرسة ذكور'}
        
        المطلوب:
        - أعد صياغة الملاحظات لتكون احترافية.
        - استخدم تنسيق HTML (divs مع class="ai-report-section") للعرض المباشر.
        - قسّم الرد إلى: "وصف الأداء العام"، "نقاط القوة"، "نقاط للتحسين"، "التوصيات".
      `;

      // 6. استدعاء النموذج - (تعديل: استخدام نص بسيط في contents لتجنب أخطاء الهيكل)
      console.log(`Sending request to AI model: ${modelId} for user: ${decodedToken.uid}`);
      
      const response = await ai.models.generateContent({
        model: modelId,
        contents: `النص الأصلي للملاحظات (قم بتحسينه وصياغته): \n${text}`, 
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 2000,
        }
      });

      // 7. التحقق من الاستجابة وإرجاع النتيجة
      if (!response || !response.text) {
          throw new Error("Empty response from AI Model");
      }

      const outputText = response.text;
      
      return res.status(200).json({ 
        result: outputText
      });

    } catch (error) {
      console.error("Error processing AI request:", error);
      // إرجاع تفاصيل الخطأ للمساعدة في التصحيح
      return res.status(500).json({ 
          error: "Internal Server Error", 
          message: error.message,
          details: error.toString() 
      });
    }
  });
});