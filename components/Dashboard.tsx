
import React from 'react';
import { Teacher, Visit, Lesson, Period } from '../types.ts';
import { DAYS_AR, DAYS_EN } from '../constants.tsx';

interface Props {
  teachers: Teacher[];
  visits: Visit[];
  lessons: Lesson[];
  currentPeriod: Period | null | undefined;
  simDate: Date;
}

const Dashboard: React.FC<Props> = ({ teachers, visits, lessons, currentPeriod, simDate }) => {
  const dayIdx = simDate.getDay();
  const dayAr = DAYS_AR[dayIdx];
  const dayEn = DAYS_EN[dayIdx];
  
  const todayLessons = lessons.filter(l => l.day === dayAr || l.day === dayEn);

  const stats = [
    { label: 'المعلمون', value: teachers.length, icon: '👨‍🏫', color: 'bg-indigo-50 text-indigo-600' },
    { label: 'الزيارات', value: visits.length, icon: '📝', color: 'bg-emerald-50 text-emerald-600' },
    { label: 'حصص اليوم', value: todayLessons.length, icon: '📚', color: 'bg-amber-50 text-amber-600' },
    { label: 'تقارير الأداء', value: visits.length, icon: '📊', color: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 leading-tight tracking-tight">القائد التربوي 🫡</h2>
          <p className="text-slate-500 mt-2 font-medium">مرحباً بك، إليك ملخص الحالة المدرسية ليوم {dayAr}.</p>
        </div>
        
        <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-slate-200 flex items-center gap-2">
          <div className="px-6 py-3 text-right">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{dayAr}</div>
            <div className="text-xl font-black text-slate-800 leading-none">
              {simDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div className="h-10 w-px bg-slate-100 mx-1"></div>
          <div className="px-4">
             <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase transition-all ${currentPeriod ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-400'}`}>
               {currentPeriod ? `الحصة ${currentPeriod.id}` : 'خارج الدوام'}
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div key={i} className={`bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:scale-[1.02]`}>
            <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-xl mb-4 shadow-sm`}>{stat.icon}</div>
            <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <h3 className="text-xl font-black text-slate-800 px-2 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
            أحدث الزيارات الإشرافية
          </h3>
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[200px] flex flex-col p-6">
             {visits.length > 0 ? (
               <div className="w-full space-y-3">
                 {visits.slice(-4).reverse().map(v => (
                   <div key={v.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-sm">👤</div>
                        <div>
                          <div className="font-black text-slate-900 text-sm">{v.teacherName}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{v.subject} - {v.class}</div>
                        </div>
                      </div>
                      <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                        {new Date(v.date).toLocaleDateString('ar-SA')}
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                 <div className="text-6xl mb-4">📄</div>
                 <p className="font-black">لا توجد زيارات مسجلة</p>
               </div>
             )}
          </div>
        </div>
        
        <div>
           <h3 className="text-xl font-black text-slate-800 px-2 mb-6">الحالة الآن</h3>
           {currentPeriod ? (
             <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                <div className="relative z-10">
                  <div className="text-emerald-400 text-[10px] font-black uppercase mb-4 tracking-[0.2em]">الفترة التعليمية النشطة</div>
                  <div className="text-7xl font-black mb-4 flex items-center justify-center gap-2">
                    <span className="text-2xl text-emerald-500">#</span>{currentPeriod.id}
                  </div>
                  <div className="text-xs font-bold opacity-60 tracking-widest">{currentPeriod.startTime} - {currentPeriod.endTime}</div>
                </div>
             </div>
           ) : (
             <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 text-center opacity-50 flex flex-col items-center">
                <div className="text-5xl mb-6 grayscale">☕</div>
                <div className="font-black text-slate-400 uppercase tracking-widest">خارج أوقات العمل</div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
