
import React from 'react';
import { useParams } from 'react-router-dom';
import { Visit } from '../types';
import { CRITERIA_DATA } from '../constants';

interface Props {
  visits: Visit[];
}

const VisitReportPrinter: React.FC<Props> = ({ visits }) => {
  const { visitId } = useParams();
  const visit = visits.find(v => v.id === visitId);

  if (!visit) return <div>لم يتم العثور على الزيارة</div>;

  // Rating numeric map for sorting
  const ratingMap: Record<string, number> = {
    "متميز (1)": 1,
    "جيد (2)": 2,
    "ملائم (3)": 3,
    "غير ملائم (4)": 4,
    "يحتاج إلى تدخل (5)": 5
  };

  // Process evaluations
  const evaluations = Object.entries(visit.ratings).map(([criterionName, rating]) => {
    // Cast rating to string to fix "Type 'unknown' cannot be used as an index type" error
    // Object.entries can sometimes infer values as unknown depending on TS configuration.
    const r = rating as string;
    const data = CRITERIA_DATA.find(c => c["المعيار / البند"] === criterionName && c["الحكم"] === r);
    return {
      name: criterionName,
      rating: r,
      score: ratingMap[r] || 3,
      description: data?.["الوصف السلوكي لجوانب الإجادة / أولويات التطوير"] || '',
      recommendation: data?.["التوصيات"] || ''
    };
  });

  // Sort by score ascending (Excellence first)
  const sorted = [...evaluations].sort((a, b) => a.score - b.score);

  // Best 3 (Excellence)
  const best3 = sorted.filter(e => e.score <= 2).slice(0, 3);
  // Bottom 3 (Improvement)
  const bottom3 = [...sorted].reverse().filter(e => e.score >= 3).slice(0, 3);

  return (
    <div className="bg-white min-h-screen p-10 max-w-[21cm] mx-auto text-slate-800 shadow-lg print:shadow-none print:m-0">
      <div className="no-print mb-8 flex gap-4">
        <button onClick={() => window.print()} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold">🖨️ طباعة التقرير</button>
        <button onClick={() => window.close()} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-bold">✖️ إغلاق</button>
      </div>

      <div className="border-b-4 border-slate-900 pb-6 mb-8 text-center space-y-2">
        <h2 className="text-xl font-bold">سلطنة عُمان</h2>
        <h2 className="text-xl font-bold">وزارة التربية والتعليم</h2>
        <h1 className="text-3xl font-black mt-4">تقرير زيارة إشرافية</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border-r-8 border-slate-900 mb-8">
        <div className="space-y-2 text-sm font-bold">
          <div><span className="text-slate-400">اسم المعلم:</span> {visit.teacherName}</div>
          <div><span className="text-slate-400">الفصل:</span> {visit.class}</div>
          <div><span className="text-slate-400">المادة:</span> {visit.subject}</div>
        </div>
        <div className="space-y-2 text-sm font-bold text-left">
           <div><span className="text-slate-400">التاريخ:</span> {new Date(visit.date).toLocaleDateString('ar-SA')}</div>
           <div><span className="text-slate-400">الوقت:</span> {new Date(visit.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>

      <div className="bg-emerald-50 text-emerald-800 p-6 rounded-2xl border-r-8 border-emerald-500 mb-8 leading-relaxed">
        أتوجه بالشكر والتقدير للأستاذ/ة <strong>{visit.teacherName}</strong> على الجهود المبذولة في تقديم هذه الحصة، وعلى حرصه/ها المستمر على تطوير العملية التعليمية وتحقيق أفضل النتائج للطلبة.
      </div>

      {best3.length > 0 && (
        <section className="mb-10">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-black text-xl mb-6 shadow-sm">✨ جوانب الإجادة</div>
          <div className="space-y-6">
            {best3.map((e, i) => (
              <div key={i} className="border-2 border-slate-100 rounded-2xl p-6">
                <div className="flex justify-between items-center border-b border-slate-50 pb-3 mb-4">
                  <span className="text-lg font-black">{i + 1}. {e.name}</span>
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black">{e.rating}</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-justify">{e.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {bottom3.length > 0 && (
        <section className="mb-10">
          <div className="bg-amber-500 text-white px-6 py-3 rounded-xl font-black text-xl mb-6 shadow-sm">📈 أولويات التطوير</div>
          <div className="space-y-6">
            {bottom3.map((e, i) => (
              <div key={i} className="border-2 border-slate-100 rounded-2xl p-6">
                <div className="flex justify-between items-center border-b border-slate-50 pb-3 mb-4">
                  <span className="text-lg font-black">{i + 1}. {e.name}</span>
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black">{e.rating}</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-justify">{e.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {bottom3.length > 0 && (
        <section className="mb-10">
          <div className="bg-blue-500 text-white px-6 py-3 rounded-xl font-black text-xl mb-6 shadow-sm">💡 التوصيات والمقترحات</div>
          <div className="space-y-4">
            {bottom3.map((e, i) => (
              <div key={i} className="bg-blue-50 border-r-4 border-blue-400 p-5 rounded-xl">
                 <div className="font-black text-blue-800 mb-2">{e.name}</div>
                 <p className="text-sm text-blue-700 leading-relaxed">{e.recommendation}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex justify-between mt-20 pt-10 border-t-2 border-slate-100">
         <div className="text-center w-48">
            <div className="font-black text-slate-900 mb-12">مدير المدرسة</div>
            <div className="border-t border-slate-900 w-full mx-auto"></div>
         </div>
         <div className="text-center w-48">
            <div className="font-black text-slate-900 mb-12">المعلم / ة</div>
            <div className="border-t border-slate-900 w-full mx-auto"></div>
         </div>
      </div>
      
      <div className="mt-12 text-center text-[10px] text-slate-300">
        منصة القائد • تم الإنشاء بتاريخ {new Date().toLocaleDateString('ar-SA')}
      </div>
    </div>
  );
};

export default VisitReportPrinter;
