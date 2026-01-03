// Global Variables
const firebaseConfig = {
  apiKey: "AIzaSyC4NddjijF29YNhowy4SqgRaMPn01oSSEg",
  authDomain: "school-9416e.firebaseapp.com",
  projectId: "school-9416e",
  databaseURL: "https://school-9416e-default-rtdb.firebaseio.com", // تأكد من تفعيل Realtime Database
  storageBucket: "school-9416e.firebasestorage.app",
  messagingSenderId: "680872052240",
  appId: "1:680872052240:web:96d2e544166ab5f8096c95"
};


function startLiveUpdate() {
    // تحديث كل 30 ثانية لضمان دقة جدول الحصص الحالية
    setInterval(() => {
        if (!isSim) { // إذا لم نكن في وضع المحاكاة، حدث الوقت الحقيقي
            refresh();
            updateDashboard();
        }
    }, 30000);
}

// تعديل بسيط على دالة refresh لضمان قراءة ملف XML المستورد
function refresh() {
    const now = isSim ? parseTime(sTime) : new Date();
    // كود الفلترة الخاص بالحصص الحالية بناءً على الوقت
    renderCurrentLessons(now); 
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// تحديث وظيفة الحفظ لتكون سحابية
function saveToCloud() {
    db.ref('school_data').set({
        data, phones, tasks, visits, visitCriteria,
        lastUpdated: new Date().toISOString()
    }).then(() => console.log("تم المزامنة مع Firebase بنجاح"));
}

let currentUser = { uid: 'demo-user', displayName: 'مدير المدرسة', email: 'principal@school.com' };
let data = { teachers: {}, classes: {}, subjects: {}, lessons: [], periods: [] };
let phones = {};
let tasks = [];
let visits = [];
let visitCriteria = [];
let isSim = false, sDay = 1, sTime = "08:00";
let visitsChart = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('تحميل الموقع...');
    loadFromLocalStorage();
    updateDashboard();
    renderStaff();
    renderTasks();
    renderVisits();
    refresh();
    
    if (localStorage.getItem('skipLogin') === 'true') {
        skipLogin();
    }
});

// Skip Login
function skipLogin() {
    localStorage.setItem('skipLogin', 'true');
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('welcomeMsg').innerText = '👤 مرحباً ' + currentUser.displayName;
    loadFromLocalStorage();
    updateDashboard();
}

// Handle Logout
function handleLogout() {
    if (confirm('هل تريد تسجيل الخروج؟')) {
        localStorage.removeItem('skipLogin');
        location.reload();
    }
}

// Local Storage Functions
function saveToLocalStorage() {
    try {
        localStorage.setItem('schoolData', JSON.stringify({
            data, phones, tasks, visits, visitCriteria,
            updated: new Date().toISOString()
        }));
    } catch (e) {
        console.error('خطأ في الحفظ:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const stored = localStorage.getItem('schoolData');
        if (stored) {
            const parsed = JSON.parse(stored);
            data = parsed.data || data;
            phones = parsed.phones || phones;
            tasks = parsed.tasks || tasks;
            visits = parsed.visits || visits;
            visitCriteria = parsed.visitCriteria || visitCriteria;
        }
    } catch (e) {
        console.error('خطأ في التحميل:', e);
    }
}

// Import Visit Criteria from JSON
function importVisitCriteria(input) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            visitCriteria = JSON.parse(e.target.result);
            saveToLocalStorage();
            alert('تم استيراد استمارة التقييم بنجاح ✅\nعدد المعايير: ' + visitCriteria.length);
        } catch (error) {
            alert('خطأ في قراءة ملف JSON');
            console.error(error);
        }
    };
    reader.readAsText(input.files[0], 'UTF-8');
}

// Update Dashboard
function updateDashboard() {
    document.getElementById('statTeachers').innerText = Object.keys(data.teachers).length;
    document.getElementById('statClasses').innerText = Object.keys(data.classes).length;
    document.getElementById('statTasks').innerText = tasks.filter(t => !t.done).length;
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekVisits = visits.filter(v => new Date(v.date) >= weekAgo);
    document.getElementById('statVisits').innerText = weekVisits.length;
    
    updateVisitsChart();
    updateDashboardTime();
}

// Update Dashboard Time
function updateDashboardTime() {
    const now = new Date();
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    let d = days[now.getDay()];
    let t = now.toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit', hour12: false});
    
    if (isSim) {
        d = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'][sDay - 1];
        t = sTime;
    }
    
    document.getElementById('dashDate').innerText = t;
    document.getElementById('dashSimBadge').style.display = isSim ? "block" : "none";
    
    const p = (data.periods || []).find(p => {
        const cur = toM(t), s = toM(p.s), e = toM(p.e);
        return cur >= s && cur <= e;
    });
    
    if (p) {
        document.getElementById('dashPeriod').innerText = "الحصة النشطة: " + p.id;
    } else {
        document.getElementById('dashPeriod').innerText = "خارج الدوام";
    }
}

// Update Visits Chart
function updateVisitsChart() {
    const ctx = document.getElementById('visitsChart');
    if (!ctx) return;
    
    const last7Days = [];
    const visitCounts = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days.push(date.toLocaleDateString('ar-SA', {weekday: 'short'}));
        
        const count = visits.filter(v => v.date && v.date.startsWith(dateStr)).length;
        visitCounts.push(count);
    }
    
    if (visitsChart) {
        visitsChart.destroy();
    }
    
    visitsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'عدد الزيارات',
                data: visitCounts,
                borderColor: '#0f172a',
                backgroundColor: 'rgba(15, 23, 42, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Random Simulation
function startRandomSimulation() {
    if (!data.lessons || data.lessons.length === 0) {
        alert('لا يوجد جدول. قم باستيراد ملف XML أولاً');
        return;
    }
    
    if (!data.periods || data.periods.length === 0) {
        alert('لا توجد فترات زمنية في الجدول');
        return;
    }
    
    // اختيار يوم عشوائي (1-5)
    sDay = Math.floor(Math.random() * 5) + 1;
    
    // اختيار حصة عشوائية
    const randomPeriod = data.periods[Math.floor(Math.random() * data.periods.length)];
    sTime = randomPeriod.s;
    
    isSim = true;
    closeModal();
    refresh();
    updateDashboard();
    
    // التبديل إلى صفحة الحصص
    switchTab('view-schedule', document.querySelectorAll('.nav-item')[1]);
    
    alert('تم بدء محاكاة حصة عشوائية ✅\nاليوم: ' + ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'][sDay - 1] + '\nالحصة: ' + randomPeriod.id);
}

// Exit Simulation Mode
function exitSimMode() {
    if (confirm('هل تريد العودة إلى الوقت الحقيقي؟')) {
        isSim = false;
        refresh();
        updateDashboard();
    }
}

// Refresh schedule
function refresh() {
    const now = new Date();
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    let d = days[now.getDay()];
    let t = now.toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit', hour12: false});
    
    if (isSim) {
        d = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'][sDay - 1];
        t = sTime;
    }
    
    document.getElementById('infoDate').innerText = t;
    document.getElementById('simBadge').style.display = isSim ? "block" : "none";
    document.getElementById('exitSimBtn').style.display = isSim ? "block" : "none";
    
    const p = (data.periods || []).find(p => {
        const cur = toM(t), s = toM(p.s), e = toM(p.e);
        return cur >= s && cur <= e;
    });
    
    const list = document.getElementById('lessons-list');
    if (p && data.lessons && data.lessons.length > 0) {
        document.getElementById('infoPeriod').innerText = "الحصة النشطة: " + p.id;
        
        // تصفية الدروس حسب اليوم والحصة
        const current = data.lessons.filter(l => l.d == d && l.p == p.id);
        
        // ترتيب الفصول من الأصغر إلى الأكبر
        current.sort((a,b)=> {
            const classA = data.classes[a.c] || '';
            const classB = data.classes[b.c] || '';
            
            // استخراج الأرقام من اسم الفصل
            const numA = parseInt(classA.match(/\d+/)) || 0;
            const numB = parseInt(classB.match(/\d+/)) || 0;
            
            return numA - numB;
        });
        
        list.innerHTML = current.map(l => {
            let n = data.teachers[l.t], ph = (phones[n] || "").replace(/\s+/g, '');
            let className = data.classes[l.c] || '..';
            let msg = encodeURIComponent(`السلام عليكم، أستاذ ${n}. نلاحظ تأخركم عن الحصة ${p.id} في صف ${className}. نرجو التواجد للأهمية.`);
            return `<div class="lesson-card">
                <div class="class-badge">${className}</div>
                <div style="flex:1; padding-right:15px;"><b>${n}</b><br><small>${data.subjects[l.s] || ''}</small></div>
                <button onclick="window.open('https://wa.me/${ph}?text=${msg}')" style="border:none; background:#10b981; color:white; width:35px; height:35px; border-radius:50%; cursor:pointer;">💬</button>
            </div>`;
        }).join('');
    } else {
        document.getElementById('infoPeriod').innerText = "خارج الدوام";
        list.innerHTML = `<div style="text-align:center; padding:50px; color:#94a3b8;">لا توجد حصص حالياً</div>`;
    }
}

// Render Staff
function renderStaff() {
    const list = document.getElementById('staff-list');
    const sorted = Array.from(new Set([...Object.values(data.teachers), ...Object.keys(phones)])).sort();
    
    if (sorted.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:50px; color:#94a3b8;">لا يوجد معلمين. قم باستيراد الجدول أو بيانات المعلمين</div>';
        return;
    }
    
    list.innerHTML = sorted.map((name, i) => {
        const ph = phones[name] || "";
        const teacherVisits = visits.filter(v => v.teacher === name);
        
        // حساب متوسط التقييم
        let avgRating = 'لا يوجد';
        if (teacherVisits.length > 0) {
            const totalRating = teacherVisits.reduce((sum, v) => {
                const ratings = v.criteriaRatings || {};
                const ratingValues = Object.values(ratings).map(r => {
                    const match = r.match(/\((\d+)\)/);
                    return match ? parseInt(match[1]) : 3;
                });
                return sum + (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length);
            }, 0);
            avgRating = (totalRating / teacherVisits.length).toFixed(1);
        }
        
        return `<div class="staff-card filter-item">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <span style="font-weight:bold; color: #0f172a;">${name}</span>
                <div style="display:flex; align-items:center; gap:5px;">
                    <span style="font-size:12px; color:#64748b;">${ph || 'لا يوجد'}</span>
                    <button class="edit-phone-btn" onclick="updatePhone('${name}')">✏️</button>
                </div>
            </div>
            <div style="background:#f8fafc; padding:8px; border-radius:8px; margin-bottom:10px; font-size:12px;">
                <span>📊 متوسط التقييم: ${avgRating}</span> | 
                <span>👁️ الزيارات: ${teacherVisits.length}</span>
            </div>
            <select class="msg-select" id="sel_${i}">
                <option value="" disabled selected>🔽 اختر توجيهاً سريعاً...</option>
                <option value="الرجاء التوجه إلى مكتب الإدارة للأهمية.">الرجاء التوجه إلى مكتب الإدارة للأهمية.</option>
                <option value="الرجاء التواجد في مكان المناوبة.">الرجاء التواجد في مكان المناوبة.</option>
                <option value="الرجاء متابعة حصة الاحتياط لديك.">الرجاء متابعة حصة الاحتياط لديك.</option>
            </select>
            <div class="grid-2" style="margin-top:10px;">
                <button onclick="sendStaffMsg('${name}', 'sel_${i}')" class="action-btn" style="background:#10b981">✉️ واتساب</button>
                <a href="tel:${ph}" class="action-btn" style="background:#3b82f6; text-decoration:none;">📞 اتصال</a>
            </div>
        </div>`;
    }).join('');
}

// Visits Functions
function openVisitModal() {
    const modal = document.getElementById('visitModal');
    const teacherSelect = document.getElementById('visitTeacher');
    
    const teachers = Array.from(new Set([...Object.values(data.teachers), ...Object.keys(phones)])).sort();
    
    if (teachers.length === 0) {
        alert('لا يوجد معلمين. قم باستيراد بيانات المعلمين أولاً');
        return;
    }
    
    teacherSelect.innerHTML = '<option value="">اختر المعلم...</option>' + 
        teachers.map(t => `<option value="${t}">${t}</option>`).join('');
    
    const now = new Date();
    const dateString = now.toISOString().slice(0, 16);
    document.getElementById('visitDate').value = dateString;
    
    // بناء استمارة التقييم
    buildCriteriaForm();
    
    modal.style.display = 'block';
}

function buildCriteriaForm() {
    const container = document.getElementById('criteriaContainer');
    
    if (visitCriteria.length === 0) {
        container.innerHTML = `<div style="padding:20px; background:#fff3cd; border-radius:10px; text-align:center; margin:15px 0;">
            <p style="margin:0; color:#856404;">لم يتم استيراد استمارة التقييم</p>
            <p style="margin:5px 0 0 0; font-size:12px; color:#856404;">اذهب للإعدادات واستورد ملف JSON</p>
        </div>`;
        return;
    }
    
    // تجميع المعايير حسب الاسم
    const criteriaGroups = {};
    visitCriteria.forEach(item => {
        const criterion = item['المعيار / البند'];
        if (!criteriaGroups[criterion]) {
            criteriaGroups[criterion] = [];
        }
        criteriaGroups[criterion].push(item);
    });
    
    let html = '<div style="margin:20px 0;"><h4 style="color:#0f172a; margin-bottom:15px;">معايير التقييم:</h4>';
    
    Object.keys(criteriaGroups).forEach((criterion, idx) => {
        const options = criteriaGroups[criterion];
        html += `
            <div class="form-group">
                <label style="font-weight:700; color:#0f172a;">${criterion}</label>
                <p style="font-size:12px; color:#64748b; margin:5px 0 10px 0;">${options[0]['وصف المعيار']}</p>
                <select class="form-control criteria-select" data-criterion="${criterion}" id="criteria_${idx}">
                    <option value="">اختر التقييم...</option>
                    ${options.map(opt => `<option value="${opt['الحكم']}">${opt['الحكم']}</option>`).join('')}
                </select>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function closeVisitModal() {
    document.getElementById('visitModal').style.display = 'none';
    document.getElementById('visitTeacher').value = '';
    document.getElementById('visitClass').value = '';
    document.getElementById('visitSubject').value = '';
    document.getElementById('visitNotes').value = '';
}

function saveVisit() {
    const teacher = document.getElementById('visitTeacher').value;
    const date = document.getElementById('visitDate').value;
    const className = document.getElementById('visitClass').value;
    const subject = document.getElementById('visitSubject').value;
    const notes = document.getElementById('visitNotes').value;
    
    if (!teacher || !date) {
        alert('الرجاء ملء الحقول المطلوبة (المعلم، التاريخ)');
        return;
    }
    
    // جمع التقييمات من المعايير
    const criteriaRatings = {};
    const criteriaSelects = document.querySelectorAll('.criteria-select');
    
    criteriaSelects.forEach(select => {
        const criterion = select.dataset.criterion;
        const rating = select.value;
        if (rating) {
            criteriaRatings[criterion] = rating;
        }
    });
    
    const visit = {
        id: Date.now(),
        teacher,
        date,
        class: className,
        subject,
        criteriaRatings,
        notes,
        createdAt: new Date().toISOString()
    };
    
    visits.push(visit);
    saveToLocalStorage();
    renderVisits();
    updateDashboard();
    closeVisitModal();
    alert('تم حفظ الزيارة بنجاح ✅');
}

function renderVisits() {
    const list = document.getElementById('visits-list');
    const sortedVisits = [...visits].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedVisits.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:50px; color:#94a3b8;">لا توجد زيارات مسجلة</div>';
        return;
    }
    
    list.innerHTML = sortedVisits.map(v => {
        const dateObj = new Date(v.date);
        const dateStr = dateObj.toLocaleDateString('ar-SA');
        const timeStr = dateObj.toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'});
        
        // عرض التقييمات
        let ratingsHtml = '';
        if (v.criteriaRatings && Object.keys(v.criteriaRatings).length > 0) {
            ratingsHtml = '<div style="margin-top:10px;">';
            Object.entries(v.criteriaRatings).forEach(([criterion, rating]) => {
                ratingsHtml += `<div class="visit-detail"><strong>${criterion}:</strong> ${rating}</div>`;
            });
            ratingsHtml += '</div>';
        }
        
        return `<div class="visit-card">
            <div class="visit-header">
                <div>
                    <h4>${v.teacher}</h4>
                    <div class="visit-meta">
                        <span>📅 ${dateStr}</span>
                        <span>🕐 ${timeStr}</span>
                        ${v.class ? `<span>📚 ${v.class}</span>` : ''}
                    </div>
                </div>
            </div>
            
            ${v.subject ? `<div class="visit-detail"><strong>المادة:</strong> ${v.subject}</div>` : ''}
            ${ratingsHtml}
            ${v.notes ? `<div class="visit-detail"><strong>📝 ملاحظات:</strong> ${v.notes}</div>` : ''}
            
            <div style="margin-top:10px; display:flex; gap:10px;">
                <button onclick="generatePrintedVisitReport(${v.id})" style="flex:1; padding:8px; background:#10b981; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:700;">🖨️ تقرير مطبوع</button>
                <button onclick="deleteVisit(${v.id})" style="flex:1; padding:8px; background:#ef4444; color:white; border:none; border-radius:8px; cursor:pointer;">🗑️ حذف</button>
            </div>
        </div>`;
    }).join('');
}

function filterVisits() {
    renderVisits();
}

function deleteVisit(id) {
    if (confirm('هل أنت متأكد من حذف هذه الزيارة؟')) {
        visits = visits.filter(v => v.id !== id);
        saveToLocalStorage();
        renderVisits();
        updateDashboard();
    }
}

// Reports Functions
function generateTeacherReport() {
    const teachers = Array.from(new Set([...Object.values(data.teachers), ...Object.keys(phones)])).sort();
    
    if (teachers.length === 0) {
        alert('لا يوجد معلمين لإنشاء تقرير');
        return;
    }
    
    const reportData = teachers.map(name => {
        const teacherVisits = visits.filter(v => v.teacher === name);
        
        let avgRating = 'N/A';
        if (teacherVisits.length > 0) {
            const totalRating = teacherVisits.reduce((sum, v) => {
                const ratings = v.criteriaRatings || {};
                const ratingValues = Object.values(ratings).map(r => {
                    const match = r.match(/\((\d+)\)/);
                    return match ? parseInt(match[1]) : 3;
                });
                return sum + (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length);
            }, 0);
            avgRating = (totalRating / teacherVisits.length).toFixed(1);
        }
        
        return {
            'اسم المعلم': name,
            'رقم الهاتف': phones[name] || '',
            'عدد الزيارات': teacherVisits.length,
            'متوسط التقييم': avgRating
        };
    });
    
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تقرير المعلمين");
    XLSX.writeFile(wb, `تقرير_المعلمين_${new Date().toLocaleDateString('ar-SA')}.xlsx`);
}

function generateVisitsReport() {
    if (visits.length === 0) {
        alert('لا توجد زيارات لإنشاء تقرير');
        return;
    }
    
    const reportData = visits.map(v => {
        const ratings = v.criteriaRatings || {};
        const ratingsSummary = Object.entries(ratings).map(([k, val]) => `${k}: ${val}`).join(' | ');
        
        return {
            'المعلم': v.teacher,
            'التاريخ': new Date(v.date).toLocaleDateString('ar-SA'),
            'الوقت': new Date(v.date).toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'}),
            'الفصل': v.class || '',
            'المادة': v.subject || '',
            'التقييمات': ratingsSummary,
            'ملاحظات': v.notes || ''
        };
    });
    
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تقرير الزيارات");
    XLSX.writeFile(wb, `تقرير_الزيارات_${new Date().toLocaleDateString('ar-SA')}.xlsx`);
}

function generateScheduleReport() {
    if (!data.lessons || data.lessons.length === 0) {
        alert('لا يوجد جدول لإنشاء تقرير');
        return;
    }
    
    const reportData = data.lessons.map(l => ({
        'اليوم': l.d,
        'الحصة': l.p,
        'المعلم': data.teachers[l.t] || '',
        'الفصل': data.classes[l.c] || '',
        'المادة': data.subjects[l.s] || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الجدول الدراسي");
    XLSX.writeFile(wb, `تقرير_الجدول_${new Date().toLocaleDateString('ar-SA')}.xlsx`);
}

function generateDetailedVisitReport() {
    if (visits.length === 0) {
        alert('لا توجد زيارات لإنشاء تقرير');
        return;
    }
    
    if (visitCriteria.length === 0) {
        alert('لم يتم استيراد استمارة التقييم. قم باستيراد ملف JSON أولاً');
        return;
    }
    
    const reportData = [];
    
    visits.forEach(visit => {
        const criteriaRatings = visit.criteriaRatings || {};
        
        Object.entries(criteriaRatings).forEach(([criterion, rating]) => {
            // البحث عن المعيار في قاعدة البيانات
            const criterionData = visitCriteria.find(c => 
                c['المعيار / البند'] === criterion && c['الحكم'] === rating
            );
            
            if (criterionData) {
                reportData.push({
                    'المعلم': visit.teacher,
                    'التاريخ': new Date(visit.date).toLocaleDateString('ar-SA'),
                    'الفصل': visit.class || '',
                    'المادة': visit.subject || '',
                    'المعيار': criterion,
                    'التقييم': rating,
                    'الوصف السلوكي': criterionData['الوصف السلوكي لجوانب الإجادة / أولويات التطوير'] || '',
                    'التوصيات': criterionData['التوصيات'] || '',
                    'ملاحظات المدير': visit.notes || ''
                });
            }
        });
    });
    
    const ws = XLSX.utils.json_to_sheet(reportData);
    
    // تنسيق العرض
    const range = XLSX.utils.decode_range(ws['!ref']);
    ws['!cols'] = [
        {wch: 20}, // المعلم
        {wch: 12}, // التاريخ
        {wch: 10}, // الفصل
        {wch: 15}, // المادة
        {wch: 25}, // المعيار
        {wch: 15}, // التقييم
        {wch: 60}, // الوصف السلوكي
        {wch: 60}, // التوصيات
        {wch: 40}  // ملاحظات المدير
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تقرير الزيارات التفصيلي");
    XLSX.writeFile(wb, `تقرير_الزيارات_التفصيلي_${new Date().toLocaleDateString('ar-SA')}.xlsx`);
}

// Tasks Functions
function addTask() {
    const input = document.getElementById('taskInput');
    if(input.value) {
        tasks.push({id: Date.now(), text: input.value, done: false});
        input.value = "";
        renderTasks();
        saveToLocalStorage();
        updateDashboard();
    }
}

function renderTasks() {
    const l = document.getElementById('tasks-list');
    if (tasks.length === 0) {
        l.innerHTML = '<div style="text-align:center; padding:50px; color:#94a3b8;">لا توجد مهام</div>';
        return;
    }
    
    l.innerHTML = tasks.map(t => `
        <div class="task-card ${t.done ? 'done' : ''}">
            <div style="display:flex; align-items:center; gap:10px; flex:1;">
                <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask(${t.id})" style="width:20px; height:20px; cursor:pointer;">
                <span style="${t.done ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${t.text}</span>
            </div>
            <button onclick="deleteTask(${t.id})" style="border:none; color:#ef4444; background:none; cursor:pointer; font-size:20px;">🗑️</button>
        </div>
    `).join('');
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.done = !task.done;
        renderTasks();
        saveToLocalStorage();
        updateDashboard();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
    saveToLocalStorage();
    updateDashboard();
}

// XML Import
function handleXML(input) {
    const reader = new FileReader();
    reader.readAsText(input.files[0], "windows-1256");
    reader.onload = (e) => {
        const xml = new DOMParser().parseFromString(e.target.result, "text/xml");
        const newData = { teachers: {}, classes: {}, subjects: {}, lessons: [], periods: [] };
        
        Array.from(xml.getElementsByTagName('teacher')).forEach(t => 
            newData.teachers[t.getAttribute('id')] = t.getAttribute('name'));
        Array.from(xml.getElementsByTagName('class')).forEach(c => 
            newData.classes[c.getAttribute('id')] = c.getAttribute('short'));
        Array.from(xml.getElementsByTagName('subject')).forEach(s => 
            newData.subjects[s.getAttribute('id')] = s.getAttribute('name'));
        Array.from(xml.getElementsByTagName('period')).forEach(p => 
            newData.periods.push({
                id: p.getAttribute('period'),
                s: p.getAttribute('starttime'),
                e: p.getAttribute('endtime')
            }));
        
        newData.lessons = Array.from(xml.getElementsByTagName('TimeTableSchedule')).map(l => ({
            d: l.getAttribute('DayID'),
            p: l.getAttribute('Period'),
            c: l.getAttribute('ClassID'),
            t: l.getAttribute('TeacherID'),
            s: l.getAttribute('SubjectGradeID')
        }));
        
        data = newData;
        saveToLocalStorage();
        closeModal();
        refresh();
        updateDashboard();
        renderStaff();
        alert('تم استيراد الجدول بنجاح ✅');
    };
}

// Excel Import/Export
function importFromExcel(input) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const wb = XLSX.read(e.target.result, { type: 'binary' });
        const sheet = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        sheet.forEach(row => {
            if(row["اسم المعلم"]) {
                phones[row["اسم المعلم"]] = String(row["رقم الهاتف"] || "");
            }
        });
        saveToLocalStorage();
        renderStaff();
        alert('تم استيراد بيانات المعلمين بنجاح ✅');
    };
    reader.readAsBinaryString(input.files[0]);
}

function exportToExcel() {
    const teachers = Array.from(new Set([...Object.values(data.teachers), ...Object.keys(phones)])).sort();
    
    if (teachers.length === 0) {
        alert('لا يوجد معلمين للتصدير');
        return;
    }
    
    const list = teachers.map(name => ({
        "اسم المعلم": name,
        "رقم الهاتف": phones[name] || ""
    }));
    const ws = XLSX.utils.json_to_sheet(list);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المعلمين");
    XLSX.writeFile(wb, "المعلمين.xlsx");
}

// Utility Functions
function filterStaff() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('.filter-item').forEach(el => 
        el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none');
}

function sendStaffMsg(n, id) {
    const ph = (phones[n] || "").replace(/\s+/g, '');
    const m = document.getElementById(id).value;
    if(ph && m) window.open(`https://wa.me/${ph}?text=${encodeURIComponent(m)}`);
    else if (!ph) alert('لا يوجد رقم هاتف لهذا المعلم');
    else alert('الرجاء اختيار رسالة');
}

function updatePhone(name) {
    const newPhone = prompt(`تحديث رقم ${name}:`, phones[name] || "");
    if (newPhone !== null) {
        phones[name] = newPhone;
        saveToLocalStorage();
        renderStaff();
    }
}

function openModal() {
    document.getElementById('settingsModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

function toM(t) {
    if(!t) return 0;
    const [h, m] = t.split(':');
    return parseInt(h) * 60 + parseInt(m);
}

function switchTab(t, b) {
    document.querySelectorAll('.container').forEach(c => c.classList.remove('active'));
    document.getElementById(t).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    b.classList.add('active');
    
    if(t === 'view-staff') renderStaff();
    if(t === 'view-visits') renderVisits();
    if(t === 'view-dashboard') updateDashboard();
}

// Auto-refresh
setInterval(() => {
    if(!isSim) {
        refresh();
        updateDashboardTime();
    }
}, 30000);

// Generate Printed Visit Report
function generatePrintedVisitReport(visitId) {
    const visit = visits.find(v => v.id === visitId);
    if (!visit) {
        alert('الزيارة غير موجودة');
        return;
    }
    
    if (!visit.criteriaRatings || Object.keys(visit.criteriaRatings).length === 0) {
        alert('هذه الزيارة لا تحتوي على تقييمات');
        return;
    }
    
    // تصنيف التقييمات
    const evaluations = [];
    Object.entries(visit.criteriaRatings).forEach(([criterion, rating]) => {
        const criterionData = visitCriteria.find(c => 
            c['المعيار / البند'] === criterion && c['الحكم'] === rating
        );
        
        if (criterionData) {
            const ratingNum = parseInt(rating.match(/\((\d+)\)/)[1]);
            evaluations.push({
                criterion: criterion,
                rating: rating,
                ratingNum: ratingNum,
                description: criterionData['الوصف السلوكي لجوانب الإجادة / أولويات التطوير'] || '',
                recommendation: criterionData['التوصيات'] || ''
            });
        }
    });
    
    // ترتيب حسب التقييم
    evaluations.sort((a, b) => a.ratingNum - b.ratingNum);
    
    // أفضل 3 تقييمات (جوانب الإجادة: 1 و 2)
    const excellencePoints = evaluations.filter(e => e.ratingNum <= 2).slice(0, 3);
    
    // أسوأ 3 تقييمات (جوانب التحسين: 3 و 4 و 5)
    const improvementPoints = evaluations.filter(e => e.ratingNum >= 3).slice(0, 3);
    
    // إنشاء HTML للتقرير
    const reportHTML = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير زيارة إشرافية - ${visit.teacher}</title>
    <style>
        @media print {
            @page {
                size: A4;
                margin: 2cm;
            }
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            .no-print {
                display: none !important;
            }
        }
        
        body {
            font-family: 'Tajawal', 'Arial', sans-serif;
            line-height: 1.8;
            color: #333;
            max-width: 21cm;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #0f172a;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #0f172a;
            font-size: 28px;
            margin: 10px 0;
            font-weight: 800;
        }
        
        .header h2 {
            color: #64748b;
            font-size: 18px;
            margin: 5px 0;
            font-weight: 600;
        }
        
        .info-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 25px;
            border-right: 5px solid #0f172a;
        }
        
        .info-row {
            display: flex;
            margin-bottom: 10px;
            font-size: 16px;
        }
        
        .info-label {
            font-weight: 700;
            color: #0f172a;
            min-width: 120px;
        }
        
        .info-value {
            color: #475569;
            flex: 1;
        }
        
        .greeting {
            background: #f0fdf4;
            border-right: 5px solid #10b981;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 25px;
            font-size: 16px;
            line-height: 2;
            color: #166534;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section-title {
            background: #0f172a;
            color: white;
            padding: 12px 20px;
            font-size: 20px;
            font-weight: 700;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .excellence-section .section-title {
            background: #10b981;
        }
        
        .improvement-section .section-title {
            background: #f59e0b;
        }
        
        .recommendations-section .section-title {
            background: #3b82f6;
        }
        
        .point {
            background: #ffffff;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .point-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f1f5f9;
        }
        
        .point-criterion {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
        }
        
        .point-rating {
            font-size: 16px;
            font-weight: 700;
            padding: 5px 15px;
            border-radius: 20px;
        }
        
        .excellence-section .point-rating {
            background: #d1fae5;
            color: #065f46;
        }
        
        .improvement-section .point-rating {
            background: #fef3c7;
            color: #92400e;
        }
        
        .point-description {
            font-size: 15px;
            color: #475569;
            line-height: 1.9;
            margin-bottom: 15px;
            text-align: justify;
        }
        
        .recommendation-item {
            background: #eff6ff;
            border-right: 4px solid #3b82f6;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
        }
        
        .recommendation-title {
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 8px;
            font-size: 16px;
        }
        
        .recommendation-text {
            color: #475569;
            line-height: 1.8;
            font-size: 15px;
        }
        
        .notes-section {
            background: #fefce8;
            border: 2px solid #fde047;
            border-radius: 10px;
            padding: 20px;
            margin-top: 30px;
        }
        
        .notes-title {
            font-weight: 700;
            color: #854d0e;
            margin-bottom: 10px;
            font-size: 18px;
        }
        
        .notes-text {
            color: #713f12;
            line-height: 1.8;
            font-size: 15px;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }
        
        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            padding: 0 50px;
        }
        
        .signature-box {
            text-align: center;
        }
        
        .signature-label {
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 40px;
            font-size: 16px;
        }
        
        .signature-line {
            border-top: 2px solid #0f172a;
            width: 200px;
            margin: 0 auto;
        }
        
        .print-button {
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: #10b981;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
        }
        
        .print-button:hover {
            background: #059669;
        }
        
        .close-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
        }
        
        .close-button:hover {
            background: #dc2626;
        }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">🖨️ طباعة التقرير</button>
    <button class="close-button no-print" onclick="window.close()">✖️ إغلاق</button>

    <div class="header">
        <h2>سلطنة عُمان</h2>
        <h2>وزارة التربية والتعليم</h2>
        <h1>تقرير زيارة إشرافية</h1>
    </div>
    
    <div class="info-section">
        <div class="info-row">
            <span class="info-label">اسم المعلم:</span>
            <span class="info-value">${visit.teacher}</span>
        </div>
        <div class="info-row">
            <span class="info-label">التاريخ:</span>
            <span class="info-value">${new Date(visit.date).toLocaleDateString('ar-SA', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</span>
        </div>
        <div class="info-row">
            <span class="info-label">الوقت:</span>
            <span class="info-value">${new Date(visit.date).toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'})}</span>
        </div>
        ${visit.class ? `<div class="info-row">
            <span class="info-label">الفصل:</span>
            <span class="info-value">${visit.class}</span>
        </div>` : ''}
        ${visit.subject ? `<div class="info-row">
            <span class="info-label">المادة:</span>
            <span class="info-value">${visit.subject}</span>
        </div>` : ''}
    </div>
    
    <div class="greeting">
        أتوجه بالشكر والتقدير للأستاذ/ة <strong>${visit.teacher}</strong> على الجهود المبذولة في تقديم هذه الحصة، وعلى حرصه/ها المستمر على تطوير العملية التعليمية وتحقيق أفضل النتائج للطلبة. وفيما يلي أبرز الملاحظات من الزيارة الصفية:
    </div>
    
    ${excellencePoints.length > 0 ? `
    <div class="section excellence-section">
        <div class="section-title">✨ جوانب الإجادة</div>
        ${excellencePoints.map((point, index) => `
            <div class="point">
                <div class="point-header">
                    <span class="point-criterion">${index + 1}. ${point.criterion}</span>
                    <span class="point-rating">${point.rating}</span>
                </div>
                <div class="point-description">
                    ${point.description}
                </div>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${improvementPoints.length > 0 ? `
    <div class="section improvement-section">
        <div class="section-title">📈 أولويات التطوير</div>
        ${improvementPoints.map((point, index) => `
            <div class="point">
                <div class="point-header">
                    <span class="point-criterion">${index + 1}. ${point.criterion}</span>
                    <span class="point-rating">${point.rating}</span>
                </div>
                <div class="point-description">
                    ${point.description}
                </div>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${improvementPoints.length > 0 ? `
    <div class="section recommendations-section">
        <div class="section-title">💡 التوصيات والمقترحات</div>
        ${improvementPoints.map((point, index) => `
            <div class="recommendation-item">
                <div class="recommendation-title">${index + 1}. ${point.criterion}</div>
                <div class="recommendation-text">${point.recommendation}</div>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${visit.notes ? `
    <div class="notes-section">
        <div class="notes-title">📝 ملاحظات إضافية من المدير</div>
        <div class="notes-text">${visit.notes}</div>
    </div>
    ` : ''}
    
    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-label">مدير المدرسة</div>
            <div class="signature-line"></div>
        </div>
        <div class="signature-box">
            <div class="signature-label">المعلم/ة</div>
            <div class="signature-line"></div>
        </div>
    </div>
    
    <div class="footer">
        <p>تم إنشاء هذا التقرير بواسطة منصة القائد</p>
        <p>التاريخ: ${new Date().toLocaleDateString('ar-SA')}</p>
    </div>
</body>
</html>
    `;
    
    // فتح التقرير في نافذة جديدة
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportHTML);
    printWindow.document.close();
}

// تحديث renderVisits لإضافة زر التقرير المطبوع
const originalRenderVisits = renderVisits;
renderVisits = function() {
    const list = document.getElementById('visits-list');
    const sortedVisits = [...visits].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedVisits.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:50px; color:#94a3b8;">لا توجد زيارات مسجلة</div>';
        return;
    }
    
    list.innerHTML = sortedVisits.map(v => {
        const dateObj = new Date(v.date);
        const dateStr = dateObj.toLocaleDateString('ar-SA');
        const timeStr = dateObj.toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'});
        
        // عرض التقييمات
        let ratingsHtml = '';
        if (v.criteriaRatings && Object.keys(v.criteriaRatings).length > 0) {
            ratingsHtml = '<div style="margin-top:10px;">';
            Object.entries(v.criteriaRatings).forEach(([criterion, rating]) => {
                ratingsHtml += `<div class="visit-detail"><strong>${criterion}:</strong> ${rating}</div>`;
            });
            ratingsHtml += '</div>';
        }
        
        return `<div class="visit-card">
            <div class="visit-header">
                <div>
                    <h4>${v.teacher}</h4>
                    <div class="visit-meta">
                        <span>📅 ${dateStr}</span>
                        <span>🕐 ${timeStr}</span>
                        ${v.class ? `<span>📚 ${v.class}</span>` : ''}
                    </div>
                </div>
            </div>
            
            ${v.subject ? `<div class="visit-detail"><strong>المادة:</strong> ${v.subject}</div>` : ''}
            ${ratingsHtml}
            ${v.notes ? `<div class="visit-detail"><strong>📝 ملاحظات:</strong> ${v.notes}</div>` : ''}
            
            <div style="margin-top:10px; display:flex; gap:10px;">
                <button onclick="generatePrintedVisitReport(${v.id})" style="flex:1; padding:8px; background:#10b981; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:700;">🖨️ تقرير مطبوع</button>
                <button onclick="deleteVisit(${v.id})" style="flex:1; padding:8px; background:#ef4444; color:white; border:none; border-radius:8px; cursor:pointer;">🗑️ حذف</button>
            </div>
        </div>`;
    }).join('');
};


// Generate Printed Visit Report
function generatePrintedVisitReport(visitId) {
    const visit = visits.find(v => v.id === visitId);
    if (!visit) {
        alert('الزيارة غير موجودة');
        return;
    }
    
    if (!visit.criteriaRatings || Object.keys(visit.criteriaRatings).length === 0) {
        alert('هذه الزيارة لا تحتوي على تقييمات');
        return;
    }
    
    // تصنيف التقييمات
    const evaluations = [];
    Object.entries(visit.criteriaRatings).forEach(([criterion, rating]) => {
        const criterionData = visitCriteria.find(c => 
            c['المعيار / البند'] === criterion && c['الحكم'] === rating
        );
        
        if (criterionData) {
            const ratingNum = parseInt(rating.match(/\((\d+)\)/)[1]);
            evaluations.push({
                criterion: criterion,
                rating: rating,
                ratingNum: ratingNum,
                description: criterionData['الوصف السلوكي لجوانب الإجادة / أولويات التطوير'] || '',
                recommendation: criterionData['التوصيات'] || ''
            });
        }
    });
    
    // ترتيب حسب التقييم
    evaluations.sort((a, b) => a.ratingNum - b.ratingNum);
    
    // أفضل 3 تقييمات (جوانب الإجادة: 1 و 2)
    const excellencePoints = evaluations.filter(e => e.ratingNum <= 2).slice(0, 3);
    
    // أسوأ 3 تقييمات (جوانب التحسين: 3 و 4 و 5)
    const improvementPoints = evaluations.filter(e => e.ratingNum >= 3).slice(0, 3);
    
    // إنشاء HTML للتقرير
    const reportHTML = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير زيارة إشرافية - ${visit.teacher}</title>
    <style>
        @media print {
            @page {
                size: A4;
                margin: 2cm;
            }
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            .no-print {
                display: none !important;
            }
        }
        
        body {
            font-family: 'Tajawal', 'Arial', sans-serif;
            line-height: 1.8;
            color: #333;
            max-width: 21cm;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #0f172a;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #0f172a;
            font-size: 28px;
            margin: 10px 0;
            font-weight: 800;
        }
        
        .header h2 {
            color: #64748b;
            font-size: 18px;
            margin: 5px 0;
            font-weight: 600;
        }
        
        .info-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 25px;
            border-right: 5px solid #0f172a;
        }
        
        .info-row {
            display: flex;
            margin-bottom: 10px;
            font-size: 16px;
        }
        
        .info-label {
            font-weight: 700;
            color: #0f172a;
            min-width: 120px;
        }
        
        .info-value {
            color: #475569;
            flex: 1;
        }
        
        .greeting {
            background: #f0fdf4;
            border-right: 5px solid #10b981;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 25px;
            font-size: 16px;
            line-height: 2;
            color: #166534;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section-title {
            background: #0f172a;
            color: white;
            padding: 12px 20px;
            font-size: 20px;
            font-weight: 700;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .excellence-section .section-title {
            background: #10b981;
        }
        
        .improvement-section .section-title {
            background: #f59e0b;
        }
        
        .recommendations-section .section-title {
            background: #3b82f6;
        }
        
        .point {
            background: #ffffff;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .point-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f1f5f9;
        }
        
        .point-criterion {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
        }
        
        .point-rating {
            font-size: 16px;
            font-weight: 700;
            padding: 5px 15px;
            border-radius: 20px;
        }
        
        .excellence-section .point-rating {
            background: #d1fae5;
            color: #065f46;
        }
        
        .improvement-section .point-rating {
            background: #fef3c7;
            color: #92400e;
        }
        
        .point-description {
            font-size: 15px;
            color: #475569;
            line-height: 1.9;
            margin-bottom: 15px;
            text-align: justify;
        }
        
        .recommendation-item {
            background: #eff6ff;
            border-right: 4px solid #3b82f6;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
        }
        
        .recommendation-title {
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 8px;
            font-size: 16px;
        }
        
        .recommendation-text {
            color: #475569;
            line-height: 1.8;
            font-size: 15px;
        }
        
        .notes-section {
            background: #fefce8;
            border: 2px solid #fde047;
            border-radius: 10px;
            padding: 20px;
            margin-top: 30px;
        }
        
        .notes-title {
            font-weight: 700;
            color: #854d0e;
            margin-bottom: 10px;
            font-size: 18px;
        }
        
        .notes-text {
            color: #713f12;
            line-height: 1.8;
            font-size: 15px;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }
        
        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            padding: 0 50px;
        }
        
        .signature-box {
            text-align: center;
        }
        
        .signature-label {
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 40px;
            font-size: 16px;
        }
        
        .signature-line {
            border-top: 2px solid #0f172a;
            width: 200px;
            margin: 0 auto;
        }
        
        .print-button {
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: #10b981;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
        }
        
        .print-button:hover {
            background: #059669;
        }
        
        .close-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
        }
        
        .close-button:hover {
            background: #dc2626;
        }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">🖨️ طباعة التقرير</button>
    <button class="close-button no-print" onclick="window.close()">✖️ إغلاق</button>

    <div class="header">
        <h2>سلطنة عُمان</h2>
        <h2>وزارة التربية والتعليم</h2>
        <h1>تقرير زيارة إشرافية</h1>
    </div>
    
    <div class="info-section">
        <div class="info-row">
            <span class="info-label">اسم المعلم:</span>
            <span class="info-value">${visit.teacher}</span>
        </div>
        <div class="info-row">
            <span class="info-label">التاريخ:</span>
            <span class="info-value">${new Date(visit.date).toLocaleDateString('ar-SA', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</span>
        </div>
        <div class="info-row">
            <span class="info-label">الوقت:</span>
            <span class="info-value">${new Date(visit.date).toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'})}</span>
        </div>
        ${visit.class ? `<div class="info-row">
            <span class="info-label">الفصل:</span>
            <span class="info-value">${visit.class}</span>
        </div>` : ''}
        ${visit.subject ? `<div class="info-row">
            <span class="info-label">المادة:</span>
            <span class="info-value">${visit.subject}</span>
        </div>` : ''}
    </div>
    
    <div class="greeting">
        أتوجه بالشكر والتقدير للأستاذ/ة <strong>${visit.teacher}</strong> على الجهود المبذولة في تقديم هذه الحصة، وعلى حرصه/ها المستمر على تطوير العملية التعليمية وتحقيق أفضل النتائج للطلبة. وفيما يلي أبرز الملاحظات من الزيارة الصفية:
    </div>
    
    ${excellencePoints.length > 0 ? `
    <div class="section excellence-section">
        <div class="section-title">✨ جوانب الإجادة</div>
        ${excellencePoints.map((point, index) => `
            <div class="point">
                <div class="point-header">
                    <span class="point-criterion">${index + 1}. ${point.criterion}</span>
                    <span class="point-rating">${point.rating}</span>
                </div>
                <div class="point-description">
                    ${point.description}
                </div>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${improvementPoints.length > 0 ? `
    <div class="section improvement-section">
        <div class="section-title">📈 أولويات التطوير</div>
        ${improvementPoints.map((point, index) => `
            <div class="point">
                <div class="point-header">
                    <span class="point-criterion">${index + 1}. ${point.criterion}</span>
                    <span class="point-rating">${point.rating}</span>
                </div>
                <div class="point-description">
                    ${point.description}
                </div>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${improvementPoints.length > 0 ? `
    <div class="section recommendations-section">
        <div class="section-title">💡 التوصيات والمقترحات</div>
        ${improvementPoints.map((point, index) => `
            <div class="recommendation-item">
                <div class="recommendation-title">${index + 1}. ${point.criterion}</div>
                <div class="recommendation-text">${point.recommendation}</div>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${visit.notes ? `
    <div class="notes-section">
        <div class="notes-title">📝 ملاحظات إضافية من المدير</div>
        <div class="notes-text">${visit.notes}</div>
    </div>
    ` : ''}
    
    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-label">مدير المدرسة</div>
            <div class="signature-line"></div>
        </div>
        <div class="signature-box">
            <div class="signature-label">المعلم/ة</div>
            <div class="signature-line"></div>
        </div>
    </div>
    
    <div class="footer">
        <p>تم إنشاء هذا التقرير بواسطة منصة القائد</p>
        <p>التاريخ: ${new Date().toLocaleDateString('ar-SA')}</p>
    </div>
</body>
</html>
    `;
    
    // فتح التقرير في نافذة جديدة
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportHTML);
    printWindow.document.close();
}
