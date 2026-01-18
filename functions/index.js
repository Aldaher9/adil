const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenAI, Type } = require("@google/generative-ai");

admin.initializeApp();

exports.generateAiReport = functions.region("us-central1").https.onCall(async (data, context) => {
  // --- PREMIUM USER CHECK ---
  // Check if the user is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  // Check if the user is a premium user from Firestore.
  const uid = context.auth.uid;
  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data().isPremium !== true) {
        throw new functions.https.HttpsError('permission-denied', 'This is a premium feature. Please upgrade your account.');
    }
  } catch (error) {
     console.error("Firestore user check failed:", error);
     throw new functions.https.HttpsError('internal', 'Failed to verify user permissions.');
  }
  // --- END PREMIUM USER CHECK ---


  // Access your API key as an environment variable inside the function handler.
  // User must set this with: firebase functions:config:set gemini.key="YOUR_API_KEY"
  const apiKey = functions.config().gemini.key;
  if (!apiKey) {
    console.error("Gemini API key not set in environment variables. Run 'firebase functions:config:set gemini.key=\"YOUR_API_KEY\"'");
    throw new functions.https.HttpsError('failed-precondition', 'The Gemini API key is not configured on the server.');
  }
  const ai = new GoogleGenAI({ apiKey });

  const { reportContext, specialization, topic, gender } = data;

  if (!reportContext || !specialization || !topic || !gender) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with all required arguments.');
  }

  const contextGender = gender === 'female' ? 'مؤنث (معلمة/طالبات)' : 'مذكر (معلم/طلاب)';
  const systemInstruction = `أنت خبير تربوي متخصص في كتابة تقارير الزيارات الصفية باللغة العربية. مهمتك هي تحليل البيانات الخام المقدمة وتحويلها إلى تقرير احترافي، بنّاء، ومحفز. يجب أن يكون الأسلوب رسمياً وداعماً. استخدم مصطلحات تربوية دقيقة والتزم بالهيكل المطلوب بدقة.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
        strengths: { type: Type.OBJECT, description: "قسم جوانب الإجادة.", properties: { title: { type: Type.STRING }, points: { type: Type.ARRAY, items: { type: Type.STRING } } } },
        improvements: { type: Type.OBJECT, description: "قسم جوانب التطوير.", properties: { title: { type: Type.STRING }, points: { type: Type.ARRAY, items: { type: Type.STRING } } } },
        support: { type: Type.OBJECT, description: "قسم الدعم المقدم.", properties: { title: { type: Type.STRING }, points: { type: Type.ARRAY, items: { type: Type.STRING } } } },
        recommendations: { type: Type.OBJECT, description: "قسم التوصيات.", properties: { title: { type: Type.STRING }, points: { type: Type.ARRAY, items: { type: Type.STRING } } } }
    }
  };

  const userPrompt = `
      الرجاء تحليل بيانات التقييم الخام التالية وصياغة تقرير زيارة صفية منظم.
      السياق: مادة "${specialization}", عنوان الدرس "${topic}", نوع المدرسة: ${contextGender}.
      
      بيانات التقييم الخام:
      ${reportContext}

      ملاحظات هامة للتحليل:
      - ${gender === 'female' ? "استخدم صيغة المؤنث في كامل التقرير (معلمة، طالبات، قامت)." : ""}
      - قسم "الدعم المقدم" يجب أن يحتوي على اقتراحات عملية مثل "تبادل زيارات مع معلم خبير" أو "حضور ورشة عمل متخصصة".
      - التزم بالهيكل المحدد في schema بدقة شديدة.
      - العناوين يجب أن تكون بالضبط كالتالي: "جوانب الإجادة في الأداء وأدلتها", "الجوانب التي تحتاج إلى تطوير في الأداء وأدلتها", "الدعم المقدم", "التوصيات".
  `;
  
  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    });

    const aiText = response.text;
    if (!aiText || !aiText.trim()) {
        throw new functions.https.HttpsError('internal', 'The AI model returned an empty response.');
    }

    const jsonResponse = JSON.parse(aiText);
    return jsonResponse;

  } catch (error) {
    console.error("Gemini API call failed:", error);
    // It's better to pass a more structured error back to the client.
    const errorMessage = error.message || 'An unknown error occurred.';
    throw new functions.https.HttpsError('internal', `Failed to call the Gemini API. ${errorMessage}`);
  }
});
