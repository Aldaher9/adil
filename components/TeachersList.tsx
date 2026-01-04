
import React, { useState } from 'react';
import { Teacher, Infraction } from '../types';
import { Search, Phone, MessageCircle, AlertCircle, Plus, Star, MoreHorizontal, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  teachers: Teacher[];
  setTeachers: (t: Teacher[]) => void;
}

const TeachersList: React.FC<Props> = ({ teachers, setTeachers }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = teachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleInfraction = (teacherId: string, type: Infraction['type']) => {
    const desc = prompt("أدخل تفاصيل الملاحظة:");
    if (!desc) return;

    const updated = teachers.map(t => {
      if (t.id === teacherId) {
        return {
          ...t,
          infractions: [...t.infractions, { type, date: new Date().toISOString(), description: desc }]
        };
      }
      return t;
    });
    setTeachers(updated);
    alert("تم تسجيل الملاحظة بنجاح");
  };

  const handleReward = (teacherId: string) => {
    const updated = teachers.map(t => {
      if (t.id === teacherId) {
        return { ...t, points: (t.points || 0) + 10 };
      }
      return t;
    });
    setTeachers(updated);
    alert("تم منح 10 نقاط تميز للمعلم ✨");
  };

  const exportReport = () => {
    const data = teachers.map(t => ({
      'اسم المعلم': t.name,
      'رقم الهاتف': t.phone,
      'نقاط التميز': t.points,
      'عدد الملاحظات': t.infractions.length,
      'آخر ملاحظة': t.infractions[t.infractions.length - 1]?.description || '-'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تقرير الأداء");
    XLSX.writeFile(wb, "تقرير_تقييم_المعلمين.xlsx");
  };

  const getWhatsAppLink = (teacher: Teacher, msgType: string) => {
    let msg = "";
    if (msgType === 'office') msg = `السلام عليكم أ/ ${teacher.name}، يرجى التوجه لمكتب المدير للأهمية.`;
    if (msgType === 'duty') msg = `السلام عليكم أ/ ${teacher.name}، يلاحظ عدم وجودكم في موقع المناوبة الخاص بكم. نرجو التواجد.`;
    if (msgType === 'assembly') msg = `السلام عليكم أ/ ${teacher.name}، نرجو الالتزام بحضور الطابور الصباحي في الوقت المحدد.`;
    
    return `https://wa.me/${teacher.phone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">سجل المعلمين</h1>
          <p className="text-slate-500 font-bold">إدارة الأداء، الملاحظات، والتميز</p>
        </div>
        <button 
          onClick={exportReport}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-colors"
        >
          <FileText size={20} />
          <span>تصدير تقرير مفصل</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="ابحث عن اسم المعلم..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 p-4 pr-12 rounded-2xl font-black text-slate-700 focus:ring-2 ring-indigo-500 outline-none shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((teacher) => (
          <div key={teacher.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5 hover:shadow-xl transition-all">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-1">{teacher.name}</h3>
                <p className="text-sm font-bold text-slate-400">{teacher.phone || 'لا يوجد رقم'}</p>
              </div>
              <div className="bg-amber-50 text-amber-600 px-3 py-1 rounded-xl flex items-center gap-1 font-black text-sm">
                <Star size={16} fill="currentColor" />
                <span>{teacher.points}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handleInfraction(teacher.id, 'delay_class')}
                className="bg-rose-50 text-rose-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-rose-100"
              >
                تأخر حصة
              </button>
              <button 
                onClick={() => handleInfraction(teacher.id, 'delay_assembly')}
                className="bg-orange-50 text-orange-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-orange-100"
              >
                تأخر طابور
              </button>
              <button 
                onClick={() => handleInfraction(teacher.id, 'delay_duty')}
                className="bg-slate-50 text-slate-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-100"
              >
                تأخر مناوبة
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="relative group">
                <button className="w-full bg-emerald-50 text-emerald-700 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-100">
                  <MessageCircle size={18} />
                  <span>مراسلة</span>
                </button>
                <div className="absolute bottom-full left-0 w-48 bg-white shadow-2xl rounded-2xl border border-slate-100 p-2 hidden group-hover:block z-10 mb-2">
                  <a href={getWhatsAppLink(teacher, 'office')} target="_blank" className="block p-3 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700 mb-1">طلب للمكتب</a>
                  <a href={getWhatsAppLink(teacher, 'duty')} target="_blank" className="block p-3 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700 mb-1">استفسار مناوبة</a>
                  <a href={getWhatsAppLink(teacher, 'assembly')} target="_blank" className="block p-3 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700">تنبيه طابور</a>
                </div>
              </div>
              <button 
                onClick={() => handleReward(teacher.id)}
                className="bg-amber-50 text-amber-700 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-amber-100"
              >
                <Plus size={18} />
                <span>شكر المعلم</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeachersList;
