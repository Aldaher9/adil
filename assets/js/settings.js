
import { parseXML, getCurrentLesson, randomLesson } from "./utils.js";

xmlUpload.onchange=async e=>{
 const text=await e.target.files[0].text();
 const lessons=parseXML(text);
 localStorage.setItem("timetable",JSON.stringify(lessons));
 alert("تم استيراد الجدول");
};

downloadTeachers.onclick=()=>{
 const lessons=JSON.parse(localStorage.getItem("timetable")||"[]");
 if(!lessons.length){alert("ارفع الجدول أولاً");return;}
 const names=[...new Set(lessons.map(l=>l.teacher))];
 let csv="اسم_المعلم,رقم_الهاتف\n";
 names.forEach(n=>csv+=`${n},\n`);
 const blob=new Blob([csv],{type:"text/csv"});
 const a=document.createElement("a");
 a.href=URL.createObjectURL(blob);
 a.download="teachers.csv";
 a.click();
};

teachersUpload.onchange=async e=>{
 const text=await e.target.files[0].text();
 const lines=text.split("\n").slice(1);
 const obj={};
 lines.forEach(l=>{
 const [n,p]=l.split(",");
 if(n&&p) obj[n.trim()]=p.trim();
 });
 localStorage.setItem("teachers",JSON.stringify(obj));
 alert("تم حفظ أرقام المعلمين");
};

simulateNow.onclick=()=>{
 const lessons=JSON.parse(localStorage.getItem("timetable")||"[]");
 const l=getCurrentLesson(lessons);
 alert(l?`الحصة الحالية: ${l.class} - ${l.subject}`:"لا توجد حصة");
};

simulateRandom.onclick=()=>{
 const lessons=JSON.parse(localStorage.getItem("timetable")||"[]");
 const l=randomLesson(lessons);
 alert(`حصة عشوائية: ${l.class} - ${l.subject}`);
};
