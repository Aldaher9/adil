/***************************************
 * منصة القائد - script.js
 * نسخة مستقرة ومصححة بالكامل
 ***************************************/

/* ========== المتغيرات العامة ========== */
let data = {};              // جدول الحصص
let phones = {};            // أرقام المعلمين
let tasks = [];             // المهام
let visits = [];            // الزيارات
let visitCriteria = [];     // استمارة الزيارة
let simMode = false;
let simLesson = null;

/* ========== التخزين المحلي ========== */
function saveToLocalStorage() {
    const payload = {
        data,
        phones,
        tasks,
        visits,
        visitCriteria,
        updated: new Date().toISOString()
    };
    localStorage.setItem('schoolData', JSON.stringify(payload));
}

function loadFromLocalStorage() {
    const stored = localStorage.getItem('schoolData');
    if (!stored) return;
    try {
        const parsed = JSON.parse(stored);
        data = parsed.data || {};
        phones = parsed.phones || {};
        tasks = parsed.tasks || [];
        visits = parsed.visits || [];
        visitCriteria = parsed.visitCriteria || [];
    } catch (e) {
        console.error('خطأ في قراءة البيانات المحلية', e);
    }
}

/* ========== التنقل ========== */
function switchTab(viewId, btn) {
    document.querySelectorAll('.container').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

/* ========== استيراد جدول XML ========== */
function handleXML(input) {
    const file = input.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xml')) {
        alert('❌ يرجى اختيار ملف XML صحيح');
        return;
    }

    const reader = new FileReader();
    reader.onload = e => {
        try {
            const parser = new DOMParser();
            const xml = parser.parseFromString(e.target.result, "text/xml");

            if (xml.getElementsByTagName("parsererror").length) {
                throw new Error("ملف XML غير صالح");
            }

            parseScheduleXML(xml);
            saveToLocalStorage();
            updateDashboard();
            renderSchedule();

            alert('✅ تم استيراد الجدول بنجاح');
        } catch (err) {
            alert('❌ خطأ في ملف الجدول: ' + err.message);
        }
    };
    reader.readAsText(file, 'UTF-8');
}

function parseScheduleXML(xml) {
    data = {};
    const lessons = xml.getElementsByTagName("Lesson");

    for (let lesson of lessons) {
        const day = lesson.getAttribute("day");
        if (!data[day]) data[day] = [];

        data[day].push({
            teacher: lesson.getAttribute("teacher"),
            subject: lesson.getAttribute("subject"),
            class: lesson.getAttribute("class"),
            start: lesson.getAttribute("start"),
            end: lesson.getAttribute("end")
        });
    }
}

/* ========== الحصة الحالية ========== */
function getCurrentLesson(lessons) {
    const now = new Date();
    const minutesNow = now.getHours() * 60 + now.getMinutes();

    return lessons.find(l => {
        const [sh, sm] = l.start.split(':').map(Number);
        const [eh, em] = l.end.split(':').map(Number);
        const start = sh * 60 + sm;
        const end = eh * 60 + em;
        return minutesNow >= start && minutesNow <= end;
    });
}

function updateDashboard() {
    document.getElementById('statTeachers').textContent = Object.keys(phones).length;
    document.getElementById('statVisits').textContent = visits.length;
    document.getElementById('statTasks').textContent = tasks.filter(t => !t.done).length;

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayLessons = data[today] || [];

    const lesson = simMode ? simLesson : getCurrentLesson(todayLessons);
    document.getElementById('dashDate').textContent = new Date().toLocaleString('ar-EG');

    if (lesson) {
        document.getElementById('dashPeriod').textContent =
            `${lesson.subject} – ${lesson.teacher} (${lesson.class})`;
    } else {
        document.getElementById('dashPeriod').textContent = 'لا توجد حصة حالياً';
    }
}

/* ========== عرض الحصص ========== */
function renderSchedule() {
    const list = document.getElementById('lessons-list');
    list.innerHTML = '';

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const lessons = data[today] || [];

    if (!lessons.length) {
        list.innerHTML = '<p>لا توجد حصص اليوم</p>';
        return;
    }

    lessons.forEach(l => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <strong>${l.subject}</strong><br>
            ${l.teacher} – ${l.class}<br>
            ⏰ ${l.start} - ${l.end}
        `;
        list.appendChild(div);
    });
}

/* ========== المحاكاة ========== */
function startRandomSimulation() {
    const days = Object.keys(data);
    if (!days.length) {
        alert('⚠️ لا يوجد جدول');
        return;
    }

    const randomDay = days[Math.floor(Math.random() * days.length)];
    const lessons = data[randomDay];
    simLesson = lessons[Math.floor(Math.random() * lessons.length)];
    simMode = true;

    document.getElementById('simBadge').style.display = 'block';
    document.getElementById('dashSimBadge').style.display = 'block';
    document.getElementById('exitSimBtn').style.display = 'inline-block';

    updateDashboard();
    renderSchedule();
}

function exitSimMode() {
    simMode = false;
    simLesson = null;
    document.getElementById('simBadge').style.display = 'none';
    document.getElementById('dashSimBadge').style.display = 'none';
    document.getElementById('exitSimBtn').style.display = 'none';
    updateDashboard();
}

/* ========== المعلمين ========== */
function renderStaff() {
    const list = document.getElementById('staff-list');
    list.innerHTML = '';

    Object.keys(phones).forEach(name => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <strong>${name}</strong><br>
            📞 ${phones[name] || '-'}
        `;
        list.appendChild(div);
    });
}

function filterStaff() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('#staff-list .card').forEach(c => {
        c.style.display = c.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
}

/* ========== المهام ========== */
function addTask() {
    const input = document.getElementById('taskInput');
    if (!input.value.trim()) return;

    tasks.push({ text: input.value, done: false });
    input.value = '';
    saveToLocalStorage();
    renderTasks();
}

function renderTasks() {
    const list = document.getElementById('tasks-list');
    list.innerHTML = '';

    tasks.forEach((t, i) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <input type="checkbox" ${t.done ? 'checked' : ''} 
            onchange="tasks[${i}].done=this.checked;saveToLocalStorage();renderTasks()">
            ${t.text}
        `;
        list.appendChild(div);
    });
}

/* ========== الزيارات ========== */
function openVisitModal() {
    document.getElementById('visitModal').style.display = 'block';
    const sel = document.getElementById('visitTeacher');
    sel.innerHTML = '';
    Object.keys(phones).forEach(t => {
        const o = document.createElement('option');
        o.textContent = t;
        sel.appendChild(o);
    });
}

function closeVisitModal() {
    document.getElementById('visitModal').style.display = 'none';
}

function saveVisit() {
    visits.push({
        teacher: visitTeacher.value,
        date: visitDate.value,
        class: visitClass.value,
        subject: visitSubject.value,
        notes: visitNotes.value
    });
    saveToLocalStorage();
    closeVisitModal();
    renderVisits();
}

function renderVisits() {
    const list = document.getElementById('visits-list');
    list.innerHTML = '';
    visits.forEach(v => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <strong>${v.teacher}</strong><br>
            ${v.subject} – ${v.class}<br>
            🕒 ${v.date}
        `;
        list.appendChild(div);
    });
}

/* ========== بدء التشغيل ========== */
window.addEventListener('load', () => {
    loadFromLocalStorage();
    updateDashboard();
    renderSchedule();
    renderStaff();
    renderTasks();
    renderVisits();
    setInterval(updateDashboard, 60000);
});
