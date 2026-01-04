
import React, { useState } from 'react';
import { Teacher, Visit } from '../types.ts';

interface Props {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  visits: Visit[];
}

// Fix: Add default export and full component implementation for Staff
const Staff: React.FC<Props> = ({ teachers, setTeachers, visits }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');

  const addTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    const newTeacher: Teacher = {
      id: Date.now().toString(),
      name,
      phone,
      subject
    };
    setTeachers([...teachers, newTeacher]);
    setName('');
    setPhone('');
    setSubject('');
  };

  const removeTeacher = (id: string) => {
    setTeachers(teachers.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-left-4 duration-500 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-900">الهيئة التدريسية 👥</h2>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
          إضافة معلم جديد
        </h3>
        <form onSubmit={addTeacher} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-sm"
            placeholder="اسم المعلم"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-sm"
            placeholder="رقم الهاتف"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
          <input
            className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-sm"
            placeholder="المادة الدراسية"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
          <button className="md:col-span-3 bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-95 transition-all">
            إضافة المعلم للقاعدة
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teachers.map(t => (
          <div key={t.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-emerald-200 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">👤</div>
              <div>
                <div className="font-black text-slate-900">{t.name}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t.subject || 'بدون مادة'}</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
               <div className="text-xs font-bold text-slate-500">📞 {t.phone}</div>
               <button 
                 onClick={() => removeTeacher(t.id)}
                 className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
               >
                 🗑️
               </button>
            </div>
          </div>
        ))}
        {teachers.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-300 font-black italic border-2 border-dashed border-slate-100 rounded-[2.5rem]">
            لا يوجد معلمون مسجلون حالياً
          </div>
        )}
      </div>
    </div>
  );
};

export default Staff;
