
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard.tsx';
import Schedule from './components/Schedule.tsx';
import Staff from './components/Staff.tsx';
import Visits from './components/Visits.tsx';
import Reports from './components/Reports.tsx';
import VisitReportPrinter from './components/VisitReportPrinter.tsx';
import { Teacher, Visit, Lesson } from './types.ts';
import { SCHOOL_PERIODS, DAYS_EN, DAYS_AR } from './constants.tsx';

const App: React.FC = () => {
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

  const [simDate, setSimDate] = useState<Date>(new Date());
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    localStorage.setItem('school_teachers', JSON.stringify(teachers));
    localStorage.setItem('school_visits', JSON.stringify(visits));
    localStorage.setItem('school_lessons', JSON.stringify(lessons));
  }, [teachers, visits, lessons]);

  useEffect(() => {
    if (!isSimulating) {
      const interval = setInterval(() => setSimDate(new Date()), 1000);
      return () => clearInterval(interval);
    }
  }, [isSimulating]);

  const currentPeriod = useMemo(() => {
    const hours = simDate.getHours().toString().padStart(2, '0');
    const minutes = simDate.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;
    
    return SCHOOL_PERIODS.find(p => currentTimeStr >= p.startTime && currentTimeStr <= p.endTime);
  }, [simDate]);

  const toggleSim = () => {
    setIsSimulating(!isSimulating);
    if (isSimulating) setSimDate(new Date());
  };

  const updateSimHour = (h: string) => {
    const newDate = new Date(simDate);
    newDate.setHours(parseInt(h));
    setSimDate(newDate);
  };

  const updateSimMin = (m: string) => {
    const newDate = new Date(simDate);
    newDate.setMinutes(parseInt(m));
    setSimDate(newDate);
  };

  const updateSimDay = (dayIdx: string) => {
    const newDate = new Date(simDate);
    const currentDay = newDate.getDay();
    const diff = parseInt(dayIdx) - currentDay;
    newDate.setDate(newDate.getDate() + diff);
    setSimDate(newDate);
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#f8fafc] pb-24 lg:pb-0 lg:pr-64">
        {/* Sidebar Desktop */}
        <aside className="fixed inset-y-0 right-0 z-40 hidden w-64 bg-slate-900 text-white lg:block shadow-2xl">
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">⚡</div>
              <h1 className="text-xl font-extrabold tracking-tight">منصة القائد</h1>
            </div>
            
            <nav className="flex-1 space-y-2">
              <SidebarLink to="/" icon="📊" label="الرئيسية" />
              <SidebarLink to="/schedule" icon="📅" label="الجدول المدرسي" />
              <SidebarLink to="/staff" icon="👥" label="الهيئة التدريسية" />
              <SidebarLink to="/visits" icon="👁️" label="الزيارات الإشرافية" />
              <SidebarLink to="/reports" icon="📋" label="التقارير والإحصاء" />
            </nav>

            <div className="mt-auto p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
               <button 
                 onClick={toggleSim}
                 className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${isSimulating ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
               >
                 {isSimulating ? 'إيقاف المحاكاة ⏹️' : 'بدء المحاكاة ⚙️'}
               </button>
            </div>
          </div>
        </aside>

        {/* Simulation Bar (Sticky) */}
        {isSimulating && (
          <div className="fixed top-0 left-0 right-0 lg:right-64 z-[60] bg-amber-500 text-white p-2 shadow-lg flex items-center justify-center gap-4 text-xs font-bold animate-in slide-in-from-top duration-300">
            <span>وضع المحاكاة نشط:</span>
            <select 
              value={simDate.getDay()} 
              onChange={(e) => updateSimDay(e.target.value)}
              className="bg-amber-600 border-none rounded px-2 py-1 outline-none"
            >
              {DAYS_AR.map((day, idx) => <option key={idx} value={idx}>{day}</option>)}
            </select>
            <div className="flex items-center gap-1">
              <input 
                type="number" min="0" max="23" 
                value={simDate.getHours()} 
                onChange={(e) => updateSimHour(e.target.value)}
                className="w-12 bg-amber-600 rounded px-1 text-center outline-none"
              />
              :
              <input 
                type="number" min="0" max="59" 
                value={simDate.getMinutes()} 
                onChange={(e) => updateSimMin(e.target.value)}
                className="w-12 bg-amber-600 rounded px-1 text-center outline-none"
              />
            </div>
            <button onClick={toggleSim} className="bg-white/20 hover:bg-white/40 px-3 py-1 rounded">إغلاق</button>
          </div>
        )}

        {/* Main Content */}
        <main className={`p-4 ${isSimulating ? 'pt-16' : 'pt-20'} lg:pt-8 lg:p-10 max-w-7xl mx-auto`}>
          <Routes>
            <Route path="/" element={<Dashboard teachers={teachers} visits={visits} lessons={lessons} currentPeriod={currentPeriod} simDate={simDate} />} />
            <Route path="/schedule" element={<Schedule lessons={lessons} teachers={teachers} currentPeriod={currentPeriod} simDate={simDate} isSimulating={isSimulating} />} />
            <Route path="/staff" element={<Staff teachers={teachers} setTeachers={setTeachers} visits={visits} />} />
            <Route path="/visits" element={<Visits visits={visits} setVisits={setVisits} teachers={teachers} />} />
            <Route path="/reports" element={<Reports visits={visits} teachers={teachers} />} />
            <Route path="/print-visit/:visitId" element={<VisitReportPrinter visits={visits} />} />
          </Routes>
        </main>

        {/* Mobile Nav */}
        <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-lg h-20 lg:hidden flex items-center justify-around px-2 z-40 border-t border-slate-200 shadow-xl">
          <MobileNavItem to="/" icon="📊" label="الرئيسية" />
          <MobileNavItem to="/schedule" icon="📅" label="الجدول" />
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
    <Link to={to} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 ${isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
      <span className="text-xl">{icon}</span>
      <span className="font-bold text-sm">{label}</span>
    </Link>
  );
};

const MobileNavItem = ({ to, icon, label }: { to: string; icon: string; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex flex-col items-center justify-center flex-1 h-full gap-1 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] font-bold">{label}</span>
    </Link>
  );
};

export default App;
