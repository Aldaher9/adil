/**
 * School Manager Pro - Cloud Functions
 * Vertex AI Implementation with Debugging
 */

const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { VertexAI } = require('@google-cloud/vertexai');

admin.initializeApp();

exports.improveText = onRequest({ cors: true, region: 'us-central1' }, async (req, res) => {
  // CORS Headers
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }
  res.set('Access-Control-Allow-Origin', '*');

  try {
    // 1. Auth Check
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "Missing Auth Token" });
    }
    const idToken = authHeader.split("Bearer ")[1];
    await admin.auth().verifyIdToken(idToken);

    // 2. Data Validation
    const { text, gender, specialization, topic } = req.body;
    if (!text) return res.status(400).json({ error: "BAD_REQUEST", message: "No text provided" });

    // 3. DEBUG LOGGING
    const projectId = process.env.GCLOUD_PROJECT || admin.instanceId().app.options.projectId;
    const location = 'us-central1';
    const modelId = 'gemini-1.5-flash'; // or gemini-1.0-pro
    
    console.log(`--- AI Request Debug ---`);
    console.log(`Project: ${projectId}`);
    console.log(`Model: ${modelId}`);
    
    // Initialize Vertex AI
    const vertex_ai = new VertexAI({
        project: projectId, 
        location: location
    });

    const generativeModel = vertex_ai.getGenerativeModel({
        model: modelId, 
        generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
        }
    });

    const contextGender = gender === 'female' ? 'مؤنث (معلمة/طالبات)' : 'مذكر (معلم/طلاب)';
    const prompt = `
      دورك: موجه فني تربوي خبير.
      المهمة: إعادة صياغة وتحسين الملاحظات الصفية التالية لتكون في صورة نقاط مهنية، تربوية، ومحفزة.
      السياق: تخصص ${specialization || 'عام'} - درس بعنوان ${topic || 'عام'} - مدرسة ${contextGender}.
      المخرجات: HTML فقط. استخدم تنسيق <ul> و <li> و <strong> للعناوين. لا تضف أي مقدمات أو خاتمات خارج الـ HTML.
      
      النص الأصلي:
      ${text}
    `;

    console.log("Sending to Vertex AI...");
    
    const resp = await generativeModel.generateContent(prompt);
    const contentResponse = await resp.response;
    
    if (!contentResponse.candidates || !contentResponse.candidates.length) {
        throw new Error("AI returned no candidates.");
    }

    let aiText = contentResponse.candidates[0].content.parts[0].text;
    // Clean markdown if present
    let cleanText = aiText.replace(/```html/g, '').replace(/```/g, '').trim();
    
    console.log("Success.");
    return res.status(200).json({ result: cleanText });

  } catch (error) {
    console.error("AI ERROR DETAILS:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    let userMessage = "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.";
    let debugInfo = error.message;

    // تحسين رسائل الخطأ الشائعة
    if (error.message.includes("404")) {
        userMessage = "الموديل غير موجود أو API غير مفعل.";
        debugInfo = "تأكد من تفعيل Vertex AI API في Google Cloud Console للمشروع: " + (process.env.GCLOUD_PROJECT || 'unknown');
    } else if (error.message.includes("403") || error.message.includes("Permission denied")) {
        userMessage = "تصريح الوصول مرفوض.";
        debugInfo = "حساب الخدمة (Service Account) لا يملك صلاحية Vertex AI User.";
    }

    return res.status(500).json({ 
        error: "AI_ERROR", 
        message: userMessage,
        debug: debugInfo,
        raw: error.toString()
    });
  }
});