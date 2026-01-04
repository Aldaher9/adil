
import React from 'react';
import { Users, Eye, CheckCircle2, TrendingUp } from 'lucide-react';

interface Props {
  stats: {
    teachers: number;
    visits: number;
    activeTasks: number;
  }
}

const Dashboard: React.FC<Props> = ({ stats }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">لوحة المعلومات</h1>
        <p className="text-slate-500 font-medium">نظرة عامة على أداء المدرسة والعملية التعليمية</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'إجمالي المعلمين', value: stats.teachers, icon: Users, color: 'indigo' },
          { label: 'الزيارات الإشرافية', value: stats.visits, icon: Eye, color: 'amber' },
          { label: 'المهام النشطة', value: stats.activeTasks, icon: CheckCircle2, color: 'emerald' },
          { label: 'معدل الأداء العام', value: '84%', icon: TrendingUp, color: 'rose' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
            <div className={`p-4 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-6">الزيارات الأخيرة</h3>
          <div className="space-y-4">
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
               <Eye className="mx-auto text-slate-300 mb-2" size={32} />
               <p className="text-slate-400 font-bold">لا توجد زيارات مسجلة حديثاً</p>
            </div>
          </div>
        </div>
        
        <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl shadow-indigo-600/20 text-white flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-black mb-2">مساعد القائد الذكي ✨</h3>
            <p className="text-indigo-100 font-medium leading-relaxed opacity-90">
              استخدم الذكاء الاصطناعي لتحليل أداء المعلمين وإنشاء تقارير إشرافية احترافية بضغطة زر واحدة.
            </p>
          </div>
          <div className="mt-8 flex gap-3">
            <div className="flex-1 bg-white/10 backdrop-blur-md p-4 rounded-2xl">
              <p className="text-xs font-bold text-indigo-200 mb-1">التقارير المولدة</p>
              <p className="text-xl font-black">12</p>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-md p-4 rounded-2xl">
              <p className="text-xs font-bold text-indigo-200 mb-1">نقاط التطوير</p>
              <p className="text-xl font-black">45</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
