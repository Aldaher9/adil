// ===== الوقت الحالي =====
function showTime(){
  document.getElementById('currentTime').innerHTML =
    new Date().toLocaleString('ar-EG');
}
showTime();
setInterval(showTime,1000);

// ===== أدوات الوقت =====
function toMinutes(t){
  if(!t) return null;
  const [h,m]=t.split(':').map(Number);
  return h*60+m;
}

// ===== البيانات =====
let timetable=[];

// ===== استيراد الجدول =====
document.getElementById('timetableFile').addEventListener('change',e=>{
  const file=e.target.files[0];
  if(!file) return;

  const reader=new FileReader();
  reader.onload=function(evt){
    const data=new Uint8Array(evt.target.result);
    const wb=XLSX.read(data,{type:'array'});
    const sheet=wb.Sheets[wb.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(sheet);

    timetable=rows.map(r=>({
      day:(r['اليوم']||r['day']||'').trim(),
      className:(r['الصف']||r['class']||'').trim(),
      subject:(r['المادة']||r['subject']||'').trim(),
      teacher:(r['المعلم']||r['teacher']||'').trim(),
      from:(r['من']||r['from']||''),
      to:(r['إلى']||r['to']||'')
    })).filter(l=>l.teacher && l.from && l.to);

    localStorage.setItem('timetable',JSON.stringify(timetable));
    alert('تم استيراد الجدول بنجاح');
    showCurrentLesson();
  };
  reader.readAsArrayBuffer(file);
});

// ===== الحصة الحالية =====
function showCurrentLesson(){
  timetable=JSON.parse(localStorage.getItem('timetable')||'[]');
  const now=new Date();
  const nowMin=now.getHours()*60+now.getMinutes();
  const today=now.toLocaleDateString('ar-EG',{weekday:'long'});

  const lesson=timetable.find(l=>{
    return l.day.includes(today) &&
      nowMin>=toMinutes(l.from) &&
      nowMin<=toMinutes(l.to);
  });

  const box=document.getElementById('currentLessonBox');
  if(!lesson){
    box.innerHTML='🟢 لا توجد حصة حالية الآن';
    return;
  }

  box.innerHTML=`
    <b>الصف:</b> ${lesson.className}<br>
    <b>المادة:</b> ${lesson.subject}<br>
    <b>المعلم:</b> ${lesson.teacher}<br>
    <b>الوقت:</b> ${lesson.from} - ${lesson.to}
  `;
}

showCurrentLesson();
setInterval(showCurrentLesson,60000);
