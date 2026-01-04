
import React from 'react';
import { SchoolData, SupervisionItem, Teacher } from '../types';
import { Upload, Download, FileCode, Users, Database, FileJson } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  schoolData: SchoolData;
  setSchoolData: (d: SchoolData) => void;
  supervisionForm: SupervisionItem[];
  setSupervisionForm: (f: SupervisionItem[]) => void;
  teachers: Teacher[];
  setTeachers: (t: Teacher[]) => void;
}

const Settings: React.FC<Props> = ({ 
  schoolData, setSchoolData, 
  supervisionForm, setSupervisionForm,
  teachers, setTeachers 
}) => {

  const handleTimetableXML = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(event.target?.result as string, "text/xml");
      
      const newTeachers: Record<string, string> = {};
      const newClasses: Record<string, string> = {};
      const newSubjects: Record<string, string> = {};
      const newPeriods: any[] = [];
      const newLessons: any[] = [];

      xml.querySelectorAll('teacher').forEach(t => {
        const id = t.getAttribute('id');
        const name = t.getAttribute('name');
        if (id && name) newTeachers[id] = name;
      });

      xml.querySelectorAll('class').forEach(c => {
        const id = c.getAttribute('id');
        const name = c.getAttribute('short');
        if (id && name) newClasses[id] = name;
      });

      xml.querySelectorAll('subject').forEach(s => {
        const id = s.getAttribute('id');
        const name = s.getAttribute('name');
        if (id && name) newSubjects[id] = name;
      });

      xml.querySelectorAll('period').forEach(p => {
        newPeriods.push({
          id: p.getAttribute('period'),
          startTime: p.getAttribute('starttime'),
          endTime: p.getAttribute('endtime')
        });
      });

      xml.querySelectorAll('TimeTableSchedule').forEach(l => {
        newLessons.push({
          day: l.getAttribute('DayID'),
          periodId: l.getAttribute('Period'),
          classId: l.getAttribute('ClassID'),
          teacherId: l.getAttribute('TeacherID'),
          subject: l.getAttribute('SubjectGradeID')
        });
      });

      setSchoolData({
        teachers: newTeachers,
        classes: newClasses,
        subjects: newSubjects,
        periods: newPeriods,
        lessons: newLessons
      });
      alert("تم رفع الجدول بنجاح ✅");
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleSupervisionJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawJson = JSON.parse(event.target?.result as string);
        // التعامل مع الهيكل الذي تكون فيه البيانات هي المفاتيح
        const textData = Object.keys(rawJson)[0];
        
        // تقسيم النص بناءً على أرقام البنود (مثال: 1- التحصيل، 2- التقدم...)
        const criteriaRegex = /(\d+-\s[^\n]+)/g;
        const criteriaNames = textData.match(criteriaRegex) || [];
        const criteriaBlocks = textData.split(criteriaRegex).filter(b => b.trim().length > 20);

        const formItems: SupervisionItem[] = criteriaNames.map((name, index) => {
          const block = criteriaBlocks[index] || "";
          
          const extractLevel = (levelNum: number) => {
            const startKey = levelNum === 1 ? "متميز (1)" : 
                             levelNum === 2 ? "جيد (2)" : 
                             levelNum === 3 ? "ملائم (3)" : 
                             levelNum === 4 ? "غير ملائم (4)" : "يحتاج إلى تدخل (5)";
            
            const nextKey = levelNum < 5 ? (levelNum === 1 ? "جيد (2)" : 
                                            levelNum === 2 ? "ملائم (3)" : 
                                            levelNum === 3 ? "غير ملائم (4)" : "يحتاج إلى تدخل (5)") : null;

            const startIdx = block.indexOf(startKey);
            if (startIdx === -1) return "لا يوجد وصف";
            
            const endIdx = nextKey ? block.indexOf(nextKey) : block.length;
            return block.substring(startIdx + startKey.length, endIdx).trim().replace(/^-/, '').trim();
          };

          return {
            id: `item-${index + 1}`,
            category: name.trim(),
            descriptions: {
              1: extractLevel(1),
              2: extractLevel(2),
              3: extractLevel(3),
              4: extractLevel(4),
              5: extractLevel(5),
            }
          };
        });

        setSupervisionForm(formItems);
        alert(`تم تحليل ${formItems.length} معيار تقييم بنجاح ✅`);
      } catch (error) {
        console.error(error);
        alert("خطأ في تحليل ملف JSON. تأكد من الصيغة الصحيحة.");
      }
    };
    reader.readAsText(file);
  };

  const exportTeachers = () => {
    const list = Object.entries(schoolData.teachers).map(([id, name]) => {
      const existing = teachers.find(t => t.id === id);
      return {
        'معرف المعلم': id,
        'اسم المعلم': name,
        'رقم الهاتف': existing?.phone || ''
      };
    });
    const ws = XLSX.utils.json_to_sheet(list);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المعلمون");
    XLSX.writeFile(wb, "قائمة_المعلمين.xlsx");
  };

  const importTeachers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet) as any[];
      
      const updatedTeachers: Teacher[] = json.map(row => ({
        id: String(row['معرف المعلم']),
        name: row['اسم المعلم'],
        phone: String(row['رقم الهاتف'] || ''),
        notes: [],
        infractions: [],
        points: 0
      }));

      setTeachers(updatedTeachers);
      alert("تم تحديث قائمة المعلمين بنجاح ✅");
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">الإعدادات والربط</h1>
        <p className="text-slate-500 font-medium">إدارة قواعد البيانات والملفات المرجعية للنظام</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Timetable XML */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <FileCode size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900">ملف الجدول (XML)</h3>
          </div>
          <p className="text-slate-400 text-sm font-medium leading-relaxed">
            قم برفع ملف الجدول المصدّر من البرنامج المدرسي لربط الحصص والمعلمين والفصول.
          </p>
          <div className="pt-4">
            <label className="flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl font-bold cursor-pointer hover:bg-indigo-600 transition-colors">
              <Upload size={20} />
              <span>رفع ملف XML</span>
              <input type="file" accept=".xml" onChange={handleTimetableXML} className="hidden" />
            </label>
          </div>
        </div>

        {/* Supervision Form JSON */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <FileJson size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900">معايير الزيارة (JSON)</h3>
          </div>
          <p className="text-slate-400 text-sm font-medium leading-relaxed">
            ارفع ملف JSON الذي يحتوي على البنود وتوصيفاتها (متميز، جيد...) لتفعيل التقييم الذكي.
          </p>
          <div className="pt-4">
            <label className="flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 rounded-2xl font-bold cursor-pointer hover:bg-indigo-700 transition-colors">
              <Upload size={20} />
              <span>رفع ملف JSON</span>
              <input type="file" accept=".json" onChange={handleSupervisionJSON} className="hidden" />
            </label>
          </div>
          {supervisionForm.length > 0 && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold bg-emerald-50 p-3 rounded-xl">
              <Database size={16} />
              <span>تم تحميل {supervisionForm.length} معيار بنجاح</span>
            </div>
          )}
        </div>

        {/* Teacher Management */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900">إدارة أرقام المعلمين</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <button onClick={exportTeachers} className="flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-colors">
              <Download size={20} />
              <span>تنزيل قائمة المعلمين</span>
            </button>
            <label className="flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl font-bold cursor-pointer hover:bg-indigo-600 transition-colors">
              <Upload size={20} />
              <span>رفع القائمة المحدثة</span>
              <input type="file" accept=".xlsx,.xls" onChange={importTeachers} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
