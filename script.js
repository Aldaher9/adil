/* ===============================
   أدوات مساعدة
================================ */
function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function getNowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/* ===============================
   تخزين البيانات
================================ */
let timetable = [];

/* ===============================
   استيراد جدول الحصص (Excel / XML)
================================ */
function importTimetable(file) {
  const reader = new FileReader();

  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    timetable = rows.map(r => ({
      day: (r.day || r.Day || r.اليوم || "").trim(),
      className: (r.class || r.Class || r.الصف || "").trim(),
      subject: (r.subject || r.Subject || r.المادة || "").trim(),
      teacher: (r.teacher || r.Teacher || r.المعلم || "").trim(),
      from: r.from || r.From || r.من,
      to: r.to || r.To || r.إلى
    })).filter(r => r.teacher && r.className && r.from && r.to);

    localStorage.setItem("timetable", JSON.stringify(timetable));
    alert("✅ تم استيراد جدول الحصص بنجاح");
    showCurrentLesson();
  };

  reader.readAsArrayBuffer(file);
}

/* ===============================
   تحديد الحصة الحالية (تصحيح جذري)
================================ */
function getCurrentLesson() {
  const nowMinutes = getNowMinutes();
  const today = new Date().toLocaleDateString("ar-EG", { weekday: "long" });

  return timetable.find(l => {
    const start = timeToMinutes(l.from);
    const end = timeToMinutes(l.to);
    return (
      l.day.includes(today) &&
      nowMinutes >= start &&
      nowMinutes <= end
    );
  });
}

/* ===============================
   عرض الحصة الحالية
================================ */
function showCurrentLesson() {
  timetable = JSON.parse(localStorage.getItem("timetable") || "[]");
  const lesson = getCurrentLesson();

  const box = document.getElementById("currentLessonBox");
  if (!box) return;

  if (!lesson) {
    box.innerHTML = "🟢 لا توجد حصة حالية الآن";
    return;
  }

  box.innerHTML = `
    <strong>الصف:</strong> ${lesson.className}<br>
    <strong>المادة:</strong> ${lesson.subject}<br>
    <strong>المعلم:</strong> ${lesson.teacher}<br>
    <strong>الوقت:</strong> ${lesson.from} - ${lesson.to}
  `;
}

/* ===============================
   أحداث الواجهة
================================ */
document.addEventListener("DOMContentLoaded", () => {
  timetable = JSON.parse(localStorage.getItem("timetable") || "[]");
  showCurrentLesson();

  const fileInput = document.getElementById("timetableFile");
  if (fileInput) {
    fileInput.addEventListener("change", e => {
      if (e.target.files.length) {
        importTimetable(e.target.files[0]);
      }
    });
  }
});
