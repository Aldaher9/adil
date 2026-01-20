import { Injectable, signal, computed, effect } from '@angular/core';

// Global declarations for CDN libraries
declare var firebase: any;
declare var XLSX: any;

export interface ViolationLog {
  date: string;
  label: string;
  points: number;
}

export interface Teacher {
  id: string;
  name: string;
  short: string;
  score: number;
  phone: string;
  lessons: Lesson[];
  violations?: ViolationLog[];
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

export interface ViolationType {
  id: string;
  label: string;
  points: number;
  icon: string;
}

// Evaluation Interface
export interface EvaluationCriteria {
    id: number;
    title: string;
    items: { [key: number]: { desc: string, rec: string } };
}

// History Interface
export interface SupervisionVisit {
    id: string;
    teacherName: string;
    className: string;
    topic: string;
    date: string;
    ratings: Record<number, number>;
    finalRecommendations?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SchoolStoreService {
  // --- State Signals ---
  teachers = signal<Teacher[]>([]);
  periods = signal<Period[]>([]);
  classes = signal<Record<string, string>>({});
  
  violationTypes = signal<ViolationType[]>([
    { id: 'late', label: 'تأخر عن الحصة', points: 5, icon: 'fa-clock' },
    { id: 'absent', label: 'غياب عن الحصة', points: 15, icon: 'fa-user-slash' },
    { id: 'phone', label: 'استخدام الهاتف', points: 3, icon: 'fa-mobile-alt' }
  ]);
  
  cloudStatus = signal<'connected' | 'saving' | 'error' | 'offline'>('offline');
  lastSync = signal<Date | null>(null);
  
  currentTime = signal<Date>(new Date());
  simulationOffset = signal<number>(0);

  // New: Evaluation Database
  evaluationDB = signal<EvaluationCriteria[]>([
      // Default initial data, will be overwritten by load
      { id: 1, title: "التحصيل الدراسي", items: {
          1: { desc: "اكتسب جميع الطلبة المهارات الأساسية...", rec: "تنفيذ مبادرة تربوية..." },
          // ... truncated for brevity, full list in logic
      }}
  ]);

  // New: History
  supervisionHistory = signal<SupervisionVisit[]>([]);

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
    
    return active.sort((a, b) => {
      const getGradeValue = (name: string): number => {
        const n = name.trim();
        if (n.match(/(الثاني|ثاني)\s*عشر/)) return 12;
        if (n.match(/(الحادي|حادي)\s*عشر/)) return 11;
        // ... (standard logic)
        const match = n.match(/\d+/);
        if (match) return parseInt(match[0], 10);
        return 999;
      };

      const valA = getGradeValue(a.className);
      const valB = getGradeValue(b.className);

      if (valA !== valB) return valA - valB;
      return a.className.localeCompare(b.className, 'ar', { numeric: true });
    });
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
        
        if(data.violationTypes) this.violationTypes.set(data.violationTypes);
        if(data.supervisionHistory) this.supervisionHistory.set(data.supervisionHistory);
        if(data.evaluationCriteria) this.evaluationDB.set(data.evaluationCriteria);

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
        violationTypes: this.violationTypes(),
        supervisionHistory: this.supervisionHistory(),
        evaluationCriteria: this.evaluationDB(),
        lastSync: new Date()
      });
      this.cloudStatus.set('connected');
      this.lastSync.set(new Date());
    } catch (e) {
      console.error("Sync error", e);
      this.cloudStatus.set('error');
    }
  }

  async updateTeacher(id: string, updates: Partial<{ name: string; short: string; phone: string; }>) {
    this.teachers.update(list =>
      list.map(t => (t.id === id ? { ...t, ...updates } : t))
    );
    await this.syncToCloud();
  }

  async dockScore(id: string, violation: ViolationType) {
    const todayStr = new Date().toLocaleDateString('ar-EG'); // Or 'en-CA' for ISO
    const logEntry: ViolationLog = {
        date: todayStr,
        label: violation.label,
        points: violation.points
    };

    this.teachers.update(list => 
      list.map(t => {
          if (t.id === id) {
              const currentViolations = t.violations || [];
              return { 
                  ...t, 
                  score: Math.max(0, t.score - violation.points),
                  violations: [logEntry, ...currentViolations]
              };
          }
          return t;
      })
    );
    await this.syncToCloud();
  }

  // --- Settings Operations ---
  
  async addViolationType(v: ViolationType) {
      this.violationTypes.update(list => [...list, v]);
      await this.syncToCloud();
  }

  async removeViolationType(id: string) {
      this.violationTypes.update(list => list.filter(x => x.id !== id));
      await this.syncToCloud();
  }

  exportToExcel() {
    if (typeof XLSX === 'undefined') {
        console.error('XLSX library not found');
        alert('حدث خطأ أثناء تهيئة مكتبة Excel.');
        return;
    }
    const data = this.teachers().map(t => {
        // Format violations log into a single string cell
        const violationsStr = (t.violations || [])
            .map(v => `[${v.date}] ${v.label} (-${v.points})`)
            .join(' \n '); // New line for excel cell

        return { 
            'المعلم': t.name, 
            'التقييم': t.score + '%', 
            'الهاتف': t.phone || '-',
            'سجل المخالفات': violationsStr || 'لا يوجد'
        };
    });
    
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Auto-width columns roughly
    const wscols = [
        {wch: 30}, // Name
        {wch: 10}, // Score
        {wch: 15}, // Phone
        {wch: 50}  // Violations log
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reports");
    XLSX.writeFile(wb, "School_Report_Advanced.xlsx");
  }

  // --- Import Logic ---
  parseXML(file: File) {
    // Standard XML Logic
  }
  importTeacherData(file: File) {
    // Standard Excel Logic
  }
  exportTeacherDataTemplate() {
      // Standard Excel Logic
  }
}