// ==========================================
// 1. المتغيرات العامة والتهيئة
// ==========================================
let currentUser = { uid: 'demo-user', displayName: 'مدير المدرسة', email: 'principal@school.com' };
let data = { teachers: {}, classes: {}, subjects: {}, lessons: [], periods: [] };
let phones = {};
let tasks = [];
let visits = [];
let visitCriteria = []; // بيانات ملف JSON
let isSim = false, sDay = 1, sTime = "08:00";
let visitsChart = null;

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('تحميل النظام...');
    loadFromLocalStorage();
    
    // التحقق من حالة تسجيل الدخول
    if (localStorage.getItem('skipLogin') === 'true') {
        skipLogin();
    } else {
        document.getElementById('login-screen').style.display = 'flex';
    }
});

// ==========================================
// 2. إدارة البيانات والتخزين
// ==========================================

function saveToLocalStorage() {
    try {
        localStorage.setItem('schoolData', JSON.stringify({
            data, phones, tasks, visits, visitCriteria,
            updated: new Date().toISOString()
        }));
        updateDashboard(); // تحديث الإحصائيات عند أي حفظ
    } catch (e) {
        console.error('خطأ في الحفظ:', e);
        alert('حدث خطأ أثناء حفظ البيانات');
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

// تخطي تسجيل الدخول
function skipLogin() {
    localStorage.setItem('skipLogin', 'true');
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('welcomeMsg').innerText = '👤 مرحباً ' + currentUser.displayName;
    refresh();
    renderStaff();
    renderVisits();
    renderTasks();
    updateDashboard();
}

function handleLogout() {
    if (confirm('هل تريد تسجيل الخروج؟')) {
        localStorage.removeItem('skipLogin');
        location.reload();
    }
}

// ==========================================
// 3. استيراد الملفات (XML, JSON, Excel)
// ==========================================

// استيراد الجدول (XML)
function handleXML(input) {
    const reader = new FileReader();
    reader.readAsText(input.files[0], "windows-1256");
    reader.onload = (e) => {
        try {
            const parser = new DOMParser();
            const xml = parser.parseFromString(e.target.result, "text/xml");
            
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
            alert('تم استيراد الجدول بنجاح ✅');
            refresh();
            closeModal();
        } catch (error) {
            alert('حدث خطأ في قراءة ملف XML');
        }
    };
}

// استيراد بيانات المعلمين (Excel)
function importFromExcel(input) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const wb = XLSX.read(e.target.result, { type: 'binary' });
            const sheet = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            sheet.forEach(row => {
                let name = row["اسم المعلم"] || row["المعلم"];
                let phone = row["رقم الهاتف"] || row["الهاتف"];
                if(name) phones[name] = String(phone || "");
            });
            saveToLocalStorage();
            renderStaff();
            alert('تم تحديث بيانات المعلمين ✅');
        } catch (error) {
            alert('تأكد من صيغة ملف Excel');
        }
    };
    reader.readAsBinaryString(input.files[0]);
}

// تصدير بيانات المعلمين
function exportToExcel() {
    const teachersList = Array.from(new Set([...Object.values(data.teachers), ...Object.keys(phones)])).sort();
    if (teachersList.length === 0) return alert('لا توجد بيانات للتصدير');
    
    const exportData = teachersList.map(name => ({
        "اسم المعلم": name,
        "رقم الهاتف": phones[name] || ""
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المعلمين");
    XLSX.writeFile(wb, "بيانات_المعلمين.xlsx");
}

// استيراد استمارة التقييم (JSON)
function importVisitCriteria(input) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            visitCriteria = JSON.parse(e.target.result);
            saveToLocalStorage();
            alert('تم استيراد بنود التقييم بنجاح ✅\nعدد البنود: ' + visitCriteria.length);
        } catch (error) {
            alert('ملف JSON غير صالح');
        }
    };
    reader.readAsText(input.files[0]);
}

// ==========================================
// 4. المحاكاة والجدول الزمني
// ==========================================

function startRandomSimulation() {
    if (!data.lessons || data.lessons.length === 0) return alert('يرجى استيراد الجدول أولاً');
    
    // اختيار حصة عشوائية فعلية من الجدول
    const randomLesson = data.lessons[Math.floor(Math.random() * data.lessons.length)];
    const periodData = data.periods.find(p => p.id == randomLesson.p);
    
    sDay = randomLesson.d;
    sTime = periodData ? periodData.s : "08:00";
    isSim = true;
    
    closeModal();
    refresh();
    updateDashboard();
    
    // الانتقال لصفحة الجدول
    switchTab('view-schedule', document.querySelectorAll('.nav-item')[1]);
    
    const days = ['','الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس'];
    alert(`🎲 وضع المحاكاة: يوم ${days[sDay]} - الحصة ${randomLesson.p}`);
}

function exitSimMode() {
    isSim = false;
    refresh();
    updateDashboard();
}

function refresh() {
    const now = new Date();
    // تحويل الأيام (الأحد=0 في JS لكن 1 في XML عادة)
    let d = isSim ? sDay : (now.getDay() === 0 ? 1 : now.getDay() + 1); 
    // تنسيق الوقت HH:MM
    let t = isSim ? sTime : now.toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit', hour12: false});
    
    // تحديث الواجهة
    document.getElementById('infoDate').innerText = t;
    document.getElementById('simBadge').style.display = isSim ? "block" : "none";
    document.getElementById('exitSimBtn').style.display = isSim ? "block" : "none";
    
    // البحث عن الحصة الحالية
    const p = (data.periods || []).find(period => {
        const cur = toMinutes(t);
        const start = toMinutes(period.s);
        const end = toMinutes(period.e);
        return cur >= start && cur <= end;
    });
    
    const list = document.getElementById('lessons-list');
    
    if (p && data.lessons && data.lessons.length > 0) {
        document.getElementById('infoPeriod').innerText = "الحصة النشطة: " + p.id;
        
        // فلترة الحصص لهذا الوقت
        let currentLessons = data.lessons.filter(l => l.d == d && l.p == p.id);
        
        // **الترتيب التصاعدي للصفوف (1/1 قبل 1/2)**
        currentLessons.sort((a, b) => {
            const classA = data.classes[a.c] || "";
            const classB = data.classes[b.c] || "";
            return classA.localeCompare(classB, 'en', { numeric: true });
        });
        
        list.innerHTML = currentLessons.map(l => {
            const tName = data.teachers[l.t];
            const cName = data.classes[l.c] || '..';
            const ph = (phones[tName] || "").replace(/\s+/g, '');
            
            // رسالة التأخر الذكية
            const delayMsg = encodeURIComponent(`أ/ ${tName} الموقر، نرجو التكرم بالعلم بأن طلاب صف (${cName}) بانتظاركم في (الحصة ${p.id})، عسى أن يكون المانع خيراً.`);
            
            return `
            <div class="lesson-card">
                <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                    <div style="display:flex; align-items:center;">
                        <div class="class-badge">${cName}</div>
                        <div style="margin-right:10px;">
                            <b>${tName}</b><br>
                            <small style="color:#64748b;">${data.subjects[l.s] || ''}</small>
                        </div>
                    </div>
                    <div style="display:flex; gap:5px;">
                        <button onclick="prefillVisit('${tName}', '${cName}', '${data.subjects[l.s] || ''}')" style="background:#fef3c7; color:#d97706; border:none; padding:5px 10px; border-radius:8px; cursor:pointer;">📝 زيارة</button>
                        <button onclick="window.open('https://wa.me/${ph}?text=${delayMsg}')" style="background:#fee2e2; color:#ef4444; border:none; padding:5px 10px; border-radius:8px; cursor:pointer;">⚠️ تأخر</button>
                    </div>
                </div>
            </div>`;
        }).join('');
    } else {
        document.getElementById('infoPeriod').innerText = "خارج وقت الحصص";
        list.innerHTML = `<div style="text-align:center; padding:50px; color:#94a3b8;">لا توجد حصص نشطة حالياً</div>`;
    }
}

// تحويل الوقت لدقائق للمقارنة
function toMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':');
    return parseInt(h) * 60 + parseInt(m);
}

// ==========================================
// 5. إدارة الزيارات والتقارير
// ==========================================

// فتح نافذة الزيارة (تعبئة تلقائية من الجدول)
function prefillVisit(teacherName, className, subjectName) {
    openVisitModal();
    document.getElementById('visitTeacher').value = teacherName;
    document.getElementById('visitClass').value = className;
    document.getElementById('visitSubject').value = subjectName;
    
    // تصفير العنوان دائماً لبدء جديد
    document.getElementById('visitNotes').value = ""; // هنا نستخدم خانة الملاحظات كعنوان للدرس أو ملاحظات عامة
}

function openVisitModal() {
    const modal = document.getElementById('visitModal');
    const teacherSelect = document.getElementById('visitTeacher');
    
    // تعبئة قائمة المعلمين
    const teachers = Array.from(new Set([...Object.values(data.teachers), ...Object.keys(phones)])).sort();
    teacherSelect.innerHTML = '<option value="">اختر المعلم...</option>' + 
        teachers.map(t => `<option value="${t}">${t}</option>`).join('');
    
    // تعيين الوقت الحالي
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('visitDate').value = now.toISOString().slice(0, 16);
    
    // بناء المعايير
    buildCriteriaForm();
    
    modal.style.display = 'block';
}

function buildCriteriaForm() {
    const container = document.getElementById('criteriaContainer');
    
    if (visitCriteria.length === 0) {
        container.innerHTML = `<p style="color:red; text-align:center;">يجب استيراد استمارة التقييم (JSON) من الإعدادات أولاً</p>`;
        return;
    }
    
    // تجميع المعايير (إزالة التكرار)
    const uniqueCriteria = [];
    const seen = new Set();
    
    visitCriteria.forEach(item => {
        if (!seen.has(item['المعيار / البند'])) {
            seen.add(item['المعيار / البند']);
            uniqueCriteria.push(item);
        }
    });
    
    let html = '<div style="margin:15px 0;"><h4>📊 بنود التقييم:</h4>';
    
    uniqueCriteria.forEach((item, idx) => {
        html += `
            <div class="form-group" style="margin-bottom:10px; border-bottom:1px dashed #eee; padding-bottom:10px;">
                <label style="font-size:14px;">${item['المعيار / البند']}</label>
                <select class="form-control criteria-select" data-criterion="${item['المعيار / البند']}" id="crit_${idx}">
                    <option value="1">1 - متميز</option>
                    <option value="2" selected>2 - جيد (افتراضي)</option>
                    <option value="3">3 - ملائم</option>
                    <option value="4">4 - غير ملائم</option>
                    <option value="5">5 - يحتاج تدخل</option>
                </select>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function saveVisit() {
    const teacher = document.getElementById('visitTeacher').value;
    if (!teacher) return alert('الرجاء اختيار المعلم');
    
    // جمع التقييمات
    const ratings = [];
    document.querySelectorAll('.criteria-select').forEach(select => {
        ratings.push({
            criterion: select.dataset.criterion,
            value: parseInt(select.value)
        });
    });
    
    const visitData = {
        id: Date.now(),
        teacher: teacher,
        date: document.getElementById('visitDate').value,
        class: document.getElementById('visitClass').value,
        subject: document.getElementById('visitSubject').value,
        notes: document.getElementById('visitNotes').value, // عنوان الدرس
        ratings: ratings
    };
    
    visits.unshift(visitData); // إضافة في البداية
    saveToLocalStorage();
    
    alert('تم حفظ الزيارة ✅');
    closeVisitModal();
    renderVisits(); // تحديث السجل
    
    // فتح التقرير المطبوع مباشرة
    generatePrintedVisitReport(visitData.id);
}

// توليد التقرير المطبوع (حسب القواعد الصارمة)
function generatePrintedVisitReport(visitId) {
    const visit = visits.find(v => v.id === visitId);
    if (!visit) return;
    
    // 1. فرز التقييمات
    // الأفضل (الأقل رقماً 1, 2)
    const sortedBest = [...visit.ratings].sort((a, b) => a.value - b.value);
    // الأسوأ (الأعلى رقماً 3, 4, 5) - شرط أن تكون أكبر من 2
    const sortedWorst = [...visit.ratings].filter(r => r.value > 2).sort((a, b) => b.value - a.value);
    
    // 2. اختيار الجوانب
    const strengths = sortedBest.filter(r => r.value <= 2).slice(0, 3); // أفضل 3
    const improvements = sortedWorst.slice(0, 4); // أسوأ 4 (أكبر من 2)
    
    // دالة مساعدة لجلب النصوص من ملف JSON
    const getText = (criterion, value, type) => {
        // البحث عن البند والحكم المطابق (مثلاً "متميز (1)")
        const found = visitCriteria.find(c => 
            c['المعيار / البند'] === criterion && c['الحكم'].includes(`(${value})`)
        );
        if (found) {
            if (type === 'desc') return found['الوصف السلوكي لجوانب الإجادة / أولويات التطوير'];
            if (type === 'rec') return found['التوصيات'];
        }
        return type === 'desc' ? 'أداء متوافق مع المعايير' : 'الاستمرار في العطاء';
    };

    // 3. بناء HTML للتقرير
    const reportHTML = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>تقرير زيارة - ${visit.teacher}</title>
        <style>
            body { font-family: 'Tajawal', sans-serif; padding: 40px; max-width: 21cm; margin: auto; }
            .header { text-align: center; border-bottom: 3px solid #0f172a; padding-bottom: 20px; margin-bottom: 20px; }
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .info-table td { border: 1px solid #000; padding: 10px; }
            .section-title { background: #f1f5f9; padding: 10px; font-weight: bold; border-right: 5px solid #0f172a; margin-top: 20px; }
            .ratings-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin-bottom: 20px; font-size: 12px; }
            .rating-box { border: 1px solid #ddd; padding: 5px; text-align: center; }
            .thank-you { text-align: center; font-weight: bold; margin: 30px 0 10px; padding: 15px; border: 1px dashed #0f172a; }
            ul { margin-top: 5px; } li { margin-bottom: 5px; }
            @media print { .no-print { display: none; } }
        </style>
    </head>
    <body>
        <button class="no-print" onclick="window.print()" style="padding:10px 20px; background:#0f172a; color:white; border:none; cursor:pointer; margin-bottom:20px;">🖨️ طباعة / PDF</button>
        
        <div class="header">
            <h2>سلطنة عُمان - وزارة التربية والتعليم</h2>
            <h1>تقرير زيارة إشرافية</h1>
        </div>

        <table class="info-table">
            <tr>
                <td><b>المعلم:</b> ${visit.teacher}</td>
                <td><b>التاريخ:</b> ${new Date(visit.date).toLocaleDateString('ar-SA')}</td>
            </tr>
            <tr>
                <td><b>الصف:</b> ${visit.class}</td>
                <td><b>المادة:</b> ${visit.subject}</td>
            </tr>
            <tr>
                <td colspan="2"><b>عنوان الدرس / ملاحظات:</b> ${visit.notes}</td>
            </tr>
        </table>

        <div class="section-title">📊 ملخص التقييم الرقمي</div>
        <div class="ratings-grid">
            ${visit.ratings.map(r => `<div class="rating-box">${r.criterion}<br><b>(${r.value})</b></div>`).join('')}
        </div>

        <div class="section-title" style="border-color: #10b981; background: #ecfdf5;">✅ جوانب الإجادة (أبرز نقاط القوة)</div>
        <ul>
            ${strengths.length > 0 ? strengths.map(s => `
                <li><b>${s.criterion}:</b> ${getText(s.criterion, s.value, 'desc')}</li>
            `).join('') : '<li>لا توجد جوانب إجادة بارزة (الكل 3 فما فوق)</li>'}
        </ul>

        <div class="section-title" style="border-color: #ef4444; background: #fef2f2;">⚠️ أولويات التطوير (جوانب التحسين)</div>
        <ul>
            ${improvements.length > 0 ? improvements.map(s => `
                <li><b>${s.criterion}:</b> ${getText(s.criterion, s.value, 'desc')}</li>
            `).join('') : '<li>لا توجد جوانب تحسين حرجة (جميع التقييمات جيدة)</li>'}
        </ul>

        <div class="thank-you">
            "نتقدم بالشكر الجزيل للأستاذ/ة ${visit.teacher} على الجهود المبذولة في أداء الحصة، ونضع بين أيديكم التوصيات التالية لمزيد من التجويد:"
        </div>

        <div class="section-title" style="border-color: #f59e0b; background: #fffbeb;">💡 التوصيات والمقترحات</div>
        <ol>
            ${improvements.length > 0 ? improvements.map(s => `
                <li><b>بخصوص ${s.criterion}:</b> ${getText(s.criterion, s.value, 'rec')}</li>
            `).join('') : '<li>الاستمرار في العطاء المتميز ومشاركة الخبرات مع الزملاء.</li>'}
        </ol>

        <div style="margin-top: 50px; display: flex; justify-content: space-between; font-weight: bold;">
            <div>توقيع المعلم: ....................</div>
            <div>توقيع مدير المدرسة: ....................</div>
        </div>
    </body>
    </html>`;

    const win = window.open('', '_blank');
    win.document.write(reportHTML);
    win.document.close();
}

// ==========================================
// 6. صفحة المعلمين والسجل
// ==========================================

function renderStaff() {
    const list = document.getElementById('staff-list');
    const search = document.getElementById('searchInput').value.toLowerCase();
    
    // دمج المعلمين من الجدول ومن الهواتف
    const allTeachers = Array.from(new Set([...Object.values(data.teachers), ...Object.keys(phones)])).sort();
    const filtered = allTeachers.filter(t => t.toLowerCase().includes(search));
    
    list.innerHTML = filtered.map(name => {
        const ph = phones[name] || '';
        return `
        <div class="staff-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <b>${name}</b><br>
                    <span style="color:#64748b; font-size:12px;">${ph || 'لا يوجد رقم'}</span>
                </div>
            </div>
            <select class="msg-select" onchange="sendQuickMsg('${name}', this.value); this.selectedIndex=0;">
                <option value="">💬 تواصل سريع...</option>
                <option value="office">🏢 استدعاء للمكتب (راقي)</option>
                <option value="duty">🛑 استفسار عن المناوبة</option>
                <option value="assembly">📢 استفسار عن الطابور</option>
                <option value="reserve">🔄 حصة احتياط</option>
            </select>
            <div style="margin-top:10px; display:flex; gap:10px;">
                <a href="tel:${ph}" class="btn-primary" style="flex:1; text-align:center; text-decoration:none; padding:8px;">📞 اتصال</a>
                <button onclick="window.open('https://wa.me/${ph.replace(/\s/g,'')}')" style="flex:1; background:#10b981; color:white; border:none; border-radius:10px;">واتساب</button>
            </div>
        </div>`;
    }).join('');
}

function sendQuickMsg(name, type) {
    const ph = (phones[name] || "").replace(/\s+/g, '');
    if(!ph) return alert('لا يوجد رقم هاتف');
    
    const msgs = {
        office: `السلام عليكم أستاذ ${name}، نرجو التكرم بالمرور على مكتب الإدارة عند توفر الوقت لديكم. شاكرين تعاونكم.`,
        duty: `أستاذ ${name} المحترم، نذكركم بموعد مناوبتكم اليوم. بوركت جهودكم.`,
        assembly: `أستاذ ${name}، نرجو التواجد في ساحة الطابور لمتابعة الطلاب. شكراً لاهتمامكم.`,
        reserve: `أستاذ ${name}، نرجو التكرم بمتابعة حصة الاحتياط المسندة إليكم. دمتم متميزين.`
    };
    
    window.open(`https://wa.me/${ph}?text=${encodeURIComponent(msgs[type])}`);
}

function renderVisits() {
    const list = document.getElementById('visits-list');
    if(visits.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#888;">لا توجد زيارات محفوظة</p>';
        return;
    }
    
    list.innerHTML = visits.map(v => `
        <div class="visit-card" style="position:relative;">
            <div style="display:flex; justify-content:space-between;">
                <strong>${v.teacher}</strong>
                <span style="font-size:12px; color:#666;">${v.date.split('T')[0]}</span>
            </div>
            <div style="font-size:13px; color:#555; margin:5px 0;">${v.subject || ''} - ${v.class || ''}</div>
            
            <div style="display:flex; gap:10px; margin-top:10px;">
                <button onclick="generatePrintedVisitReport(${v.id})" style="background:#0f172a; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">🖨️ طباعة التقرير</button>
                <button onclick="deleteVisit(${v.id})" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">🗑️</button>
            </div>
        </div>
    `).join('');
}

function deleteVisit(id) {
    if(confirm('حذف هذا السجل؟')) {
        visits = visits.filter(v => v.id !== id);
        saveToLocalStorage();
        renderVisits();
    }
}

// وظائف الأجندة (Dashboard Update)
function updateDashboard() {
    document.getElementById('statTeachers').innerText = Object.keys(data.teachers).length;
    document.getElementById('statClasses').innerText = Object.keys(data.classes).length;
    document.getElementById('statVisits').innerText = visits.length;
    
    // تحديث الرسم البياني
    const ctx = document.getElementById('visitsChart');
    if(ctx && !visitsChart) {
        visitsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
                datasets: [{ label: 'الزيارات', data: [0,0,0,0,0], backgroundColor: '#0f172a' }]
            }
        });
    }
}

// دوال التنقل والقوائم
function switchTab(id, btn) {
    document.querySelectorAll('.container').forEach(d => d.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    if(id === 'view-staff') renderStaff();
    if(id === 'view-visits') {
        renderVisits(); // عرض السجل في الأسفل
        openVisitModal(); // فتح نموذج الزيارة مباشرة عند الضغط
    }
}

function openModal() { document.getElementById('settingsModal').style.display = 'block'; }
function closeModal() { document.getElementById('settingsModal').style.display = 'none'; }
function closeVisitModal() { document.getElementById('visitModal').style.display = 'none'; }

// دوال المهام
function addTask() {
    const val = document.getElementById('taskInput').value;
    if(val) { tasks.push({id:Date.now(), text:val, done:false}); document.getElementById('taskInput').value=''; renderTasks(); saveToLocalStorage(); }
}
function renderTasks() {
    document.getElementById('tasks-list').innerHTML = tasks.map(t => 
        `<div class="task-card ${t.done?'done':''}"><span onclick="toggleTask(${t.id})">${t.text}</span> <button onclick="deleteTask(${t.id})">❌</button></div>`
    ).join('');
}
function toggleTask(id) { const t = tasks.find(x=>x.id==id); if(t) t.done=!t.done; renderTasks(); saveToLocalStorage(); }
function deleteTask(id) { tasks = tasks.filter(x=>x.id!=id); renderTasks(); saveToLocalStorage(); }

</script>
