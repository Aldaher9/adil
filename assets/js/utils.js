
export function parseXML(text){
 const parser=new DOMParser();
 const xml=parser.parseFromString(text,"text/xml");
 const lessons=[];
 xml.querySelectorAll("lesson").forEach(l=>{
 lessons.push({
 day:l.querySelector("day").textContent,
 class:l.querySelector("class").textContent,
 subject:l.querySelector("subject").textContent,
 teacher:l.querySelector("teacher").textContent,
 from:l.querySelector("from").textContent,
 to:l.querySelector("to").textContent
 });
 });
 return lessons;
}

export function getCurrentLesson(lessons){
 const now=new Date();
 const day=now.toLocaleDateString("en-US",{weekday:"long"});
 const time=now.toTimeString().slice(0,5);
 return lessons.find(l=>l.day===day && time>=l.from && time<=l.to);
}

export function randomLesson(lessons){
 return lessons[Math.floor(Math.random()*lessons.length)];
}

export function saveViolation(data){
 const list=JSON.parse(localStorage.getItem("violations")||"[]");
 list.push(data);
 localStorage.setItem("violations",JSON.stringify(list));
}
