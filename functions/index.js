const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { GoogleGenAI } = require("@google/genai");

// تهيئة تطبيق المدير للتحقق من التوكن
admin.initializeApp();

/**
 * دالة سحابية آمنة لتحسين النصوص الإشرافية - الإصدار الاحترافي
 */
exports.improveText = onRequest({ cors: true, secrets: ["GEMINI_API_KEY"] }, async (req, res) => {
  // إعدادات CORS للسماح بالوصول من المتصفح
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
      return res.status(401).json({ error: "Unauthorized: Missing Token" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    try {
      // التحقق من صحة التوكن عبر Firebase Auth
      await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error("Token verification failed:", error);
      return res.status(403).json({ error: "Unauthorized: Invalid Token", details: error.message });
    }

    // 2. استلام البيانات
    const { text, gender, specialization, topic } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing text content" });
    }

    // 3. تهيئة Gemini
    const apiKey = process.env.GEMINI_API_KEY; 
    if (!apiKey) {
      console.error("CRITICAL: GEMINI_API_KEY is not set.");
      return res.status(500).json({ error: "Server Error: API Key Config Missing" });
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    // 4. هندسة التلقين (Prompt Engineering) - الاحترافية التربوية
    const systemInstruction = `
      أنت مستشار تربوي وموجه فني أول بوزارة التربية والتعليم، تتمتع بخبرة تزيد عن 20 عاماً في الإشراف التربوي.
      
      المهمة:
      تحويل الملاحظات الأولية لزيارة صفية إلى "تقرير فني احترافي" مكتوب بلغة تربوية رصينة، بناءة، ومحفزة.

      السياق:
      - التخصص: ${specialization || "عام"}
      - عنوان الدرس: ${topic || "عام"}
      - البيئة المدرسية: ${gender === 'female' ? 'مدرسة إناث (استخدمي صيغة المؤنث للمعلمة والطالبات)' : 'مدرسة ذكور (استخدم صيغة المذكر للمعلم والطلاب)'}

      تعليمات الصياغة الصارمة:
      1. التنسيق: يجب أن يكون المخرج عبارة عن كود HTML فقط (Clean HTML) بدون أي علامات Markdown (مثل \`\`\`html).
      2. الهيكل: استخدم الـ tags التالية حصراً للتنسيق:
         - استخدم <div class="ai-report-section"> لكل قسم رئيسي.
         - استخدم <h4> للعناوين الفرعية مع إضافة أيقونات FontAwesome مناسبة (مثلاً <i class="fas fa-star"></i>).
         - استخدم <ul> و <li> للنقاط.
         - استخدم <p> للفقرات الوصفية.

      الأقسام المطلوبة في التقرير:
      1. **وصف الأداء العام**: فقرة موجزة تصف جو الحصة وانطباعك العام بأسلوب مهني.
      2. **أبرز جوانب الإجادة**: نقاط القوة التي تم رصدها (ركز على استراتيجيات التدريس، التفاعل، البيئة الصفية).
      3. **نقاط للتطوير والتحسين**: صغها بأسلوب "نقاط تحتاج إلى مزيد من العناية" وليس كنقاط ضعف، لتكون مقبولة نفسياً.
      4. **التوصيات الفنية والإجرائية**: نصائح عملية دقيقة وقابلة للتطبيق لرفع مستوى الأداء.

      نبرة الكتابة:
      - مهنية، موضوعية، ومحفزة.
      - ابتعد عن لغة النقد الجارح، واستخدم لغة "الفرص التحسينية".
    `;

    // 5. استدعاء النموذج
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `هذه هي الملاحظات والتقييمات الخام التي رصدتها في الزيارة:\n${text}\n\nقم بصياغتها الآن في تقرير HTML احترافي وفق التعليمات.`, 
      config: {
          systemInstruction: systemInstruction,
          temperature: 0.65, // تقليل العشوائية لضمان الرصانة
          maxOutputTokens: 2500,
      }
    });

    // 6. التحقق والإرجاع
    if (!response || !response.text) {
        throw new Error("Empty response from AI Model");
    }

    // تنظيف النتيجة من أي شوائب markdown قد يضيفها النموذج رغم التعليمات
    let cleanText = response.text.replace(/```html/g, '').replace(/```/g, '').trim();
    
    return res.status(200).json({ 
      result: cleanText
    });

  } catch (error) {
    console.error("AI Processing Error:", error);
    return res.status(500).json({ 
        error: "Internal Server Error", 
        message: "حدث خطأ أثناء معالجة التقرير في السحابة. يرجى المحاولة لاحقاً." 
    });
  }
});