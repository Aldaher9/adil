
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Settings, 
  Clock, 
  RotateCcw, 
  Upload, 
  Download, 
  FileJson, 
  Users, 
  Calendar, 
  ClipboardList, 
  X, 
  Menu, 
  Save,
  Search,
  User,
  MapPin,
  BookOpen,
  Play
} from 'lucide-react';

// --- Types ---

interface Teacher {
  id: string;
  name: string;
  phone: string;
  subject?: string;
}

interface ScheduleEntry {
  id: string;
  day: string; // Sunday, Monday, etc.
  period: number; // 1, 2, 3...
  teacherName: string;
  subject: string;
  className: string;
  room: string;
}

interface SupervisionVisit {
  id: string;
  teacherName: string;
  supervisorName: string;
  date: string;
  time: string;
  rating: number; // 1-5
  notes: string;
}

// --- Constants ---

const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Standard Saudi/Regional School Periods (Example)
const PERIODS = [
  { number: 1, start: '07:00', end: '07:45' },
  { number: 2, start: '07:45', end: '08:30' },
  { number: 3, start: '08:30', end: '09:15' },
  { number: 4, start: '09:45', end: '10:30' }, // After break
  { number: 5, start: '10:30', end: '11:15' },
  { number: 6, start: '11:15', end: '12:00' },
  { number: 7, start: '12:00', end: '12:45' },
];

// --- Helper Functions ---

const generateId = () => Math.random().toString(36).substr(2, 9);

const parseTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  return now;
};

const getCurrentPeriod = (time: Date) => {
  const currentMinutes = time.getHours() * 60 + time.getMinutes();
  
  for (const p of PERIODS) {
    const [startH, startM] = p.start.split(':').map(Number);
    const [endH, endM] = p.end.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (currentMinutes >= startTotal && currentMinutes < endTotal) {
      return p.number;
    }
  }
  return null;
};

const getDayNameAr = (date: Date) => {
  return DAYS_AR[date.getDay()];
};

// --- Components ---

const App = () => {
  // State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [supervisions, setSupervisions] = useState<SupervisionVisit[]>([]);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationTimeStr, setSimulationTimeStr] = useState("08:00");
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'teachers' | 'schedule' | 'supervision'>('schedule');

  // Timer for Real Time
  useEffect(() => {
    if (!isSimulating) {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [isSimulating]);

  // Handlers
  const handleSimulate = () => {
    const now = new Date();
    const [hours, minutes] = simulationTimeStr.split(':').map(Number);
    now.setHours(hours, minutes, 0, 0);
    setCurrentTime(now);
    setIsSimulating(true);
  };

  const handleResetTime = () => {
    setIsSimulating(false);
    setCurrentTime(new Date());
  };

  // --- File Upload Parsers ---

  const handleTeacherUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // Simple CSV Parse: Name,Phone,Subject
      const lines = text.split('\n');
      const newTeachers: Teacher[] = [];
      lines.forEach((line, index) => {
        if (index === 0) return; // Skip header
        const [name, phone, subject] = line.split(',').map(s => s.trim());
        if (name) {
          newTeachers.push({ id: generateId(), name, phone, subject });
        }
      });
      setTeachers(prev => [...prev, ...newTeachers]);
      alert(`تم إضافة ${newTeachers.length} معلم بنجاح`);
    };
    reader.readAsText(file);
  };

  const handleScheduleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // Simple CSV Parse: Day,Period,Teacher,Subject,Class,Room
      const lines = text.split('\n');
      const newSchedule: ScheduleEntry[] = [];
      lines.forEach((line, index) => {
        if (index === 0) return; // Skip header
        const cols = line.split(',').map(s => s.trim());
        if (cols.length >= 6) {
          const [day, period, teacherName, subject, className, room] = cols;
          newSchedule.push({
            id: generateId(),
            day,
            period: parseInt(period),
            teacherName,
            subject,
            className,
            room
          });
        }
      });
      setSchedule(prev => [...prev, ...newSchedule]);
      alert(`تم إضافة ${newSchedule.length} حصة للجدول`);
    };
    reader.readAsText(file);
  };

  const handleSupervisionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          setSupervisions(prev => [...prev, ...json]);
          alert(`تم استيراد ${json.length} زيارة إشرافية`);
        } else {
          alert('صيغة الملف غير صحيحة، يجب أن يكون مصفوفة JSON');
        }
      } catch (err) {
        alert('خطأ في قراءة ملف JSON');
      }
    };
    reader.readAsText(file);
  };

  // --- Downloads ---

  const downloadTeacherTemplate = () => {
    const header = "اسم المعلم,رقم الجوال,المادة\nأحمد محمد,0500000000,رياضيات\nسعيد علي,0555555555,علوم";
    const blob = new Blob([header], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'نموذج_بيانات_المعلمين.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const downloadScheduleTemplate = () => {
    const header = "اليوم,الحصة,اسم المعلم,المادة,الصف,القاعة\nالأحد,1,أحمد محمد,رياضيات,1/أ,101\nالأحد,2,سعيد علي,علوم,2/ب,المختبر";
    const blob = new Blob([header], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'نموذج_الجدول_المدرسي.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSupervisionJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(supervisions, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.setAttribute('download', 'سجل_الزيارات_الاشرافية.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Display Logic ---

  const currentDayName = getDayNameAr(currentTime);
  const currentPeriodNum = getCurrentPeriod(currentTime);
  
  const activeClasses = schedule.filter(entry => 
    entry.day === currentDayName && entry.period === currentPeriodNum
  );

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-lg">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">نظام الإشراف المدرسي</h1>
            <p className="text-xs text-gray-500">لوحة المتابعة اليومية</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end">
             <span className="text-2xl font-mono font-bold text-indigo-600">
               {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
             </span>
             <span className="text-sm text-gray-500">
               {currentTime.toLocaleDateString('ar-SA')} - {currentDayName}
               {isSimulating && <span className="mr-2 text-amber-600 font-bold">(محاكاة)</span>}
             </span>
           </div>
           
           <div className="flex gap-2">
             {isSimulating && (
               <button 
                onClick={handleResetTime}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                title="العودة للوقت الحالي"
               >
                 <RotateCcw size={16} />
                 <span>العودة للواقع</span>
               </button>
             )}
             
             <button 
               onClick={() => setIsSettingsOpen(true)}
               className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
               title="الإعدادات"
             >
               <Settings size={20} />
             </button>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        
        {/* Simulation Controls (Visible if simulating or empty state) */}
        {!isSimulating && schedule.length > 0 && (
           <div className="mb-8 flex justify-end">
             <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex items-center gap-2">
                <span className="text-sm text-gray-500 px-2">معاينة وقت آخر:</span>
                <input 
                  type="time" 
                  value={simulationTimeStr}
                  onChange={(e) => setSimulationTimeStr(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                />
                <button 
                  onClick={handleSimulate}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors"
                >
                  <Play size={14} />
                  <span>محاكاة</span>
                </button>
             </div>
           </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Stats Cards */}
          <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">الحصة الحالية</p>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {currentPeriodNum ? `الحصة ${currentPeriodNum}` : 'لا يوجد حصص الآن'}
                  </h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                  <Clock size={24} />
                </div>
             </div>

             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">المعلمون النشطون</p>
                  <h3 className="text-2xl font-bold text-gray-800">{activeClasses.length}</h3>
                </div>
                <div className="p-3 bg-green-50 text-green-600 rounded-full">
                  <User size={24} />
                </div>
             </div>

             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">إجمالي المعلمين</p>
                  <h3 className="text-2xl font-bold text-gray-800">{teachers.length}</h3>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
                  <Users size={24} />
                </div>
             </div>
          </div>

          {/* Active Classes List */}
          <div className="md:col-span-4">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                 <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                 الحصص القائمة الآن
               </h2>
               {currentPeriodNum && (
                  <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                    الفترة: {PERIODS[currentPeriodNum-1].start} - {PERIODS[currentPeriodNum-1].end}
                  </span>
               )}
             </div>

             {activeClasses.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {activeClasses.map((cls) => (
                    <div key={cls.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500"></div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{cls.teacherName}</h3>
                          <p className="text-sm text-gray-500">{cls.subject}</p>
                        </div>
                        <div className="bg-gray-100 p-2 rounded-lg">
                          <User size={20} className="text-gray-600" />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin size={16} className="text-indigo-500" />
                          <span>{cls.room}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={16} className="text-indigo-500" />
                          <span>{cls.className}</span>
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
             ) : (
               <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                 <div className="inline-block p-4 bg-gray-50 rounded-full mb-4">
                    <Clock size={40} className="text-gray-300" />
                 </div>
                 <h3 className="text-lg font-medium text-gray-900">لا توجد حصص نشطة في هذا الوقت</h3>
                 <p className="text-gray-500 mt-2">
                   {schedule.length === 0 ? "قم برفع الجدول المدرسي من الإعدادات للبدء" : "انتهى الدوام أو أنك في فترة راحة"}
                 </p>
                 {schedule.length === 0 && (
                   <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="mt-4 text-indigo-600 font-medium hover:underline"
                   >
                     الذهاب للإعدادات
                   </button>
                 )}
               </div>
             )}
          </div>

        </div>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Settings className="text-indigo-600" />
                إعدادات النظام
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-1 overflow-hidden">
              
              {/* Sidebar */}
              <div className="w-64 bg-gray-50 border-l border-gray-100 p-4 flex flex-col gap-2">
                <button 
                  onClick={() => setActiveTab('schedule')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-colors ${activeTab === 'schedule' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Calendar size={18} />
                  الجدول المدرسي
                </button>
                <button 
                  onClick={() => setActiveTab('teachers')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-colors ${activeTab === 'teachers' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Users size={18} />
                  بيانات المعلمين
                </button>
                <button 
                  onClick={() => setActiveTab('supervision')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-colors ${activeTab === 'supervision' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <ClipboardList size={18} />
                  الزيارات الإشرافية
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-6 overflow-y-auto">
                
                {activeTab === 'schedule' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">إدارة الجدول المدرسي</h3>
                      <p className="text-sm text-gray-500 mb-4">قم برفع ملف الجدول بصيغة CSV أو قم بتنزيل النموذج لتعبئته.</p>
                      
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                          <Upload size={18} />
                          <span>رفع الجدول (CSV)</span>
                          <input type="file" accept=".csv" onChange={handleScheduleUpload} className="hidden" />
                        </label>
                        <button 
                          onClick={downloadScheduleTemplate}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Download size={18} />
                          <span>تنزيل النموذج</span>
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                      <h4 className="font-bold text-gray-800 mb-4 flex justify-between items-center">
                        <span>الجدول الحالي</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">{schedule.length} حصة</span>
                      </h4>
                      {schedule.length > 0 ? (
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                          <table className="w-full text-sm text-right">
                            <thead className="bg-gray-50 text-gray-600 font-medium">
                              <tr>
                                <th className="p-3">اليوم</th>
                                <th className="p-3">الحصة</th>
                                <th className="p-3">المعلم</th>
                                <th className="p-3">المادة</th>
                                <th className="p-3">الصف</th>
                                <th className="p-3">القاعة</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {schedule.slice(0, 10).map((s) => (
                                <tr key={s.id}>
                                  <td className="p-3">{s.day}</td>
                                  <td className="p-3">{s.period}</td>
                                  <td className="p-3 font-medium">{s.teacherName}</td>
                                  <td className="p-3">{s.subject}</td>
                                  <td className="p-3">{s.className}</td>
                                  <td className="p-3">{s.room}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {schedule.length > 10 && (
                            <div className="p-2 text-center text-xs text-gray-500 bg-gray-50">
                              ... ويوجد {schedule.length - 10} صفوف أخرى
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400">
                          لا توجد بيانات جدول حالياً
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'teachers' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">بيانات المعلمين</h3>
                      <p className="text-sm text-gray-500 mb-4">رفع قائمة المعلمين مع أرقام التواصل.</p>
                      
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                          <Upload size={18} />
                          <span>رفع المعلمين (CSV)</span>
                          <input type="file" accept=".csv" onChange={handleTeacherUpload} className="hidden" />
                        </label>
                        <button 
                          onClick={downloadTeacherTemplate}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Download size={18} />
                          <span>تنزيل نموذج البيانات</span>
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                      <h4 className="font-bold text-gray-800 mb-4">المعلمون المسجلون ({teachers.length})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {teachers.map((t) => (
                          <div key={t.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                                {t.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-gray-800 text-sm">{t.name}</p>
                                <p className="text-xs text-gray-500">{t.phone}</p>
                              </div>
                            </div>
                            <span className="text-xs bg-white px-2 py-1 border rounded text-gray-600">{t.subject || 'عام'}</span>
                          </div>
                        ))}
                        {teachers.length === 0 && (
                          <div className="col-span-2 text-center text-gray-400 py-4">لا يوجد معلمون</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'supervision' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">قاعدة بيانات الزيارات الإشرافية</h3>
                      <p className="text-sm text-gray-500 mb-4">تصدير واستيراد سجلات الزيارات بصيغة JSON.</p>
                      
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg cursor-pointer hover:bg-teal-700 transition-colors">
                          <Upload size={18} />
                          <span>استيراد السجل (JSON)</span>
                          <input type="file" accept=".json" onChange={handleSupervisionUpload} className="hidden" />
                        </label>
                        <button 
                          onClick={downloadSupervisionJson}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <FileJson size={18} />
                          <span>تصدير البيانات الحالية</span>
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                       <h4 className="font-bold text-gray-800 mb-4">أحدث الزيارات ({supervisions.length})</h4>
                       <div className="space-y-3">
                         {supervisions.map((visit) => (
                           <div key={visit.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                             <div className="flex justify-between items-start">
                               <div>
                                 <h5 className="font-bold text-gray-900">المعلم: {visit.teacherName}</h5>
                                 <p className="text-sm text-gray-500">المشرف: {visit.supervisorName}</p>
                               </div>
                               <div className="text-left">
                                 <span className="block font-mono text-sm text-gray-600">{visit.date}</span>
                                 <div className="flex gap-1 mt-1">
                                   {[...Array(5)].map((_, i) => (
                                     <div key={i} className={`w-2 h-2 rounded-full ${i < visit.rating ? 'bg-yellow-400' : 'bg-gray-200'}`}></div>
                                   ))}
                                 </div>
                               </div>
                             </div>
                             {visit.notes && (
                               <div className="mt-2 text-sm text-gray-600 bg-gray-100 p-2 rounded">
                                 {visit.notes}
                               </div>
                             )}
                           </div>
                         ))}
                         {supervisions.length === 0 && (
                           <div className="text-center py-8 text-gray-400">لا توجد زيارات مسجلة</div>
                         )}
                       </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
