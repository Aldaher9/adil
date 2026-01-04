let schedule=[];

function loadSchedule(){
const file=document.getElementById('fileInput').files[0];
if(!file){alert("اختر ملف الجدول");return;}
const reader=new FileReader();
reader.onload=e=>{
const lines=e.target.result.split('\n');
schedule=lines.map(l=>l.split(','));
renderTable();
}
reader.readAsText(file);
}

function renderTable(){
const table=document.getElementById('scheduleTable');
table.innerHTML='';
schedule.forEach((row,i)=>{
const tr=document.createElement('tr');
row.forEach(c=>{
const td=document.createElement(i==0?'th':'td');
td.innerText=c;
tr.appendChild(td);
});
table.appendChild(tr);
});
}

function simulateNow(){
if(schedule.length<2){alert("لا يوجد جدول");return;}
const r = schedule[Math.floor(Math.random()*(schedule.length-1))+1];
document.getElementById('currentLesson').innerText=
`المعلم: ${r[1]} | المادة: ${r[2]} | الصف: ${r[3]}`;
}
