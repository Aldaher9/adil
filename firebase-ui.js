// ========================================
// 🎨 واجهة المستخدم - تسجيل الدخول والمزامنة
// ========================================

import { firebaseService } from './firebase-service.js';

// 1. إظهار شاشة تسجيل الدخول
export function showLoginScreen() {
    const loginHTML = `
    <div id="firebase-login-screen" style="position:fixed; inset:0; background:#f1f5f9; z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px; font-family: 'Tajawal', sans-serif;">
        <div style="background:white; padding:40px; border-radius:30px; text-align:center; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); width:100%; max-width:400px;">
            
            <div style="margin-bottom:30px;">
                <h1 style="color:#0f172a; margin-bottom: 10px; font-size:1.8rem;">منصة القائد ⚡</h1>
                <p style="color:#64748b; font-size:0.9rem;">نظام الإدارة المدرسية المتكامل</p>
            </div>

            <button id="google-login-btn" style="width:100%; display:flex; align-items:center; justify-content:center; gap:12px; background:white; color:#1e293b; border:2px solid #e2e8f0; padding:12px; border-radius:15px; font-weight:bold; cursor:pointer; transition:all 0.3s ease; margin-bottom:20px;">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20">
                الدخول عبر حساب Google
            </button>

            <div style="margin:20px 0; display:flex; align-items:center; gap:10px; color:#cbd5e1;">
                <div style="flex:1; height:1px; background:#e2e8f0;"></div>
                <span style="font-size:0.8rem;">أو عبر البريد</span>
                <div style="flex:1; height:1px; background:#e2e8f0;"></div>
            </div>

            <div id="auth-form">
                <input type="email" id="auth-email" placeholder="البريد الإلكتروني" style="width:100%; padding:12px; margin-bottom:12px; border:2px solid #f1f5f9; border-radius:12px; outline:none;">
                <input type="password" id="auth-password" placeholder="كلمة المرور" style="width:100%; padding:12px; margin-bottom:20px; border:2px solid #f1f5f9; border-radius:12px; outline:none;">
                
                <button id="login-submit-btn" style="width:100%; background:#0f172a; color:white; border:none; padding:14px; border-radius:12px; font-weight:bold; cursor:pointer; margin-bottom:15px;">تسجيل الدخول</button>
            </div>

            <button id="demo-mode-btn" style="background:none; border:none; color:#64748b; text-decoration:underline; font-size:0.85rem; cursor:pointer;">استمرار كضيف (وضع التجربة)</button>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', loginHTML);
    setupEventListeners();
}

// 2. إعداد مستمعي الأحداث للأزرار
function setupEventListeners() {
    // تسجيل دخول جوجل
    document.getElementById('google-login-btn')?.addEventListener('click', async () => {
        const result = await firebaseService.loginWithGoogle();
        if (result.success) {
            location.reload();
        } else {
            alert(result.error);
        }
    });

    // تسجيل دخول بريد
    document.getElementById('login-submit-btn')?.addEventListener('click', async () => {
        const email = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-password').value;
        if(!email || !pass) return alert('يرجى ملء كافة الحقول');
        
        const result = await firebaseService.loginWithEmail(email, pass);
        if (result.success) {
            location.reload();
        } else {
            alert(result.error);
        }
    });

    // وضع التجربة
    document.getElementById('demo-mode-btn')?.addEventListener('click', () => {
        localStorage.setItem('demoMode', 'true');
        document.getElementById('firebase-login-screen').remove();
        if (window.skipLogin) window.skipLogin();
    });
}

// 3. تحديث رسالة الترحيب في الهيدر
window.updateWelcomeMessage = function(name) {
    const welcomeMsg = document.getElementById('welcomeMsg');
    if (welcomeMsg) {
        welcomeMsg.innerHTML = `👤 مرحباً بالقائد: <span style="color:#f59e0b">${name}</span>`;
    }
}

// 4. معالجة خروج المستخدم
window.handleLogoutFirebase = async function() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        await firebaseService.logout();
        localStorage.removeItem('demoMode');
        location.reload();
    }
}

// 5. المزامنة التلقائية كل 60 ثانية لضمان حفظ البيانات
let syncTimer;
export function startAutoSync() {
    if (syncTimer) clearInterval(syncTimer);
    syncTimer = setInterval(async () => {
        if (firebaseService.currentUser && !localStorage.getItem('demoMode')) {
            console.log('🔄 جاري المزامنة السحابية تلقائياً...');
            await firebaseService.syncFromLocalStorage();
        }
    }, 60000);
}

// بدء التشغيل عند التحميل
window.addEventListener('load', () => {
    setTimeout(() => {
        if (!firebaseService.currentUser && localStorage.getItem('demoMode') !== 'true') {
            showLoginScreen();
        } else if (firebaseService.currentUser) {
            startAutoSync();
        }
    }, 1000);
});
