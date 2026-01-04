
import React from 'react';
import { VisitReport } from '../types';
import { FileText, Printer, Trash2, Share2, Search, Filter } from 'lucide-react';

interface Props {
  visits: VisitReport[];
  setVisits: (v: VisitReport[]) => void;
}

const VisitsHistory: React.FC<Props> = ({ visits, setVisits }) => {
  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا التقرير؟")) {
      setVisits(visits.filter(v => v.id !== id));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">سجل الزيارات الإشرافية</h1>
          <p className="text-slate-500 font-bold">الأرشيف الكامل للتقارير المعتمدة</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={handlePrint}
            className="bg-white border-2 border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50"
          >
            <Printer size={20} />
            <span>طباعة القائمة</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-5 text-sm font-black text-slate-500">الرقم التسلسلي</th>
                <th className="p-5 text-sm font-black text-slate-500">المعلم</th>
                <th className="p-5 text-sm font-black text-slate-500">المادة والدرس</th>
                <th className="p-5 text-sm font-black text-slate-500">التاريخ</th>
                <th className="p-5 text-sm font-black text-slate-500">التقييم</th>
                <th className="p-5 text-sm font-black text-slate-500">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => (
                <tr key={visit.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                  <td className="p-5 font-black text-slate-400 text-sm">{visit.id}</td>
                  <td className="p-5 font-black text-slate-800">{visit.teacherName}</td>
                  <td className="p-5">
                    <p className="font-bold text-slate-700 text-sm">{visit.subject}</p>
                    <p className="text-xs font-medium text-slate-400">{visit.lessonTitle}</p>
                  </td>
                  <td className="p-5 text-sm font-bold text-slate-500">{visit.date}</td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            visit.totalAverage >= 4 ? 'bg-emerald-500' : 
                            visit.totalAverage >= 3 ? 'bg-amber-500' : 'bg-rose-500'
                          }`} 
                          style={{ width: `${(visit.totalAverage/5)*100}%` }}
                        />
                      </div>
                      <span className="text-sm font-black text-slate-700">{visit.totalAverage.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => alert("قريباً: فتح معاينة التقرير الكامل")}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        <FileText size={18} />
                      </button>
                      <button className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg">
                        <Share2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(visit.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visits.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-slate-400 font-bold">
                    لا توجد تقارير زيارات مسجلة حتى الآن
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VisitsHistory;
