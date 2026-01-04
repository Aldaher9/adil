
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, logout } from './services/firebase.ts';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Eye, 
  Settings as SettingsIcon, 
  LogOut,
  User as UserIcon
} from 'lucide-react';
import Dashboard from './components/Dashboard.tsx';
import CurrentClasses from './components/CurrentClasses.tsx';
import TeachersList from './components/TeachersList.tsx';
import VisitsHistory from './components/VisitsHistory.tsx';
import VisitForm from './components/VisitForm.tsx';
import Settings from './components/Settings.tsx';
import { View, SchoolData, Teacher, VisitReport, SupervisionItem } from './types.ts';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [schoolData, setSchoolData] = useState<SchoolData>({
    teachers: {},
    classes: {},
    subjects: {},
    lessons: [],
    periods: []
  });
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [visits, setVisits] = useState<VisitReport[]>([]);
  const [supervisionForm, setSupervisionForm] = useState<SupervisionItem[]>([]);
  const [selectedVisitData, setSelectedVisitData] = useState<Partial<VisitReport> | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    
    const savedData = localStorage.getItem('school_data');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setSchoolData(parsed.schoolData || schoolData);
      setTeachers(parsed.teachers || []);
      setVisits(parsed.visits || []);
      setSupervisionForm(parsed.supervisionForm || []);
    }

    return () => unsubscribe();
  }, []);

  const persistData = (updates: any) => {
    const current = { schoolData, teachers, visits, supervisionForm, ...updates };
    localStorage.setItem('school_data', JSON.stringify(current));
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      alert("فشل تسجيل الدخول. تأكد من إعداد نطاق GitHub في Firebase Console.");
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard stats={{ teachers: teachers.length, visits: visits.length, activeTasks: 0 }} />;
      case 'classes':
        return (
          <CurrentClasses 
            schoolData={schoolData} 
            teacherDetails={teachers}
            onStartVisit={(data) => {
              setSelectedVisitData(data);
              setActiveView('visit_form');
            }}
          />
        );
      case 'teachers':
        return (
          <TeachersList 
            teachers={teachers} 
            setTeachers={(t) => { setTeachers(t); persistData({ teachers: t }); }} 
          />
        );
      case 'visits':
        return <VisitsHistory visits={visits} setVisits={(v) => { setVisits(v); persistData({ visits: v }); }} />;
      case 'visit_form':
        return (
          <VisitForm 
            initialData={selectedVisitData}
            formItems={supervisionForm}
            teachers={teachers}
            schoolData={schoolData}
            onSave={(report) => {
              const updatedVisits = [...visits, report];
              setVisits(updatedVisits);
              persistData({ visits: updatedVisits });
              setActiveView('visits');
              setSelectedVisitData(null);
            }}
          />
        );
      case 'settings':
        return (
          <Settings 
            schoolData={schoolData} 
            setSchoolData={(d) => { setSchoolData(d); persistData({ schoolData: d }); }}
            supervisionForm={supervisionForm}
            setSupervisionForm={(f) => { setSupervisionForm(f); persistData({ supervisionForm: f }); }}
            teachers={teachers}
            setTeachers={(t) => { setTeachers(t); persistData({ teachers: t }); }}
          />
        );
      default:
        return <Dashboard stats={{ teachers: teachers.length, visits: visits.length, activeTasks: 0 }} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-100 p-6 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-indigo-50 rounded-2xl">
              <LayoutDashboard size={48} className="text-indigo-600" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">منصة القائد</h1>
          <p className="text-slate-500 mb-8 font-medium">نظام الإدارة المدرسية المتكامل والذكي</p>
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 py-4 px-6 rounded-2xl hover:bg-slate-50 transition-all group active:scale-95"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6" />
            <span className="font-bold text-slate-700">تسجيل الدخول عبر جوجل</span>
          </button>
          <div className="mt-8 pt-6 border-t border-slate-100">
             <button onClick={() => setUser({ displayName: 'مدير تجريبي', email: 'demo@school.com', uid: 'demo' } as User)} className="text-indigo-600 font-bold hover:underline">
               الدخول كضيف (للتجربة)
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden">
      <aside className="hidden md:flex flex-col w-72 bg-slate-900 text-white p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <LayoutDashboard size={24} />
          </div>
          <h2 className="text-xl font-black tracking-tight">منصة القائد</h2>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
            { id: 'classes', icon: Calendar, label: 'الحصص الحالية' },
            { id: 'teachers', icon: Users, label: 'المعلمون' },
            { id: 'visits', icon: Eye, label: 'الزيارات الإشرافية' },
            { id: 'settings', icon: SettingsIcon, label: 'الإعدادات' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              className={`w-full flex items-center gap-4 py-3.5 px-5 rounded-2xl transition-all font-bold ${
                activeView === item.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={22} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-indigo-400">
              <UserIcon size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user.displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="w-full flex items-center gap-4 py-3 px-5 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold"
          >
            <LogOut size={22} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900">منصة القائد</h2>
          <button onClick={() => setActiveView('settings')} className="p-2 text-slate-500">
            <SettingsIcon size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {renderView()}
        </div>

        <nav className="md:hidden bg-white border-t border-slate-200 px-2 py-2 flex justify-around">
          {[
            { id: 'dashboard', icon: LayoutDashboard },
            { id: 'classes', icon: Calendar },
            { id: 'teachers', icon: Users },
            { id: 'visits', icon: Eye },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              className={`p-3 rounded-xl transition-all ${
                activeView === item.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'
              }`}
            >
              <item.icon size={24} />
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
};

export default App;
