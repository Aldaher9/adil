// ==========================================
// 1. المتغيرات العامة والتهيئة
// ==========================================
let currentUser = { uid: 'demo-user', displayName: 'مدير المدرسة', email: 'principal@school.com' };
let data = { teachers: {}, classes: {}, subjects: {}, lessons: [], periods: [] };
let phones = {};
let tasks = [];
let visits = [];
let visitCriteria = []; 
let isSim = false, sDay = 1, sTime = "08:00";
let visitsChart = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('تحميل النظام...');
    loadFromLocalStorage();
    
    // التحقق من المكتبات
    if (typeof html2pdf === 'undefined') {
        console.warn('مكتبة PDF لم يتم تحميلها. تأكد من الاتصال بالإنترنت.');
    }

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
        if(document.getElementById('statTeachers')) updateDashboard(); 
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
// 3. استيراد الملفات
// ==========================================

function handleXML(input) {
    const reader = new FileReader();
    reader.readAsText(input.files[0], "windows-1256");
    reader.onload = (e) => {
        try {
            const parser = new DOMParser();
            const xml = parser.parseFromString(e.target.result, "text/xml");
            const newData = { teachers: {}, classes: {}, subjects: {}, lessons: [], periods: [] };
            
            Array.from(xml.getElementsByTagName('teacher')).forEach(t => newData.teachers[t.getAttribute('id')] = t.getAttribute('name'));
            Array.from(xml.getElementsByTagName('class')).forEach(c => newData.classes[c.getAttribute('id')] = c.getAttribute('short'));
            Array.from(xml.getElementsByTagName('subject')).forEach(s => newData.subjects[s.getAttribute('id')] = s.getAttribute('name'));
            Array.from(xml.getElementsByTagName('period')).forEach(p => newData.periods.push({id: p.getAttribute('period'), s: p.getAttribute('starttime'), e: p.getAttribute('endtime')}));
            
            newData.lessons = Array.from(xml.getElementsByTagName('TimeTableSchedule')).map(l => ({
                d: l.getAttribute('DayID'), p: l.getAttribute('Period'), c: l.getAttribute('ClassID'), t: l.getAttribute('TeacherID'), s: l.getAttribute('SubjectGradeID')
            }));
            
            data = newData;
            saveToLocalStorage();
            alert('تم استيراد الجدول بنجاح ✅');
            refresh();
            closeModal();
        } catch (error) { alert('خطأ في ملف XML'); }
    };
}

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
        } catch (error) { alert('تأكد من ملف Excel'); }
    };
    reader.readAsBinaryString(input.files[0]);
}

function exportToExcel() {
    const teachersList = Array.from(new Set([...Object.values(data.teachers), ...Object.keys(phones)])).sort();
    if (teachersList.length === 0) return alert('لا توجد بيانات للتصدير');
    const ws = XLSX.utils.json_to_sheet(teachersList.map(n => ({ "اسم المعلم": n, "رقم الهاتف": phones[n] || "" })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المعلمين");
    XLSX.writeFile(wb, "بيانات_المعلمين.xlsx");
}

function importVisitCriteria(input) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            visitCriteria = JSON.parse(e.target.result);
            saveToLocalStorage();
            alert('تم استيراد الاستمارة بنجاح ✅\nعدد البنود: ' + visitCriteria.length);
        } catch (error) { alert('ملف JSON غير صالح'); }
    };
    reader.readAsText(input.files[0]);
}

// ==========================================
// 4. المحاكاة والجدول
// ==========================================

function startRandomSimulation() {
    if (!data.lessons || data.lessons.length === 0) return alert('يرجى استيراد الجدول أولاً');
    const randomLesson = data.lessons[Math.floor(Math.random() * data.lessons.length)];
    const periodData = data.periods.find(p => p.id == randomLesson.p);
    sDay = randomLesson.d;
    sTime = periodData ? periodData.s : "08:00";
    isSim = true;
    closeModal();
    refresh();
    updateDashboard();
    switchTab('view-schedule', document.querySelectorAll('.nav-item')[1]);
    const days = ['','الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس'];
    alert(`🎲 وضع المحاكاة: يوم ${days[sDay]} - الحصة ${randomLesson.p}`);
}

function exitSimMode() { isSim = false; refresh(); updateDashboard(); }

function refresh() {
    const now = new Date();
    let d = isSim ? sDay : (now.getDay() === 0 ? 1 : now.getDay() + 1); 
    let t = isSim ? sTime : now.toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit', hour12: false});
    
    document.getElementById('infoDate').innerText = t;
    document.getElementById('simBadge').style.display = isSim ? "block" : "none";
    document.getElementById('exitSimBtn').style.display = isSim ? "block" : "none";
    
    const p = (data.periods || []).find(period => {
        const cur = toMinutes(t), start = toMinutes(period.s), end = toMinutes(period.e);
        return cur >= start && cur <= end;
    });
    
    const list = document.getElementById('lessons-list');
    
    if (p && data.lessons && data.lessons.length > 0) {
        document.getElementById('infoPeriod').innerText = "الحصة النشطة: " + p.id;
        let currentLessons = data.lessons.filter(l => l.d == d && l.p == p.id);
        
        // ترتيب الصفوف تصاعدياً
        currentLessons.sort((a, b) => {
            const classA = data.classes[a.c] || "";
            const classB = data.classes[b.c] || "";
            return classA.localeCompare(classB, 'en', { numeric: true });
        });
        
        list.innerHTML = currentLessons.map(l => {
            const tName = data.teachers[l.t];
            const cName = data.classes[l.c] || '..';
            const ph = (phones[tName] || "").replace(/\s+/g, '');
            const delayMsg = encodeURIComponent(`أ/ ${tName} الموقر، نرجو التكرم بالعلم بأن طلاب صف (${cName}) بانتظاركم في (الحصة ${p.id})، عسى أن يكون المانع خيراً.`);
            
            return `
            <div class="lesson-card">
                <div class="class-badge">${cName}</div>
                <div style="flex:1; padding-right:15px;"><b>${tName}</b><br><small>${data.subjects[l.s] || ''}</small></div>
                <div style="display:flex; gap:5px;">
                    <button onclick="prefillVisit('${tName}', '${cName}', '${data.subjects[l.s] || ''}')" style="background:#fef3c7; color:#d97706; border:none; padding:8px; border-radius:8px; cursor:pointer;">📝 زيارة</button>
                    <button onclick="window.open('https://wa.me/${ph}?text=${delayMsg}')" style="background:#fee2e2; color:#ef4444; border:none; padding:8px; border-radius:8px; cursor:pointer;">⚠️ تأخر</button>
                </div>
            </div>`;
        }).join('');
    } else {
        document.getElementById('infoPeriod').innerText = "خارج وقت الحصص";
        list.innerHTML = `<div style="text-align:center; padding:50px; color:#94a3b8;">لا توجد حصص نشطة حالياً</div>`;
    }
}

function toMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':');
    return parseInt(h) * 60 + parseInt(m);
}

// ==========================================
// 5. إدارة الزيارات والتقارير (Logic Fixes)
// ==========================================

function prefillVisit(teacherName, className, subjectName) {
    openVisitModal();
    document.getElementById('visitTeacher').value = teacherName;
    document.getElementById('visitClass').value = className;
    document.getElementById('visitSubject').value = subjectName;
    document.getElementById('visitNotes').value = ""; // مسح العنوان لبدء جديد
}

function openVisitModal() {
    const modal = document.getElementById('visitModal');
    const teacherSelect = document.getElementById('visitTeacher');
    const teachers = Array.from(new Set([...Object.values(data.teachers), ...Object.keys(phones)])).sort();
    
    teacherSelect.innerHTML = '<option value="">اختر المعلم...</option>' + teachers.map(t => `<option value="${t}">${t}</option>`).join('');
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('visitDate').value = now.toISOString().slice(0, 16);
    buildCriteriaForm();
    modal.style.display = 'block';
}

function buildCriteriaForm() {
    const container = document.getElementById('criteriaContainer');
    if (visitCriteria.length === 0) {
        container.innerHTML = `<p style="color:red; text-align:center;">يجب استيراد استمارة التقييم (JSON)</p>`;
        return;
    }
    
    // تجميع المعايير الفريدة
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
            </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

function saveVisit() {
    const teacher = document.getElementById('visitTeacher').value;
    if (!teacher) return alert('الرجاء اختيار المعلم');
    
    const ratings = [];
    document.querySelectorAll('.criteria-select').forEach(select => {
        ratings.push({ criterion: select.dataset.criterion, value: parseInt(select.value) });
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
    
    visits.unshift(visitData);
    saveToLocalStorage();
    alert('تم حفظ الزيارة ✅');
    closeVisitModal();
    renderVisits();
    
    // محاولة فتح التقرير فوراً
    try {
        generatePrintedVisitReport(visitData.id);
    } catch(e) {
        console.error("Error generating report immediately:", e);
        alert("تم الحفظ، يمكنك فتح التقرير من السجل.");
    }
}

// دالة توليد التقرير المطبوع (Fail-safe Version)
function generatePrintedVisitReport(visitId) {
    try {
        const visit = visits.find(v => v.id === visitId);
        if (!visit) { alert('الزيارة غير موجودة'); return; }

        const evaluations = [];
        visit.ratings.forEach(r => {
            // البحث المرن عن المعيار والحكم
            const criterionData = visitCriteria.find(c => 
                c['المعيار / البند'] === r.criterion && c['الحكم'].includes(`(${r.value})`)
            );
            
            // إذا لم نجد تطابقاً تاماً، نستخدم نصاً افتراضياً لتجنب توقف التقرير
            evaluations.push({
                criterion: r.criterion,
                ratingNum: r.value,
                description: criterionData ? criterionData['الوصف السلوكي لجوانب الإجادة / أولويات التطوير'] : 'أداء وفق المعايير',
                recommendation: criterionData ? criterionData['التوصيات'] : 'متابعة الأداء'
            });
        });

        // 1. جوانب الإجادة: أفضل 3 تقييمات (يجب أن تكون 1 أو 2)
        const sortedBest = [...evaluations].sort((a, b) => a.ratingNum - b.ratingNum);
        const excellencePoints = sortedBest.filter(e => e.ratingNum <= 2).slice(0, 3);

        // 2. جوانب التحسين: أسوأ 4 تقييمات (يجب أن تكون أكبر من 2)
        const sortedWorst = [...evaluations].filter(e => e.ratingNum > 2).sort((a, b) => b.ratingNum - a.ratingNum);
        const improvementPoints = sortedWorst.slice(0, 4);

        const reportHTML = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>تقرير - ${visit.teacher}</title>
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Tajawal', sans-serif; padding: 30px; max-width: 21cm; margin: auto; background: #fff; color: #000; }
                .header { text-align: center; border-bottom: 4px double #0f172a; padding-bottom: 20px; margin-bottom: 20px; }
                .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .info-table td { border: 1px solid #000; padding: 10px; }
                .section-title { background: #f1f5f9; padding: 10px; font-weight: 800; border-right: 6px solid #0f172a; margin-top: 25px; margin-bottom: 10px; font-size: 18px; }
                .ratings-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin-bottom: 20px; font-size: 11px; }
                .rating-box { border: 1px solid #ccc; padding: 5px; text-align: center; }
                .thank-you-box { text-align: center; border: 2px dashed #0f172a; padding: 15px; margin: 30px 0 15px; font-weight: bold; font-size: 16px; background: #fdfdfd; }
                ul, ol { margin-top: 5px; padding-right: 25px; }
                li { margin-bottom: 8px; line-height: 1.6; }
                @media print { .no-print { display: none; } button { display: none; } }
            </style>
        </head>
        <body>
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
                    <td><b>الصف:</b> ${visit.class || '-'}</td>
                    <td><b>المادة:</b> ${visit.subject || '-'}</td>
                </tr>
                <tr>
                    <td colspan="2"><b>عنوان الدرس:</b> ${visit.notes || '-'}</td>
                </tr>
            </table>

            <div class="section-title">📊 ملخص التقييم الرقمي</div>
            <div class="ratings-grid">
                ${evaluations.map(e => `<div class="rating-box">${e.criterion}<br><b>(${e.ratingNum})</b></div>`).join('')}
            </div>

            <div class="section-title" style="border-color: #10b981; background: #ecfdf5;">✅ جوانب الإجادة (أبرز نقاط القوة)</div>
            <ul>
                ${excellencePoints.length > 0 ? excellencePoints.map(s => `
                    <li><b>${s.criterion} (${s.ratingNum}):</b> ${s.description}</li>
                `).join('') : '<li>لا توجد بنود متميزة جداً (الكل 3 فما فوق)</li>'}
            </ul>

            <div class="section-title" style="border-color: #ef4444; background: #fef2f2;">⚠️ أولويات التطوير (جوانب التحسين)</div>
            <ul>
                ${improvementPoints.length > 0 ? improvementPoints.map(s => `
                    <li><b>${s.criterion} (${s.ratingNum}):</b> ${s.description}</li>
                `).join('') : '<li>الأداء متوافق مع المعايير (لا توجد تقييمات منخفضة)</li>'}
            </ul>

            <div class="thank-you-box">
                "نتقدم بالشكر الجزيل للأستاذ/ة ${visit.teacher} على الجهود المبذولة في أداء الحصة، ونضع بين أيديكم التوصيات التالية:"
            </div>

            <div class="section-title" style="border-color: #f59e0b; background: #fffbeb;">💡 التوصيات والمقترحات</div>
            <ol>
                ${improvementPoints.length > 0 ? improvementPoints.map(s => `
                    <li><b>بخصوص ${s.criterion}:</b> ${s.recommendation}</li>
                `).join('') : '<li>الاستمرار في العطاء المتميز ومشاركة الخبرات.</li>'}
            </ol>

            <div style="margin-top: 60px; display: flex; justify-content: space-between; font-weight: bold; padding: 0 40px;">
                <div>توقيع المعلم: ....................</div>
                <div>توقيع مدير المدرسة: ....................</div>
            </div>
            
            <script>window.print();<\/script>
        </body>
        </html>`;

        const win = window.open('', '_blank');
        if (win) {
            win.document.write(reportHTML);
            win.document.close();
        } else {
            alert('يرجى السماح بالنوافذ المنبثقة (Pop-ups) لعرض التقرير');
        }
    } catch(e) {
        console.error(e);
        alert('حدث خطأ أثناء توليد التقرير: ' + e.message);
    }
}

// ==========================================
// 6. صفحة المعلمين والسجل
// ==========================================

function renderStaff() {
    const list = document.getElementById('staff-list');
    const search = document.getElementById('searchInput').value.toLowerCase();
    const allTeachers = Array.from(new Set([...Object.values(data.teachers), ...Object.keys(phones)])).sort();
    const filtered = allTeachers.filter(t => t.toLowerCase().includes(search));
    
    if (filtered.length === 0) { list.innerHTML = '<p style="text-align:center;">لا يوجد معلمين</p>'; return; }

    list.innerHTML = filtered.map((name, i) => {
        const ph = phones[name] || '';
        return `
        <div class="staff-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div><b>${name}</b><br><span style="color:#64748b; font-size:12px;">${ph || 'لا يوجد رقم'}</span></div>
                <div style="display:flex; gap:5px;">
                    <button class="edit-phone-btn" onclick="updatePhone('${name}')">✏️</button>
                </div>
            </div>
            <select class="msg-select" onchange="sendQuickMsg('${name}', this.value); this.selectedIndex=0;">
                <option value="">💬 تواصل سريع...</option>
                <option value="office">🏢 استدعاء للمكتب</option>
                <option value="duty">🛑 استفسار عن المناوبة</option>
                <option value="assembly">📢 استفسار عن الطابور</option>
                <option value="reserve">🔄 حصة احتياط</option>
            </select>
            <div class="grid-2" style="margin-top:10px;">
                <a href="tel:${ph}" class="action-btn" style="background:#3b82f6; text-decoration:none;">📞 اتصال</a>
                <button onclick="window.open('https://wa.me/${ph.replace(/\s/g,'')}')" class="action-btn" style="background:#10b981;">واتساب</button>
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

function updatePhone(name) {
    const newPhone = prompt(`تحديث رقم ${name}:`, phones[name] || "");
    if (newPhone !== null) {
        phones[name] = newPhone;
        saveToLocalStorage();
        renderStaff();
    }
}

function renderVisits() {
    const list = document.getElementById('visits-list');
    const sortedVisits = [...visits].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedVisits.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:50px; color:#94a3b8;">لا توجد زيارات مسجلة</div>';
        return;
    }
    
    list.innerHTML = sortedVisits.map(v => `
        <div class="visit-card">
            <div class="visit-header">
                <div>
                    <h4>${v.teacher}</h4>
                    <div class="visit-meta">
                        <span>📅 ${new Date(v.date).toLocaleDateString('ar-SA')}</span>
                        <span>📚 ${v.class || ''}</span>
                    </div>
                </div>
            </div>
            <div style="margin-top:10px; display:flex; gap:10px;">
                <button onclick="generatePrintedVisitReport(${v.id})" style="flex:1; padding:8px; background:#10b981; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:700;">🖨️ التقرير</button>
                <button onclick="deleteVisit(${v.id})" style="flex:1; padding:8px; background:#ef4444; color:white; border:none; border-radius:8px; cursor:pointer;">🗑️ حذف</button>
            </div>
        </div>
    `).join('');
}

function deleteVisit(id) {
    if (confirm('هل أنت متأكد من حذف هذه الزيارة؟')) {
        visits = visits.filter(v => v.id !== id);
        saveToLocalStorage();
        renderVisits();
        updateDashboard();
    }
}

// ==========================================
// 7. وظائف مساعدة
// ==========================================

function openModal() { document.getElementById('settingsModal').style.display = 'block'; }
function closeModal() { document.getElementById('settingsModal').style.display = 'none'; }
function closeVisitModal() { document.getElementById('visitModal').style.display = 'none'; }

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

setInterval(() => { if(!isSim) { refresh(); updateDashboardTime(); } }, 30000);
