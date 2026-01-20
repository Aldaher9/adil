# 📦 دليل التثبيت والإعداد الشامل
## School Manager Pro - Installation & Setup Guide

---

## 📋 جدول المحتويات

1. [المتطلبات](#-المتطلبات)
2. [التثبيت الأساسي](#-التثبيت-الأساسي)
3. [إعداد Firebase](#-إعداد-firebase)
4. [التكوين](#-التكوين)
5. [التشغيل](#-التشغيل)
6. [البناء للإنتاج](#-البناء-للإنتاج)
7. [النشر](#-النشر)
8. [حل المشاكل](#-حل-المشاكل)

---

## 🔧 المتطلبات

### البرامج المطلوبة

#### 1. Node.js
```bash
# النسخة المطلوبة: 18.0.0 أو أحدث
# تحقق من النسخة المثبتة
node --version

# تنزيل من الموقع الرسمي
https://nodejs.org/
```

#### 2. npm (Node Package Manager)
```bash
# يأتي مع Node.js تلقائياً
# تحقق من النسخة
npm --version

# النسخة المطلوبة: 9.0.0 أو أحدث
```

#### 3. Angular CLI
```bash
# تثبيت عالمي
npm install -g @angular/cli

# تحقق من التثبيت
ng version
```

#### 4. Git (اختياري)
```bash
# للتحكم بالإصدارات
git --version

# تنزيل من
https://git-scm.com/
```

### متطلبات النظام

```
نظام التشغيل:
- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu 20.04+)

الذاكرة: 4GB RAM (يفضل 8GB)
المساحة: 500MB حرة
المعالج: ثنائي النواة 2GHz+
الإنترنت: مطلوب للتثبيت والمزامنة
```

---

## 💻 التثبيت الأساسي

### الطريقة 1: استنساخ من Git

```bash
# 1. استنساخ المشروع
git clone <repository-url>

# 2. الدخول للمجلد
cd school-manager-pro-enhanced

# 3. تثبيت المكتبات
npm install

# 4. الانتظار حتى اكتمال التثبيت...
```

### الطريقة 2: تحميل ZIP

```bash
# 1. حمّل الملف من GitHub
# 2. فك الضغط

# 3. افتح Terminal/CMD في المجلد
cd path/to/school-manager-pro-enhanced

# 4. تثبيت المكتبات
npm install
```

### التحقق من التثبيت

```bash
# تحقق من المكتبات المثبتة
npm list --depth=0

# يجب أن تشاهد:
# - @angular/core: 21.1.0
# - tailwindcss: 3.4.17
# - firebase: وموجود في index.html
```

---

## 🔥 إعداد Firebase

### الخطوة 1: إنشاء مشروع Firebase

```
1. اذهب إلى: https://console.firebase.google.com/
2. اضغط "Add project"
3. اسم المشروع: "school-manager-pro"
4. فعّل Google Analytics (اختياري)
5. اضغط "Create project"
```

### الخطوة 2: إضافة تطبيق ويب

```
1. في صفحة المشروع، اضغط على أيقونة الويب </>
2. اسم التطبيق: "School Manager Pro"
3. فعّل Firebase Hosting (اختياري)
4. اضغط "Register app"
```

### الخطوة 3: نسخ إعدادات Firebase

```javascript
// ستحصل على شيء مثل هذا:
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```

### الخطوة 4: تفعيل Firestore

```
1. في Firebase Console، اذهب إلى "Firestore Database"
2. اضغط "Create database"
3. اختر "Start in production mode"
4. اختر الموقع (مثل: us-central)
5. اضغط "Enable"
```

### الخطوة 5: إعداد قواعد الأمان

```javascript
// في Firebase Console > Firestore > Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // السماح بالقراءة والكتابة للجميع (للتطوير فقط)
    match /{document=**} {
      allow read, write: if true;
    }
    
    // للإنتاج - قم بتقييد الوصول
    // match /{document=**} {
    //   allow read, write: if request.auth != null;
    // }
  }
}
```

### الخطوة 6: تحديث الكود

```typescript
// افتح: src/services/enhanced-school-store.service.ts
// ابحث عن initFirebase()
// استبدل firebaseConfig بإعداداتك:

private initFirebase() {
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",           // <-- هنا
    authDomain: "YOUR_AUTH_DOMAIN",   // <-- هنا
    projectId: "YOUR_PROJECT_ID",     // <-- هنا
    storageBucket: "YOUR_STORAGE",    // <-- هنا
    messagingSenderId: "YOUR_ID",     // <-- هنا
    appId: "YOUR_APP_ID"              // <-- هنا
  };
  
  // ... باقي الكود
}
```

---

## ⚙️ التكوين

### ملف package.json

```json
{
  "name": "school-manager-pro-enhanced",
  "version": "2.0.0",
  "scripts": {
    "dev": "ng serve --open",
    "build": "ng build --configuration production",
    "test": "ng test",
    "lint": "ng lint"
  }
}
```

### ملف angular.json

```json
// تأكد من وجود التكوينات الصحيحة
{
  "projects": {
    "school-manager-pro": {
      "architect": {
        "build": {
          "options": {
            "outputPath": "dist/school-manager-pro"
          }
        }
      }
    }
  }
}
```

### ملف tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "strict": true
  }
}
```

---

## 🚀 التشغيل

### وضع التطوير (Development)

```bash
# الطريقة 1: تشغيل عادي
npm run dev

# الطريقة 2: تشغيل مع فتح المتصفح تلقائياً
ng serve --open

# الطريقة 3: تشغيل على منفذ مخصص
ng serve --port 4300

# الطريقة 4: تشغيل مع إعادة التحميل السريع
ng serve --hmr
```

### الوصول للتطبيق

```
المتصفح: http://localhost:4200

الشبكة المحلية:
1. احصل على IP الخاص بك
   - Windows: ipconfig
   - Mac/Linux: ifconfig
2. افتح: http://YOUR_IP:4200
```

### التحقق من التشغيل

```
✅ يجب أن تشاهد:
1. صفحة تحميل أولية
2. Header بالألوان الزرقاء
3. لوحة التحكم
4. القائمة السفلية

❌ في حالة وجود أخطاء:
1. تحقق من Console (F12)
2. راجع قسم "حل المشاكل" أدناه
```

---

## 📦 البناء للإنتاج

### بناء أساسي

```bash
# بناء للإنتاج
npm run build

# أو
ng build --configuration production

# الملفات ستكون في:
# dist/school-manager-pro/
```

### بناء متقدم

```bash
# بناء مع إحصائيات
ng build --stats-json

# بناء مع تحسينات قصوى
ng build --optimization \
         --build-optimizer \
         --vendor-chunk \
         --named-chunks=false

# تحليل حجم الحزم
npm install -g webpack-bundle-analyzer
webpack-bundle-analyzer dist/stats.json
```

### التحقق من Build

```bash
# 1. تحقق من وجود المجلد
ls -la dist/school-manager-pro/

# 2. يجب أن تشاهد:
# - index.html
# - main.*.js
# - polyfills.*.js
# - styles.*.css
```

---

## 🌐 النشر

### 1. Firebase Hosting

```bash
# تثبيت Firebase CLI
npm install -g firebase-tools

# تسجيل الدخول
firebase login

# تهيئة المشروع
firebase init

# اختر:
# - Hosting
# - Use existing project
# - Public directory: dist/school-manager-pro/browser
# - Single-page app: Yes
# - Overwrite index.html: No

# النشر
firebase deploy

# ستحصل على رابط مثل:
# https://your-project.web.app
```

### 2. Netlify

```bash
# طريقة 1: من الموقع
1. اذهب إلى netlify.com
2. اسحب مجلد dist/school-manager-pro
3. ستحصل على رابط فوري

# طريقة 2: CLI
npm install -g netlify-cli
netlify deploy --prod --dir=dist/school-manager-pro
```

### 3. Vercel

```bash
# تثبيت Vercel CLI
npm install -g vercel

# تسجيل الدخول
vercel login

# النشر
vercel --prod

# اتبع التعليمات
```

### 4. خادم خاص (VPS)

```bash
# 1. رفع الملفات عبر FTP/SFTP
# 2. أو استخدام rsync
rsync -avz dist/school-manager-pro/ user@server:/var/www/html/

# 3. إعداد Nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# 4. إعادة تشغيل Nginx
sudo systemctl restart nginx
```

---

## 🐛 حل المشاكل

### المشكلة 1: npm install فشل

```bash
# الحل 1: مسح cache
npm cache clean --force
npm install

# الحل 2: حذف node_modules
rm -rf node_modules package-lock.json
npm install

# الحل 3: استخدام نسخة Node.js مختلفة
nvm install 18
nvm use 18
npm install
```

### المشكلة 2: لا يتصل بـ Firebase

```bash
# تحقق من:
1. صحة API Key
2. تفعيل Firestore
3. قواعد الأمان في Firestore
4. اتصال الإنترنت

# في Console:
firebase.apps.length  // يجب أن يكون > 0
```

### المشكلة 3: أخطاء TypeScript

```bash
# الحل 1: تحديث TypeScript
npm install typescript@latest

# الحل 2: تجاهل الأخطاء مؤقتاً
ng serve --skip-nx-cache

# الحل 3: إعادة تثبيت Angular
npm install @angular/core@latest
```

### المشكلة 4: صفحة بيضاء بعد Build

```bash
# السبب: مسارات خاطئة
# الحل: تحديث angular.json

"outputPath": "dist/school-manager-pro/browser",
"baseHref": "/"

# بناء مرة أخرى
npm run build
```

### المشكلة 5: بطء شديد

```bash
# الحلول:
1. مسح cache المتصفح
2. تعطيل Extensions
3. استخدام Incognito Mode
4. زيادة memory لـ Node:
   NODE_OPTIONS=--max_old_space_size=4096 npm run dev
```

---

## 📊 اختبار الأداء

### Lighthouse Audit

```bash
# في Chrome DevTools:
1. F12 > Lighthouse
2. اختر: Performance, Best Practices, SEO
3. Run audit

# الأهداف:
Performance: 90+
Accessibility: 95+
Best Practices: 90+
SEO: 100
```

### Bundle Size Analysis

```bash
# بناء مع إحصائيات
ng build --stats-json

# تحليل
npm install -g webpack-bundle-analyzer
webpack-bundle-analyzer dist/stats.json

# الأهداف:
Main bundle: < 500KB
Total: < 2MB
```

---

## 🔒 الأمان

### قبل النشر للإنتاج

```typescript
// 1. تحديث قواعد Firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}

// 2. تفعيل Authentication
// في Firebase Console > Authentication

// 3. إخفاء API Keys الحساسة
// استخدم Environment Variables

// 4. تفعيل HTTPS
// إلزامي في Firebase Hosting
```

---

## 📱 دعم PWA (قريباً)

```bash
# إضافة PWA
ng add @angular/pwa

# سيضيف:
- manifest.json
- service-worker.js
- icons

# ميزات PWA:
✅ العمل بدون إنترنت
✅ التثبيت على الهاتف
✅ إشعارات Push
✅ تحديثات تلقائية
```

---

## 🎯 الخطوات التالية

### بعد التثبيت الناجح

```
✅ 1. استكشف التطبيق
✅ 2. أضف بيانات تجريبية
✅ 3. اختبر جميع الميزات
✅ 4. خصص الإعدادات
✅ 5. ادع الفريق للاختبار
```

### للتطوير

```
✅ 1. راجع الكود
✅ 2. اقرأ التوثيق
✅ 3. جرب إضافة ميزات
✅ 4. شارك التحسينات
```

---

## 📞 الدعم

### إذا واجهت مشاكل

```
1. راجع هذا الدليل مرة أخرى
2. ابحث في GitHub Issues
3. اطرح سؤالاً في Discussions
4. تواصل معنا:
   - Email: support@school-manager.com
   - Discord: [رابط الخادم]
```

---

<div align="center">

**تمت كتابة هذا الدليل بعناية لمساعدتك** 💙

**إذا نجح التثبيت، شارك تجربتك معنا!** ⭐

**نسخة الدليل: 1.0** | **آخر تحديث: 20 يناير 2025**

</div>
