
import React from 'react';
import { useParams } from 'react-router-dom';
import { Visit } from '../types.ts';
import { CRITERIA_DATA } from '../constants.tsx';

interface Props {
  visits: Visit[];
}

const VisitReportPrinter: React.FC<Props> = ({ visits }) => {
  const { visitId } = useParams();
  const visit = visits.find(v => v.id === visitId);

  if (!visit) return <div className="p-20 text-center font-black">لم يتم العثور على تقرير الزيارة</div>;

  const ratingMap: Record<string, number> = {
    "متميز (1)": 1,
    "جيد (2)": 2,
    "ملائم (3)": 3,
    "غير ملائم (4)": 4,
    "يحتاج إلى تدخل (5)": 5
  };

  const evaluations = Object.entries(visit.ratings).map(([criterionName, rating]) => {
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

  const sorted = [...evaluations].sort((a, b) => a.score - b.score);
  const best3 = sorted.filter(e => e.score <= 2).slice(0, 3);
  const bottom3 = [...sorted].reverse().filter(e => e.score >= 3).slice(0, 3);

  return (
    <div className="bg-white min-h-screen p-12 max-w-[21cm] mx-auto text-slate-800 shadow-2xl print:shadow-none print:m-0 print:p-8">
      <div className="no-print mb-10 flex justify-center gap-4">
        <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black shadow-xl hover:scale-105 transition-transform">🖨️ طباعة التقرير</button>
        <button onClick={() => window.close()} className="bg-slate-100 text-slate-600 px-8 py-3 rounded-2xl font-black border border-slate-200">إغلاق التبويب</button>
      </div>

      <div className="border-b-8 border-slate-900 pb-8 mb-10 flex justify-between items-center text-right">
        <div className="space-y-1">
          <h2 className="text-xl font-bold">سلطنة عُمان</h2>
          <h2 className="text-lg font-bold">وزارة التربية والتعليم</h2>
          <h2 className="text-sm font-bold text-slate-500">منصة القائد للإدارة المدرسية</h2>
        </div>
        <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center text-white text-5xl font-black shadow-2xl">⚡</div>
      </div>

      <h1 className="text-4xl font-black text-center mb-12 tracking-tight uppercase">تقرير زيارة فنية</h1>

      <div className="grid grid-cols-2 gap-8 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 mb-12">
        <div className="space-y-4">
          <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">اسم المعلم</span> <span className="text-lg font-black">{visit.teacherName}</span></div>
          <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المادة الدراسية</span> <span className="text-lg font-black">{visit.subject}</span></div>
        </div>
        <div className="space-y-4 text-left">
           <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">تاريخ الزيارة</span> <span className="text-lg font-black">{new Date(visit.date).toLocaleDateString('ar-SA')}</span></div>
           <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الصف / الفصل</span> <span className="text-lg font-black">{visit.class}</span></div>
        </div>
      </div>

      <div className="bg-emerald-600 text-white p-8 rounded-[2rem] mb-12 shadow-xl shadow-emerald-600/10 leading-relaxed font-medium text-lg italic">
        "شكراً لجهودكم المخلصة في الميدان التربوي، ونتطلع دائماً للارتقاء بمستوى أبنائنا الطلبة من خلال هذه الممارسات النوعية."
      </div>

      {best3.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xl">✨</div>
             <h3 className="text-2xl font-black text-slate-900">أبرز نقاط القوة (جوانب الإجادة)</h3>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {best3.map((e, i) => (
              <div key={i} className="bg-white border-2 border-emerald-50 rounded-[2rem] p-8 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xl font-black text-emerald-700">{e.name}</h4>
                  <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-black">{e.rating}</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-sm text-justify">{e.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {bottom3.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white text-xl">📈</div>
             <h3 className="text-2xl font-black text-slate-900">فرص التطوير والتحسين</h3>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {bottom3.map((e, i) => (
              <div key={i} className="bg-white border-2 border-amber-50 rounded-[2rem] p-8 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xl font-black text-amber-700">{e.name}</h4>
                  <span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-xs font-black">{e.rating}</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-sm text-justify mb-6">{e.description}</p>
                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                   <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">التوصية المهنية</div>
                   <p className="text-amber-800 text-sm font-bold leading-relaxed">{e.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex justify-between mt-24 pt-12 border-t-2 border-slate-100">
         <div className="text-center w-64">
            <div className="font-black text-slate-900 mb-16 text-xl">يعتمد / مدير المدرسة</div>
            <div className="border-b-2 border-slate-300 w-full mx-auto"></div>
         </div>
         <div className="text-center w-64">
            <div className="font-black text-slate-900 mb-16 text-xl">توقيع المعلم</div>
            <div className="border-b-2 border-slate-300 w-full mx-auto"></div>
         </div>
      </div>
      
      <div className="mt-16 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
        هذا التقرير تم إنشاؤه عبر منصة القائد الذكية • سلطنة عمان
      </div>
    </div>
  );
};

export default VisitReportPrinter;
