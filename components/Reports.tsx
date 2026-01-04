
import React from 'react';
import { Visit, Teacher } from '../types.ts';

interface Props {
  visits: Visit[];
  teachers: Teacher[];
}

// Fix: Add default export and full component implementation for Reports
const Reports: React.FC<Props> = ({ visits, teachers }) => {
  const ratingDistribution = visits.reduce((acc, v) => {
    Object.values(v.ratings).forEach(r => {
      acc[r] = (acc[r] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const stats = [
    { label: 'إجمالي التقييمات', value: Object.values(ratingDistribution).reduce((a, b) => a + b, 0), color: 'bg-indigo-500' },
    { label: 'متميز', value: ratingDistribution['متميز (1)'] || 0, color: 'bg-emerald-500' },
    { label: 'يحتاج تدخل', value: ratingDistribution['يحتاج إلى تدخل (5)'] || 0, color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-right" dir="rtl">
      <h2 className="text-3xl font-black text-slate-900">التقارير والإحصاء 📋</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
             <div className="text-4xl font-black text-slate-900 mb-2">{s.value}</div>
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
               <span className={`w-2 h-2 rounded-full ${s.color}`}></span>
               {s.label}
             </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-xl font-black mb-8">تحليل الأداء العام</h3>
        <div className="space-y-6">
          {Object.entries(ratingDistribution).map(([rating, count], idx) => {
            const total = Object.values(ratingDistribution).reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-xs font-black text-slate-600 uppercase">
                  <span>{rating}</span>
                  <span>{Math.round(percentage)}%</span>
                </div>
                <div className="h-4 bg-slate-50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
          {Object.keys(ratingDistribution).length === 0 && (
            <div className="py-10 text-center text-slate-300 font-bold italic">
              بانتظار تسجيل أولى الزيارات لعرض البيانات
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
