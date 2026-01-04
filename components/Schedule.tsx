
import React from 'react';
import { Lesson, Teacher, Period } from '../types';
import { DAYS_AR, SCHOOL_PERIODS } from '../constants';

interface Props {
  lessons: Lesson[];
  teachers: Teacher[];
  currentPeriod: Period | null | undefined;
  simDate: Date;
  isSimulating: boolean;
  setIsSimulating: (v: boolean) => void;
  setSimDate: (d: Date) => void;
}

const Schedule: React.FC<Props> = ({ lessons, teachers, currentPeriod, simDate, isSimulating, setIsSimulating, setSimDate }) => {
  const currentDayAr = DAYS_AR[simDate.getDay()];
  const currentLessons = lessons.filter(l => l.day === currentDayAr && l.periodId === (currentPeriod?.id || ''));

  const handleSimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [h, m] = e.target.value.split(':');
    const newDate = new Date(simDate);
    newDate.setHours(parseInt(h), parseInt(m));
    setSimDate(newDate);
    setIsSimulating(true);
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dayIndex = parseInt(e.target.value);
    const newDate = new Date(simDate);
    // Find the next/prev weekday matching the selection
    const currentDay = newDate.getDay();
    const diff = dayIndex - currentDay;
    newDate.setDate(newDate.getDate() + diff);
    setSimDate(newDate);
    setIsSimulating(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">الجدول المدرسي الحقيقي</h2>
          <p className="text-slate-500">متابعة دقيقة لما يحدث في فصولك الآن.</p>
        </div>
        <div className="flex gap-2">
           <select 
             onChange={handleDayChange}
             className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-sm font-bold shadow-sm"
             value={simDate.getDay()}
           >
             {DAYS_AR.map((day, idx) => (
               <option key={idx} value={idx}>{day}</option>
             ))}
           </select>
           <input 
             type="time" 
             onChange={handleSimChange}
             className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-sm font-bold shadow-sm"
             value={simDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
           />
           {isSimulating && (
             <button 
               onClick={() => { setIsSimulating(false); setSimDate(new Date()); }}
               className="bg-emerald-500 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-sm"
             >
               العودة للوقت الحالي ↩️
             </button>
           )}
        </div>
      </div>

      {!currentPeriod ? (
        <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-slate-200">
           <div className="text-6xl mb-6">☕</div>
           <h3 className="text-2xl font-black text-slate-900">خارج وقت العمل الرسمي</h3>
           <p className="text-slate-500 mt-2 max-w-sm mx-auto">
             لا توجد حصص نشطة حالياً. يمكنك استخدام أدوات المحاكاة أعلاه لتجربة أوقات مختلفة من اليوم.
           </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <h4 className="font-black text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              قائمة فصول الحصة {currentPeriod.id}
            </h4>
            <span className="text-xs font-bold text-slate-400">{currentLessons.length} فصل جاري</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentLessons.map((lesson, idx) => {
              const teacher = teachers.find(t => t.id === lesson.teacherId);
              return (
                <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex flex-col items-center justify-center text-emerald-700">
                      <span className="text-xs font-black leading-none">فصل</span>
                      <span className="text-lg font-black leading-none">{lesson.classId}</span>
                    </div>
                    <div>
                      <div className="font-black text-slate-900">{teacher?.name || 'غير معروف'}</div>
                      <div className="text-xs font-bold text-slate-500">{lesson.subjectId}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                      💬
                    </button>
                    <button className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                      📞
                    </button>
                  </div>
                </div>
              );
            })}

            {currentLessons.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400 font-bold italic">
                لا توجد حصص مسجلة في هذا التوقيت لهذا اليوم.
              </div>
            )}
          </div>
          
          <div className="mt-10">
            <h4 className="font-black text-slate-800 mb-4">الأجندة الزمنية لليوم</h4>
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
              {SCHOOL_PERIODS.map(p => (
                <div key={p.id} className={`min-w-[120px] p-4 rounded-2xl border transition-all ${currentPeriod?.id === p.id ? 'bg-emerald-500 border-emerald-400 text-white scale-105 shadow-lg' : 'bg-white border-slate-200 text-slate-500 opacity-60'}`}>
                  <div className="text-xs font-bold">الحصة</div>
                  <div className="text-xl font-black">{p.id}</div>
                  <div className="text-[10px] mt-1 font-bold">{p.startTime} - {p.endTime}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
