
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Schedule from './components/Schedule';
import Staff from './components/Staff';
import Visits from './components/Visits';
import Reports from './components/Reports';
import VisitReportPrinter from './components/VisitReportPrinter';
import { AppTab, Teacher, Visit, Lesson } from './types';
import { SCHOOL_PERIODS, DAYS_EN } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem('school_teachers');
    return saved ? JSON.parse(saved) : [];
  });
  const [visits, setVisits] = useState<Visit[]>(() => {
    const saved = localStorage.getItem('school_visits');
    return saved ? JSON.parse(saved) : [];
  });
  const [lessons, setLessons] = useState<Lesson[]>(() => {
    const saved = localStorage.getItem('school_lessons');
    return saved ? JSON.parse(saved) : [];
  });

  // Simulation State
  const [simDate, setSimDate] = useState<Date>(new Date());
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    localStorage.setItem('school_teachers', JSON.stringify(teachers));
    localStorage.setItem('school_visits', JSON.stringify(visits));
    localStorage.setItem('school_lessons', JSON.stringify(lessons));
  }, [teachers, visits, lessons]);

  // Sync Simulation
  useEffect(() => {
    if (!isSimulating) {
      const interval = setInterval(() => setSimDate(new Date()), 30000);
      return () => clearInterval(interval);
    }
  }, [isSimulating]);

  const currentPeriod = useMemo(() => {
    const currentTimeStr = simDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const currentDay = DAYS_EN[simDate.getDay()];
    
    // School is closed on weekends for this example
    if (simDate.getDay() === 0 || simDate.getDay() === 6) return null;

    return SCHOOL_PERIODS.find(p => {
      return currentTimeStr >= p.startTime && currentTimeStr <= p.endTime;
    });
  }, [simDate]);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 pb-24 lg:pb-0 lg:pr-64">
        {/* Sidebar for Desktop */}
        <aside className="fixed inset-y-0 right-0 z-40 hidden w-64 bg-slate-900 text-white lg:block">
          <div className="flex flex-col h-full p-6">
            <h1 className="text-2xl font-extrabold text-emerald-400 mb-8">منصة القائد ⚡</h1>
            <nav className="flex-1 space-y-2">
              <SidebarLink to="/" icon="📊" label="الرئيسية" />
              <SidebarLink to="/schedule" icon="📅" label="الحصص الحالية" />
              <SidebarLink to="/staff" icon="👥" label="المعلمون" />
              <SidebarLink to="/visits" icon="👁️" label="الزيارات" />
              <SidebarLink to="/reports" icon="📋" label="التقارير" />
            </nav>
            <div className="mt-auto pt-6 border-t border-slate-800">
               <div className="text-xs text-slate-400 mb-2">حالة النظام:</div>
               <div className="flex items-center gap-2">
                 <div className={`w-3 h-3 rounded-full ${isSimulating ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                 <span className="text-sm">{isSimulating ? 'وضع المحاكاة نشط' : 'وقت حقيقي'}</span>
               </div>
            </div>
          </div>
        </aside>

        {/* Header (Mobile-ish) */}
        <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-30 lg:hidden">
           <div className="flex justify-between items-center">
             <h1 className="text-xl font-extrabold text-slate-900">منصة القائد ⚡</h1>
             <button onClick={() => setIsSimulating(!isSimulating)} className={`px-3 py-1 rounded-full text-xs font-bold ${isSimulating ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
               {isSimulating ? 'محاكاة ⚙️' : 'وقت حقيقي ⏰'}
             </button>
           </div>
        </header>

        {/* Main Content */}
        <main className="p-4 lg:p-8 max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard teachers={teachers} visits={visits} lessons={lessons} currentPeriod={currentPeriod} simDate={simDate} />} />
            <Route path="/schedule" element={<Schedule lessons={lessons} teachers={teachers} currentPeriod={currentPeriod} simDate={simDate} setIsSimulating={setIsSimulating} setSimDate={setSimDate} isSimulating={isSimulating} />} />
            <Route path="/staff" element={<Staff teachers={teachers} setTeachers={setTeachers} visits={visits} />} />
            <Route path="/visits" element={<Visits visits={visits} setVisits={setVisits} teachers={teachers} />} />
            <Route path="/reports" element={<Reports visits={visits} teachers={teachers} />} />
            <Route path="/print-visit/:visitId" element={<VisitReportPrinter visits={visits} />} />
          </Routes>
        </main>

        {/* Bottom Nav for Mobile */}
        <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 h-16 lg:hidden flex items-center justify-around px-2 z-40">
          <MobileNavItem to="/" icon="📊" label="الرئيسية" />
          <MobileNavItem to="/schedule" icon="📅" label="الحصص" />
          <MobileNavItem to="/staff" icon="👥" label="المعلمون" />
          <MobileNavItem to="/visits" icon="👁️" label="الزيارات" />
          <MobileNavItem to="/reports" icon="📋" label="التقارير" />
        </nav>
      </div>
    </Router>
  );
};

const SidebarLink = ({ to, icon, label }: { to: string; icon: string; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
      <span className="text-xl">{icon}</span>
      <span className="font-bold">{label}</span>
    </Link>
  );
};

const MobileNavItem = ({ to, icon, label }: { to: string; icon: string; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex flex-col items-center justify-center h-full px-2 gap-1 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`}>
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-[10px] font-bold">{label}</span>
    </Link>
  );
};

export default App;
