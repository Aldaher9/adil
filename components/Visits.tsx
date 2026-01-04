
import React, { useState } from 'react';
import { Visit, Teacher } from '../types';
import { CRITERIA_DATA } from '../constants';
import { Link } from 'react-router-dom';

interface Props {
  visits: Visit[];
  setVisits: React.Dispatch<React.SetStateAction<Visit[]>>;
  teachers: Teacher[];
}

const Visits: React.FC<Props> = ({ visits, setVisits, teachers }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newVisit, setNewVisit] = useState<Partial<Visit>>({
    teacherId: '',
    class: '',
    subject: '',
    notes: '',
    ratings: {}
  });

  // Group criteria by their standard name
  const criteriaGroups = Array.from(new Set(CRITERIA_DATA.map(c => c["المعيار / البند"])));

  const saveVisit = () => {
    if (!newVisit.teacherId) return;
    const teacher = teachers.find(t => t.id === newVisit.teacherId);
    const visit: Visit = {
      id: Date.now().toString(),
      teacherId: newVisit.teacherId,
      teacherName: teacher?.name || 'غير معروف',
      date: new Date().toISOString(),
      class: newVisit.class || '',
      subject: newVisit.subject || '',
      ratings: newVisit.ratings as Record<string, string>,
      notes: newVisit.notes || ''
    };
    setVisits([...visits, visit]);
    setShowAdd(false);
    setNewVisit({ teacherId: '', class: '', subject: '', notes: '', ratings: {} });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">الزيارات الإشرافية</h2>
          <p className="text-slate-500">متابعة الأداء التعليمي وتوثيق جودة التدريس.</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg flex items-center gap-2"
        >
          <span>👁️</span> تسجيل زيارة جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {visits.length > 0 ? visits.slice().reverse().map(visit => (
          <div key={visit.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl border border-slate-100">📝</div>
              <div>
                <h3 className="font-black text-slate-900">{visit.teacherName}</h3>
                <div className="text-xs font-bold text-slate-400">
                  {new Date(visit.date).toLocaleDateString('ar-SA')} • {visit.class} • {visit.subject}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end md:self-center">
              <Link 
                to={`/print-visit/${visit.id}`} 
                target="_blank"
                className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-emerald-100 transition-colors"
              >
                🖨️ تقرير مطبوع
              </Link>
              <button 
                onClick={() => setVisits(visits.filter(v => v.id !== visit.id))}
                className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-black hover:bg-red-100 transition-colors"
              >
                🗑️ حذف
              </button>
            </div>
          </div>
        )) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
             <div className="text-5xl mb-4 grayscale">📄</div>
             <p className="text-slate-400 font-bold">لا توجد زيارات مسجلة حتى الآن.</p>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
            <h3 className="text-2xl font-black text-slate-900 mb-6">استمارة الزيارة الإشرافية</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">المعلم</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold"
                  value={newVisit.teacherId}
                  onChange={e => setNewVisit({...newVisit, teacherId: e.target.value})}
                >
                  <option value="">اختر المعلم...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">الفصل</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold"
                  placeholder="3/1"
                  value={newVisit.class}
                  onChange={e => setNewVisit({...newVisit, class: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">المادة</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold"
                  placeholder="الرياضيات"
                  value={newVisit.subject}
                  onChange={e => setNewVisit({...newVisit, subject: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-black text-slate-800 border-b pb-2">تقييم المعايير (13 معيار)</h4>
              {criteriaGroups.map((group, i) => (
                <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-sm font-black text-slate-900 mb-2">{group}</div>
                  <div className="flex flex-wrap gap-2">
                    {["متميز (1)", "جيد (2)", "ملائم (3)", "غير ملائم (4)", "يحتاج إلى تدخل (5)"].map(rating => {
                      const isActive = newVisit.ratings?.[group] === rating;
                      return (
                        <button 
                          key={rating}
                          onClick={() => {
                            const ratings = { ...(newVisit.ratings || {}), [group]: rating };
                            setNewVisit({...newVisit, ratings});
                          }}
                          className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all border ${isActive ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white text-slate-600 border-slate-200'}`}
                        >
                          {rating}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
              <button onClick={() => setShowAdd(false)} className="bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold">إلغاء</button>
              <button onClick={saveVisit} className="bg-emerald-500 text-white py-4 rounded-2xl font-bold shadow-lg">حفظ التقرير</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visits;
