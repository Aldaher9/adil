// ========================================
// 🔄 دوال إضافية للتكامل مع Firebase
// ========================================
// هذا الملف يحتوي على دوال مساعدة لربط script.js مع Firebase

// ========================================
// 💾 المزامنة اليدوية
// ========================================

async function manualSync() {
    // التحقق من وجود مستخدم مسجل
    if (!firebaseService.currentUser) {
        alert('⚠️ يجب تسجيل الدخول أولاً للمزامنة مع السحابة');
        return;
    }

    // التحقق من وضع التجربة
    if (localStorage.getItem('demoMode') === 'true') {
        alert('⚠️ أنت في وضع التجربة. البيانات محلية فقط ولن تُحفظ على السحابة.');
        return;
    }

    // عرض رسالة تحميل
    const originalHTML = event.target.innerHTML;
    event.target.innerHTML = '⏳ جاري المزامنة...';
    event.target.disabled = true;

    try {
        // حفظ البيانات المحلية إلى Firebase
        const result = await firebaseService.syncFromLocalStorage();
        
        if (result.success) {
            alert('✅ تمت المزامنة بنجاح!\n\nتم حفظ جميع بياناتك على السحابة.');
        } else {
            alert('❌ فشلت المزامنة: ' + result.error);
        }
    } catch (error) {
        console.error('خطأ في المزامنة:', error);
        alert('❌ حدث خطأ أثناء المزامنة');
    } finally {
        // إرجاع الزر لحالته الأصلية
        event.target.innerHTML = originalHTML;
        event.target.disabled = false;
    }
}

// ========================================
// 🔄 مزامنة تلقائية للبيانات
// ========================================

// دالة لحفظ البيانات تلقائياً عند التعديل
function autoSaveToFirebase() {
    // إذا كان المستخدم مسجل دخول وليس في وضع التجربة
    if (firebaseService.currentUser && !localStorage.getItem('demoMode')) {
        // حفظ بعد ثانية من آخر تعديل
        clearTimeout(window.autoSaveTimeout);
        window.autoSaveTimeout = setTimeout(async () => {
            console.log('🔄 حفظ تلقائي...');
            await firebaseService.syncFromLocalStorage();
        }, 1000);
    }
}

// ========================================
// 📊 تحديث واجهة المستخدم حسب حالة Firebase
// ========================================

function updateUIBasedOnFirebaseStatus() {
    const welcomeMsg = document.getElementById('welcomeMsg');
    
    if (firebaseService.currentUser) {
        // مستخدم مسجل دخول
        const displayName = firebaseService.currentUser.displayName || 
                          firebaseService.currentUser.email.split('@')[0];
        welcomeMsg.textContent = '👤 مرحباً ' + displayName;
        welcomeMsg.style.color = '#10b981'; // أخضر
    } else if (localStorage.getItem('demoMode') === 'true') {
        // وضع التجربة
        welcomeMsg.textContent = '🎮 وضع التجربة (بيانات محلية)';
        welcomeMsg.style.color = '#f59e0b'; // برتقالي
    } else {
        // غير مسجل دخول
        welcomeMsg.textContent = '👤 غير مسجل';
        welcomeMsg.style.color = '#94a3b8'; // رمادي
    }
}

// ========================================
// 🔔 إشعارات حالة المزامنة
// ========================================

function showSyncStatus(message, type = 'info') {
    // إنشاء عنصر الإشعار إذا لم يكن موجوداً
    let notification = document.getElementById('sync-notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'sync-notification';
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: bold;
            font-size: 14px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            opacity: 0;
        `;
        document.body.appendChild(notification);
    }

    // تحديد اللون حسب النوع
    let bgColor, textColor, icon;
    switch(type) {
        case 'success':
            bgColor = '#d1fae5';
            textColor = '#065f46';
            icon = '✅';
            break;
        case 'error':
            bgColor = '#fee2e2';
            textColor = '#991b1b';
            icon = '❌';
            break;
        case 'warning':
            bgColor = '#fef3c7';
            textColor = '#92400e';
            icon = '⚠️';
            break;
        default: // info
            bgColor = '#dbeafe';
            textColor = '#1e40af';
            icon = 'ℹ️';
    }

    notification.style.background = bgColor;
    notification.style.color = textColor;
    notification.textContent = icon + ' ' + message;
    
    // إظهار الإشعار
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 100);

    // إخفاء بعد 3 ثواني
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 3000);
}

// ========================================
// 🎛️ تعديل دوال الحفظ الموجودة
// ========================================

// تعديل دالة saveToLocalStorage لتشمل Firebase
const originalSaveToLocalStorage = window.saveToLocalStorage;
window.saveToLocalStorage = function() {
    // حفظ محلي
    if (originalSaveToLocalStorage) {
        originalSaveToLocalStorage();
    }
    
    // حفظ تلقائي إلى Firebase
    autoSaveToFirebase();
};

// ========================================
// 🔄 تحميل البيانات من Firebase عند البداية
// ========================================

async function loadDataFromFirebase() {
    if (firebaseService.currentUser && !localStorage.getItem('demoMode')) {
        console.log('📥 جاري تحميل البيانات من Firebase...');
        
        const result = await firebaseService.loadSchoolData();
        
        if (result.success) {
            // تحديث البيانات المحلية
            window.data = result.data;
            window.phones = result.phones;
            window.tasks = result.tasks;
            window.visits = result.visits;
            window.visitCriteria = result.visitCriteria;
            
            // حفظ في localStorage
            saveToLocalStorage();
            
            // تحديث الواجهة
            if (typeof updateDashboard === 'function') {
                updateDashboard();
            }
            if (typeof renderStaff === 'function') {
                renderStaff();
            }
            if (typeof renderTasks === 'function') {
                renderTasks();
            }
            if (typeof renderVisits === 'function') {
                renderVisits();
            }
            
            console.log('✅ تم تحميل البيانات بنجاح');
            showSyncStatus('تم تحميل البيانات من السحابة', 'success');
        }
    }
}

// ========================================
// 🚀 تهيئة عند تحميل الصفحة
// ========================================

// الانتظار حتى يتم تحميل Firebase
window.addEventListener('load', () => {
    setTimeout(() => {
        // تحديث واجهة المستخدم
        updateUIBasedOnFirebaseStatus();
        
        // تحميل البيانات من Firebase
        loadDataFromFirebase();
        
        // بدء المزامنة التلقائية
        if (typeof startAutoSync === 'function') {
            startAutoSync();
        }
    }, 1000);
});

// ========================================
// 📱 معلومات حالة الاتصال
// ========================================

function showConnectionStatus() {
    if (!navigator.onLine) {
        showSyncStatus('⚠️ أنت غير متصل بالإنترنت. التغييرات ستُحفظ محلياً.', 'warning');
    }
}

window.addEventListener('online', () => {
    showSyncStatus('✅ عادت اتصال الإنترنت', 'success');
    // محاولة المزامنة
    autoSaveToFirebase();
});

window.addEventListener('offline', () => {
    showSyncStatus('⚠️ انقطع اتصال الإنترنت', 'warning');
});

// ========================================
// 📊 إحصائيات المزامنة
// ========================================

function getSyncStats() {
    if (!firebaseService.currentUser) {
        return {
            status: 'غير مسجل دخول',
            lastSync: 'لا يوجد',
            dataSize: '0 KB'
        };
    }

    const schoolData = localStorage.getItem('schoolData');
    const dataSize = schoolData ? (schoolData.length / 1024).toFixed(2) : '0';

    return {
        status: localStorage.getItem('demoMode') ? 'وضع التجربة' : 'متصل',
        lastSync: new Date().toLocaleString('ar-EG'),
        dataSize: dataSize + ' KB',
        user: firebaseService.currentUser.email
    };
}

// ========================================
// 🎯 دوال مساعدة للزيارات مع Firebase
// ========================================

// حفظ زيارة جديدة مع Firebase
async function saveVisitToFirebase(visitData) {
    if (firebaseService.currentUser && !localStorage.getItem('demoMode')) {
        try {
            const result = await firebaseService.addVisit(visitData);
            if (result.success) {
                console.log('✅ تم حفظ الزيارة في Firebase');
                return result.id;
            }
        } catch (error) {
            console.error('خطأ في حفظ الزيارة:', error);
        }
    }
    return null;
}

// تحديث زيارة مع Firebase
async function updateVisitInFirebase(visitId, visitData) {
    if (firebaseService.currentUser && !localStorage.getItem('demoMode')) {
        try {
            await firebaseService.updateVisit(visitId, visitData);
            console.log('✅ تم تحديث الزيارة في Firebase');
        } catch (error) {
            console.error('خطأ في تحديث الزيارة:', error);
        }
    }
}

// حذف زيارة مع Firebase
async function deleteVisitFromFirebase(visitId) {
    if (firebaseService.currentUser && !localStorage.getItem('demoMode')) {
        try {
            await firebaseService.deleteVisit(visitId);
            console.log('✅ تم حذف الزيارة من Firebase');
        } catch (error) {
            console.error('خطأ في حذف الزيارة:', error);
        }
    }
}

console.log('✅ تم تحميل دوال التكامل مع Firebase');
