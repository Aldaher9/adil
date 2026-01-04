
import React, { useState, useEffect } from 'react';
import { SchoolData, Teacher, Period, Lesson, VisitReport } from '../types';
import { MessageCircle, Phone, Clock, FileText, ChevronRight } from 'lucide-react';

interface Props {
  schoolData: SchoolData;
  teacherDetails: Teacher[];
  onStartVisit: (data: Partial<VisitReport>) => void;
}

const CurrentClasses: React.FC<Props> = ({ schoolData, teacherDetails, onStartVisit }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [simulatedTime, setSimulatedTime] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getCurrentPeriod = () => {
    const timeStr = simulatedTime || currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return schoolData.periods.find(p => {
      const [hNow, mNow] = timeStr.split(':').map(Number);
      const [hStart, mStart] = p.startTime.split(':').map(Number);
      const [hEnd, mEnd] = p.endTime.split(':').map(Number);
      const now = hNow * 60 + mNow;
      const start = hStart * 60 + mStart;
      const end = hEnd * 60 + mEnd;
      return now >= start && now <= end;
    });
  };

  const currentPeriod = getCurrentPeriod();
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const currentDay = days[currentTime.getDay()];

  const activeLessons = schoolData.lessons
    .filter(l => l.day === currentDay && l.periodId === currentPeriod?.id)
    .sort((a, b) => {
      // Sort classes from smallest to largest
      const classA = schoolData.classes[a.classId] || '';
      const classB = schoolData.classes[b.classId] || '';
      return classA.localeCompare(classB, 'ar', { numeric: true });
    });

  const handleWhatsApp = (teacherId: string, message: string) => {
    const teacher = teacherDetails.find(t => t.id === teacherId);
    if (teacher?.phone) {
      window.open(`https://wa.me/${teacher.phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      alert("رقم الهاتف غير متاح لهذا المعلم");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">الحصص الجارية الآن</h1>
          <p className="text-slate-500 font-bold flex items-center gap-2">
            <Clock size={16} className="text-indigo-600" />
            {currentDay} - {currentPeriod ? `الحصة ${currentPeriod.id} (${currentPeriod.startTime} - ${currentPeriod.endTime})` : 'لا توجد حصص حالياً'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => {
              const mock = prompt("أدخل وقت المحاكاة (مثال 08:30):", "08:30");
              if (mock) setSimulatedTime(mock);
            }}
            className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-200 transition-colors"
          >
            المحاكاة
          </button>
          {simulatedTime && (
            <button 
              onClick={() => setSimulatedTime(null)}
              className="bg-rose-100 text-rose-700 px-4 py-2 rounded-xl text-sm font-bold"
            >
              إلغاء المحاكاة
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {activeLessons.map((lesson, idx) => {
          const teacherName = schoolData.teachers[lesson.teacherId] || 'غير معروف';
          const className = schoolData.classes[lesson.classId] || '..';
          const subjectName = schoolData.subjects[lesson.subject] || '..';
          const teacher = teacherDetails.find(t => t.id === lesson.teacherId);

          return (
            <div key={idx} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl font-black text-sm shadow-lg shadow-indigo-600/20">
                    الصف {className}
                  </span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleWhatsApp(lesson.teacherId, `السلام عليكم أ/ ${teacherName}، نلاحظ تأخركم عن حصة ${subjectName} بصف ${className} الحصة ${currentPeriod?.id}. نرجو التوجه للفصل.`)}
                      className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                      title="تسجيل تأخير"
                    >
                      <Clock size={20} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <h3 className="text-xl font-black text-slate-800">{teacherName}</h3>
                  <p className="text-indigo-600 font-black text-sm">{subjectName}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleWhatsApp(lesson.teacherId, `السلام عليكم أستاذ ${teacherName}...`)}
                    className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-3 rounded-2xl font-bold hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle size={18} />
                    <span>واتساب</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (teacher?.phone) window.location.href = `tel:${teacher.phone}`;
                    }}
                    className="flex items-center justify-center gap-2 bg-sky-50 text-sky-700 py-3 rounded-2xl font-bold hover:bg-sky-100 transition-colors"
                  >
                    <Phone size={18} />
                    <span>اتصال</span>
                  </button>
                </div>
              </div>

              <button 
                onClick={() => onStartVisit({
                  teacherId: lesson.teacherId,
                  teacherName: teacherName,
                  classId: lesson.classId,
                  periodId: lesson.periodId,
                  subject: subjectName,
                })}
                className="w-full bg-slate-900 text-white py-4 font-black flex items-center justify-center gap-2 group-hover:bg-indigo-600 transition-colors"
              >
                <FileText size={18} />
                <span>بدء زيارة إشرافية</span>
                <ChevronRight size={18} className="mr-2" />
              </button>
            </div>
          );
        })}

        {activeLessons.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
            <Clock size={48} className="mb-4 opacity-20" />
            <p className="text-xl font-bold">لا توجد حصص نشطة في هذا الوقت</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentClasses;
