// ========================================
// 🔐 خدمات Firebase - المصادقة وقاعدة البيانات (v9 Modular)
// ========================================

import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

import { 
    ref,
    set,
    get,
    update,
    remove,
    onValue,
    off,
    push,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

class FirebaseService {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        this.init();
    }

    // ========================================
    // التهيئة الأولية
    // ========================================
    init() {
        // مراقبة حالة تسجيل الدخول
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.currentUser = user;
                this.onUserLoggedIn(user);
            } else {
                this.currentUser = null;
                this.onUserLoggedOut();
            }
            this.isInitialized = true;
        });
    }

    // ========================================
    // 🔐 المصادقة (Authentication)
    // ========================================

    // تسجيل دخول بالبريد الإلكتروني وكلمة المرور
    async loginWithEmail(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: this.getArabicError(error.code) };
        }
    }

    // تسجيل مستخدم جديد
    async registerWithEmail(email, password, displayName) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // تحديث اسم المستخدم
            await updateProfile(userCredential.user, {
                displayName: displayName
            });

            // إنشاء ملف تعريف في قاعدة البيانات
            await this.createUserProfile(userCredential.user.uid, {
                email: email,
                displayName: displayName,
                role: 'principal',
                createdAt: serverTimestamp()
            });

            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: this.getArabicError(error.code) };
        }
    }

    // تسجيل الخروج
    async logout() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: this.getArabicError(error.code) };
        }
    }

    // إعادة تعيين كلمة المرور
    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true, message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' };
        } catch (error) {
            return { success: false, error: this.getArabicError(error.code) };
        }
    }

    // ========================================
    // 📊 قاعدة البيانات
    // ========================================

    async saveData(path, data) {
        try {
            if (!this.currentUser) throw new Error('يجب تسجيل الدخول أولاً');
            const userId = this.currentUser.uid;
            const dataRef = ref(db, `users/${userId}/${path}`);
            await set(dataRef, { ...data, updatedAt: serverTimestamp() });
            return { success: true };
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
            return { success: false, error: error.message };
        }
    }

    async updateData(path, updates) {
        try {
            if (!this.currentUser) throw new Error('يجب تسجيل الدخول أولاً');
            const userId = this.currentUser.uid;
            const dataRef = ref(db, `users/${userId}/${path}`);
            await update(dataRef, { ...updates, updatedAt: serverTimestamp() });
            return { success: true };
        } catch (error) {
            console.error('خطأ في تحديث البيانات:', error);
            return { success: false, error: error.message };
        }
    }

    async getData(path) {
        try {
            if (!this.currentUser) throw new Error('يجب تسجيل الدخول أولاً');
            const userId = this.currentUser.uid;
            const dataRef = ref(db, `users/${userId}/${path}`);
            const snapshot = await get(dataRef);
            return { success: true, data: snapshot.val() };
        } catch (error) {
            console.error('خطأ في قراءة البيانات:', error);
            return { success: false, error: error.message };
        }
    }

    listenToData(path, callback) {
        if (!this.currentUser) return null;
        const userId = this.currentUser.uid;
        const dataRef = ref(db, `users/${userId}/${path}`);
        onValue(dataRef, (snapshot) => callback(snapshot.val()));
        return dataRef;
    }

    stopListening(dataRef) {
        if (dataRef) off(dataRef);
    }

    async deleteData(path) {
        try {
            if (!this.currentUser) throw new Error('يجب تسجيل الدخول أولاً');
            const userId = this.currentUser.uid;
            const dataRef = ref(db, `users/${userId}/${path}`);
            await remove(dataRef);
            return { success: true };
        } catch (error) {
            console.error('خطأ في حذف البيانات:', error);
            return { success: false, error: error.message };
        }
    }

    async createUserProfile(userId, profileData) {
        try {
            const profileRef = ref(db, `users/${userId}/profile`);
            await set(profileRef, { ...profileData, createdAt: serverTimestamp() });
            return { success: true };
        } catch (error) {
            console.error('خطأ في إنشاء الملف الشخصي:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserProfile() {
        if (!this.currentUser) return null;
        try {
            const profileRef = ref(db, `users/${this.currentUser.uid}/profile`);
            const snapshot = await get(profileRef);
            return snapshot.val();
        } catch (error) {
            console.error('خطأ في قراءة الملف الشخصي:', error);
            return null;
        }
    }

    // ========================================
    // 🎓 وظائف منصة القائد
    // ========================================

    async saveSchoolData(schoolData) {
        const { data, phones, tasks, visits, visitCriteria } = schoolData;
        return await this.saveData('schoolData', { data, phones, tasks, visits, visitCriteria });
    }

    async loadSchoolData() {
        const result = await this.getData('schoolData');
        if (result.success && result.data) {
            return {
                success: true,
                data: result.data.data || {},
                phones: result.data.phones || {},
                tasks: result.data.tasks || [],
                visits: result.data.visits || [],
                visitCriteria: result.data.visitCriteria || []
            };
        }
        return { success: false };
    }

    async addVisit(visitData) {
        try {
            const visitsRef = ref(db, `users/${this.currentUser.uid}/schoolData/visits`);
            const newVisitRef = push(visitsRef);
            await set(newVisitRef, { ...visitData, id: newVisitRef.key, createdAt: serverTimestamp() });
            return { success: true, id: newVisitRef.key };
        } catch (error) {
            console.error('خطأ في إضافة الزيارة:', error);
            return { success: false, error: error.message };
        }
    }

    async updateVisit(visitId, visitData) {
        return await this.updateData(`schoolData/visits/${visitId}`, visitData);
    }

    async deleteVisit(visitId) {
        return await this.deleteData(`schoolData/visits/${visitId}`);
    }

    async syncFromLocalStorage() {
        try {
            const stored = localStorage.getItem('schoolData');
            if (stored) {
                const parsed = JSON.parse(stored);
                await this.saveSchoolData(parsed);
                return { success: true, message: 'تمت المزامنة بنجاح' };
            }
            return { success: false, error: 'لا توجد بيانات محلية للمزامنة' };
        } catch (error) {
            console.error('خطأ في المزامنة:', error);
            return { success: false, error: error.message };
        }
    }

    async syncToLocalStorage() {
        try {
            const result = await this.loadSchoolData();
            if (result.success) {
                localStorage.setItem('schoolData', JSON.stringify({
                    data: result.data,
                    phones: result.phones,
                    tasks: result.tasks,
                    visits: result.visits,
                    visitCriteria: result.visitCriteria,
                    updated: new Date().toISOString()
                }));
                return { success: true, message: 'تمت المزامنة بنجاح' };
            }
            return result;
        } catch (error) {
            console.error('خطأ في المزامنة:', error);
            return { success: false, error: error.message };
        }
    }

    onUserLoggedIn(user) {
        console.log('تم تسجيل الدخول:', user.email);
        document.body.style.display = 'block';
        if (typeof updateWelcomeMessage === 'function') {
            updateWelcomeMessage(user.displayName || user.email);
        }
        this.syncToLocalStorage().then(() => {
            if (typeof loadFromLocalStorage === 'function') loadFromLocalStorage();
            if (typeof updateDashboard === 'function') updateDashboard();
        });
    }

    onUserLoggedOut() {
        console.log('تم تسجيل الخروج');
        if (typeof showLoginScreen === 'function') showLoginScreen();
    }

    getArabicError(errorCode) {
        const errors = {
            'auth/email-already-in-use': 'البريد الإلكتروني مستخدم بالفعل',
            'auth/invalid-email': 'البريد الإلكتروني غير صالح',
            'auth/weak-password': 'كلمة المرور ضعيفة جداً (6 أحرف على الأقل)',
            'auth/user-not-found': 'المستخدم غير موجود',
            'auth/wrong-password': 'كلمة المرور غير صحيحة',
            'auth/too-many-requests': 'محاولات كثيرة جداً، حاول لاحقاً',
            'auth/network-request-failed': 'خطأ في الاتصال بالإنترنت',
            'auth/invalid-credential': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        };
        return errors[errorCode] || 'حدث خطأ: ' + errorCode;
    }
}

const firebaseService = new FirebaseService();
window.firebaseService = firebaseService;

console.log('✅ تم تحميل خدمات Firebase (v9 Modular)');
