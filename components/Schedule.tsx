
import React from 'react';
import { Lesson, Teacher, Period } from '../types.ts';
import { DAYS_AR, DAYS_EN } from '../constants.tsx';

interface Props {
  lessons: Lesson[];
  teachers: Teacher[];
  currentPeriod: Period | null | undefined;
  simDate: Date;
  isSimulating: boolean;
}

const Schedule: React.FC<Props> = ({ lessons, teachers, currentPeriod, simDate }) => {
  const dayIdx = simDate.getDay();
  const dayAr = DAYS_AR[dayIdx];
  const dayEn = DAYS_EN[dayIdx];

  // فلترة الحصص بناءً على اليوم (يدعم التخزين بالعربي أو الإنجليزي) والحصة الحالية
  const currentLessons = lessons.filter(l => 
    (l.day === dayAr || l.day === dayEn) && 
    l.periodId === (currentPeriod?.id || '')
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900">الجدول الزمني 📅</h2>
          <p className="text-slate-500 mt-1 font-medium italic">يوم {dayAr} - {simDate.toLocaleDateString('ar-SA')}</p>
        </div>
      </div>

      {!currentPeriod ? (
        <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-200">
           <div className="text-7xl mb-8">🌙</div>
           <h3 className="text-2xl font-black text-slate-900">خارج وقت الدوام الرسمي</h3>
           <p className="text-slate-500 mt-4 max-w-sm mx-auto font-medium">يمكنك استخدام "وضع المحاكاة" من القائمة الجانبية لتجربة عرض الحصص في وقت آخر.</p>
        </div>
      ) : (
        <div className="space-y-6">
           <div className="bg-emerald-600 text-white p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-center shadow-xl gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center text-4xl font-black shadow-inner">#{currentPeriod.id}</div>
                <div>
                  <div className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">الحصة النشطة حالياً</div>
                  <div className="text-3xl font-black">{currentPeriod.startTime} - {currentPeriod.endTime}</div>
                </div>
              </div>
              <div className="text-center md:text-right bg-white/10 px-6 py-4 rounded-2xl border border-white/20">
                 <div className="text-4xl font-black leading-none">{currentLessons.length}</div>
                 <div className="text-xs font-bold opacity-70 mt-1 uppercase">فصل دراسي نشط</div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {currentLessons.length > 0 ? currentLessons.map((lesson, idx) => {
                const teacher = teachers.find(t => t.id === lesson.teacherId);
                return (
                  <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl font-black group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          {lesson.classId}
                        </div>
                        <div className="flex-1">
                          <div className="font-black text-slate-900 text-lg">{teacher?.name || 'معلم غير مسجل'}</div>
                          <div className="text-xs text-slate-400 font-bold uppercase tracking-wide">{lesson.subjectId}</div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                     </div>
                  </div>
                );
              }) : (
                <div className="col-span-full py-12 text-center text-slate-400 font-bold bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                  لم يتم إضافة حصص لهذا الوقت في الجدول
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
