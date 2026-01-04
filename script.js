
const reportData = {
  teacher: "أحمد بن سالم",
  className: "7/أ",
  subject: "الرياضيات",
  lessonTitle: "المعادلات الخطية",
  evaluations: [
    {
      title: "التخطيط",
      items: [
        { title: "وضوح الأهداف", description: "أهداف واضحة ومناسبة لمستوى الطلبة" },
        { title: "تنظيم المحتوى", description: "تسلسل منطقي للمفاهيم" }
      ]
    },
    {
      title: "تنفيذ الدرس",
      items: [
        { title: "تنويع الاستراتيجيات", description: "استخدام أساليب نشطة" },
        { title: "إدارة الصف", description: "انضباط عالٍ وتفاعل إيجابي" }
      ]
    }
  ],
  strengths: [
    "تمكن علمي واضح من المادة",
    "تفاعل إيجابي مع الطلبة",
    "تنويع استراتيجيات التدريس"
  ],
  improvements: [
    "زيادة استخدام التقويم البنائي",
    "إشراك جميع الطلبة في الأنشطة",
    "توظيف الوسائل التقنية بشكل أوسع"
  ],
  recommendations:
    "نشكر المعلم على أدائه الجيد في تنفيذ الحصة، ونوصي بالاستمرار في تنويع استراتيجيات التدريس مع تعزيز استخدام أساليب التقويم البنائي."
};

function renderVisitReport(data) {

  document.getElementById("lessonInfo").innerHTML = `
    <strong>المعلم:</strong> ${data.teacher}<br>
    <strong>الصف:</strong> ${data.className}<br>
    <strong>المادة:</strong> ${data.subject}<br>
    <strong>عنوان الدرس:</strong> ${data.lessonTitle}
  `;

  const container = document.getElementById("evaluationCards");
  container.innerHTML = "";

  data.evaluations.forEach(domain => {
    const card = document.createElement("div");
    card.className = "report-card";
    card.innerHTML = `
      <h3>${domain.title}</h3>
      <ul>
        ${domain.items.map(i => `<li>${i.title} – ${i.description}</li>`).join("")}
      </ul>
    `;
    container.appendChild(card);
  });

  document.getElementById("strengthsList").innerHTML =
    data.strengths.map(s => `<li>${s}</li>`).join("");

  document.getElementById("improvementsList").innerHTML =
    data.improvements.map(i => `<li>${i}</li>`).join("");

  document.getElementById("recommendationsText").innerText =
    data.recommendations;
}

renderVisitReport(reportData);
