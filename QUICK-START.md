# 🚀 دليل التطبيق السريع

## خطوات التطبيق (10 دقائق)

### الخطوة 1️⃣: نسخ الملفات المحسّنة
```bash
# نسخ Cloud Function المحسّنة
cp functions-improved/index.js functions/index.js
cp functions-improved/package.json functions/package.json

# استبدال index.html
mv index.html index-old.html
cp index-improved.html index.html
```

### الخطوة 2️⃣: تثبيت المكتبات
```bash
cd functions
npm install
cd ..
```

### الخطوة 3️⃣: إعداد API Key

1. **احصل على Gemini API Key**:
   - اذهب إلى: https://aistudio.google.com/app/apikey
   - اضغط "Create API Key"
   - انسخ المفتاح

2. **أضف API Key في Firebase**:
   ```bash
   # في terminal
   firebase functions:secrets:set GEMINI_API_KEY
   # الصق المفتاح عند الطلب
   ```

3. **أو عبر Console**:
   - افتح Firebase Console
   - اذهب إلى Functions > Secrets
   - أضف `GEMINI_API_KEY`

### الخطوة 4️⃣: تفعيل Google Cloud APIs

1. افتح: https://console.cloud.google.com
2. اختر مشروعك
3. فعّل هذه الخدمات:
   - ✅ Generative Language API
   - ✅ Vertex AI API
   - ✅ Cloud Functions API

### الخطوة 5️⃣: نشر التحديثات
```bash
# نشر Functions
firebase deploy --only functions

# نشر Hosting (إن وجد)
firebase deploy --only hosting
```

### الخطوة 6️⃣: اختبار النظام

1. افتح التطبيق
2. سجّل الدخول
3. أنشئ زيارة إشرافية
4. اضغط زر "تحسين"
5. راقب الإشعارات

---

## ✅ قائمة التحقق

- [ ] نسخ الملفات المحسّنة
- [ ] تثبيت المكتبات الجديدة
- [ ] إضافة GEMINI_API_KEY
- [ ] تفعيل Google Cloud APIs
- [ ] نشر Functions
- [ ] نشر Hosting
- [ ] اختبار الميزة

---

## 🆘 حل سريع للمشاكل

### إذا ظهرت رسالة "API Key غير صالح":
```bash
# تحقق من السر
firebase functions:secrets:access GEMINI_API_KEY

# إعادة تعيين
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy --only functions
```

### إذا ظهرت رسالة "Model not found":
1. فعّل Vertex AI API
2. انتظر 5-10 دقائق
3. حاول مرة أخرى

### إذا ظهر خطأ Timeout:
- زد timeout في index.html (السطر 1770):
```javascript
const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 ثانية
```

---

## 📞 تواصل معنا

إذا واجهت أي مشكلة، تواصل عبر:
- 📧 Email: support@example.com
- 💬 Telegram: @SupportBot

---

**ملاحظة**: احتفظ بنسخة احتياطية من الملفات القديمة قبل التطبيق!
