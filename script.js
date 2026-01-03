function generatePrintedVisitReport(visitId) {
    const visit = visits.find(v => v.id === visitId);
    if (!visit) return;

    const win = window.open('', '_blank');
    const strengths = visit.criteriaRatings.filter(c => c.rating <= 2).slice(0, 3);
    const improvements = visit.criteriaRatings.filter(c => c.rating > 2).slice(0, 3);

    win.document.write(`
        <html dir="rtl">
        <head>
            <title>تقرير زيارة - ${visit.teacher}</title>
            <style>
                body { font-family: 'Tajawal', sans-serif; padding: 40px; line-height: 1.6; }
                .header { text-align: center; border-bottom: 2px solid #0f172a; margin-bottom: 30px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 20px; border-radius: 10px; }
                .section-title { color: #1e3a5f; border-right: 5px solid #f59e0b; padding-right: 10px; margin-top: 30px; font-weight: bold; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>وزارة التربية والتعليم</h2>
                <h3>تقرير أداء المعلم الإشرافي</h3>
            </div>
            <div class="info-grid">
                <div><strong>المعلم:</strong> ${visit.teacher}</div>
                <div><strong>التاريخ:</strong> ${new Date(visit.date).toLocaleDateString('ar-SA')}</div>
                <div><strong>المادة:</strong> ${visit.subject}</div>
                <div><strong>الفصل:</strong> ${visit.class}</div>
            </div>
            <h4 class="section-title">✅ أبرز جوانب الإجادة</h4>
            ${strengths.map(s => `<p>• ${s.criterion}: ${s.description}</p>`).join('')}
            <h4 class="section-title">⚠️ توصيات التطوير</h4>
            ${improvements.map(i => `<p>• ${i.criterion}: ${i.recommendation}</p>`).join('')}
            <div style="margin-top: 100px; display: flex; justify-content: space-between;">
                <p>توقيع المعلم: .................</p>
                <p>توقيع مدير المدرسة: .................</p>
            </div>
            <button class="no-print" onclick="window.print()" style="margin-top:20px; padding:10px 20px; background:#0f172a; color:white; border-radius:5px; cursor:pointer;">طباعة التقرير</button>
        </body>
        </html>
    `);
}
