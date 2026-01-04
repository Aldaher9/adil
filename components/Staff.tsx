
import React, { useState } from 'react';
import { Teacher, Visit } from '../types';

interface Props {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  visits: Visit[];
}

const Staff: React.FC<Props> = ({ teachers, setTeachers, visits }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: '', phone: '', subject: '' });
  const [search, setSearch] = useState('');

  const addTeacher = () => {
    if (!newTeacher.name || !newTeacher.phone) return;
    setTeachers([...teachers, { ...newTeacher, id: Date.now().toString() }]);
    setNewTeacher({ name: '', phone: '', subject: '' });
    setShowAdd(false);
  };

  const deleteTeacher = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المعلم؟')) {
      setTeachers(teachers.filter(t => t.id !== id));
    }
  };

  const filtered = teachers.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">الكادر التعليمي</h2>
          <p className="text-slate-500">إدارة المعلمين ومعلومات التواصل الخاصة بهم.</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
        >
          <span>➕</span> إضافة معلم جديد
        </button>
      </div>

      <div className="relative">
        <input 
          type="text" 
          placeholder="ابحث بالاسم أو المادة..."
          className="w-full bg-white border border-slate-200 rounded-2xl px-12 py-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl grayscale">🔍</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(teacher => {
          const teacherVisits = visits.filter(v => v.teacherId === teacher.id);
          return (
            <div key={teacher.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden group hover:border-emerald-200 transition-all">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                   <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl border border-slate-200">👨‍🏫</div>
                   <button onClick={() => deleteTeacher(teacher.id)} className="text-slate-300 hover:text-red-500 p-2">🗑️</button>
                </div>
                <h3 className="text-xl font-black text-slate-900">{teacher.name}</h3>
                <p className="text-emerald-600 font-bold text-sm mb-4">{teacher.subject || 'لم يتم تحديد المادة'}</p>
                
                <div className="flex items-center justify-between py-3 border-y border-slate-50 mb-4">
                  <div className="text-center flex-1 border-l border-slate-50">
                    <div className="text-xs font-bold text-slate-400">الزيارات</div>
                    <div className="text-lg font-black text-slate-800">{teacherVisits.length}</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-xs font-bold text-slate-400">آخر تقييم</div>
                    <div className="text-lg font-black text-slate-800">1.0</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                   <a 
                     href={`https://wa.me/${teacher.phone}`}
                     target="_blank"
                     rel="noreferrer"
                     className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 py-3 rounded-xl text-xs font-black hover:bg-emerald-100 transition-colors"
                   >
                     <span>💬</span> واتساب
                   </a>
                   <a 
                     href={`tel:${teacher.phone}`}
                     className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-3 rounded-xl text-xs font-black hover:bg-blue-100 transition-colors"
                   >
                     <span>📞</span> اتصال
                   </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
              <h3 className="text-2xl font-black text-slate-900 mb-6">إضافة معلم جديد</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1">اسم المعلم</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newTeacher.name}
                    onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1">رقم الهاتف (بدون مفتاح)</label>
                  <input 
                    type="tel" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newTeacher.phone}
                    onChange={(e) => setNewTeacher({...newTeacher, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1">المادة</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newTeacher.subject}
                    onChange={(e) => setNewTeacher({...newTeacher, subject: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button onClick={() => setShowAdd(false)} className="bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold">إلغاء</button>
                  <button onClick={addTeacher} className="bg-emerald-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100">حفظ</button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
