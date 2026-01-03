// المتغيرات العامة
let data = { teachers: {}, lessons: [], periods: [] };
let visits = [];
let isSim = false;
let sTime = "08:00";

// 1. عند تشغيل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    startLiveSystem();
});

// 2. نظام التحديث الحي (حل مشكلة الجدول)
function startLiveSystem() {
    refreshTable();
    setInterval(refreshTable, 30000); // تحديث تلقائي كل 30 ثانية
}

function refreshTable() {
    const now = new Date();
    let currentTime = isSim ? sTime : now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    
    document.getElementById('liveClock').innerText = (isSim ? "🕒 محاكاة: " : "⏰ ") + currentTime;
    renderCurrentLessons(currentTime);
}

// 3. عرض الحصص الحالية (المشكلة الثانية)
function renderCurrentLessons(time) {
    const container = document.getElementById('currentLessonsTable');
    // منطق فلترة الحصص بناءً على وقت الحصة المستورد من XML
    const currentOnes = data.lessons.filter(l => isTimeInRange(time, l.start, l.end));
    
    if(currentOnes.length === 0) {
        container.innerHTML = "<p class='empty-msg'>لا توجد حصص قائمة حالياً</p>";
        return;
    }

    let html = `<table class="data-table">
        <thead><tr><th>المعلم</th><th>الفصل</th><th>المادة</th><th>إجراء</th></tr></thead><tbody>`;
    
    currentOnes.forEach(l => {
        html += `
            <tr>
                <td><strong>${l.teacher}</strong></td>
                <td><span class="badge">${l.class}</span></td>
                <td>${l.subject}</td>
                <td><button class="btn-visit" onclick="startVisit('${l.teacher}')">📝 زيارة</button></td>
            </tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
}

// 4. تقارير الزيارات القابلة للطباعة (المشكلة الثالثة)
function generatePrintedVisitReport(visitId) {
    const v = visits.find(visit => visit.id === visitId);
    if (!v) return;

    const win = window.open('', '_blank');
    win.document.write(`
        <html dir="rtl">
        <head>
            <title>تقرير زيارة - ${v.teacher}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
                body { font-family: 'Tajawal', sans-serif; padding: 40px; color: #1e293b; }
                .header-rep { text-align: center; border-bottom: 3px solid #1e293b; padding-bottom: 20px; margin-bottom: 30px; }
                .info-box { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f1f5f9; padding: 20px; border-radius: 10px; }
                .section-title { color: #f59e0b; border-right: 5px solid #1e293b; padding-right: 10px; margin: 25px 0 15px; }
                .print-btn { background: #1e293b; color: white; padding: 10px 25px; border-radius: 8px; cursor: pointer; border: none; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header-rep">
                <h2>وزارة التربية والتعليم</h2>
                <h3>تقرير زيارة إشرافية فنية</h3>
            </div>
            <div class="info-box">
                <div><strong>المعلم:</strong> ${v.teacher}</div>
                <div><strong>المادة:</strong> ${v.subject}</div>
                <div><strong>التاريخ:</strong> ${new Date(v.date).toLocaleDateString('ar-SA')}</div>
                <div><strong>الفصل:</strong> ${v.class}</div>
            </div>
            <h4 class="section-title">✅ جوانب الإجادة</h4>
            <p>${v.strengths || 'تم الأداء وفق المعايير المطلوبة.'}</p>
            <h4 class="section-title">⚠️ أولويات التطوير</h4>
            <p>${v.improvements || 'مواصلة التطوير المهني المستمر.'}</p>
            <div style="margin-top: 50px; display: flex; justify-content: space-around;">
                <p>توقيع القائد: .................</p>
                <p>توقيع المعلم: .................</p>
            </div>
            <center><button class="no-print print-btn" onclick="window.print()">طباعة التقرير (PDF)</button></center>
        </body>
        </html>
    `);
}

// 5. تبديل الواجهات (Navigation)
function showView(viewName) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    
    document.getElementById('view-' + viewName).classList.add('active');
    event.currentTarget.classList.add('active');
}

// الدوال المساعدة (دعم الوقت والـ LocalStorage)
function isTimeInRange(now, start, end) {
    return now >= start && now <= end;
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('schoolData');
    if (saved) {
        const parsed = JSON.parse(saved);
        data = parsed.data || data;
        visits = parsed.visits || [];
        updateStats();
    }
}

function updateStats() {
    document.getElementById('countTeachers').innerText = Object.keys(data.teachers).length;
    document.getElementById('countVisits').innerText = visits.length;
}
