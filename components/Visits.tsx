
import React, { useState } from 'react';
import { Visit, Teacher } from '../types.ts';
import { CRITERIA_DATA } from '../constants.tsx';
import { Link } from 'react-router-dom';

interface Props {
  visits: Visit[];
  setVisits: React.Dispatch<React.SetStateAction<Visit[]>>;
  teachers: Teacher[];
}

// Fix: Add default export and full component implementation for Visits
const Visits: React.FC<Props> = ({ visits, setVisits, teachers }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [visitClass, setVisitClass] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [ratings, setRatings] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const teacher = teachers.find(t => t.id === selectedTeacherId);
    if (!teacher || !visitClass) return;

    const newVisit: Visit = {
      id: Date.now().toString(),
      teacherId: teacher.id,
      teacherName: teacher.name,
      date: visitDate,
      class: visitClass,
      subject: teacher.subject || 'عام',
      ratings: ratings,
      notes: ''
    };

    setVisits([...visits, newVisit]);
    setShowAdd(false);
    setRatings({});
    setSelectedTeacherId('');
  };

  const updateRating = (criterion: string, rating: string) => {
    setRatings(prev => ({ ...prev, [criterion]: rating }));
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-900">الزيارات الإشرافية 👁️</h2>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
        >
          {showAdd ? 'إلغاء' : 'تسجيل زيارة جديدة +'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl animate-in zoom-in-95 duration-300">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-400 uppercase mr-2">المعلم</label>
                <select 
                  value={selectedTeacherId} 
                  onChange={e => setSelectedTeacherId(e.target.value)}
                  className="p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm"
                >
                  <option value="">اختر معلماً...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-400 uppercase mr-2">الصف</label>
                <input 
                  value={visitClass} 
                  onChange={e => setVisitClass(e.target.value)}
                  placeholder="مثال: 10/1"
                  className="p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm text-right"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-400 uppercase mr-2">التاريخ</label>
                <input 
                  type="date"
                  value={visitDate} 
                  onChange={e => setVisitDate(e.target.value)}
                  className="p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm text-right"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-800">معايير التقييم</h3>
              <div className="grid grid-cols-1 gap-4">
                {CRITERIA_DATA.map((criterion, idx) => (
                  <div key={idx} className="p-6 bg-slate-50 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-black text-slate-900">{criterion["المعيار / البند"]}</div>
                      <div className="text-xs text-slate-400 font-medium">{criterion["وصف المعيار"]}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {["متميز (1)", "جيد (2)", "ملائم (3)", "غير ملائم (4)", "يحتاج إلى تدخل (5)"].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => updateRating(criterion["المعيار / البند"], r)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${ratings[criterion["المعيار / البند"]] === r ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-slate-400 hover:bg-slate-100'}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg shadow-2xl hover:bg-emerald-600 transition-all">
              حفظ الزيارة وإصدار التقرير 💾
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-6 text-xs font-black text-slate-400 uppercase">المعلم</th>
              <th className="p-6 text-xs font-black text-slate-400 uppercase text-center">المادة</th>
              <th className="p-6 text-xs font-black text-slate-400 uppercase text-center">التاريخ</th>
              <th className="p-6 text-xs font-black text-slate-400 uppercase text-center">التقرير</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {visits.map(v => (
              <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-6">
                  <div className="font-black text-slate-900">{v.teacherName}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">{v.class}</div>
                </td>
                <td className="p-6 text-center font-bold text-slate-600 text-sm">{v.subject}</td>
                <td className="p-6 text-center font-bold text-slate-600 text-sm">{new Date(v.date).toLocaleDateString('ar-SA')}</td>
                <td className="p-6 text-center">
                  <Link 
                    to={`/print-visit/${v.id}`} 
                    target="_blank"
                    className="inline-flex items-center justify-center w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  >
                    📄
                  </Link>
                </td>
              </tr>
            ))}
            {visits.length === 0 && (
              <tr>
                <td colSpan={4} className="p-20 text-center text-slate-300 font-black italic">لا توجد زيارات مسجلة حتى الآن</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Visits;
