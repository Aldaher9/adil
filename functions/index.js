/**
 * School Manager Pro - Cloud Functions
 * Vertex AI Implementation
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

    // 3. DEBUG LOGGING (تتبع المشكلة)
    const projectId = process.env.GCLOUD_PROJECT || "school-9416e";
    const location = 'us-central1';
    const modelId = 'gemini-1.5-flash';
    
    console.log(`--- AI Request Debug Info ---`);
    console.log(`Project ID: ${projectId}`);
    console.log(`Location: ${location}`);
    console.log(`Model: ${modelId}`);
    
    // محاولة تهيئة Vertex AI
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
      System Instruction: بصفتك موجهاً فنياً، صغ تقرير زيارة صفية.
      السياق: ${specialization || 'عام'} - ${topic || 'عام'} - ${contextGender}.
      المطلوب: HTML فقط (div class="ai-report-section").
      البيانات: ${text}
    `;

    console.log("Sending request to Vertex AI...");
    
    const resp = await generativeModel.generateContent(prompt);
    const contentResponse = await resp.response;
    
    if (!contentResponse.candidates || !contentResponse.candidates.length) {
        throw new Error("No candidates returned from AI.");
    }

    let aiText = contentResponse.candidates[0].content.parts[0].text;
    let cleanText = aiText.replace(/```html/g, '').replace(/```/g, '').trim();
    
    console.log("Success! Sending response.");
    return res.status(200).json({ result: cleanText });

  } catch (error) {
    // طباعة الخطأ كاملاً في سجلات Firebase Console
    console.error("CRITICAL AI ERROR:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // إرسال تفاصيل الخطأ للواجهة الأمامية للمساعدة في التشخيص
    let errorMessage = error.message || "Unknown Error";
    let errorCode = "INTERNAL_ERROR";

    if (errorMessage.includes("404")) {
        errorCode = "VERTEX_AI_404";
        errorMessage = "لم يتم العثور على الموديل. تأكد من تفعيل Vertex AI API في المشروع الصحيح (us-central1).";
    } else if (errorMessage.includes("403") || errorMessage.includes("Permission denied")) {
        errorCode = "PERMISSION_DENIED";
        errorMessage = "حساب الخدمة (App Engine Default Service Account) لا يملك صلاحية 'Vertex AI User'.";
    }

    return res.status(500).json({ 
        error: errorCode, 
        message: errorMessage,
        raw: error.toString() 
    });
  }
});