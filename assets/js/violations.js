
const log=document.getElementById("log");
const list=JSON.parse(localStorage.getItem("violations")||"[]");

if(!list.length){
 log.innerText="لا توجد مخالفات مسجلة";
}else{
 log.innerHTML=list.map(v=>`
 <div class="record">
 <b>${v.type}</b><br>
 المعلم: ${v.teacher}<br>
 الصف: ${v.class}<br>
 المادة: ${v.subject}<br>
 الوقت: ${v.time}
 </div>
 `).join("");
}
