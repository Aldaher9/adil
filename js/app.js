// Application State
const appState = {
    user: null,
    data: {
        teachers: {},
        classes: {},
        subjects: {},
        lessons: [],
        periods: [],
        visits: [],
        tasks: []
    },
    phones: {},
    isSimulation: false,
    currentView: 'dashboard',
    sidebarActive: false
};

// DOM Elements
const elements = {
    appContainer: document.getElementById('app-container'),
    authScreen: document.getElementById('firebase-auth-screen'),
    loadingScreen: document.getElementById('loading-screen'),
    welcomeMessage: document.getElementById('welcome-message'),
    currentTime: document.getElementById('current-time'),
    currentPeriod: document.getElementById('current-period'),
    syncStatus: document.getElementById('sync-status'),
    sidebar: document.getElementById('sidebar'),
    mainContent: document.querySelector('.main-content'),
    totalTeachers: document.getElementById('total-teachers'),
    totalClasses: document.getElementById('total-classes'),
    activeLessons: document.getElementById('active-lessons'),
    pendingTasks: document.getElementById('pending-tasks'),
    connectionStatus: document.getElementById('connection-status'),
    dataSize: document.getElementById('data-size')
};

// Initialize Application
async function initApp() {
    try {
        // Check Firebase connection
        if (!window.firebaseApp) {
            throw new Error('Firebase not initialized');
        }
        
        // Check authentication state
        firebaseAuth.onAuthStateChanged(async (user) => {
            if (user) {
                await handleUserLogin(user);
            } else {
                showAuthScreen();
            }
        });
        
        // Load initial data
        await loadInitialData();
        
        // Start interval updates
        startUpdates();
        
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('خطأ في تهيئة التطبيق', 'error');
    } finally {
        // Hide loading screen
        setTimeout(() => {
            elements.loadingScreen.style.display = 'none';
        }, 1000);
    }
}

// Handle User Login
async function handleUserLogin(user) {
    try {
        appState.user = user;
        
        // Update UI
        elements.welcomeMessage.textContent = `مرحباً ${user.displayName || user.email}`;
        
        // Load user data from Firebase
        await loadUserData(user.uid);
        
        // Show main app
        elements.appContainer.style.display = 'block';
        elements.authScreen.style.display = 'none';
        
        // Update sync status
        updateSyncStatus('متصل');
        
        // Show success notification
        showNotification('تم تسجيل الدخول بنجاح', 'success');
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('خطأ في تسجيل الدخول', 'error');
    }
}

// Show Authentication Screen
function showAuthScreen() {
    // Hide app, show auth screen
    elements.appContainer.style.display = 'none';
    
    // Create auth screen HTML
    elements.authScreen.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <i class="fas fa-chalkboard-teacher"></i>
                    <h2>منصة القائد</h2>
                    <p>نظام الإدارة المتكامل للمدارس</p>
                </div>
                
                <div class="auth-tabs">
                    <button class="auth-tab active" onclick="switchAuthTab('login')">
                        تسجيل الدخول
                    </button>
                    <button class="auth-tab" onclick="switchAuthTab('register')">
                        حساب جديد
                    </button>
                </div>
                
                <div class="auth-form">
                    <div id="login-form">
                        <div class="form-group">
                            <input type="email" id="login-email" placeholder="البريد الإلكتروني">
                        </div>
                        <div class="form-group">
                            <input type="password" id="login-password" placeholder="كلمة المرور">
                        </div>
                        <button class="btn btn-primary btn-block" onclick="handleEmailLogin()">
                            <i class="fas fa-sign-in-alt"></i> تسجيل الدخول
                        </button>
                        <button class="btn btn-link" onclick="showForgotPassword()">
                            نسيت كلمة المرور؟
                        </button>
                    </div>
                    
                    <div id="register-form" style="display: none;">
                        <div class="form-group">
                            <input type="text" id="register-name" placeholder="الاسم الكامل">
                        </div>
                        <div class="form-group">
                            <input type="email" id="register-email" placeholder="البريد الإلكتروني">
                        </div>
                        <div class="form-group">
                            <input type="password" id="register-password" placeholder="كلمة المرور">
                        </div>
                        <div class="form-group">
                            <input type="password" id="register-confirm" placeholder="تأكيد كلمة المرور">
                        </div>
                        <button class="btn btn-primary btn-block" onclick="handleEmailRegister()">
                            <i class="fas fa-user-plus"></i> إنشاء حساب
                        </button>
                    </div>
                </div>
                
                <div class="auth-footer">
                    <button class="btn btn-secondary btn-block" onclick="enterDemoMode()">
                        <i class="fas fa-play-circle"></i> تجربة بدون تسجيل
                    </button>
                </div>
                
                <div id="auth-message" class="auth-message"></div>
            </div>
        </div>
    `;
}

// Switch Auth Tab
function switchAuthTab(tab) {
    const loginTab = document.querySelector('.auth-tab:nth-child(1)');
    const registerTab = document.querySelector('.auth-tab:nth-child(2)');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

// Handle Email Login
async function handleEmailLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showAuthMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور', 'error');
        return;
    }
    
    try {
        const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
        await handleUserLogin(userCredential.user);
    } catch (error) {
        showAuthMessage(getFirebaseError(error.code), 'error');
    }
}

// Handle Email Register
async function handleEmailRegister() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showAuthMessage('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showAuthMessage('كلمتا المرور غير متطابقتين', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAuthMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    try {
        // Create user
        const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        
        // Update profile
        await userCredential.user.updateProfile({
            displayName: name
        });
        
        // Create user document in database
        await createUserDocument(userCredential.user.uid, {
            name: name,
            email: email,
            role: 'principal',
            createdAt: new Date().toISOString()
        });
        
        await handleUserLogin(userCredential.user);
        
    } catch (error) {
        showAuthMessage(getFirebaseError(error.code), 'error');
    }
}

// Show Forgot Password
async function showForgotPassword() {
    const email = prompt('أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور:');
    
    if (email) {
        try {
            await firebaseAuth.sendPasswordResetEmail(email);
            showNotification('تم إرسال رابط إعادة التعيين إلى بريدك', 'success');
        } catch (error) {
            showNotification(getFirebaseError(error.code), 'error');
        }
    }
}

// Enter Demo Mode
function enterDemoMode() {
    if (confirm('هل تريد الدخول في وضع التجربة؟\nالبيانات لن تُحفظ على السحابة.')) {
        appState.user = { displayName: 'مستخدم تجريبي', email: 'demo@example.com' };
        localStorage.setItem('demoMode', 'true');
        
        elements.welcomeMessage.textContent = 'وضع التجربة';
        elements.appContainer.style.display = 'block';
        elements.authScreen.style.display = 'none';
        
        showNotification('أنت الآن في وضع التجربة', 'warning');
        
        // Load demo data
        loadDemoData();
    }
}

// Create User Document
async function createUserDocument(userId, userData) {
    try {
        await set(ref(firebaseDB, `users/${userId}/profile`), userData);
    } catch (error) {
        console.error('Error creating user document:', error);
    }
}

// Load User Data
async function loadUserData(userId) {
    try {
        // Load from Firebase
        const snapshot = await get(ref(firebaseDB, `users/${userId}/data`));
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            appState.data = userData;
            updateUI();
        } else {
            // Try to load from localStorage
            loadFromLocalStorage();
        }
        
    } catch (error) {
        console.error('Error loading user data:', error);
        loadFromLocalStorage();
    }
}

// Load from LocalStorage
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('schoolData');
    const savedPhones = localStorage.getItem('teacherPhones');
    
    if (savedData) {
        try {
            appState.data = JSON.parse(savedData);
            updateUI();
        } catch (error) {
            console.error('Error parsing saved data:', error);
        }
    }
    
    if (savedPhones) {
        try {
            appState.phones = JSON.parse(savedPhones);
        } catch (error) {
            console.error('Error parsing saved phones:', error);
        }
    }
}

// Load Demo Data
function loadDemoData() {
    // Create sample data for demo mode
    appState.data = {
        teachers: {
            '1': 'أحمد محمد',
            '2': 'سارة خالد',
            '3': 'علي حسن'
        },
        classes: {
            '1': '1/أ',
            '2': '2/ب',
            '3': '3/ج'
        },
        subjects: {
            '1': 'اللغة العربية',
            '2': 'الرياضيات',
            '3': 'العلوم'
        },
        lessons: [
            { d: '1', p: '1', c: '1', t: '1', s: '1' },
            { d: '1', p: '1', c: '2', t: '2', s: '2' },
            { d: '1', p: '2', c: '3', t: '3', s: '3' }
        ],
        periods: [
            { id: '1', s: '07:00', e: '08:00' },
            { id: '2', s: '08:00', e: '09:00' },
            { id: '3', s: '09:00', e: '10:00' }
        ],
        visits: [],
        tasks: []
    };
    
    appState.phones = {
        'أحمد محمد': '+966501234567',
        'سارة خالد': '+966502345678'
    };
    
    updateUI();
}

// Update UI
function updateUI() {
    // Update stats
    elements.totalTeachers.textContent = Object.keys(appState.data.teachers).length;
    elements.totalClasses.textContent = Object.keys(appState.data.classes).length;
    
    // Calculate active lessons
    const now = new Date();
    const currentPeriod = getCurrentPeriod(now);
    const activeLessonsCount = currentPeriod ? 
        appState.data.lessons.filter(l => 
            l.d === getDayNumber(now) && 
            l.p === currentPeriod.id
        ).length : 0;
    
    elements.activeLessons.textContent = activeLessonsCount;
    elements.pendingTasks.textContent = appState.data.tasks.length;
    
    // Update data size
    const dataSize = JSON.stringify(appState.data).length / 1024;
    elements.dataSize.textContent = `${dataSize.toFixed(2)} KB`;
}

// Get Current Period
function getCurrentPeriod(date) {
    const time = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    const timeInMinutes = toMinutes(time);
    
    return appState.data.periods.find(p => {
        const start = toMinutes(p.s);
        const end = toMinutes(p.e);
        return timeInMinutes >= start && timeInMinutes <= end;
    });
}

// Get Day Number
function getDayNumber(date) {
    // Sunday = 1, Monday = 2, ..., Thursday = 5
    return date.getDay() === 0 ? 1 : date.getDay() + 1;
}

// Convert time to minutes
function toMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

// Update Time Display
function updateTimeDisplay() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ar-SA');
    const dateString = now.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    elements.currentTime.querySelector('span').textContent = timeString;
    
    const currentPeriod = getCurrentPeriod(now);
    if (currentPeriod) {
        elements.currentPeriod.querySelector('span').textContent = 
            `الحصة ${currentPeriod.id} (${currentPeriod.s} - ${currentPeriod.e})`;
    } else {
        elements.currentPeriod.querySelector('span').textContent = 'خارج أوقات الدروس';
    }
}

// Update Sync Status
function updateSyncStatus(status) {
    elements.syncStatus.querySelector('span').textContent = status;
    elements.connectionStatus.textContent = status;
    
    if (status === 'متصل') {
        elements.syncStatus.style.color = '#10b981';
        elements.syncStatus.querySelector('i').style.color = '#10b981';
    } else {
        elements.syncStatus.style.color = '#ef4444';
        elements.syncStatus.querySelector('i').style.color = '#ef4444';
    }
}

// Manual Sync
async function manualSync() {
    if (appState.user && !localStorage.getItem('demoMode')) {
        try {
            showNotification('جاري المزامنة...', 'info');
            
            // Save data to Firebase
            await saveDataToFirebase();
            
            showNotification('تمت المزامنة بنجاح', 'success');
            updateSyncStatus('مزامن');
            
        } catch (error) {
            console.error('Sync error:', error);
            showNotification('فشلت المزامنة', 'error');
        }
    } else {
        showNotification('وضع التجربة: البيانات محلية فقط', 'warning');
    }
}

// Save Data to Firebase
async function saveDataToFirebase() {
    if (!appState.user) return;
    
    try {
        await set(ref(firebaseDB, `users/${appState.user.uid}/data`), appState.data);
        await set(ref(firebaseDB, `users/${appState.user.uid}/phones`), appState.phones);
        
        // Update localStorage
        localStorage.setItem('schoolData', JSON.stringify(appState.data));
        localStorage.setItem('teacherPhones', JSON.stringify(appState.phones));
        
    } catch (error) {
        console.error('Error saving to Firebase:', error);
        throw error;
    }
}

// Switch View
function switchView(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected view
    document.getElementById(`view-${viewId}`).classList.add('active');
    
    // Activate corresponding nav item
    document.querySelector(`.nav-item[onclick*="${viewId}"]`).classList.add('active');
    
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
        toggleSidebar();
    }
}

// Toggle Sidebar
function toggleSidebar() {
    elements.sidebar.classList.toggle('active');
    elements.mainContent.classList.toggle('sidebar-active');
}

// Handle Logout
async function handleLogout() {
    if (confirm('هل تريد تسجيل الخروج؟')) {
        try {
            // Save data before logout
            if (appState.user && !localStorage.getItem('demoMode')) {
                await saveDataToFirebase();
            }
            
            // Sign out
            await firebaseAuth.signOut();
            
            // Clear demo mode
            localStorage.removeItem('demoMode');
            
            // Reset app state
            appState.user = null;
            appState.data = {
                teachers: {},
                classes: {},
                subjects: {},
                lessons: [],
                periods: [],
                visits: [],
                tasks: []
            };
            appState.phones = {};
            
            // Show auth screen
            showAuthScreen();
            elements.appContainer.style.display = 'none';
            
            showNotification('تم تسجيل الخروج', 'success');
            
        } catch (error) {
            console.error('Logout error:', error);
            showNotification('خطأ في تسجيل الخروج', 'error');
        }
    }
}

// Refresh Data
function refreshData() {
    updateUI();
    updateTimeDisplay();
    showNotification('تم تحديث البيانات', 'success');
}

// Start Updates
function startUpdates() {
    // Update time every second
    setInterval(updateTimeDisplay, 1000);
    
    // Update UI every minute
    setInterval(updateUI, 60000);
    
    // Auto-save every 5 minutes (if logged in)
    if (appState.user && !localStorage.getItem('demoMode')) {
        setInterval(() => {
            saveDataToFirebase().catch(console.error);
        }, 300000); // 5 minutes
    }
}

// Show Notification
function showNotification(message, type = 'info') {
    const container = document.getElementById('notifications-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? '✓' :
                 type === 'error' ? '✗' :
                 type === 'warning' ? '⚠' : 'ℹ';
    
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                          type === 'error' ? 'times-circle' : 
                          type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            container.removeChild(notification);
        }, 300);
    }, 5000);
}

// Show Auth Message
function showAuthMessage(message, type) {
    const messageDiv = document.getElementById('auth-message');
    messageDiv.textContent = message;
    messageDiv.className = `auth-message ${type}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Get Firebase Error Message
function getFirebaseError(errorCode) {
    const errors = {
        'auth/email-already-in-use': 'البريد الإلكتروني مستخدم بالفعل',
        'auth/invalid-email': 'البريد الإلكتروني غير صالح',
        'auth/weak-password': 'كلمة المرور ضعيفة جداً',
        'auth/user-not-found': 'المستخدم غير موجود',
        'auth/wrong-password': 'كلمة المرور غير صحيحة',
        'auth/network-request-failed': 'خطأ في الاتصال بالإنترنت'
    };
    
    return errors[errorCode] || 'حدث خطأ غير معروف';
}

// Simulate Random Period
function simulateRandomPeriod() {
    if (appState.data.periods.length === 0) {
        showNotification('يجب رفع جدول أولاً', 'warning');
        return;
    }
    
    appState.isSimulation = true;
    
    // Random day (1-5)
    const randomDay = Math.floor(Math.random() * 5) + 1;
    
    // Random period
    const randomPeriod = appState.data.periods[Math.floor(Math.random() * appState.data.periods.length)];
    
    // Create simulated date
    const simulatedDate = new Date();
    const [hours, minutes] = randomPeriod.s.split(':').map(Number);
    simulatedDate.setHours(hours);
    simulatedDate.setMinutes(minutes);
    
    // Update UI with simulation
    updateSimulationUI(randomDay, simulatedDate);
    
    showNotification(`المحاكاة: اليوم ${randomDay} - الحصة ${randomPeriod.id}`, 'warning');
}

// Update Simulation UI
function updateSimulationUI(day, date) {
    // This would update the UI to show simulated data
    // Implementation depends on your specific needs
}

// Open Upload Modal
function openUploadModal() {
    document.getElementById('upload-modal').classList.add('active');
}

// Close Upload Modal
function closeUploadModal() {
    document.getElementById('upload-modal').classList.remove('active');
}

// Initialize on load
window.addEventListener('DOMContentLoaded', initApp);

// Export functions to global scope
window.switchAuthTab = switchAuthTab;
window.handleEmailLogin = handleEmailLogin;
window.handleEmailRegister = handleEmailRegister;
window.showForgotPassword = showForgotPassword;
window.enterDemoMode = enterDemoMode;
window.handleLogout = handleLogout;
window.switchView = switchView;
window.toggleSidebar = toggleSidebar;
window.manualSync = manualSync;
window.refreshData = refreshData;
window.simulateRandomPeriod = simulateRandomPeriod;
window.openUploadModal = openUploadModal;
window.closeUploadModal = closeUploadModal;
