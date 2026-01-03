// ========================================
// 🎨 واجهة المستخدم - تسجيل الدخول والتسجيل
// ========================================

// إظهار شاشة تسجيل الدخول
function showLoginScreen() {
    const loginHTML = `
    <div id="firebase-login-screen" style="position:fixed; inset:0; background:#f1f5f9; z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px;">
        <div style="background:white; padding:40px; border-radius:30px; text-align:center; box-shadow:0 10px 25px rgba(0,0,0,0.1); width:100%; max-width:400px;">
            
            <!-- علامة تجارية -->
            <div style="margin-bottom:30px;">
                <h1 style="color:#0f172a; margin-bottom: 10px; font-size:1.8rem;">منصة القائد ⚡</h1>
                <p style="color:#64748b; font-size:0.9rem;">نظام الإدارة المتكامل</p>
            </div>

            <!-- تبويب تسجيل الدخول/التسجيل -->
            <div style="display:flex; gap:10px; margin-bottom:25px; background:#f1f5f9; padding:5px; border-radius:15px;">
                <button id="tab-login" onclick="switchAuthTab('login')" style="flex:1; padding:12px; border:none; background:#0f172a; color:white; border-radius:12px; cursor:pointer; font-weight:bold; transition:all 0.3s;">
                    تسجيل الدخول
                </button>
                <button id="tab-register" onclick="switchAuthTab('register')" style="flex:1; padding:12px; border:none; background:transparent; color:#64748b; border-radius:12px; cursor:pointer; font-weight:bold; transition:all 0.3s;">
                    حساب جديد
                </button>
            </div>

            <!-- نموذج تسجيل الدخول -->
            <div id="login-form" style="display:block;">
                <input type="email" id="login-email" placeholder="📧 البريد الإلكتروني" style="width:100%; padding:15px; border:2px solid #e2e8f0; border-radius:15px; margin-bottom:15px; font-size:14px;">
                
                <div style="position:relative; margin-bottom:15px;">
                    <input type="password" id="login-password" placeholder="🔒 كلمة المرور" style="width:100%; padding:15px; border:2px solid #e2e8f0; border-radius:15px; font-size:14px;">
                    <button onclick="togglePassword('login-password')" style="position:absolute; left:15px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:18px;">
                        👁️
                    </button>
                </div>

                <button onclick="handleLogin()" id="login-btn" style="width:100%; padding:15px; background:#10b981; color:white; border:none; border-radius:15px; cursor:pointer; font-weight:bold; font-size:15px; margin-bottom:15px;">
                    🚀 دخول
                </button>

                <button onclick="showResetPassword()" style="width:100%; padding:12px; background:transparent; color:#3b82f6; border:none; cursor:pointer; font-size:13px; text-decoration:underline;">
                    نسيت كلمة المرور؟
                </button>
            </div>

            <!-- نموذج التسجيل -->
            <div id="register-form" style="display:none;">
                <input type="text" id="register-name" placeholder="👤 الاسم الكامل" style="width:100%; padding:15px; border:2px solid #e2e8f0; border-radius:15px; margin-bottom:15px; font-size:14px;">
                
                <input type="email" id="register-email" placeholder="📧 البريد الإلكتروني" style="width:100%; padding:15px; border:2px solid #e2e8f0; border-radius:15px; margin-bottom:15px; font-size:14px;">
                
                <div style="position:relative; margin-bottom:15px;">
                    <input type="password" id="register-password" placeholder="🔒 كلمة المرور" style="width:100%; padding:15px; border:2px solid #e2e8f0; border-radius:15px; font-size:14px;">
                    <button onclick="togglePassword('register-password')" style="position:absolute; left:15px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:18px;">
                        👁️
                    </button>
                </div>

                <div style="position:relative; margin-bottom:15px;">
                    <input type="password" id="register-password-confirm" placeholder="🔒 تأكيد كلمة المرور" style="width:100%; padding:15px; border:2px solid #e2e8f0; border-radius:15px; font-size:14px;">
                    <button onclick="togglePassword('register-password-confirm')" style="position:absolute; left:15px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:18px;">
                        👁️
                    </button>
                </div>

                <p style="font-size:11px; color:#64748b; text-align:right; margin-bottom:15px;">
                    * كلمة المرور يجب أن تكون 6 أحرف على الأقل
                </p>

                <button onclick="handleRegister()" id="register-btn" style="width:100%; padding:15px; background:#8b5cf6; color:white; border:none; border-radius:15px; cursor:pointer; font-weight:bold; font-size:15px;">
                    ✨ إنشاء حساب
                </button>
            </div>

            <!-- رسائل التحميل والأخطاء -->
            <div id="auth-message" style="margin-top:15px; padding:12px; border-radius:10px; display:none; font-size:13px; font-weight:bold;"></div>

            <!-- وضع التجربة -->
            <div style="margin-top:25px; padding-top:25px; border-top:2px solid #f1f5f9;">
                <button onclick="skipLoginWithFirebase()" style="width:100%; padding:12px; background:#f59e0b; color:white; border:none; border-radius:15px; cursor:pointer; font-weight:bold; font-size:13px;">
                    🎮 وضع التجربة (بدون تسجيل)
                </button>
            </div>
        </div>
    </div>
    `;

    // إضافة الشاشة إلى الصفحة
    const existingScreen = document.getElementById('firebase-login-screen');
    if (existingScreen) {
        existingScreen.remove();
    }
    document.body.insertAdjacentHTML('afterbegin', loginHTML);
}

// التبديل بين تسجيل الدخول والتسجيل
function switchAuthTab(tab) {
    const loginTab = document.getElementById('tab-login');
    const registerTab = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (tab === 'login') {
        loginTab.style.background = '#0f172a';
        loginTab.style.color = 'white';
        registerTab.style.background = 'transparent';
        registerTab.style.color = '#64748b';
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        registerTab.style.background = '#0f172a';
        registerTab.style.color = 'white';
        loginTab.style.background = 'transparent';
        loginTab.style.color = '#64748b';
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
    }

    hideAuthMessage();
}

// إظهار/إخفاء كلمة المرور
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

// معالجة تسجيل الدخول
async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    // التحقق من الحقول
    if (!email || !password) {
        showAuthMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور', 'error');
        return;
    }

    // تعطيل الزر وإظهار التحميل
    const btn = document.getElementById('login-btn');
    const originalText = btn.textContent;
    btn.textContent = '⏳ جاري تسجيل الدخول...';
    btn.disabled = true;

    // تسجيل الدخول
    const result = await firebaseService.loginWithEmail(email, password);

    if (result.success) {
        showAuthMessage('✅ تم تسجيل الدخول بنجاح!', 'success');
        setTimeout(() => {
            hideLoginScreen();
        }, 1000);
    } else {
        showAuthMessage('❌ ' + result.error, 'error');
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// معالجة التسجيل
async function handleRegister() {
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;

    // التحقق من الحقول
    if (!name || !email || !password || !passwordConfirm) {
        showAuthMessage('يرجى ملء جميع الحقول', 'error');
        return;
    }

    if (password !== passwordConfirm) {
        showAuthMessage('كلمتا المرور غير متطابقتين', 'error');
        return;
    }

    if (password.length < 6) {
        showAuthMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }

    // تعطيل الزر وإظهار التحميل
    const btn = document.getElementById('register-btn');
    const originalText = btn.textContent;
    btn.textContent = '⏳ جاري إنشاء الحساب...';
    btn.disabled = true;

    // التسجيل
    const result = await firebaseService.registerWithEmail(email, password, name);

    if (result.success) {
        showAuthMessage('✅ تم إنشاء الحساب بنجاح!', 'success');
        setTimeout(() => {
            hideLoginScreen();
        }, 1000);
    } else {
        showAuthMessage('❌ ' + result.error, 'error');
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// إظهار نافذة إعادة تعيين كلمة المرور
function showResetPassword() {
    const email = prompt('📧 أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور:');
    
    if (email) {
        resetPassword(email);
    }
}

// إعادة تعيين كلمة المرور
async function resetPassword(email) {
    showAuthMessage('⏳ جاري إرسال رابط إعادة التعيين...', 'info');

    const result = await firebaseService.resetPassword(email);

    if (result.success) {
        showAuthMessage('✅ ' + result.message, 'success');
    } else {
        showAuthMessage('❌ ' + result.error, 'error');
    }
}

// الدخول بدون تسجيل (وضع التجربة)
function skipLoginWithFirebase() {
    if (confirm('⚠️ تحذير: في وضع التجربة، لن يتم حفظ بياناتك على السحابة.\n\nهل تريد المتابعة؟')) {
        localStorage.setItem('demoMode', 'true');
        hideLoginScreen();
        
        // تحديث رسالة الترحيب
        updateWelcomeMessage('مدير المدرسة (وضع التجربة)');
        
        // تحميل البيانات المحلية
        if (typeof loadFromLocalStorage === 'function') {
            loadFromLocalStorage();
        }
        if (typeof updateDashboard === 'function') {
            updateDashboard();
        }
    }
}

// إخفاء شاشة تسجيل الدخول
function hideLoginScreen() {
    const screen = document.getElementById('firebase-login-screen');
    if (screen) {
        screen.style.display = 'none';
    }
    document.body.style.display = 'block';
}

// إظهار رسالة
function showAuthMessage(message, type) {
    const msgDiv = document.getElementById('auth-message');
    msgDiv.style.display = 'block';
    msgDiv.textContent = message;

    // تغيير اللون حسب النوع
    if (type === 'success') {
        msgDiv.style.background = '#d1fae5';
        msgDiv.style.color = '#065f46';
        msgDiv.style.border = '2px solid #10b981';
    } else if (type === 'error') {
        msgDiv.style.background = '#fee2e2';
        msgDiv.style.color = '#991b1b';
        msgDiv.style.border = '2px solid #ef4444';
    } else {
        msgDiv.style.background = '#dbeafe';
        msgDiv.style.color = '#1e40af';
        msgDiv.style.border = '2px solid #3b82f6';
    }
}

// إخفاء الرسالة
function hideAuthMessage() {
    const msgDiv = document.getElementById('auth-message');
    if (msgDiv) {
        msgDiv.style.display = 'none';
    }
}

// تحديث رسالة الترحيب
function updateWelcomeMessage(name) {
    const welcomeMsg = document.getElementById('welcomeMsg');
    if (welcomeMsg) {
        welcomeMsg.textContent = '👤 مرحباً ' + name;
    }
}

// معالجة تسجيل الخروج مع Firebase
async function handleLogoutFirebase() {
    if (confirm('هل تريد تسجيل الخروج؟')) {
        // حفظ البيانات قبل الخروج
        if (firebaseService.currentUser && !localStorage.getItem('demoMode')) {
            showAuthMessage('⏳ جاري حفظ البيانات...', 'info');
            await firebaseService.syncFromLocalStorage();
        }

        // تسجيل الخروج
        await firebaseService.logout();
        
        // مسح وضع التجربة
        localStorage.removeItem('demoMode');
        
        // إظهار شاشة تسجيل الدخول
        showLoginScreen();
    }
}

// ========================================
// 🔄 المزامنة التلقائية
// ========================================

// مزامنة البيانات كل 30 ثانية
let syncInterval = null;

function startAutoSync() {
    // مسح أي مزامنة سابقة
    if (syncInterval) {
        clearInterval(syncInterval);
    }

    // بدء المزامنة التلقائية
    syncInterval = setInterval(async () => {
        if (firebaseService.currentUser && !localStorage.getItem('demoMode')) {
            console.log('🔄 مزامنة تلقائية...');
            await firebaseService.syncFromLocalStorage();
        }
    }, 30000); // كل 30 ثانية
}

// إيقاف المزامنة التلقائية
function stopAutoSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
}

// ========================================
// 🚀 التهيئة عند تحميل الصفحة
// ========================================

window.addEventListener('load', () => {
    // الانتظار حتى يتم تهيئة Firebase
    setTimeout(() => {
        if (!firebaseService.currentUser && !localStorage.getItem('demoMode')) {
            showLoginScreen();
        } else {
            // بدء المزامنة التلقائية
            startAutoSync();
        }
    }, 500);
});

// حفظ البيانات قبل إغلاق الصفحة
window.addEventListener('beforeunload', async (e) => {
    if (firebaseService.currentUser && !localStorage.getItem('demoMode')) {
        e.preventDefault();
        await firebaseService.syncFromLocalStorage();
    }
});

console.log('✅ تم تحميل واجهة المستخدم Firebase');
