/**
 * School Manager Pro - Cloud Functions
 * Enhanced Gemini API Implementation - Professional Version
 * تحسين احترافي لوظيفة تحسين النصوص بالذكاء الاصطناعي
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require('firebase-functions/params');
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

// تعريف المفتاح السري
const geminiApiKey = defineSecret('GEMINI_API_KEY');

/**
 * Cloud Function لتحسين تقارير الزيارات الإشرافية باستخدام Gemini AI
 * - دعم المصادقة عبر Firebase Auth
 - معالجة الأخطاء الشاملة
 * - تنسيق HTML احترافي
 * - دعم اللغة العربية الكامل
 */
exports.improveText = onRequest({ 
  cors: true, 
  region: 'us-central1', 
  secrets: [geminiApiKey],
  memory: '1GiB',
  timeoutSeconds: 60,
  maxInstances: 10,
  concurrency: 80
}, async (req, res) => {
  
  // معالجة طلبات CORS Preflight
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return;
  }
  
  // تعيين CORS headers للطلبات الفعلية
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    // 1. التحقق من المصادقة
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      console.error("Authentication failed: Missing Bearer token");
      return res.status(401).json({ 
        error: "UNAUTHORIZED", 
        message: "يجب تسجيل الدخول لاستخدام هذه الخدمة",
        details: "Missing Firebase Auth Token"
      });
    }

    const idToken = authHeader.split("Bearer ")[1];
    let decodedToken;
    
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log(`Request authenticated for user: ${decodedToken.uid}`);
    } catch (authError) {
      console.error("Token verification failed:", authError);
      return res.status(401).json({ 
        error: "INVALID_TOKEN", 
        message: "رمز المصادقة غير صالح أو منتهي الصلاحية",
        details: authError.message
      });
    }

    // 2. التحقق من صحة البيانات المدخلة
    const { text, gender, specialization, topic } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ 
        error: "BAD_REQUEST", 
        message: "لم يتم إرسال نص للمعالجة",
        details: "Text parameter is required"
      });
    }

    if (text.length > 10000) {
      return res.status(400).json({ 
        error: "TEXT_TOO_LONG", 
        message: "النص المرسل طويل جداً",
        details: "Text must be less than 10000 characters"
      });
    }

    console.log(`Processing request - Topic: ${topic}, Specialization: ${specialization}, Gender: ${gender}`);

    // 3. تهيئة Gemini AI
    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not configured");
      return res.status(500).json({ 
        error: "CONFIGURATION_ERROR", 
        message: "خطأ في إعدادات الخادم",
        details: "API Key is not configured"
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 4096,
      },
    });

    // 4. إعداد السياق والتعليمات
    const contextGender = gender === 'female' 
      ? 'مدرسة بنات - استخدام صيغة المؤنث (المعلمة، الطالبات، قامت)' 
      : 'مدرسة بنين - استخدام صيغة المذكر (المعلم، الطلاب، قام)';
    
    const systemInstruction = `أنت موجه فني تربوي خبير متخصص في كتابة تقارير الزيارات الإشرافية الاحترافية والمحفزة.

مهمتك: تحويل بيانات التقييم الخام إلى تقرير إشرافي احترافي ومحفز يساعد المعلم على التطور.

معايير الجودة:
✓ لغة عربية فصيحة وواضحة
✓ أسلوب تربوي محفز وإيجابي
✓ توازن بين الإشادة والتطوير
✓ أدلة واقعية من الحصة
✓ توصيات قابلة للتطبيق
✓ تنسيق HTML منظم ومنسق`;

    const userPrompt = `
📋 معلومات الزيارة:
• المادة/التخصص: ${specialization || 'غير محدد'}
• عنوان الدرس: "${topic || 'غير محدد'}"
• نوع المدرسة: ${contextGender}

📝 المطلوب:
قم بصياغة تقرير إشرافي احترافي بتنسيق HTML يتضمن الأقسام التالية بالضبط:

<h4>✨ جوانب الإجادة في الأداء وأدلتها</h4>
<ul>
<li>نقاط قوة محددة مع أدلة من الحصة (3-5 نقاط)</li>
</ul>

<h4>🎯 الجوانب التي تحتاج إلى تطوير في الأداء وأدلتها</h4>
<ul>
<li>جوانب التطوير بأسلوب محفز (2-4 نقاط)</li>
</ul>

<h4>🤝 الدعم المقدم</h4>
<ul>
<li>أنواع الدعم التي قدمها المشرف (2-3 نقاط)</li>
</ul>

<h4>💡 التوصيات</h4>
<ul>
<li>توصيات عملية قابلة للتطبيق (3-4 نقاط)</li>
</ul>

⚠️ ملاحظات هامة:
• التزم بصيغة ${gender === 'female' ? 'المؤنث' : 'المذكر'} في كامل التقرير
• استخدم HTML فقط بدون رموز markdown
• اجعل المحتوى محدداً ومرتبطاً بالمادة والدرس
• استخدم لغة تربوية محفزة وإيجابية
• أضف أيقونات emoji للعناوين لجعل التقرير جذاباً

📊 بيانات التقييم الأولية:
${text}
`;

    // 5. توليد المحتوى
    console.log("Generating AI content...");
    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    const aiText = response.text();

    if (!aiText || aiText.trim() === '') {
      throw new Error("No content generated from AI");
    }

    console.log("AI content generated successfully");

    // 6. تنظيف وتنسيق النص
    let cleanText = aiText
      .replace(/```html/gi, '')
      .replace(/```/g, '')
      .trim();

    // إضافة تنسيقات CSS inline للطباعة الأفضل
    cleanText = cleanText
      .replace(/<h4>/g, '<h4 style="color: #1e40af; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; font-size: 1.125rem;">')
      .replace(/<ul>/g, '<ul style="list-style-type: disc; padding-right: 1.5rem; margin-top: 0.5rem; margin-bottom: 1rem;">')
      .replace(/<li>/g, '<li style="margin-bottom: 0.5rem; line-height: 1.75; color: #334155;">');

    // 7. إرسال النتيجة
    return res.status(200).json({ 
      success: true,
      result: cleanText,
      metadata: {
        userId: decodedToken.uid,
        topic: topic || 'غير محدد',
        specialization: specialization || 'غير محدد',
        gender: gender || 'male',
        timestamp: new Date().toISOString(),
        textLength: text.length,
        resultLength: cleanText.length
      }
    });

  } catch (error) {
    console.error("❌ CRITICAL ERROR:", error);
    
    // معالجة الأخطاء المختلفة
    let errorCode = "INTERNAL_ERROR";
    let errorMessage = "حدث خطأ أثناء معالجة الطلب";
    let statusCode = 500;

    if (error.message) {
      // أخطاء API Key
      if (error.message.includes("API key") || error.message.includes("invalid")) {
        errorCode = "INVALID_API_KEY";
        errorMessage = "مفتاح API غير صالح";
        statusCode = 503;
      } 
      // أخطاء الموديل
      else if (error.message.includes("not found") || error.message.includes("MODEL_NOT_FOUND")) {
        errorCode = "MODEL_NOT_FOUND";
        errorMessage = "الموديل غير متوفر - تأكد من تفعيل Generative Language API في Google Cloud Console";
        statusCode = 503;
      }
      // أخطاء الصلاحيات
      else if (error.message.includes("PERMISSION_DENIED") || error.message.includes("permission")) {
        errorCode = "PERMISSION_DENIED";
        errorMessage = "لا توجد صلاحيات كافية - تحقق من إعدادات API";
        statusCode = 403;
      }
      // أخطاء الحصة (Quota)
      else if (error.message.includes("quota") || error.message.includes("RESOURCE_EXHAUSTED")) {
        errorCode = "QUOTA_EXCEEDED";
        errorMessage = "تم تجاوز الحد المسموح من الطلبات - حاول مرة أخرى لاحقاً";
        statusCode = 429;
      }
      // أخطاء الشبكة
      else if (error.message.includes("timeout") || error.message.includes("DEADLINE_EXCEEDED")) {
        errorCode = "TIMEOUT";
        errorMessage = "انتهت مهلة الاتصال - حاول مرة أخرى";
        statusCode = 504;
      }
    }

    return res.status(statusCode).json({ 
      success: false,
      error: errorCode, 
      message: errorMessage,
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
