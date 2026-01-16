/**
 * School Manager Pro - Cloud Functions
 * Gemini API Implementation with API Key
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require('firebase-functions/params');
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

// Define the secret environment variable
const geminiApiKey = defineSecret('GEMINI_API_KEY');

exports.improveText = onRequest({ cors: true, region: 'us-central1', secrets: [geminiApiKey] }, async (req, res) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }
  res.set('Access-Control-Allow-Origin', '*');

  try {
    // 1. Auth Check: Verify Firebase Auth token
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "Missing Firebase Auth Token" });
    }
    const idToken = authHeader.split("Bearer ")[1];
    await admin.auth().verifyIdToken(idToken);

    // 2. Data Validation
    const { text, gender, specialization, topic } = req.body;
    if (!text) {
      return res.status(400).json({ error: "BAD_REQUEST", message: "No text provided" });
    }
    
    // 3. Initialize Gemini with the API Key from secrets
    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      console.error("GEMINI_API_KEY secret not available");
      return res.status(500).json({ error: "CONFIGURATION_ERROR", message: "API Key is not configured on the server." });
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use standard flash model. If this fails with "Not Found", verify API enablement.
    // Try 'gemini-1.5-flash' first, it is the current standard.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 4. Construct the Prompt
    const contextGender = gender === 'female' ? 'مؤنث (معلمة/طالبات)' : 'مذكر (معلم/طلاب)';
    const prompt = `
      System Instruction: بصفتك موجهاً فنياً تربوياً خبيراً، قم بصياغة تقرير زيارة صفية احترافي ومحفز للمعلم.
      السياق: مادة ${specialization || 'عامة'}, عنوان الدرس "${topic || 'عام'}", نوع المدرسة: ${contextGender}.
      المطلوب: يجب أن يكون الرد بتنسيق HTML فقط، ومقسم إلى فقرات داخل div يحمل class="ai-report-section". يجب أن يحتوي التقرير على: مقدمة، جوانب الإجادة، نقاط للتحسين، وتوصيات فنية.
      بيانات التقييم الخام: ${text}
    `;

    // 5. Generate Content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text(); 
    
    const cleanText = aiText.replace(/```html/g, '').replace(/```/g, '').trim();
    
    return res.status(200).json({ result: cleanText });

  } catch (error) {
    console.error("CRITICAL AI FUNCTION ERROR:", error);
    
    let errorMessage = "An internal server error occurred while processing the AI request.";
    let errorCode = "INTERNAL_ERROR";

    // Handle specific Google API errors
    if (error.message) {
        if (error.message.includes("API key")) {
            errorCode = "INVALID_API_KEY";
            errorMessage = "The configured API key is invalid or blocked.";
        } else if (error.message.includes("not found") || error.message.includes("404")) {
            // Specific handling for the user's error
            errorCode = "MODEL_NOT_FOUND";
            errorMessage = "Model not found. Please ensure 'Generative Language API' is enabled in Google Cloud Console.";
        }
    }

    return res.status(500).json({ 
        error: errorCode, 
        message: errorMessage,
        raw: error.message 
    });
  }
});