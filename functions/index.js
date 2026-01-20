const functions = require("firebase-functions");
const admin = require("firebase-admin");
// استخدام SDK الجديد @google/genai
const { GoogleGenAI, Type } = require("@google/genai");

admin.initializeApp();

// =====================================================
// ✅ generateAiReport: Gemini API Direct Implementation
// =====================================================
exports.generateAiReport = functions
  .region("us-central1")
  .runWith({ 
    secrets: ["GEMINI_API_KEY"], 
    timeoutSeconds: 300,
    memory: "512MB"
  })
  .https.onCall(async (data, context) => {
    console.log("🟢 generateAiReport: Request received.");

    try {
      // 1. التحقق من المصادقة (للمدير فقط)
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "يجب تسجيل الدخول لاستخدام هذه الميزة."
        );
      }
      const uid = context.auth.uid;

      // 2. إدارة الحدود والاشتراكات (Limit Logic)
      const userRef = admin.firestore().collection("users").doc(uid);
      const userDoc = await userRef.get();
      const userData = userDoc.exists ? userDoc.data() : {};

      // تحديد الحد اليومي المسموح به
      let allowedLimit = 5; 
      
      if (userData.customDailyLimit && typeof userData.customDailyLimit === 'number') {
          allowedLimit = userData.customDailyLimit; 
      } else if (userData.isPremium === true) {
          allowedLimit = 100; 
      }

      // التحقق من الاستهلاك اليومي
      const today = new Date().toLocaleDateString('en-CA'); 
      let usageData = userData.aiUsage || { date: today, count: 0 };

      if (usageData.date !== today) {
          usageData = { date: today, count: 0 };
      }

      if (usageData.count >= allowedLimit) {
          console.warn(`⚠️ Limit reached for user ${uid}. Limit: ${allowedLimit}`);
          throw new functions.https.HttpsError(
              "resource-exhausted",
              `LIMIT_REACHED` 
          );
      }

      // 3. التحقق من المدخلات
      const { reportContext, specialization, topic, gender } = data || {};
      
      if (!reportContext || !specialization || !topic || !gender) {
        throw new functions.https.HttpsError("invalid-argument", "البيانات غير مكتملة.");
      }

      if (reportContext.length > 25000) {
          throw new functions.https.HttpsError("invalid-argument", "النص طويل جداً.");
      }

      // 4. تهيئة Gemini
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new functions.https.HttpsError("failed-precondition", "API Key missing.");
      }
      
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const contextGender = gender === "female" 
          ? "استخدمي صيغة المؤنث (معلمة، طالبات، قامت)." 
          : "استخدم صيغة المذكر (معلم، طلاب، قام).";

      const systemInstructionText = `
أنت خبير تربوي وموجه فني. مهمتك صياغة تقرير زيارة صفية احترافي.
القاعدة الذهبية للصياغة:
في قوائم (جوانب الإجادة) و (جوانب التطوير)، يجب أن تبدأ كل نقطة بذكر "عنوان بند التقييم" الأصلي نصاً، متبوعاً بنقطتين رأسيتين (:)، ثم الوصف السلوكي المحسن.
مثال:
"التحصيل الدراسي: أظهر الطلبة تمكناً ملحوظاً في استيعاب المفاهيم..."
"إدارة الصف: تميزت المعلمة بالقدرة العالية على جذب انتباه الطالبات..."
`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          strengths: { 
            type: Type.OBJECT, 
            properties: { 
              title: { type: Type.STRING }, 
              points: { type: Type.ARRAY, items: { type: Type.STRING } } 
            } 
          },
          improvements: { 
            type: Type.OBJECT, 
            properties: { 
              title: { type: Type.STRING }, 
              points: { type: Type.ARRAY, items: { type: Type.STRING } } 
            } 
          },
          support: { 
            type: Type.OBJECT, 
            properties: { 
              title: { type: Type.STRING }, 
              points: { type: Type.ARRAY, items: { type: Type.STRING } } 
            } 
          },
          recommendations: { 
            type: Type.OBJECT, 
            properties: { 
              title: { type: Type.STRING }, 
              points: { type: Type.ARRAY, items: { type: Type.STRING } } 
            } 
          }
        }
      };

      const userPrompt = `
المادة: ${specialization}
عنوان الدرس: ${topic}
السياق: ${contextGender}

البيانات الخام للزيارة (تحتوي على عناوين البنود والتقييمات):
${reportContext}

المطلوب:
1. استخراج نقاط القوة (جوانب الإجادة).
2. استخراج نقاط التطوير.
3. كتابة التوصيات والدعم.
هام جداً: في مصفوفة النقاط (points)، ابدأ كل جملة بعنوان البند الخاص بها من البيانات أعلاه.
`;
      
      console.log("🚀 Calling Gemini API (gemini-2.5-flash)...");
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
            systemInstruction: systemInstructionText,
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.7
        }
      });

      const text = response.text;
      if (!text) throw new functions.https.HttpsError("internal", "رد فارغ من الذكاء الاصطناعي.");
      
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonResponse = JSON.parse(cleanedText);

      // تحديث العداد
      await userRef.set({
          aiUsage: {
              date: today,
              count: usageData.count + 1
          }
      }, { merge: true });

      return jsonResponse;

    } catch (err) {
      console.error("🔥 Error:", err);
      throw err;
    }
  });