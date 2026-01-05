import { Injectable, signal, computed, effect } from '@angular/core';

// Global declarations for CDN libraries
declare var firebase: any;
declare var XLSX: any;

export interface Teacher {
  id: string;
  name: string;
  short: string;
  score: number;
  phone: string;
  lessons: Lesson[];
}

export interface Lesson {
  day: number;
  period: number;
  className: string;
}

export interface Period {
  id: string;
  start: string;
  end: string;
}

@Injectable({
  providedIn: 'root'
})
export class SchoolStoreService {
  // --- State Signals ---
  teachers = signal<Teacher[]>([]);
  periods = signal<Period[]>([]);
  classes = signal<Record<string, string>>({});
  
  cloudStatus = signal<'connected' | 'saving' | 'error' | 'offline'>('offline');
  lastSync = signal<Date | null>(null);
  
  // Simulation Logic
  currentTime = signal<Date>(new Date());
  simulationOffset = signal<number>(0);

  // Firestore DB Reference
  private db: any;

  constructor() {
    this.initFirebase();
    this.startClock();
    this.loadFromCloud();
  }

  // --- Core Logic ---

  private initFirebase() {
    const firebaseConfig = {
        apiKey: "AIzaSyC4NddjijF29YNhowy4SqgRaMPn01oSSEg",
        authDomain: "school-9416e.firebaseapp.com",
        projectId: "school-9416e",
        storageBucket: "school-9416e.firebasestorage.app",
        messagingSenderId: "680872052240",
        appId: "1:680872052240:web:96d2e544166ab5f8096c95",
        measurementId: "G-5EBTV0MV83"
    };
    
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      this.db = firebase.firestore();
      this.cloudStatus.set('connected');
    } else if (typeof firebase !== 'undefined') {
       this.db = firebase.firestore();
       this.cloudStatus.set('connected');
    }
  }

  private startClock() {
    setInterval(() => {
      this.currentTime.set(new Date(new Date().getTime() + this.simulationOffset()));
    }, 1000);
  }

  addSimulationHour() {
    this.simulationOffset.update(v => v + 3600000);
    // Immediately update current time to reflect change without waiting for interval
    this.currentTime.set(new Date(new Date().getTime() + this.simulationOffset()));
  }

  // --- Computed State ---

  currentPeriod = computed(() => {
    const now = this.currentTime();
    const mins = now.getHours() * 60 + now.getMinutes();
    
    return this.periods().find(p => {
      const [sh, sm] = p.start.split(':').map(Number);
      const [eh, em] = p.end.split(':').map(Number);
      const startMins = sh * 60 + sm;
      const endMins = eh * 60 + em;
      return mins >= startMins && mins <= endMins;
    });
  });

  currentDayId = computed(() => {
    // 0=Sun, 6=Sat in JS. Assuming school Week: Sun=1, Mon=2...
    // Adjust based on typical regional settings. standard JS getDay(): Sun=0.
    // Let's assume the XML data uses 1=Sunday, 2=Monday.
    return this.currentTime().getDay() + 1;
  });

  activeLessons = computed(() => {
    const p = this.currentPeriod();
    const d = this.currentDayId();

    if (!p) return [];

    const pId = parseInt(p.id);
    const active: { teacher: Teacher, className: string }[] = [];

    this.teachers().forEach(t => {
      const l = t.lessons.find(ls => ls.day === d && ls.period === pId);
      if (l) {
        active.push({ teacher: t, className: l.className });
      }
    });
    
    // Sort by class name numeric (1/1, 1/2, 2/1...)
    return active.sort((a, b) => a.className.localeCompare(b.className, 'ar', { numeric: true }));
  });


  // --- Data Operations ---

  async loadFromCloud() {
    if (!this.db) return;
    try {
      const doc = await this.db.collection("school_settings").doc("timetable").get();
      if (doc.exists) {
        const data = doc.data();
        this.teachers.set(data.teachers || []);
        this.periods.set(data.periods || []);
        this.classes.set(data.classes || {});
        this.cloudStatus.set('connected');
      }
    } catch (e) {
      console.error("Load error", e);
      this.cloudStatus.set('error');
    }
  }

  async syncToCloud() {
    if (!this.db) return;
    this.cloudStatus.set('saving');
    try {
      await this.db.collection("school_settings").doc("timetable").set({
        teachers: this.teachers(),
        periods: this.periods(),
        classes: this.classes(),
        lastSync: new Date()
      });
      this.cloudStatus.set('connected');
      this.lastSync.set(new Date());
    } catch (e) {
      console.error("Sync error", e);
      this.cloudStatus.set('error');
    }
  }

  async updateTeacherPhone(id: string, phone: string) {
    this.teachers.update(list => 
      list.map(t => t.id === id ? { ...t, phone } : t)
    );
    await this.syncToCloud();
  }

  async dockScore(id: string, amount: number) {
    this.teachers.update(list => 
      list.map(t => t.id === id ? { ...t, score: Math.max(0, t.score - amount) } : t)
    );
    await this.syncToCloud();
  }

  exportToExcel() {
    if (typeof XLSX === 'undefined') return;
    
    const data = this.teachers().map(t => ({
      'المعلم': t.name,
      'التقييم': t.score + '%',
      'الهاتف': t.phone || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teachers");
    XLSX.writeFile(wb, "School_Report.xlsx");
  }

  // --- XML Parser ---
  
  parseXML(file: File) {
    const reader = new FileReader();
    // Using windows-1256 for Arabic XML support as per original
    reader.readAsText(file, "windows-1256");
    
    reader.onload = async (e: any) => {
      try {
        const parser = new DOMParser();
        const xml = parser.parseFromString(e.target.result, "text/xml");

        // Parse Periods
        const newPeriods = Array.from(xml.querySelectorAll('periods period')).map(p => ({
            id: p.getAttribute('period')!, 
            start: p.getAttribute('starttime')!, 
            end: p.getAttribute('endtime')!
        }));

        // Parse Classes
        const newClasses: Record<string, string> = {};
        xml.querySelectorAll('classes class').forEach(c => {
          newClasses[c.getAttribute('id')!] = c.getAttribute('name')!;
        });

        // Parse Teachers
        const newTeachers = Array.from(xml.querySelectorAll('teachers teacher')).map(t => ({
            id: t.getAttribute('id')!, 
            name: t.getAttribute('name')!, 
            short: t.getAttribute('short')!,
            score: 100, 
            phone: '', 
            lessons: [] as Lesson[]
        }));

        // Parse Schedule
        xml.querySelectorAll('TimeTableSchedules TimeTableSchedule').forEach(sch => {
            const tId = sch.getAttribute('TeacherID');
            const teacher = newTeachers.find(x => x.id === tId);
            if(teacher) {
              teacher.lessons.push({ 
                day: parseInt(sch.getAttribute('DayID')!), 
                period: parseInt(sch.getAttribute('Period')!), 
                className: newClasses[sch.getAttribute('ClassID')!] || 'نشاط' 
              });
            }
        });

        // Update State
        this.periods.set(newPeriods);
        this.classes.set(newClasses);
        this.teachers.set(newTeachers);

        await this.syncToCloud();
        alert("تم استيراد الجدول بنجاح!");

      } catch (err) {
        console.error("XML Parse Error", err);
        alert("خطأ في قراءة ملف XML");
      }
    };
  }

  // --- Advanced Teacher Data Import/Export ---

  exportTeacherDataTemplate() {
    if (typeof XLSX === 'undefined') return alert('المكتبة غير محملة');

    const data = this.teachers().map(t => ({
      'Teacher_ID': t.id,
      'Short_Name': t.short,
      'Full_Name': t.name,
      'Phone': t.phone
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teachers_Data");
    XLSX.writeFile(wb, "Teachers_Data_Template.xlsx");
  }

  importTeacherData(file: File) {
    if (typeof XLSX === 'undefined') return alert('المكتبة غير محملة');

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const json = XLSX.utils.sheet_to_json(worksheet);

        this.teachers.update(teachers => {
          return teachers.map(t => {
            // Find row by ID
            const row: any = json.find((r: any) => r['Teacher_ID'] == t.id);
            if (row) {
              return {
                ...t,
                name: row['Full_Name'] || t.name,
                phone: row['Phone'] ? String(row['Phone']) : t.phone
              };
            }
            return t;
          });
        });

        await this.syncToCloud();
        alert('تم تحديث بيانات المعلمين بنجاح');
      } catch (err) {
        console.error(err);
        alert('خطأ في قراءة ملف Excel');
      }
    };
    reader.readAsArrayBuffer(file);
  }
}
