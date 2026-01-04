
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Clock, 
  Upload, 
  RefreshCw, 
  Calendar, 
  Users, 
  BookOpen, 
  User,
  PlayCircle,
  AlertCircle,
  Timer,
  X,
  LayoutDashboard,
  CheckCircle2,
  ChevronLeft,
  Search,
  FileCode,
  FileText
} from 'lucide-react';

// --- Types ---

type PeriodConfig = {
  number: number;
  start: string; // "07:30"
  end: string;   // "08:15"
};

type ScheduleItem = {
  id: string;
  day: string; // "Sunday", "Monday", etc.
  period: number;
  className: string;
  subject: string;
  teacher: string;
};

// --- Constants & Config ---

const DAYS_AR: Record<string, string> = {
  'Sunday': 'الأحد',
  'Monday': 'الاثنين',
  'Tuesday': 'الثلاثاء',
  'Wednesday': 'الأربعاء',
  'Thursday': 'الخميس',
  'Friday': 'الجمعة',
  'Saturday': 'السبت'
};

const AR_DAYS_REVERSE: Record<string, string> = {
  'الأحد': 'Sunday',
  'الاثنين': 'Monday',
  'الإثنين': 'Monday',
  'الثلاثاء': 'Tuesday',
  'الأربعاء': 'Wednesday',
  'الاربعاء': 'Wednesday',
  'الخميس': 'Thursday',
  'الجمعة': 'Friday',
  'السبت': 'Saturday'
};

const PERIODS: PeriodConfig[] = [
  { number: 1, start: '07:00', end: '07:45' },
  { number: 2, start: '07:45', end: '08:30' },
  { number: 3, start: '08:30', end: '09:15' },
  { number: 4, start: '09:45', end: '10:30' },
  { number: 5, start: '10:30', end: '11:15' },
  { number: 6, start: '11:15', end: '12:00' },
  { number: 7, start: '12:00', end: '12:45' },
];

const DEFAULT_DATA: ScheduleItem[] = [
  { id: '1', day: 'Sunday', period: 1, className: '1/1', subject: 'رياضيات', teacher: 'أ. محمد أحمد' },
  { id: '2', day: 'Sunday', period: 1, className: '1/2', subject: 'لغة عربية', teacher: 'أ. خالد علي' },
  { id: '3', day: 'Sunday', period: 1, className: '2/1', subject: 'علوم', teacher: 'أ. سمير سعيد' },
  { id: '4', day: 'Sunday', period: 1, className: '2/2', subject: 'لغة إنجليزية', teacher: 'أ. جون سميث' },
  { id: '5', day: 'Sunday', period: 1, className: '3/1', subject: 'حاسب آلي', teacher: 'أ. تامر حسني' },
  { id: '6', day: 'Sunday', period: 2, className: '1/1', subject: 'علوم', teacher: 'أ. سمير سعيد' },
  { id: '7', day: 'Sunday', period: 2, className: '1/2', subject: 'رياضيات', teacher: 'أ. محمد أحمد' },
];

// --- Helper Functions ---

const parseTime = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const getCurrentPeriodInfo = (date: Date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const currentTime = hours * 60 + minutes;

  for (const p of PERIODS) {
    const startTime = parseTime(p.start);
    const endTime = parseTime(p.end);

    if (currentTime >= startTime && currentTime < endTime) {
      return { 
        number: p.number, 
        progress: ((currentTime - startTime) / (endTime - startTime)) * 100,
        minutesLeft: endTime - currentTime,
        config: p
      };
    }
  }
  return null;
};

const getDayName = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

// --- Components ---

const App = () => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('school_schedule');
    return saved ? JSON.parse(saved) : DEFAULT_DATA;
  });
  const [simulatedDate, setSimulatedDate] = useState<Date | null>(null);
  const [realTime, setRealTime] = useState(new Date());
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('school_schedule', JSON.stringify(schedule));
  }, [schedule]);

  // Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => setRealTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeDate = simulatedDate || realTime;
  const currentDay = getDayName(activeDate);
  const currentPeriodInfo = getCurrentPeriodInfo(activeDate);
  const currentPeriodNumber = currentPeriodInfo?.number;
  
  const activeClasses = useMemo(() => {
    if (!currentPeriodNumber) return [];
    
    return schedule
      .filter(item => item.day === currentDay && item.period === currentPeriodNumber)
      .filter(item => 
        item.className.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.teacher.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.className.localeCompare(b.className, 'ar', { numeric: true }));
  }, [schedule, currentDay, currentPeriodNumber, searchTerm]);

  // Simulation Logic
  const handleSimulateRandom = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
    const randomDay = days[Math.floor(Math.random() * days.length)];
    const randomPeriod = PERIODS[Math.floor(Math.random() * PERIODS.length)];
    
    const now = new Date();
    const targetDayIndex = [0,1,2,3,4,5,6].indexOf(new Date().getDay()); // Simple day map
    const simDate = new Date(now);
    
    const [h, m] = randomPeriod.start.split(':').map(Number);
    simDate.setHours(h, m + 10, 0); 
    // Just change the hours for simple simulation within "today" but logically tied to random day's data
    setSimulatedDate(simDate);
  };

  const handleResetTime = () => setSimulatedDate(null);

  // Parsing Logic (XML and CSV)
  const parseData = (text: string): ScheduleItem[] => {
    const trimmed = text.trim();
    if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) {
      return parseXML(trimmed);
    }
    return parseCSV(trimmed);
  };

  const parseXML = (xmlText: string): ScheduleItem[] => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const items: ScheduleItem[] = [];
      
      // Look for common patterns: <lesson>, <card>, <row>, or <record>
      const nodes = xmlDoc.querySelectorAll('lesson, card, row, record, item');
      
      nodes.forEach((node, index) => {
        const getVal = (selector: string) => {
          const el = node.querySelector(selector);
          return el ? el.textContent?.trim() : '';
        };

        const dayRaw = getVal('day') || getVal('Day') || getVal('يوم') || '';
        const periodRaw = getVal('period') || getVal('Period') || getVal('حصة') || '';
        const className = getVal('class') || getVal('className') || getVal('فصل') || '';
        const subject = getVal('subject') || getVal('Subject') || getVal('مادة') || '';
        const teacher = getVal('teacher') || getVal('Teacher') || getVal('معلم') || '';

        const day = AR_DAYS_REVERSE[dayRaw] || dayRaw;
        const period = parseInt(periodRaw);

        if (day && !isNaN(period) && className) {
          items.push({
            id: `xml-${index}-${Date.now()}`,
            day,
            period,
            className,
            subject: subject || 'غير محدد',
            teacher: teacher || 'غير محدد'
          });
        }
      });

      if (items.length === 0) {
        // Try fallback for flat structures if no specific tags found
        const allNodes = xmlDoc.getElementsByTagName('*');
        console.warn('XML structure not recognized, trying deep search...');
      }

      return items;
    } catch (e) {
      console.error('XML Parsing Error:', e);
      return [];
    }
  };

  const parseCSV = (text: string): ScheduleItem[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 1) return [];

    let startIndex = 0;
    const firstLineLower = lines[0].toLowerCase();
    if (firstLineLower.includes('day') || firstLineLower.includes('اليوم') || firstLineLower.includes('class')) {
      startIndex = 1;
    }

    const data: ScheduleItem[] = [];
    const delimiter = text.includes('\t') ? '\t' : ',';

    for (let i = startIndex; i < lines.length; i++) {
      const row = lines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
      if (row.length < 3) continue;

      const dayRaw = row[0];
      const periodRaw = row[1];
      const className = row[2];
      const subject = row[3] || 'غير محدد';
      const teacher = row[4] || 'غير محدد';

      let day = AR_DAYS_REVERSE[dayRaw] || dayRaw.charAt(0).toUpperCase() + dayRaw.slice(1).toLowerCase();
      const period = parseInt(periodRaw);

      if (day && !isNaN(period) && className) {
        data.push({
          id: `csv-${i}-${Date.now()}`,
          day,
          period,
          className,
          subject,
          teacher
        });
      }
    }
    return data;
  };

  const handleImport = () => {
    const data = parseData(importText);
    if (data.length > 0) {
      setSchedule(data);
      setIsImportModalOpen(false);
      setImportText('');
    } else {
      alert('لم يتم العثور على بيانات صالحة. تأكد من أن التنسيق (XML أو CSV) صحيح.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-12 overflow-x-hidden">
      {/* Top Navigation / Status Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 p-2 rounded-lg shadow-md">
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">لوحة المدير الذكية</h1>
              <p className="text-[10px] text-slate-500 font-medium">نظام مراقبة الجدول اللحظي</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
                <Clock className="text-primary-600" size={16} />
                <span className="font-mono font-bold text-sm tracking-tighter" dir="ltr">
                  {activeDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="w-px h-4 bg-slate-300"></span>
                <span className="text-xs font-bold text-primary-700">{DAYS_AR[currentDay]}</span>
             </div>
             
             {simulatedDate && (
               <button 
                onClick={handleResetTime}
                className="flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-full text-xs font-bold border border-rose-100 hover:bg-rose-100 transition-colors animate-pulse"
               >
                 <RefreshCw size={14} />
                 إيقاف المحاكاة
               </button>
             )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <Users size={64} className="text-primary-600" />
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">الفصول في الحصة الحالية</p>
            <div className="flex items-end gap-2">
               <span className="text-4xl font-black text-slate-900 leading-none">{activeClasses.length}</span>
               <span className="text-xs text-slate-400 font-medium mb-1">فصلاً نشطاً</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <Timer size={64} className="text-amber-600" />
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">الحالة الزمنية</p>
            <div className="flex items-end gap-2">
               <span className="text-4xl font-black text-slate-900 leading-none">
                 {currentPeriodNumber ? `الحصة ${currentPeriodNumber}` : 'فسحة / انتهاء'}
               </span>
            </div>
            {currentPeriodInfo && (
              <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-amber-500 transition-all duration-1000"
                   style={{ width: `${currentPeriodInfo.progress}%` }}
                 ></div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
             <button 
               onClick={() => setIsImportModalOpen(true)}
               className="flex items-center justify-between w-full bg-white border border-slate-200 p-4 rounded-2xl hover:bg-slate-50 transition-all group"
             >
                <div className="flex items-center gap-3">
                  <div className="bg-primary-50 p-2 rounded-lg text-primary-600">
                    <Upload size={18} />
                  </div>
                  <span className="font-bold text-sm">تحديث الجدول (XML/CSV)</span>
                </div>
                <ChevronLeft size={16} className="text-slate-300 group-hover:translate-x-[-4px] transition-transform" />
             </button>
             
             <button 
               onClick={handleSimulateRandom}
               className="flex items-center justify-between w-full bg-primary-600 text-white p-4 rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 group"
             >
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg text-white">
                    <PlayCircle size={18} />
                  </div>
                  <span className="font-bold text-sm">محاكاة وقت حصة</span>
                </div>
                <ChevronLeft size={16} className="text-white/50 group-hover:translate-x-[-4px] transition-transform" />
             </button>
          </div>
        </div>

        {/* Header and Filter Section */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-primary-600 rounded-full"></div>
              <h2 className="text-lg font-black text-slate-800">الحصص الجارية الآن</h2>
           </div>
           
           <div className="relative w-full md:w-96">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="ابحث عن فصل، مادة، أو معلم..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        {/* Main List */}
        {activeClasses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeClasses.map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-2xl hover:border-primary-200 transition-all duration-300 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary-50 rounded-bl-[3rem] -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500 opacity-50"></div>
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="bg-slate-900 text-white font-black text-xl px-4 py-1.5 rounded-2xl shadow-lg">
                    {item.className}
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-100">
                    <CheckCircle2 size={12} />
                    نشط
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-amber-50 p-2 rounded-xl text-amber-600">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">المادة الدراسية</span>
                      <span className="font-bold text-slate-800 text-base">{item.subject}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-start gap-3">
                    <div className="mt-1 bg-primary-50 p-2 rounded-xl text-primary-600">
                      <User size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">المعلم المسؤول</span>
                      <span className="text-sm font-semibold text-slate-600">{item.teacher}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] py-24 flex flex-col items-center justify-center text-center px-6">
             <div className="bg-slate-50 p-8 rounded-full mb-8 text-slate-300 animate-bounce">
                <Calendar size={80} />
             </div>
             <h3 className="text-2xl font-black text-slate-800 mb-3">لا توجد دروس حالية</h3>
             <p className="text-slate-500 max-w-sm mx-auto mb-10 leading-relaxed font-medium">
               الوقت الحالي ({activeDate.toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}) لا يتوافق مع أي حصة مجدولة في يوم {DAYS_AR[currentDay]}
             </p>
             <button 
               onClick={handleSimulateRandom}
               className="bg-primary-600 text-white font-bold px-10 py-4 rounded-2xl hover:bg-primary-700 transition-all flex items-center gap-3 shadow-xl shadow-primary-600/30"
             >
               <PlayCircle size={24} />
               تجربة وقت حصة آخر
             </button>
          </div>
        )}
      </main>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                   <div className="bg-primary-600 p-3 rounded-2xl text-white shadow-lg shadow-primary-600/20">
                     <Upload size={24} />
                   </div>
                   <div>
                     <h3 className="text-xl font-black text-slate-800">تحديث بيانات الجدول</h3>
                     <p className="text-xs text-slate-500 font-medium">يدعم ملفات XML و CSV وصيغة Excel</p>
                   </div>
                </div>
                <button onClick={() => setIsImportModalOpen(false)} className="bg-white p-2 rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors shadow-sm">
                  <X size={24} />
                </button>
             </div>
             
             <div className="p-8">
                {/* File Upload Trigger */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-6 border-2 border-dashed border-primary-200 bg-primary-50/30 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-primary-50 transition-all group"
                >
                   <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".xml,.csv,.txt" 
                    onChange={handleFileChange}
                   />
                   <div className="bg-white p-4 rounded-2xl shadow-sm text-primary-600 mb-4 group-hover:scale-110 transition-transform">
                      <FileCode size={32} />
                   </div>
                   <p className="font-bold text-slate-700">اضغط لرفع ملف (XML أو CSV)</p>
                   <p className="text-xs text-slate-400 mt-1">أو الصق البيانات في المربع أدناه مباشرة</p>
                </div>

                <div className="relative group">
                  <div className="absolute -top-3 right-6 bg-white px-3 text-[10px] font-black text-primary-600 border border-primary-100 rounded-full z-10">
                    محتوى البيانات
                  </div>
                  <textarea 
                    className="w-full h-48 bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-sm font-mono focus:outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-500 transition-all shadow-inner"
                    placeholder={`مثال CSV:\nالأحد, 1, 1/1, رياضيات, أ. أحمد\n\nأو الصق كود XML هنا...`}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    dir="rtl"
                  />
                </div>

                <div className="mt-6 flex items-start gap-3 bg-blue-50/50 border border-blue-100 p-4 rounded-2xl">
                   <AlertCircle className="text-blue-500 shrink-0" size={18} />
                   <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                     <b>نصيحة:</b> إذا كان ملفك بتنسيق XML الخاص ببرامج الجداول المدرسية، ما عليك سوى رفعه مباشرة وسيقوم النظام باستخراج الحصص والفصول تلقائياً.
                   </p>
                </div>
             </div>

             <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 justify-end">
                <button 
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-8 py-3 text-slate-500 font-bold hover:text-slate-700 transition-colors"
                >
                  إغلاق
                </button>
                <button 
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="px-10 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 disabled:opacity-50 transition-all shadow-xl shadow-primary-600/30 flex items-center gap-2"
                >
                  {importText.trim().startsWith('<') ? <FileCode size={18} /> : <FileText size={18} />}
                  تطبيق البيانات
                </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
