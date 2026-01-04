// ========================================
// 🔥 إعدادات Firebase - منصة القائد
// ========================================

// Import Firebase SDK v9 (Modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";

// ✅ إعدادات مشروعك الخاص
const firebaseConfig = {
    apiKey: "AIzaSyC4NddjijF29YNhowy4SqgRaMPn01oSSEg",
    authDomain: "school-9416e.firebaseapp.com",
    projectId: "school-9416e",
    storageBucket: "school-9416e.firebasestorage.app",
    messagingSenderId: "680872052240",
    appId: "1:680872052240:web:96d2e544166ab5f8096c95",
    measurementId: "G-5EBTV0MV83",
    databaseURL: "https://school-9416e-default-rtdb.firebaseio.com" // إضافة URL قاعدة البيانات
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تهيئة الخدمات
const auth = getAuth(app);
const db = getDatabase(app);
const analytics = getAnalytics(app);

// إعدادات اللغة العربية
auth.languageCode = 'ar';

// تصدير للاستخدام في ملفات أخرى
export { app, auth, db, analytics };

console.log('✅ تم تحميل إعدادات Firebase بنجاح');
