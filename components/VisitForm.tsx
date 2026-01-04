
import React, { useState } from 'react';
import { VisitReport, SupervisionItem, Teacher, SchoolData } from '../types';
import { generateAIReport } from '../services/geminiService';
import { Save, Sparkles, ChevronLeft, Check, Star, Info } from 'lucide-react';

interface Props {
  initialData: Partial<VisitReport> | null;
  formItems: SupervisionItem[];
  teachers: Teacher[];
  schoolData: SchoolData;
  onSave: (report: VisitReport) => void;
}

const VisitForm: React.FC<Props> = ({ initialData, formItems, teachers, schoolData, onSave }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<VisitReport>>({
    id: `V-${Date.now()}`,
    teacherId: initialData?.teacherId || '',
    teacherName: initialData?.teacherName || '',
    classId: initialData?.classId || '',
    periodId: initialData?.periodId || '',
    subject: initialData?.subject || '',
    lessonTitle: '',
    date: new Date().toISOString().split('T')[0],
    ratings: {},
    ...initialData
  });
  const [generating, setGenerating] = useState(false);

  const handleRatingChange = (itemId: string, rating: number) => {
    setFormData(prev => ({
      ...prev,
      ratings: { ...prev.ratings, [itemId]: rating }
    }));
  };

  const handleGenerateAI = async () => {
    if (!formData.lessonTitle) {
      alert("الرجاء إدخال عنوان الدرس أولاً");
      return;
    }
    
    setGenerating(true);
    const aiResult = await generateAIReport(formData, formItems, formData.subject || '');
    if (aiResult) {
      setFormData(prev => ({ ...prev, aiReport: aiResult }));
      setStep(3);
    } else {
      alert("فشل في توليد التقرير الذكي");
    }
    setGenerating(false);
  };

  const calculateAverage = () => {
    const vals = Object.values(formData.ratings || {}) as number[];
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">تسجيل زيارة إشرافية</h1>
        <div className="flex items-center gap-2">
           {[1, 2, 3].map(s => (
             <div key={s} className={`w-10 h-2 rounded-full transition-all ${step >= s ? 'bg-indigo-600' : 'bg-slate-200'}`} />
           ))}
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 block">المعلم والمادة</label>
              <input value={`${formData.teacherName} - ${formData.subject}`} disabled className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black text-slate-700" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 block">عنوان الدرس</label>
              <input 
                placeholder="أدخل عنوان الدرس..." 
                value={formData.lessonTitle}
                onChange={e => setFormData({...formData, lessonTitle: e.target.value})}
                className="w-full border border-slate-200 p-4 rounded-2xl font-black text-slate-700 focus:ring-2 ring-indigo-500 outline-none" 
              />
            </div>
          </div>
          <button onClick={() => setStep(2)} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2">
            <span>بدء التقييم الفني</span>
            <ChevronLeft size={20} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          {formItems.map((item) => {
            const currentRating = formData.ratings?.[item.id] as keyof typeof item.descriptions;
            const description = currentRating ? item.descriptions[currentRating] : null;

            return (
              <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Star size={18} fill="currentColor" />
                   </div>
                   <h4 className="font-black text-slate-800">{item.category}</h4>
                </div>
                
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => handleRatingChange(item.id, lvl)}
                      className={`flex-1 py-3 rounded-xl font-black transition-all border-2 ${
                        formData.ratings?.[item.id] === lvl 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' 
                        : 'bg-slate-50 text-slate-400 border-transparent hover:border-indigo-200'
                      }`}
                    >
                      {lvl === 1 ? 'متميز' : lvl === 2 ? 'جيد' : lvl === 3 ? 'ملائم' : lvl === 4 ? 'ضعيف' : 'تدخل'}
                    </button>
                  ))}
                </div>

                {description && (
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 animate-in fade-in slide-in-from-top-2">
                    <Info className="text-amber-600 shrink-0" size={20} />
                    <p className="text-sm font-bold text-amber-800 leading-relaxed">{description}</p>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex gap-4 sticky bottom-4">
            <button onClick={() => setStep(1)} className="flex-1 bg-white border border-slate-200 py-4 rounded-2xl font-black text-slate-500 shadow-lg">السابق</button>
            <button 
              disabled={generating || Object.keys(formData.ratings || {}).length < formItems.length}
              onClick={handleGenerateAI}
              className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
            >
              {generating ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <Sparkles size={22} className="text-amber-400" />}
              <span>{generating ? 'جاري الصياغة الذكية...' : 'توليد التقرير النهائي'}</span>
            </button>
          </div>
        </div>
      )}

      {step === 3 && formData.aiReport && (
        <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-2xl space-y-8">
          <div className="text-center pb-6 border-b border-slate-100">
            <h2 className="text-3xl font-black text-indigo-600 mb-2">تقرير الزيارة الإشرافية</h2>
            <p className="text-slate-400 font-bold">المعلم: {formData.teacherName} | {formData.subject}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-emerald-600 font-black"><Check size={20} /> جوانب الإجادة</h4>
              <ul className="space-y-2">
                {formData.aiReport.strengths.map((s, i) => (
                  <li key={i} className="bg-emerald-50 p-4 rounded-2xl text-emerald-800 text-sm font-bold">{s}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-rose-600 font-black">⚡ أولويات التطوير</h4>
              <ul className="space-y-2">
                {formData.aiReport.improvements.map((s, i) => (
                  <li key={i} className="bg-rose-50 p-4 rounded-2xl text-rose-800 text-sm font-bold">{s}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
            <h4 className="text-indigo-800 font-black mb-3">التوصيات التنفيذية</h4>
            <p className="text-indigo-900 text-sm font-medium leading-loose">{formData.aiReport.recommendations}</p>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setStep(2)} className="flex-1 bg-white border border-slate-200 py-4 rounded-2xl font-black text-slate-400">تعديل</button>
            <button onClick={() => onSave({ ...formData, totalAverage: calculateAverage() } as VisitReport)} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl">
              <Save size={22} /> <span>حفظ وتصدير PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitForm;
