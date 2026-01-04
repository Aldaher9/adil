
import React from 'react';
import { Teacher, Visit, Lesson, Period } from '../types';
import { DAYS_AR } from '../constants';

interface Props {
  teachers: Teacher[];
  visits: Visit[];
  lessons: Lesson[];
  currentPeriod: Period | null | undefined;
  simDate: Date;
}

const Dashboard: React.FC<Props> = ({ teachers, visits, lessons, currentPeriod, simDate }) => {
  const stats = [
    { label: 'إجمالي المعلمين', value: teachers.length, icon: '👥', color: 'bg-blue-50 text-blue-600' },
    { label: 'الزيارات الكلية', value: visits.length, icon: '👁️', color: 'bg-emerald-50 text-emerald-600' },
    { label: 'دروس اليوم', value: lessons.filter(l => l.day === DAYS_AR[simDate.getDay()]).length, icon: '📚', color: 'bg-purple-50 text-purple-600' },
    { label: 'تقارير معلقة', value: 0, icon: '📝', color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">أهلاً بك أيها القائد 🫡</h2>
          <p className="text-slate-500 mt-1">نظرة عامة على حالة مدرستك اليوم.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-400">{DAYS_AR[simDate.getDay()]}</div>
            <div className="text-sm font-extrabold text-slate-800">{simDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div className="h-8 w-px bg-slate-200 mx-1"></div>
          <div className="text-emerald-600 font-extrabold text-sm">
            {currentPeriod ? `الحصة ${currentPeriod.id}` : 'خارج الدوام'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center text-2xl mb-3`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-black text-slate-900">{stat.value}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span>🚀</span> الزيارات الأخيرة
          </h3>
          <div className="space-y-3">
            {visits.length > 0 ? visits.slice(-5).reverse().map(v => (
              <div key={v.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-lg border border-slate-200">👤</div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{v.teacherName}</div>
                    <div className="text-xs text-slate-500">{v.class} • {v.subject}</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-400">{new Date(v.date).toLocaleDateString('ar-SA')}</div>
              </div>
            )) : (
              <div className="text-center py-10 text-slate-400 font-bold italic">لا توجد زيارات مسجلة مؤخراً</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
           <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span>⏰</span> الحصة النشطة
          </h3>
          {currentPeriod ? (
             <div className="bg-emerald-50 rounded-2xl p-6 text-center border border-emerald-100">
               <div className="text-emerald-500 text-sm font-black mb-1">حصة جارية الآن</div>
               <div className="text-4xl font-black text-emerald-700 mb-4">#{currentPeriod.id}</div>
               <div className="text-sm text-emerald-600 font-bold">
                 {currentPeriod.startTime} - {currentPeriod.endTime}
               </div>
               <div className="mt-4 pt-4 border-t border-emerald-100 text-xs text-emerald-800">
                  عدد الفصول في هذه الحصة: {lessons.filter(l => l.day === DAYS_AR[simDate.getDay()] && l.periodId === currentPeriod.id).length}
               </div>
             </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-10 text-center border border-slate-100">
               <div className="text-4xl mb-4">🌙</div>
               <div className="text-slate-400 font-bold">المدرسة مغلقة حالياً</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
