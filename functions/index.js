const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { GoogleGenAI } = require("@google/genai");

// تهيئة تطبيق المدير للتحقق من التوكن
admin.initializeApp();

/**
 * دالة سحابية آمنة لتحسين النصوص الإشرافية - الإصدار الاحترافي المعدل
 */
exports.improveText = onRequest({ cors: true, secrets: ["GEMINI_API_KEY"] }, async (req, res) => {
  // ملاحظة: مع خيار cors: true، يتم التعامل مع OPTIONS تلقائياً، 
  // ولكننا نضع الهيدرز للتأكيد في حال وجود مشاكل في الكونفيج
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }

  try {
    // 1. التحقق من المصادقة
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      console.error("Auth Error: Missing Token");
      return res.status(401).json({ error: "UNAUTHORIZED", message: "يجب تسجيل الدخول للوصول لهذه الخدمة." });
    }

    const idToken = authHeader.split("Bearer ")[1];
    try {
      await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error("Auth Error: Invalid Token", error);
      return res.status(403).json({ error: "FORBIDDEN", message: "جلسة المستخدم غير صالحة، يرجى إعادة تسجيل الدخول." });
    }

    // 2. التحقق من مفتاح API
    // نحاول جلبه من Secrets أو Environment Variables
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      console.error("Config Error: GEMINI_API_KEY is missing");
      return res.status(500).json({ error: "CONFIG_ERROR", message: "خطأ في إعدادات السيرفر: مفتاح الذكاء الاصطناعي مفقود." });
    }

    // 3. استلام والتحقق من البيانات
    const { text, gender, specialization, topic } = req.body;
    if (!text || text.length < 10) {
      return res.status(400).json({ error: "BAD_REQUEST", message: "النص المرسل قصير جداً أو مفقود." });
    }

    // 4. إعداد الموديل
    const ai = new GoogleGenAI({ apiKey: apiKey });

    // 5. هندسة التلقين (Prompt Engineering)
    const contextGender = gender === 'female' ? 'مؤنث (معلمة/طالبات)' : 'مذكر (معلم/طلاب)';
    const systemInstruction = `
      بصفتك خبيراً تربويًا وموجهاً فنيًا أول (Senior Educational Supervisor).
      قم بتحليل بيانات الزيارة الصفية وصياغة تقرير إشرافي رسمي ومحفز.
      
      السياق:
      - المادة: ${specialization || "عام"}
      - الدرس: ${topic || "عام"}
      - نوع المدرسة: ${contextGender}

      القواعد الصارمة للمخرجات (HTML Only):
      - لا تستخدم Markdown.
      - لا تضع \`\`\`html في البداية.
      - استخدم فقط وسوم HTML التالية داخل الرد:
        1. <div class="ai-report-section"> : حاوية لكل قسم.
        2. <h4> : للعناوين الفرعية (مثال: نقاط القوة، التوصيات). أضف أيقونات FontAwesome داخل العنوان.
        3. <ul> و <li> : للقوائم النقطية.
        4. <p> : للنص العادي.
      
      هيكل التقرير المطلوب:
      1. [وصف عام]: فقرة احترافية تصف سير الحصة.
      2. [جوانب الإجادة]: نقاط القوة المرصودة بأسلوب تعزيزي.
      3. [فرص التحسين]: صياغة تربوية لنقاط الضعف (استخدم عبارات مثل "يحتاج إلى"، "يُفضل"، "لزيادة الفاعلية").
      4. [التوصيات الإجرائية]: خطوات عملية محددة للتطوير المهني.
    `;

    // 6. استدعاء Gemini 
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
            role: "user",
            parts: [{ text: `البيانات المرصودة:\n${text}` }]
        }
      ], 
      config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 3000,
      }
    });

    // 7. معالجة الرد
    if (!response || !response.text) {
        throw new Error("Empty AI Response");
    }

    let cleanText = response.text
        .replace(/```html/g, '')
        .replace(/```/g, '')
        .trim();
    
    return res.status(200).json({ result: cleanText });

  } catch (error) {
    console.error("Function Crash:", error);
    // إرجاع رسالة خطأ واضحة للمستخدم
    return res.status(500).json({ 
        error: "INTERNAL_ERROR", 
        message: "حدث خطأ غير متوقع في المعالجة السحابية.",
        details: error.message 
    });
  }
});