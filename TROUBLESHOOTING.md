# 🔧 دليل حل المشاكل الشائعة

## جدول المحتويات
1. [مشاكل API و Gemini](#مشاكل-api-و-gemini)
2. [مشاكل Firebase](#مشاكل-firebase)
3. [مشاكل الشبكة](#مشاكل-الشبكة)
4. [مشاكل الواجهة](#مشاكل-الواجهة)
5. [مشاكل التحديث](#مشاكل-التحديث)

---

## مشاكل API و Gemini

### ❌ المشكلة: "API Key غير صالح"

**الأعراض:**
```
Error: INVALID_API_KEY
Message: "مفتاح API غير صالح"
```

**الحلول:**

1. **تحقق من المفتاح:**
```bash
firebase functions:secrets:access GEMINI_API_KEY
```

2. **أنشئ مفتاح جديد:**
   - اذهب إلى: https://aistudio.google.com/app/apikey
   - أنشئ مفتاح جديد
   - احفظه بشكل آمن

3. **حدّث المفتاح:**
```bash
firebase functions:secrets:set GEMINI_API_KEY
# الصق المفتاح الجديد
firebase deploy --only functions
```

4. **تحقق من صلاحيات المفتاح:**
   - افتح Google Cloud Console
   - تأكد من تفعيل Generative Language API

---

### ❌ المشكلة: "Model not found"

**الأعراض:**
```
Error: MODEL_NOT_FOUND
Message: "الموديل غير متوفر"
```

**الحلول:**

1. **فعّل APIs المطلوبة:**
```
https://console.cloud.google.com/apis/library
```
   - Generative Language API ✅
   - Vertex AI API ✅

2. **انتظر 5-10 دقائق:**
   - بعد التفعيل، انتظر قليلاً

3. **جرّب موديل آخر:**
   - غيّر في `functions/index.js`:
```javascript
// من
model: "gemini-1.5-flash"
// إلى
model: "gemini-1.5-pro"
```

4. **تحقق من Project ID:**
```bash
firebase projects:list
```

---

### ❌ المشكلة: "Quota Exceeded"

**الأعراض:**
```
Error: QUOTA_EXCEEDED
Message: "تم تجاوز الحد المسموح"
```

**الحلول:**

1. **انتظر قليلاً:**
   - Gemini Free tier: 15 requests/minute
   - انتظر دقيقة ثم حاول مرة أخرى

2. **ترقية الحساب:**
   - افتح: https://cloud.google.com/billing
   - أضف بطاقة دفع للحد الأعلى

3. **قلل عدد الطلبات:**
   - لا تضغط "تحسين" عدة مرات متتالية
   - انتظر نتيجة الطلب الأول

---

## مشاكل Firebase

### ❌ المشكلة: "UNAUTHORIZED - Missing Bearer token"

**الأعراض:**
```
Error: UNAUTHORIZED
Message: "يجب تسجيل الدخول"
```

**الحلول:**

1. **سجّل الدخول:**
   - اضغط زر "تسجيل الدخول" في التطبيق
   - استخدم حساب Google

2. **امسح Cache:**
```javascript
// في Console المتصفح
localStorage.clear();
location.reload();
```

3. **تحقق من Firebase Auth:**
```bash
firebase auth:export users.json
```

4. **أعد تسجيل الدخول:**
   - اخرج من الحساب
   - سجّل دخول مرة أخرى

---

### ❌ المشكلة: "Permission Denied"

**الأعراض:**
```
Error: PERMISSION_DENIED
Message: "لا توجد صلاحيات"
```

**الحلول:**

1. **تحقق من Firestore Rules:**
```javascript
// في Firebase Console > Firestore > Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

2. **تحقق من IAM Roles:**
   - Firebase Console > Project Settings > Service Accounts
   - تأكد من وجود "Firebase Admin SDK"

3. **أعد نشر Rules:**
```bash
firebase deploy --only firestore:rules
```

---

## مشاكل الشبكة

### ❌ المشكلة: "Timeout - انتهت مهلة الاتصال"

**الأعراض:**
```
Error: Timeout
Message: "انتهت مهلة الاتصال"
```

**الحلول:**

1. **تحقق من الإنترنت:**
   - افتح موقع آخر للتأكد
   - حاول إعادة الاتصال

2. **زد Timeout:**
   - في `index.html`:
```javascript
// السطر ~1770
const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 ثانية
```

3. **قلّل حجم التقرير:**
   - قلل عدد المعايير المختارة
   - اجعل الملاحظات أقصر

4. **جرّب مرة أخرى:**
   - أحياناً مشكلة مؤقتة في الشبكة

---

### ❌ المشكلة: "CORS Error"

**الأعراض:**
```
Access to fetch blocked by CORS policy
```

**الحلول:**

1. **تحقق من URL:**
   - في `index.html`:
```javascript
const url = this.state.cloudFunctionUrl || "https://improvetext-XXXXX.cloudfunctions.net/improveText";
```

2. **أعد نشر Functions:**
```bash
firebase deploy --only functions
```

3. **تحقق من CORS في Function:**
```javascript
// في functions/index.js
res.set('Access-Control-Allow-Origin', '*');
```

4. **امسح Cache:**
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

---

## مشاكل الواجهة

### ❌ المشكلة: "الإشعارات لا تظهر"

**الحلول:**

1. **تحقق من Console:**
```javascript
// اضغط F12 > Console
// ابحث عن أخطاء JavaScript
```

2. **تحقق من CSS:**
   - في `index.html`، تأكد من وجود:
```css
@keyframes slideIn { /* ... */ }
```

3. **امسح Cache:**
```
Ctrl + Shift + R
```

4. **جرّب متصفح آخر:**
   - Chrome أو Firefox

---

### ❌ المشكلة: "زر التحسين لا يعمل"

**الحلول:**

1. **تحقق من البيانات:**
   - املأ جميع الحقول المطلوبة
   - عنوان الدرس
   - التخصص
   - الصف

2. **افتح Console:**
```javascript
// F12 > Console
// ابحث عن أخطاء
```

3. **تحقق من تسجيل الدخول:**
   - سجّل خروج ثم دخول مرة أخرى

4. **أعد تحميل الصفحة:**
```
F5 أو Ctrl + R
```

---

## مشاكل التحديث

### ❌ المشكلة: "بعد التحديث، لا يعمل شيء"

**الحلول:**

1. **راجع خطوات التحديث:**
   - تأكد من نسخ جميع الملفات
   - تحقق من `npm install`

2. **تحقق من package.json:**
```bash
cd functions
cat package.json
# يجب أن ترى:
# "@google/generative-ai": "^0.21.0"
```

3. **أعد التثبيت:**
```bash
cd functions
rm -rf node_modules package-lock.json
npm install
firebase deploy --only functions
```

4. **تحقق من logs:**
```bash
firebase functions:log
```

---

### ❌ المشكلة: "الموقع القديم لا يزال يظهر"

**الحلول:**

1. **امسح Cache الكامل:**
```
Chrome: Settings > Privacy > Clear browsing data
Firefox: Options > Privacy > Clear Data
```

2. **Hard Refresh:**
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

3. **جرّب Incognito Mode:**
```
Ctrl + Shift + N
```

4. **تحقق من Firebase Hosting:**
```bash
firebase hosting:channel:list
```

---

## نصائح عامة للوقاية

### ✅ قبل البدء:
1. احتفظ بنسخة احتياطية
2. اقرأ QUICK-START.md
3. جهّز API Key مسبقاً

### ✅ أثناء التحديث:
1. اتبع الخطوات بالترتيب
2. لا تتخطّ أي خطوة
3. راقب رسائل الـ terminal

### ✅ بعد التحديث:
1. اختبر الميزة عدة مرات
2. راقب Console للأخطاء
3. احفظ URL الجديد للـ Function

---

## 📞 الدعم الإضافي

### إذا استمرت المشاكل:

1. **جمّع المعلومات:**
   - نسخة المتصفح
   - رسالة الخطأ الكاملة
   - خطوات التكرار

2. **افحص Logs:**
```bash
firebase functions:log --only improveText
```

3. **اختبر محلياً:**
```bash
firebase emulators:start --only functions
```

4. **تواصل معنا:**
   - 📧 Email: support@example.com
   - 💬 Telegram: @SupportBot
   - 📚 Docs: https://docs.example.com

---

## 🎓 موارد إضافية

- [Firebase Documentation](https://firebase.google.com/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Google Cloud Console](https://console.cloud.google.com)

---

**ملاحظة**: معظم المشاكل يمكن حلها بـ:
1. إعادة نشر Functions
2. مسح Cache المتصفح
3. تحديث API Key

**حظاً موفقاً! 🍀**
