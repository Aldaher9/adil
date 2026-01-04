
import React from 'react';
import { Visit, Teacher } from '../types';

interface Props {
  visits: Visit[];
  teachers: Teacher[];
}

const Reports: React.FC<Props> = ({ visits, teachers }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">التقارير التحليلية</h2>
          <p className="text-slate-500">تحليل بيانات الأداء والزيارات على مستوى المدرسة.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="text-3xl mb-4">📈</div>
          <h3 className="text-xl font-black text-slate-900">ملخص الزيارات</h3>
          <p className="text-sm text-slate-500 mb-6">تقرير مفصل يوضح إحصائيات الزيارات لكل معلم.</p>
          <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors">
            تصدير إلى Excel
          </button>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="text-3xl mb-4">👥</div>
          <h3 className="text-xl font-black text-slate-900">دليل المعلمين</h3>
          <p className="text-sm text-slate-500 mb-6">قائمة بجميع بيانات التواصل والمواد الدراسية.</p>
          <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors">
             تصدير بصيغة PDF
          </button>
        </div>
      </div>

      <div className="bg-emerald-900 text-white p-10 rounded-3xl overflow-hidden relative">
        <div className="relative z-10">
           <h3 className="text-2xl font-black mb-2">تقارير ذكية قريباً 🤖</h3>
           <p className="text-emerald-200 max-w-md">
             سيتم قريباً دمج الذكاء الاصطناعي لتحليل نقاط القوة والضعف تلقائياً وتقديم توصيات مخصصة لكل معلم بناءً على نتائج الزيارات.
           </p>
        </div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-800 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-0 text-9xl opacity-10">🪄</div>
      </div>
    </div>
  );
};

export default Reports;
