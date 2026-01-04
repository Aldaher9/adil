
import { getCurrentLesson, saveViolation } from "./utils.js";

const box=document.getElementById("lessonBox");
const absentBtn=document.getElementById("absentBtn");
const lateBtn=document.getElementById("lateBtn");
const visitBtn=document.getElementById("visitBtn");

const lessons=JSON.parse(localStorage.getItem("timetable")||"[]");
const teachers=JSON.parse(localStorage.getItem("teachers")||"{}");

if(lessons.length){
 const lesson=getCurrentLesson(lessons);
 if(lesson){
 box.innerHTML=`
 <b>الصف:</b> ${lesson.class}<br>
 <b>المادة:</b> ${lesson.subject}<br>
 <b>المعلم:</b> ${lesson.teacher}<br>
 <b>الوقت:</b> ${lesson.from} - ${lesson.to}
 `;
 absentBtn.style.display=lateBtn.style.display=visitBtn.style.display="inline";

 absentBtn.onclick=()=>{
 const phone=teachers[lesson.teacher];
 if(!phone){alert("لا يوجد رقم مسجل");return;}
 const msg=`الأستاذ ${lesson.teacher} المحترم،
نأمل إفادتنا حول سبب عدم التواجد في حصة ${lesson.subject}
للصف ${lesson.class}.
مع الشكر.`;
 window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`);
 };

 lateBtn.onclick=()=>{
 saveViolation({
 type:"تأخير حصة",
 teacher:lesson.teacher,
 class:lesson.class,
 subject:lesson.subject,
 time:new Date().toLocaleString()
 });
 alert("تم تسجيل التأخير");
 };

 visitBtn.onclick=()=>{
 localStorage.setItem("currentVisit",JSON.stringify(lesson));
 window.location.href="visit.html";
 };
 }else{
 box.innerText="لا توجد حصة حالية";
 }
}
