// ========================================
// 🔐 خدمات Firebase المطورة - منصة القائد
// ========================================

import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

import { 
    ref,
    set,
    get,
    onValue
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

class FirebaseService {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.currentUser = user;
                this.onUserLoggedIn(user);
            } else {
                this.currentUser = null;
                this.onUserLoggedOut();
            }
        });
    }

    // 1. تسجيل الدخول عبر جوجل (إصلاح الخطأ المطلوب)
    async loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: this.getArabicError(error.code) };
        }
    }

    // 2. مزامنة البيانات السحابية (حل مشكلة ربط قواعد البيانات)
    async syncData(data) {
        if (!this.currentUser) return;
        try {
            const userRef = ref(db, 'users/' + this.currentUser.uid);
            await set(userRef, {
                ...data,
                lastSync: new Date().toISOString()
            });
            console.log("✅ تمت المزامنة بنجاح");
        } catch (error) {
            console.error("❌ خطأ في المزامنة:", error);
        }
    }

    onUserLoggedIn(user) {
        document.body.style.display = 'block';
        // إخفاء شاشة تسجيل الدخول إن وجدت
        const loginScreen = document.getElementById('firebase-login-screen');
        if (loginScreen) loginScreen.style.display = 'none';
        
        if (window.updateWelcomeMessage) window.updateWelcomeMessage(user.displayName || user.email);
        if (window.loadFromLocalStorage) window.loadFromLocalStorage();
    }

    onUserLoggedOut() {
        if (window.showLoginScreen) window.showLoginScreen();
    }

    getArabicError(code) {
        const errors = {
            'auth/popup-closed-by-user': 'تم إغلاق نافذة تسجيل الدخول قبل الإكمال',
            'auth/network-request-failed': 'خطأ في الاتصال بالإنترنت',
            'auth/internal-error': 'حدث خطأ داخلي في الخادم'
        };
        return errors[code] || 'حدث خطأ غير معروف: ' + code;
    }
}

export const firebaseService = new FirebaseService();
