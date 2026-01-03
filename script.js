// ================= المتغيرات العامة =================
let dbData = {
    schedule: { lessons: [], periods: [], teachers: {}, subjects: {} },
    visits: [],
    teachersList: {}, // { id: {name, phone, notes: []} }
    criteria: [] // يتم استيرادها من JSON
};

let simMode = false;
let simTimeObj = { day: 1, time: "08:00" };

// ================= التهيئة والتشغيل =================
document.addEventListener('DOMContentLoaded', () => {
    // محاولة تحميل البيانات من LocalStorage كنسخة احتياطية
    loadLocalData();
    setInterval(updateClock, 1000); // تحديث الساعة
    setInterval(renderSchedule, 60000); // تحديث الجدول كل دقيقة
    
    // مراقبة Firebase (إذا كان الملف موجوداً)
    if(window.firebaseService) {
        // يمكنك هنا إضافة كود استدعاء البيانات من السحابة
    }
});

function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');
    
    // تفعيل الزر في النافبار
    const btns = document.querySelectorAll('.nav-item');
    if(pageId === 'schedule') btns[0].classList.add('active');
    if(pageId === 'visits') btns[1].classList.add('active');
    if(pageId === 'teachers') btns[2].classList.add('active');

    if(pageId === 'schedule') renderSchedule();
    if(pageId === 'teachers') renderTeachers();
    if(pageId === 'visits') renderVisitsLog();
}

// ================= معالجة الجدول (XML) =================
function handleXML(input) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(e.target.result, "text/xml");
            parseTimetable(xmlDoc);
            saveData();
            alert('تم استيراد الجدول بنجاح ✅');
            renderSchedule();
        } catch(err) {
            alert('خطأ في قراءة ملف XML');
            console.error(err);
        }
    };
    reader.readAsText(input.files[0]);
}

function parseTimetable(xml) {
    // 1. استخراج المعلمين
    const teachers = {};
    Array.from(xml.getElementsByTagName('teacher')).forEach(t => {
        teachers[t.getAttribute('id')] = {
            name: t.getAttribute('name'),
            short: t.getAttribute('short'),
            phone: ''
        };
        // إضافة لقائمة المعلمين الرئيسية
        if(!dbData.teachersList[t.getAttribute('id')]) {
            dbData.teachersList[t.getAttribute('id')] = {
                name: t.getAttribute('name'),
                phone: '',
                notes: []
            };
        }
    });

    // 2. استخراج المواد
    const subjects = {};
    Array.from(xml.getElementsByTagName('subject')).forEach(s => {
        subjects[s.getAttribute('id')] = s.getAttribute('name');
    });

    // 3. استخراج الفصول (Periods)
    const periods = [];
    Array.from(xml.getElementsByTagName('period')).forEach(p => {
        periods.push({
            id: p.getAttribute('period'),
            start: p.getAttribute('starttime'),
            end: p.getAttribute('endtime')
        });
    });

    // 4. استخراج الحصص (Cards) وربطها
    // ملاحظة: في ملف XML المرفق، الربط يكون معقد (Cards -> Lesson -> Teacher/Subject)
    const lessonsMap = {};
    Array.from(xml.getElementsByTagName('lesson')).forEach(l => {
        lessonsMap[l.getAttribute('id')] = {
            subject: subjects[l.getAttribute('subjectid')],
            teacher: teachers[l.getAttribute('teacherid')] ? teachers[l.getAttribute('teacherid')].name : 'غير محدد',
            teacherId: l.getAttribute('teacherid')
        };
    });

    const classesMap = {}; // لأسماء الصفوف
    Array.from(xml.getElementsByTagName('class')).forEach(c => {
        classesMap[c.getAttribute('id')] = c.getAttribute('name');
    });

    const schedule = [];
    Array.from(xml.getElementsByTagName('card')).forEach(c => {
        const lessonInfo = lessonsMap[c.getAttribute('lessonid')];
        if(lessonInfo) {
            schedule.push({
                day: parseInt(c.getAttribute('day')), // 1 = الأحد
                period: c.getAttribute('period'),
                classIds: c.getAttribute('classids').split(','), // قد يكون هناك أكثر من فصل
                className: c.getAttribute('classids').split(',').map(id => classesMap[id]).join('، '),
                teacher: lessonInfo.teacher,
                teacherId: lessonInfo.teacherId,
                subject: lessonInfo.subject
            });
        }
    });

    dbData.schedule = { teachers, periods, lessons: schedule };
}

// ================= عرض الجدول الحي =================
function renderSchedule() {
    const container = document.getElementById('liveClassesContainer');
    const nowInfo = getSimulationTime();
    const currentPeriod = getCurrentPeriod(nowInfo.time);
    const dayIndex = nowInfo.day; // 1-5

    const daysNames = ["", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
    
    document.getElementById('currentPeriodLabel').innerHTML = 
        `اليوم: ${daysNames[dayIndex]} | الساعة: ${nowInfo.time} | ${currentPeriod ? 'الحصة: ' + currentPeriod.id : 'خارج الدوام'}`;

    if(!currentPeriod) {
        container.innerHTML = '<div class="empty-state">لا توجد حصص في هذا الوقت</div>';
        return;
    }

    // فلترة الحصص الحالية
    const currentLessons = dbData.schedule.lessons.filter(l => 
        l.day == dayIndex && l.period == currentPeriod.id
    );

    // ترتيب تصاعدي حسب اسم الصف (يحتاج استخراج الرقم من الاسم)
    currentLessons.sort((a, b) => a.className.localeCompare(b.className, 'ar', { numeric: true }));

    container.innerHTML = currentLessons.map(lesson => {
        const teacherObj = dbData.teachersList[lesson.teacherId] || {};
        const phone = teacherObj.phone || '';
        
        return `
        <div class="class-card">
            <div class="class-info">
                <h3>${lesson.className}</h3>
                <div class="class-meta">
                    👨‍🏫 ${lesson.teacher}<br>
                    📘 ${lesson.subject}
                </div>
            </div>
            <div class="class-actions">
                <button onclick="sendWhatsapp('${phone}', '${lesson.className}', '${currentPeriod.id}')" class="btn-icon btn-whatsapp">💬</button>
                <button onclick="addQuickNote('${lesson.teacherId}', 'تأخر عن الحصة ${currentPeriod.id}')" class="btn-icon btn-alert">⚠️</button>
                <button onclick="openVisitFor('${lesson.teacherId}', '${lesson.teacher}', '${lesson.subject}', '${lesson.className}')" class="btn-icon btn-visit">📝</button>
            </div>
        </div>
        `;
    }).join('');
}

function getCurrentPeriod(timeStr) {
    if(!dbData.schedule.periods) return null;
    const timeToMin = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };
    const currentMin = timeToMin(timeStr);

    return dbData.schedule.periods.find(p => {
        const start = timeToMin(p.start);
        const end = timeToMin(p.end);
        return currentMin >= start && currentMin <= end;
    });
}

// ================= إدارة الزيارات =================
function handleCriteria(input) {
    const reader = new FileReader();
    reader.onload = (e) => {
        dbData.criteria = JSON.parse(e.target.result);
        saveData();
        alert('تم استيراد المعايير ✅');
    };
    reader.readAsText(input.files[0]);
}

function openVisitFor(tId, tName, subj, cls) {
    document.getElementById('vTeacher').value = tName;
    document.getElementById('vTeacher').dataset.id = tId;
    document.getElementById('vSubject').value = subj;
    document.getElementById('vClass').value = cls;
    document.getElementById('vLessonTitle').value = '';
    
    // بناء معايير التقييم
    const container = document.getElementById('criteriaList');
    container.innerHTML = dbData.criteria.map((c, idx) => `
        <div class="criterion-box">
            <div class="criterion-header">${c['المعيار / البند']}</div>
            <div class="criterion-desc">${c['وصف المعيار']}</div>
            <div class="rating-options">
                ${[1, 2, 3, 4, 5].map(val => `
                    <input type="radio" name="crit_${idx}" id="c_${idx}_${val}" value="${val}" class="rating-input">
                    <label for="c_${idx}_${val}" class="rating-label">${getRatingLabel(val)}</label>
                `).join('')}
            </div>
        </div>
    `).join('');

    document.getElementById('visitModal').style.display = 'flex';
}

function getRatingLabel(val) {
    const labels = {1: 'متميز', 2: 'جيد', 3: 'ملائم', 4: 'غير ملائم', 5: 'يحتاج تدخل'};
    return `${val} - ${labels[val]}`;
}

function saveVisit() {
    const teacherName = document.getElementById('vTeacher').value;
    const lessonTitle = document.getElementById('vLessonTitle').value;
    const ratings = [];
    
    // جمع التقييمات
    dbData.criteria.forEach((c, idx) => {
        const selected = document.querySelector(`input[name="crit_${idx}"]:checked`);
        if(selected) {
            ratings.push({
                criterion: c['المعيار / البند'],
                desc: c['وصف المعيار'], // الوصف الأصلي
                rating: parseInt(selected.value),
                // هذه البيانات تأتي من ملف JSON المرفق لكل مستوى تقييم
                // سنفترض هنا أن JSON يحتوي على "الوصف السلوكي" و "التوصيات" لكل مستوى
                // للتسهيل، سنستخدم بيانات افتراضية إذا لم تتوفر المطابقة الدقيقة في الذاكرة
                behaviorDesc: c['الوصف السلوكي لجوانب الإجادة / أولويات التطوير'] || '', 
                recommendation: c['التوصيات'] || ''
            });
        }
    });

    if(ratings.length < dbData.criteria.length) {
        if(!confirm('لم تقم بتقييم جميع البنود، هل تريد المتابعة؟')) return;
    }

    const visitData = {
        id: Date.now(),
        date: new Date().toLocaleDateString('ar-EG'),
        teacher: teacherName,
        subject: document.getElementById('vSubject').value,
        class: document.getElementById('vClass').value,
        title: lessonTitle,
        ratings: ratings,
        notes: document.getElementById('vGeneralNotes').value
    };

    dbData.visits.push(visitData);
    saveData();
    closeModal('visitModal');
    generatePrintableReport(visitData);
    renderVisitsLog();
}

// ================= تقرير الزيارة (المنطق الذكي) =================
function generatePrintableReport(visit) {
    // 1. فرز التقييمات
    // الأفضل: الأقل رقماً (1 هو الأفضل)
    const sorted = [...visit.ratings].sort((a, b) => a.rating - b.rating);
    
    // أفضل 3 (درجة 1 أو 2)
    const strengths = sorted.filter(r => r.rating <= 2).slice(0, 3);
    
    // أسوأ 3 (درجة 3، 4، 5) - نأخذ الأسوأ (الأعلى رقماً) أولاً
    const improvements = [...visit.ratings]
        .filter(r => r.rating >= 3)
        .sort((a, b) => b.rating - a.rating) // تنازلي
        .slice(0, 4); // المطلوب أسوأ 4 تقييمات كما طلبت

    // نافذة الطباعة
    const win = window.open('', '_blank');
    win.document.write(`
        <html dir="rtl">
        <head>
            <title>تقرير زيارة صفية - ${visit.teacher}</title>
            <style>
                body { font-family: 'Tajawal', sans-serif; padding: 20px; max-width: 210mm; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .meta-table td { border: 1px solid #ddd; padding: 8px; }
                .meta-header { background: #f3f4f6; font-weight: bold; }
                .box { border: 1px solid #000; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
                .box-title { background: #000; color: white; display: inline-block; padding: 5px 15px; border-radius: 5px; margin-top: -25px; font-weight: bold; }
                .item { margin-bottom: 8px; border-bottom: 1px dashed #ccc; padding-bottom: 5px; }
                .rating-badge { float: left; font-weight: bold; background: #eee; padding: 2px 8px; border-radius: 4px; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>وزارة التربية والتعليم</h2>
                <h3>تقرير زيارة إشرافية فنية</h3>
            </div>

            <table class="meta-table">
                <tr>
                    <td class="meta-header">المعلم</td><td>${visit.teacher}</td>
                    <td class="meta-header">المادة</td><td>${visit.subject}</td>
                </tr>
                <tr>
                    <td class="meta-header">الصف</td><td>${visit.class}</td>
                    <td class="meta-header">التاريخ</td><td>${visit.date}</td>
                </tr>
                <tr>
                    <td class="meta-header">عنوان الدرس</td><td colspan="3">${visit.title}</td>
                </tr>
            </table>

            <div class="box">
                <div class="box-title">✅ جوانب الإجادة (نقاط القوة)</div>
                <br>
                ${strengths.length ? strengths.map(s => `
                    <div class="item">
                        <strong>${s.criterion}</strong>
                        <span class="rating-badge">${getRatingLabel(s.rating)}</span>
                        <p style="margin:5px 0; color:#555;">${s.behaviorDesc || 'أداء متميز في هذا المعيار'}</p>
                    </div>
                `).join('') : '<p>لا توجد جوانب إجادة بارزة (الكل بحاجة لتحسين) أو لم يتم رصدها.</p>'}
            </div>

            <div class="box" style="border-color: #ef4444;">
                <div class="box-title" style="background: #ef4444;">⚠️ جوانب التحسين (أولويات التطوير)</div>
                <br>
                ${improvements.length ? improvements.map(s => `
                    <div class="item">
                        <strong>${s.criterion}</strong>
                        <span class="rating-badge">${getRatingLabel(s.rating)}</span>
                        <p style="margin:5px 0; color:#555;">${s.behaviorDesc || 'يحتاج إلى تطوير في هذا الجانب'}</p>
                    </div>
                `).join('') : '<p>مبارك! لا توجد جوانب قصور ملحوظة.</p>'}
            </div>

            <div class="box" style="border-color: #2563eb;">
                <div class="box-title" style="background: #2563eb;">💡 التوصيات والمقترحات</div>
                <br>
                <p>أتقدم بخالص الشكر والتقدير للأستاذ/ة <strong>${visit.teacher}</strong> على جهوده المبذولة في الحصة.</p>
                <strong>بناءً على جوانب التحسين أعلاه، يوصى بالآتي:</strong>
                <ul>
                    ${improvements.map(s => `
                        <li>${s.recommendation || ('العمل على تحسين ' + s.criterion)}</li>
                    `).join('')}
                </ul>
                ${visit.notes ? `<p><strong>ملاحظات إضافية:</strong> ${visit.notes}</p>` : ''}
            </div>

            <br><br>
            <div style="display:flex; justify-content:space-between; padding: 0 50px;">
                <div><strong>توقيع المعلم</strong><br>....................</div>
                <div><strong>توقيع مدير المدرسة</strong><br>....................</div>
            </div>

            <div class="no-print" style="margin-top:20px; text-align:center;">
                <button onclick="window.print()" style="padding:10px 20px; font-size:1.2rem; cursor:pointer;">طباعة التقرير 🖨️</button>
            </div>
        </body>
        </html>
    `);
}

// ================= إدارة المعلمين (Excel & Notes) =================
function renderTeachers() {
    const container = document.getElementById('teachersListContainer');
    const search = document.getElementById('searchTeacher').value.toLowerCase();
    
    // تحويل الكائن إلى مصفوفة للفرز والعرض
    const list = Object.values(dbData.teachersList).filter(t => 
        t.name.toLowerCase().includes(search)
    );

    container.innerHTML = list.map(t => `
        <div class="class-card" style="display:block;">
            <div style="display:flex; justify-content:space-between;">
                <h3>${t.name}</h3>
                <a href="tel:${t.phone}">${t.phone || 'لا يوجد هاتف'}</a>
            </div>
            
            <div style="margin:10px 0; background:#f9fafb; padding:10px; border-radius:6px;">
                <strong>آخر الملاحظات:</strong>
                <ul style="margin:5px 20px; font-size:0.85rem; color:red;">
                    ${t.notes && t.notes.length ? t.notes.slice(-3).map(n => `<li>${n.text} (${n.date})</li>`).join('') : 'لا توجد ملاحظات'}
                </ul>
            </div>

            <div class="class-actions" style="margin-top:10px;">
                <button onclick="addQuickNoteByName('${t.name}', 'غياب عن الحصة')" class="btn-small btn-alert">غياب حصة</button>
                <button onclick="addQuickNoteByName('${t.name}', 'تأخر عن الطابور')" class="btn-small btn-alert">تأخر طابور</button>
                <button onclick="sendWhatsapp('${t.phone}', 'دعوة لمكتب المدير', '')" class="btn-small btn-primary">استدعاء</button>
            </div>
        </div>
    `).join('');
}

function addQuickNote(id, text) {
    if(dbData.teachersList[id]) {
        if(!dbData.teachersList[id].notes) dbData.teachersList[id].notes = [];
        dbData.teachersList[id].notes.push({
            text: text,
            date: new Date().toLocaleDateString('ar-EG')
        });
        saveData();
        alert(`تم تسجيل: ${text}`);
    }
}

// نسخة تقبل الاسم للمرونة
function addQuickNoteByName(name, text) {
    const id = Object.keys(dbData.teachersList).find(key => dbData.teachersList[key].name === name);
    if(id) addQuickNote(id, text);
    renderTeachers();
}

function exportTeachersExcel() {
    const data = Object.values(dbData.teachersList).map(t => ({
        "الاسم": t.name,
        "رقم الهاتف": t.phone
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المعلمين");
    XLSX.writeFile(wb, "قائمة_المعلمين.xlsx");
}

function handlePhoneImport(input) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const wb = XLSX.read(e.target.result, {type: 'binary'});
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);
        
        let count = 0;
        json.forEach(row => {
            // البحث عن المعلم بالاسم وتحديث هاتفه
            const name = row['الاسم'] || row['اسم المعلم'];
            const phone = row['رقم الهاتف'] || row['الهاتف'];
            
            if(name && phone) {
                // البحث في القائمة
                for(let id in dbData.teachersList) {
                    if(dbData.teachersList[id].name.trim() === name.trim()) {
                        dbData.teachersList[id].phone = phone;
                        count++;
                    }
                }
            }
        });
        saveData();
        alert(`تم تحديث أرقام ${count} معلم ✅`);
        renderTeachers();
    };
    reader.readAsBinaryString(input.files[0]);
}

// ================= أدوات مساعدة =================
function sendWhatsapp(phone, msg, period) {
    if(!phone) { alert('لا يوجد رقم هاتف للمعلم'); return; }
    const text = `السلام عليكم، بخصوص ${msg} - الحصة ${period}. يرجى التوجه للإدارة.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`);
}

function updateClock() {
    const now = getSimulationTime();
    document.getElementById('clockDisplay').innerText = now.time;
    document.getElementById('simulationBadge').style.display = simMode ? 'inline-block' : 'none';
}

function getSimulationTime() {
    if(simMode) return simTimeObj;
    const d = new Date();
    const daysMap = {0:1, 1:2, 2:3, 3:4, 4:5, 5:6, 6:1}; // افتراض الأحد = 1
    return {
        day: daysMap[d.getDay()],
        time: d.toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'})
    };
}

function toggleSim() {
    simMode = !simMode;
    if(simMode) {
        simTimeObj.day = document.getElementById('simDay').value;
        simTimeObj.time = document.getElementById('simTime').value;
    }
    renderSchedule();
    closeModal('settingsModal');
}

function saveData() {
    localStorage.setItem('schoolData_v2', JSON.stringify(dbData));
    // هنا يمكن إضافة كود الحفظ في Firebase
    if(window.firebaseService) window.firebaseService.saveSchoolData(dbData);
}

function loadLocalData() {
    const saved = localStorage.getItem('schoolData_v2');
    if(saved) dbData = JSON.parse(saved);
}

function renderVisitsLog() {
    const container = document.getElementById('visitsLogContainer');
    container.innerHTML = dbData.visits.slice().reverse().map((v, i) => `
        <div class="class-card">
            <div>
                <strong>${v.teacher}</strong> - ${v.date}<br>
                <small>${v.title}</small>
            </div>
            <div>
                <button onclick="generatePrintableReport(dbData.visits[${dbData.visits.length - 1 - i}])" class="btn-small">🖨️ طباعة</button>
                <button onclick="deleteVisit(${dbData.visits.length - 1 - i})" class="btn-small btn-alert">❌ حذف</button>
            </div>
        </div>
    `).join('');
}

function deleteVisit(index) {
    if(confirm('هل أنت متأكد من الحذف؟')) {
        dbData.visits.splice(index, 1);
        saveData();
        renderVisitsLog();
    }
}

// نوافذ
window.openSettings = () => document.getElementById('settingsModal').style.display = 'flex';
window.startNewVisit = () => alert('يرجى اختيار زيارة من جدول الحصص لبدء التقييم');
window.closeModal = (id) => document.getElementById(id).style.display = 'none';
