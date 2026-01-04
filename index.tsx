import React, { useState, useEffect, useRef, useContext, createContext } from "react";
import { createRoot } from "react-dom/client";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, Timestamp, deleteDoc, doc } from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Users, 
  Settings, 
  History, 
  LogOut, 
  Upload, 
  FileText, 
  Play, 
  Phone, 
  MessageCircle, 
  AlertTriangle, 
  Star, 
  Printer, 
  Trash2, 
  Share2,
  Menu,
  X,
  Search
} from "lucide-react";

// --- Configuration ---

const firebaseConfig = {
  apiKey: "AIzaSyC4NddjijF29YNhowy4SqgRaMPn01oSSEg",
  authDomain: "school-9416e.firebaseapp.com",
  projectId: "school-9416e",
  storageBucket: "school-9416e.firebasestorage.app",
  messagingSenderId: "680872052240",
  appId: "1:680872052240:web:96d2e544166ab5f8096c95",
  measurementId: "G-5EBTV0MV83"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Gemini
// Fix: Handle process.env safely for browser environments
const getApiKey = () => {
  // In a real build environment, process.env is replaced by the bundler.
  // In a browser script tag environment, accessing process might throw an error.
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore error if process is not defined
  }
  return "YOUR_API_KEY_HERE"; // Replace this with your actual Gemini API Key if testing locally without env vars
};

const genAI = new GoogleGenAI({ apiKey: getApiKey() });

// --- Types & Interfaces ---

interface Teacher {
  id: string;
  name: string;
  phone: string;
  subject: string;
  points: number;
  violations: Violation[];
}

interface Violation {
  type: 'late_class' | 'late_morning' | 'late_duty';
  date: string; // ISO string
  details: string;
}

interface ClassSession {
  id: string;
  className: string; // e.g., "1/5"
  teacherName: string;
  subject: string;
  period: number;
  startTime: string;
  endTime: string;
}

interface RubricItem {
  id: number;
  category: string;
  description: string;
  maxScore: number;
}

interface Visit {
  id: string;
  teacherName: string;
  className: string;
  subject: string;
  date: string; // ISO
  topic: string;
  scores: Record<number, number>; // itemId -> score
  report: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
    summary: string;
  };
}

// --- Mock Data Generators (for Simulation) ---

const DEFAULT_RUBRIC: RubricItem[] = [
  { id: 1, category: "التخطيط", description: "يخطط للدرس بفاعلية ويحدد الأهداف بوضوح", maxScore: 4 },
  { id: 2, category: "الإدارة الصفية", description: "يدير وقت الحصة ويضبط سلوك الطلاب", maxScore: 4 },
  { id: 3, category: "استراتيجيات التدريس", description: "ينوع في طرق التدريس ويستخدم التعلم النشط", maxScore: 4 },
  { id: 4, category: "التقويم", description: "يستخدم أساليب تقويم متنوعة ومناسبة", maxScore: 4 },
  { id: 5, category: "استخدام التقنية", description: "يوظف التقنية في خدمة العملية التعليمية", maxScore: 4 },
];

const MOCK_TEACHERS: Teacher[] = [
  { id: "t1", name: "أحمد محمد", phone: "96800000000", subject: "رياضيات", points: 10, violations: [] },
  { id: "t2", name: "سعيد علي", phone: "96800000001", subject: "لغة عربية", points: 5, violations: [] },
  { id: "t3", name: "خالد يوسف", phone: "96800000002", subject: "علوم", points: 8, violations: [] },
];

// --- Context ---

const AppContext = createContext<{
  user: User | null;
  teachers: Teacher[];
  rubric: RubricItem[];
  visits: Visit[];
  currentSchedule: ClassSession[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  setRubric: React.Dispatch<React.SetStateAction<RubricItem[]>>;
  addVisit: (visit: Visit) => void;
  updateTeacher: (teacher: Teacher) => void;
  simulateSchedule: () => void;
  isLoading: boolean;
}>({
  user: null,
  teachers: [],
  rubric: [],
  visits: [],
  currentSchedule: [],
  setTeachers: () => {},
  setRubric: () => {},
  addVisit: () => {},
  updateTeacher: () => {},
  simulateSchedule: () => {},
  isLoading: false,
});

// --- Components ---

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useContext(AppContext);

  if (isLoading) return <div className="flex h-screen items-center justify-center text-blue-600">جاري التحميل...</div>;

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="mb-6 flex justify-center">
             <div className="p-4 bg-blue-100 rounded-full">
               <ClipboardCheck size={48} className="text-blue-600" />
             </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">منصة المدير الذكي</h1>
          <p className="text-gray-500 mb-8">يرجى تسجيل الدخول بحساب Google للمتابعة</p>
          <button
            onClick={() => signInWithPopup(auth, googleProvider)}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            تسجيل الدخول باستخدام Google
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// --- Pages ---

const Dashboard: React.FC = () => {
  const { currentSchedule, teachers, updateTeacher, simulateSchedule } = useContext(AppContext);
  const [loadingAI, setLoadingAI] = useState<string | null>(null);

  const handleContact = async (teacherName: string, type: 'late' | 'inquiry', className: string) => {
    setLoadingAI(teacherName);
    const teacher = teachers.find(t => t.name === teacherName);
    
    let prompt = "";
    if (type === 'late') {
        prompt = `Draft a very polite and professional WhatsApp message in Arabic from a school principal to a teacher named ${teacherName}. The context is that the teacher is currently late for their class ${className}. Ask kindly about the reason and emphasize the importance of time, but keep it supportive.`;
    } else {
        prompt = `Draft a polite professional message in Arabic to teacher ${teacherName} asking about their class ${className}.`;
    }

    try {
        const response = await genAI.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
        });
        const message = encodeURIComponent(response.text.trim());
        const phone = teacher?.phone || "";
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    } catch (error) {
        console.error("AI Error", error);
        alert("حدث خطأ أثناء توليد الرسالة. يرجى التأكد من مفتاح API أو المحاولة يدوياً.");
    } finally {
        setLoadingAI(null);
    }
  };

  const registerViolation = (teacherName: string, className: string) => {
      if(confirm(`هل أنت متأكد من تسجيل مخالفة تأخير للمعلم ${teacherName}؟`)) {
        const teacher = teachers.find(t => t.name === teacherName);
        if (teacher) {
            const newViolation: Violation = {
                type: 'late_class',
                date: new Date().toISOString(),
                details: `تأخير عن الحصة في الصف ${className}`
            };
            updateTeacher({
                ...teacher,
                violations: [...teacher.violations, newViolation]
            });
            alert("تم تسجيل المخالفة بنجاح");
        }
      }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">لوحة التحكم</h2>
           <p className="text-gray-500">نظرة عامة على الحصص الحالية</p>
        </div>
        <div className="flex gap-2">
            <button onClick={simulateSchedule} className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 transition flex items-center gap-2">
                <Play size={18} /> محاكاة الوقت
            </button>
            <div className="bg-white px-4 py-2 rounded-lg shadow text-sm font-medium border border-gray-200">
                الوقت الحالي: {new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
            </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {currentSchedule.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-xl shadow-sm text-center border-2 border-dashed border-gray-300">
                <LayoutDashboard className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-900">لا توجد حصص حالياً</h3>
                <p className="text-gray-500">جرب الضغط على "محاكاة الوقت" لعرض بيانات تجريبية</p>
            </div>
        ) : (
            currentSchedule
            .sort((a, b) => a.className.localeCompare(b.className))
            .map((session) => (
                <div key={session.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                    <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                        <h3 className="text-lg font-bold">{session.className}</h3>
                        <span className="text-sm bg-blue-500 px-2 py-1 rounded">الحصة {session.period}</span>
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                                {session.teacherName.charAt(0)}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">{session.teacherName}</p>
                                <p className="text-sm text-gray-500">{session.subject}</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-2 border-t pt-4">
                            <button 
                                onClick={() => handleContact(session.teacherName, 'late', session.className)}
                                disabled={loadingAI === session.teacherName}
                                className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition flex items-center justify-center gap-1"
                            >
                                {loadingAI === session.teacherName ? '...' : <><AlertTriangle size={16}/> تأخير</>}
                            </button>
                            <button 
                                onClick={() => handleContact(session.teacherName, 'inquiry', session.className)}
                                className="flex-1 bg-green-50 text-green-600 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition flex items-center justify-center gap-1"
                            >
                                <MessageCircle size={16}/> واتساب
                            </button>
                            <button 
                                onClick={() => window.location.hash = `#new-visit?teacher=${encodeURIComponent(session.teacherName)}&class=${encodeURIComponent(session.className)}&subject=${encodeURIComponent(session.subject)}`}
                                className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition flex items-center justify-center gap-1"
                            >
                                <ClipboardCheck size={16}/> زيارة
                            </button>
                        </div>
                        <button onClick={() => registerViolation(session.teacherName, session.className)} className="w-full text-xs text-center text-gray-400 hover:text-red-500 mt-2">
                             تسجيل مخالفة رسمية
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

const SupervisionForm: React.FC = () => {
    const { rubric, addVisit, teachers } = useContext(AppContext);
    const [formData, setFormData] = useState({
        teacherName: '',
        className: '',
        subject: '',
        topic: ''
    });
    const [scores, setScores] = useState<Record<number, number>>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<Visit['report'] | null>(null);

    // Parse query params for pre-filling
    useEffect(() => {
        const hash = window.location.hash;
        if(hash.includes('?')) {
            const params = new URLSearchParams(hash.split('?')[1]);
            setFormData(prev => ({
                ...prev,
                teacherName: params.get('teacher') || '',
                className: params.get('class') || '',
                subject: params.get('subject') || '',
            }));
        }
    }, []);

    const handleScoreChange = (id: number, score: number) => {
        setScores(prev => ({...prev, [id]: score}));
    };

    const generateAIReport = async () => {
        if (!formData.teacherName || !formData.topic || Object.keys(scores).length === 0) {
            alert("يرجى تعبئة جميع البيانات والتقييمات أولاً");
            return;
        }

        setIsGenerating(true);
        
        // Prepare data for AI
        const rubricData = rubric.map(r => `Criteria: ${r.category} (${r.description}) - Score: ${scores[r.id] || 0}/4`).join('\n');
        
        const prompt = `
            Act as an educational supervision expert. Analyze the following class visit data for teacher ${formData.teacherName}.
            Topic: ${formData.topic}
            Subject: ${formData.subject}
            
            Rubric Scores:
            ${rubricData}

            Please generate a structured JSON report (DO NOT use Markdown, just raw JSON) with the following keys:
            - "strengths": Array of strings (Top 3 strongest points, must be enthusiastic).
            - "improvements": Array of strings (Points with score < 2, construct them as areas for development. If none, suggest generic advanced improvements).
            - "recommendations": Array of strings (Actionable advice based on improvements).
            - "summary": String (A polite paragraph thanking the teacher and summarizing the performance level).

            Language: Arabic.
        `;

        try {
            const response = await genAI.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            
            const reportData = JSON.parse(response.text);
            setGeneratedReport(reportData);
        } catch (error) {
            console.error(error);
            alert("فشل توليد التقرير، يرجى المحاولة مرة أخرى");
        } finally {
            setIsGenerating(false);
        }
    };

    const saveVisit = () => {
        if (!generatedReport) return;
        
        const newVisit: Visit = {
            id: Date.now().toString(),
            ...formData,
            date: new Date().toISOString(),
            scores,
            report: generatedReport
        };
        
        addVisit(newVisit);
        alert("تم حفظ الزيارة بنجاح!");
        window.location.hash = "#visits";
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <ClipboardCheck className="text-blue-600" />
                استمارة زيارة إشرافية
            </h2>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم المعلم</label>
                    <input 
                        type="text" 
                        value={formData.teacherName} 
                        onChange={e => setFormData({...formData, teacherName: e.target.value})}
                        list="teachers-list"
                        className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="اختر أو اكتب اسم المعلم"
                    />
                    <datalist id="teachers-list">
                        {teachers.map(t => <option key={t.id} value={t.name} />)}
                    </datalist>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الصف</label>
                    <input 
                        type="text" 
                        value={formData.className} 
                        onChange={e => setFormData({...formData, className: e.target.value})}
                        className="w-full border-gray-300 rounded-lg shadow-sm p-2 border" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المادة</label>
                    <input 
                        type="text" 
                        value={formData.subject} 
                        onChange={e => setFormData({...formData, subject: e.target.value})}
                        className="w-full border-gray-300 rounded-lg shadow-sm p-2 border" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الدرس</label>
                    <input 
                        type="text" 
                        value={formData.topic} 
                        onChange={e => setFormData({...formData, topic: e.target.value})}
                        className="w-full border-gray-300 rounded-lg shadow-sm p-2 border" 
                        placeholder="مثال: المعادلات التربيعية"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-800">بنود التقييم</h3>
                {rubric.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition">
                        <div className="flex justify-between md:items-center flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-900">{item.category}</h4>
                                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                            </div>
                            <div className="flex gap-2 bg-gray-50 p-2 rounded-lg">
                                {[1, 2, 3, 4].map(score => (
                                    <button
                                        key={score}
                                        onClick={() => handleScoreChange(item.id, score)}
                                        className={`w-10 h-10 rounded-full font-bold transition ${
                                            scores[item.id] === score 
                                            ? 'bg-blue-600 text-white shadow-lg scale-105' 
                                            : 'bg-white text-gray-400 border hover:border-blue-400'
                                        }`}
                                    >
                                        {score}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-center pt-6">
                <button
                    onClick={generateAIReport}
                    disabled={isGenerating}
                    className="bg-gradient-to-l from-indigo-600 to-purple-600 text-white py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex items-center gap-2 font-bold text-lg disabled:opacity-50"
                >
                    {isGenerating ? 'جاري التحليل بالذكاء الاصطناعي...' : <><Star className="fill-current" /> إنشاء التقرير الذكي</>}
                </button>
            </div>

            {generatedReport && (
                <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-indigo-500 animate-fade-in">
                    <h3 className="text-2xl font-bold mb-6 text-center text-gray-800 border-b pb-4">تقرير الزيارة الفني</h3>
                    
                    <div className="mb-6 bg-indigo-50 p-4 rounded-lg text-indigo-900">
                        <p className="font-medium">{generatedReport.summary}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="flex items-center gap-2 font-bold text-green-700 mb-3 text-lg">
                                <span className="bg-green-100 p-1 rounded">👍</span> جوانب الإجادة
                            </h4>
                            <ul className="list-disc list-inside space-y-2 text-gray-700">
                                {generatedReport.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="flex items-center gap-2 font-bold text-orange-700 mb-3 text-lg">
                                <span className="bg-orange-100 p-1 rounded">🔨</span> فرص التحسين
                            </h4>
                            <ul className="list-disc list-inside space-y-2 text-gray-700">
                                {generatedReport.improvements.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8">
                        <h4 className="flex items-center gap-2 font-bold text-blue-700 mb-3 text-lg">
                            <span className="bg-blue-100 p-1 rounded">💡</span> التوصيات الفنية
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                             <ul className="list-decimal list-inside space-y-2 text-gray-700">
                                {generatedReport.recommendations.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-4 justify-end no-print">
                        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50 text-gray-700">
                            <Printer size={18} /> طباعة
                        </button>
                        <button onClick={saveVisit} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold shadow">
                             حفظ في السجل
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const TeachersList: React.FC = () => {
    const { teachers, updateTeacher } = useContext(AppContext);
    
    const addPoints = (id: string) => {
        const teacher = teachers.find(t => t.id === id);
        if (teacher) {
            updateTeacher({ ...teacher, points: teacher.points + 1 });
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Users /> قائمة المعلمين
            </h2>
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المادة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نقاط التميز</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {teachers.map(teacher => (
                            <tr key={teacher.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium">{teacher.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{teacher.subject}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-bold">
                                        {teacher.points}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                                    <button onClick={() => addPoints(teacher.id)} className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded">
                                        + شكر وتميز
                                    </button>
                                    <button 
                                        onClick={() => window.open(`https://wa.me/${teacher.phone}`, '_blank')}
                                        className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded"
                                    >
                                        تواصل
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 flex justify-end">
                <button onClick={() => window.print()} className="bg-gray-800 text-white px-4 py-2 rounded flex items-center gap-2">
                    <FileText size={18} /> تصدير التقرير
                </button>
            </div>
        </div>
    );
};

const SettingsPage: React.FC = () => {
    const { simulateSchedule } = useContext(AppContext);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        // In a real app, parse File object here.
        // For demo, we just simulate success.
        alert(`تم رفع ملف ${type} بنجاح! سيتم معالجة البيانات.`);
        if (type === 'Timetable') simulateSchedule();
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Settings /> الإعدادات
            </h2>
            
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow border">
                    <h3 className="font-bold text-lg mb-4 text-indigo-700">1. الجدول المدرسي (XML)</h3>
                    <p className="text-sm text-gray-500 mb-4">يرجى رفع ملف الجدول بصيغة XML ليقوم النظام بتوزيع الحصص.</p>
                    <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-indigo-600 focus:outline-none">
                        <span className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Upload className="text-gray-600" />
                            <span className="font-medium text-gray-600">اضغط لرفع ملف الجدول</span>
                        </span>
                        <input type="file" name="file_upload" className="hidden" accept=".xml" onChange={(e) => handleFileUpload(e, 'Timetable')} />
                    </label>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border">
                    <h3 className="font-bold text-lg mb-4 text-green-700">2. بنود التقييم (CSV/Excel)</h3>
                    <p className="text-sm text-gray-500 mb-4">رفع قاعدة بيانات بنود التقييم وتوصيفها.</p>
                    <label className="flex items-center justify-center w-full h-20 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-green-600">
                        <span className="font-medium text-gray-600 flex gap-2"><Upload/> رفع ملف البنود</span>
                        <input type="file" className="hidden" accept=".csv,.xlsx" onChange={(e) => handleFileUpload(e, 'Rubric')} />
                    </label>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border">
                    <h3 className="font-bold text-lg mb-4 text-orange-700">3. محاكاة النظام</h3>
                    <p className="text-sm text-gray-500 mb-4">توليد بيانات عشوائية لتجربة الخصائص.</p>
                    <button onClick={simulateSchedule} className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-bold w-full hover:bg-orange-200">
                        تشغيل محاكاة الحصص الدراسية
                    </button>
                </div>
            </div>
        </div>
    );
};

const VisitHistory: React.FC = () => {
    const { visits } = useContext(AppContext);

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <History /> سجل الزيارات
            </h2>
            <div className="grid gap-6">
                {visits.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">لا توجد زيارات مسجلة بعد.</p>
                ) : (
                    visits.map((visit) => (
                        <div key={visit.id} className="bg-white p-6 rounded-xl shadow border border-gray-200 print:break-inside-avoid">
                            <div className="flex justify-between items-start border-b pb-4 mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{visit.teacherName}</h3>
                                    <p className="text-gray-600">{visit.subject} - {visit.className}</p>
                                    <p className="text-sm text-gray-400">{new Date(visit.date).toLocaleDateString('ar-EG')}</p>
                                </div>
                                <div className="no-print flex gap-2">
                                     <button className="text-gray-500 hover:text-blue-600"><Share2 size={20}/></button>
                                     <button className="text-gray-500 hover:text-red-600"><Trash2 size={20}/></button>
                                </div>
                            </div>
                            <div className="prose max-w-none text-gray-700">
                                <p className="font-medium bg-gray-50 p-2 rounded">{visit.report.summary}</p>
                                <div className="grid md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <strong className="text-green-700">نقاط القوة:</strong>
                                        <ul className="list-disc list-inside text-sm">{visit.report.strengths.slice(0,2).map((s,i) => <li key={i}>{s}</li>)}</ul>
                                    </div>
                                    <div>
                                        <strong className="text-blue-700">التوصيات:</strong>
                                        <ul className="list-disc list-inside text-sm">{visit.report.recommendations.slice(0,2).map((s,i) => <li key={i}>{s}</li>)}</ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// --- Main App & Layout ---

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>(MOCK_TEACHERS);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [rubric, setRubric] = useState<RubricItem[]>(DEFAULT_RUBRIC);
  const [currentSchedule, setCurrentSchedule] = useState<ClassSession[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Hash Router simplified
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').split('?')[0];
      if (hash) setActiveTab(hash);
      else setActiveTab('dashboard');
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // init
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const simulateSchedule = () => {
    // Generate random classes
    const subjects = ['رياضيات', 'علوم', 'لغة عربية', 'دراسات', 'إنجليزي'];
    const newSchedule: ClassSession[] = [];
    const t = [...teachers];
    
    // Create 5 random sessions
    for(let i=1; i<=6; i++) {
        const teacher = t[Math.floor(Math.random() * t.length)];
        newSchedule.push({
            id: `s-${i}`,
            className: `${Math.floor(Math.random()*4)+5}/${Math.floor(Math.random()*5)+1}`, // e.g. 5/2
            teacherName: teacher.name,
            subject: teacher.subject,
            period: i,
            startTime: '08:00',
            endTime: '09:00'
        });
    }
    setCurrentSchedule(newSchedule);
  };

  const addVisit = (visit: Visit) => {
      setVisits([visit, ...visits]);
  };

  const updateTeacher = (updatedTeacher: Teacher) => {
      setTeachers(teachers.map(t => t.id === updatedTeacher.id ? updatedTeacher : t));
  };

  const renderContent = () => {
      switch(activeTab) {
          case 'dashboard': return <Dashboard />;
          case 'new-visit': return <SupervisionForm />;
          case 'teachers': return <TeachersList />;
          case 'visits': return <VisitHistory />;
          case 'settings': return <SettingsPage />;
          default: return <Dashboard />;
      }
  };

  return (
    <AppContext.Provider value={{ user, teachers, rubric, visits, currentSchedule, setTeachers, setRubric, addVisit, updateTeacher, simulateSchedule, isLoading }}>
      <AuthGuard>
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shadow-xl no-print">
                <div className="p-6 text-center border-b border-slate-700">
                    <h1 className="text-xl font-bold">المدير الذكي</h1>
                    <p className="text-xs text-slate-400 mt-1">نسخة المدير العام</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <a href="#dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}>
                        <LayoutDashboard size={20} /> الرئيسية
                    </a>
                    <a href="#new-visit" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'new-visit' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}>
                        <ClipboardCheck size={20} /> زيارة جديدة
                    </a>
                    <a href="#teachers" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'teachers' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}>
                        <Users size={20} /> المعلمون
                    </a>
                    <a href="#visits" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'visits' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}>
                        <History size={20} /> السجل
                    </a>
                    <a href="#settings" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}>
                        <Settings size={20} /> الإعدادات
                    </a>
                </nav>
                <div className="p-4 border-t border-slate-700">
                    <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-red-400 hover:text-red-300 w-full px-4 py-2">
                        <LogOut size={18} /> تسجيل خروج
                    </button>
                </div>
            </aside>

            {/* Mobile Nav */}
            <div className="md:hidden fixed bottom-0 w-full bg-white border-t z-50 flex justify-around p-3 no-print">
                <a href="#dashboard" className="text-slate-600 flex flex-col items-center"><LayoutDashboard size={24}/></a>
                <a href="#new-visit" className="text-blue-600 flex flex-col items-center"><ClipboardCheck size={24}/></a>
                <a href="#visits" className="text-slate-600 flex flex-col items-center"><History size={24}/></a>
                <a href="#settings" className="text-slate-600 flex flex-col items-center"><Settings size={24}/></a>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-auto pb-20 md:pb-0">
                <header className="bg-white shadow-sm p-4 flex justify-between items-center md:hidden no-print">
                    <h1 className="font-bold text-lg">المدير الذكي</h1>
                    <button onClick={() => signOut(auth)}><LogOut className="text-red-500"/></button>
                </header>
                {renderContent()}
            </main>
        </div>
      </AuthGuard>
    </AppContext.Provider>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
