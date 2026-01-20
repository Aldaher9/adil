import { Injectable, signal, computed, effect } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Global declarations for CDN libraries
declare var firebase: any;
declare var XLSX: any;

// ============ Interfaces ============

export interface ViolationLog {
  id: string;
  date: string;
  label: string;
  points: number;
  teacherId: string;
  createdBy?: string;
  notes?: string;
}

export interface Teacher {
  id: string;
  name: string;
  short: string;
  score: number;
  phone: string;
  email?: string;
  department?: string;
  specialization?: string;
  hireDate?: string;
  lessons: Lesson[];
  violations?: ViolationLog[];
  achievements?: Achievement[];
  avatar?: string;
}

export interface Lesson {
  day: number;
  period: number;
  className: string;
  subject?: string;
}

export interface Period {
  id: string;
  start: string;
  end: string;
  label?: string;
}

export interface ViolationType {
  id: string;
  label: string;
  points: number;
  icon: string;
  color?: string;
  category?: 'attendance' | 'behavior' | 'performance' | 'other';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  points: number;
  icon?: string;
}

export interface EvaluationCriteria {
  id: number;
  title: string;
  items: { [key: number]: { desc: string; rec: string } };
}

export interface SupervisionVisit {
  id: string;
  teacherId: string;
  teacherName: string;
  className: string;
  subject?: string;
  topic: string;
  date: string;
  time: string;
  ratings: Record<number, number>;
  finalRecommendations?: string;
  strengths?: string[];
  improvements?: string[];
  overallScore?: number;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export interface DashboardStats {
  totalTeachers: number;
  activeClasses: number;
  averageScore: number;
  todayViolations: number;
  weeklyTrend: number;
  topPerformers: Teacher[];
  needsAttention: Teacher[];
}

export interface AttendanceRecord {
  id: string;
  teacherId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}

// ============ Service ============

@Injectable({
  providedIn: 'root'
})
export class SchoolStoreService {
  // --- State Signals ---
  teachers = signal<Teacher[]>([]);
  periods = signal<Period[]>([]);
  classes = signal<Record<string, string>>({});
  attendanceRecords = signal<AttendanceRecord[]>([]);
  
  violationTypes = signal<ViolationType[]>([
    { id: 'late', label: 'تأخر عن الحصة', points: 5, icon: 'fa-clock', color: 'amber', category: 'attendance' },
    { id: 'absent', label: 'غياب عن الحصة', points: 15, icon: 'fa-user-slash', color: 'red', category: 'attendance' },
    { id: 'phone', label: 'استخدام الهاتف', points: 3, icon: 'fa-mobile-alt', color: 'orange', category: 'behavior' },
    { id: 'unprepared', label: 'عدم التحضير', points: 10, icon: 'fa-book-open', color: 'purple', category: 'performance' },
    { id: 'late-grading', label: 'تأخر في التصحيح', points: 7, icon: 'fa-clipboard-check', color: 'indigo', category: 'performance' }
  ]);
  
  cloudStatus = signal<'connected' | 'saving' | 'error' | 'offline'>('offline');
  lastSync = signal<Date | null>(null);
  
  currentTime = signal<Date>(new Date());
  simulationOffset = signal<number>(0);

  // Theme Support
  currentTheme = signal<'light' | 'dark'>('light');
  
  // Notifications
  notifications = signal<Notification[]>([]);
  
  // Evaluation Database
  evaluationDB = signal<EvaluationCriteria[]>([]);

  // Supervision History
  supervisionHistory = signal<SupervisionVisit[]>([]);

  // Settings
  schoolSettings = signal<{
    schoolName: string;
    academicYear: string;
    semester: string;
    workingDays: number[];
    passScore: number;
  }>({
    schoolName: 'مدرسة النموذجية',
    academicYear: '2024-2025',
    semester: 'الفصل الأول',
    workingDays: [1, 2, 3, 4, 5], // Sunday to Thursday
    passScore: 70
  });

  private db: any;
  private notificationSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationSubject.asObservable();

  constructor() {
    this.initFirebase();
    this.startClock();
    this.loadFromCloud();
    this.loadTheme();
    this.setupAutoSync();
  }

  // ============ Core Logic ============

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
      this.addNotification('success', 'تم الاتصال', 'تم الاتصال بقاعدة البيانات بنجاح');
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

  private setupAutoSync() {
    // Auto-sync every 5 minutes
    setInterval(() => {
      if (this.cloudStatus() === 'connected') {
        this.syncToCloud();
      }
    }, 5 * 60 * 1000);
  }

  addSimulationHour() {
    this.simulationOffset.update(v => v + 3600000);
    this.currentTime.set(new Date(new Date().getTime() + this.simulationOffset()));
  }

  // ============ Computed State ============

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
    const active: { teacher: Teacher; className: string; subject?: string }[] = [];

    this.teachers().forEach(t => {
      const l = t.lessons.find(ls => ls.day === d && ls.period === pId);
      if (l) {
        active.push({ teacher: t, className: l.className, subject: l.subject });
      }
    });
    
    return active.sort((a, b) => {
      const getGradeValue = (name: string): number => {
        const n = name.trim();
        if (n.match(/(الثاني|ثاني)\s*عشر/)) return 12;
        if (n.match(/(الحادي|حادي)\s*عشر/)) return 11;
        if (n.match(/(العاشر|عاشر)/)) return 10;
        if (n.match(/(التاسع|تاسع)/)) return 9;
        if (n.match(/(الثامن|ثامن)/)) return 8;
        if (n.match(/(السابع|سابع)/)) return 7;
        if (n.match(/(السادس|سادس)/)) return 6;
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

  // Dashboard Statistics
  dashboardStats = computed<DashboardStats>(() => {
    const teachers = this.teachers();
    const total = teachers.length;
    const active = this.activeLessons().length;
    const avgScore = total > 0 
      ? Math.round(teachers.reduce((sum, t) => sum + t.score, 0) / total) 
      : 0;

    const today = new Date().toLocaleDateString('ar-EG');
    const todayViolations = teachers.reduce((sum, t) => {
      const todayV = (t.violations || []).filter(v => v.date === today);
      return sum + todayV.length;
    }, 0);

    // Get top 3 performers
    const topPerformers = [...teachers]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Get teachers needing attention (score < 70)
    const needsAttention = teachers
      .filter(t => t.score < 70)
      .sort((a, b) => a.score - b.score);

    return {
      totalTeachers: total,
      activeClasses: active,
      averageScore: avgScore,
      todayViolations,
      weeklyTrend: 0, // Can be calculated based on weekly data
      topPerformers,
      needsAttention
    };
  });

  // ============ Data Operations ============

  async loadFromCloud() {
    if (!this.db) return;
    try {
      const doc = await this.db.collection("school_settings").doc("timetable").get();
      if (doc.exists) {
        const data = doc.data();
        this.teachers.set(data.teachers || []);
        this.periods.set(data.periods || []);
        this.classes.set(data.classes || {});
        this.attendanceRecords.set(data.attendanceRecords || []);
        
        if (data.violationTypes) this.violationTypes.set(data.violationTypes);
        if (data.supervisionHistory) this.supervisionHistory.set(data.supervisionHistory);
        if (data.evaluationCriteria) this.evaluationDB.set(data.evaluationCriteria);
        if (data.schoolSettings) this.schoolSettings.set(data.schoolSettings);

        this.cloudStatus.set('connected');
        this.lastSync.set(new Date());
      }
    } catch (e) {
      console.error("Load error", e);
      this.cloudStatus.set('error');
      this.addNotification('error', 'خطأ في التحميل', 'فشل تحميل البيانات من السحابة');
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
        schoolSettings: this.schoolSettings(),
        attendanceRecords: this.attendanceRecords(),
        lastSync: new Date()
      });
      this.cloudStatus.set('connected');
      this.lastSync.set(new Date());
    } catch (e) {
      console.error("Sync error", e);
      this.cloudStatus.set('error');
      this.addNotification('error', 'خطأ في المزامنة', 'فشل حفظ البيانات');
    }
  }

  async updateTeacher(id: string, updates: Partial<Teacher>) {
    this.teachers.update(list =>
      list.map(t => (t.id === id ? { ...t, ...updates } : t))
    );
    await this.syncToCloud();
    this.addNotification('success', 'تم التحديث', `تم تحديث بيانات المعلم بنجاح`);
  }

  async addTeacher(teacher: Omit<Teacher, 'id'>) {
    const newTeacher: Teacher = {
      ...teacher,
      id: this.generateId(),
      score: teacher.score || 100,
      lessons: teacher.lessons || [],
      violations: []
    };
    
    this.teachers.update(list => [...list, newTeacher]);
    await this.syncToCloud();
    this.addNotification('success', 'إضافة معلم', `تم إضافة ${newTeacher.name} بنجاح`);
  }

  async removeTeacher(id: string) {
    const teacher = this.teachers().find(t => t.id === id);
    this.teachers.update(list => list.filter(t => t.id !== id));
    await this.syncToCloud();
    this.addNotification('info', 'حذف معلم', `تم حذف ${teacher?.name || 'المعلم'}`);
  }

  async dockScore(id: string, violation: ViolationType) {
    const todayStr = new Date().toLocaleDateString('ar-EG');
    const logEntry: ViolationLog = {
      id: this.generateId(),
      date: todayStr,
      label: violation.label,
      points: violation.points,
      teacherId: id
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
    
    const teacher = this.teachers().find(t => t.id === id);
    this.addNotification('warning', 'تسجيل مخالفة', 
      `تم تسجيل مخالفة "${violation.label}" للمعلم ${teacher?.name}`);
  }

  async addAchievement(teacherId: string, achievement: Omit<Achievement, 'id'>) {
    const newAchievement: Achievement = {
      ...achievement,
      id: this.generateId()
    };

    this.teachers.update(list =>
      list.map(t => {
        if (t.id === teacherId) {
          return {
            ...t,
            score: Math.min(100, t.score + achievement.points),
            achievements: [...(t.achievements || []), newAchievement]
          };
        }
        return t;
      })
    );

    await this.syncToCloud();
    const teacher = this.teachers().find(t => t.id === teacherId);
    this.addNotification('success', 'إنجاز جديد', 
      `تم تسجيل إنجاز للمعلم ${teacher?.name}`);
  }

  // ============ Attendance ============

  async recordAttendance(record: Omit<AttendanceRecord, 'id'>) {
    const newRecord: AttendanceRecord = {
      ...record,
      id: this.generateId()
    };

    this.attendanceRecords.update(list => [...list, newRecord]);
    await this.syncToCloud();
  }

  getTeacherAttendance(teacherId: string, startDate?: string, endDate?: string) {
    let records = this.attendanceRecords().filter(r => r.teacherId === teacherId);
    
    if (startDate) {
      records = records.filter(r => r.date >= startDate);
    }
    if (endDate) {
      records = records.filter(r => r.date <= endDate);
    }

    return records;
  }

  // ============ Settings Operations ============
  
  async addViolationType(v: ViolationType) {
    this.violationTypes.update(list => [...list, v]);
    await this.syncToCloud();
  }

  async removeViolationType(id: string) {
    this.violationTypes.update(list => list.filter(x => x.id !== id));
    await this.syncToCloud();
  }

  async updateSchoolSettings(settings: Partial<typeof this.schoolSettings>) {
    this.schoolSettings.update(current => ({ ...current, ...settings }));
    await this.syncToCloud();
  }

  // ============ Theme ============

  toggleTheme() {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.currentTheme.set(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  }

  private loadTheme() {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    this.currentTheme.set(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }

  // ============ Notifications ============

  addNotification(type: Notification['type'], title: string, message: string) {
    const notification: Notification = {
      id: this.generateId(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false
    };

    this.notifications.update(list => [notification, ...list].slice(0, 50)); // Keep last 50
    this.notificationSubject.next(this.notifications());
  }

  markNotificationAsRead(id: string) {
    this.notifications.update(list =>
      list.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  clearAllNotifications() {
    this.notifications.set([]);
    this.notificationSubject.next([]);
  }

  // ============ Export/Import ============

  exportToExcel() {
    if (typeof XLSX === 'undefined') {
      console.error('XLSX library not found');
      this.addNotification('error', 'خطأ', 'حدث خطأ أثناء تهيئة مكتبة Excel');
      return;
    }

    const data = this.teachers().map(t => {
      const violationsStr = (t.violations || [])
        .map(v => `[${v.date}] ${v.label} (-${v.points})`)
        .join('\n');

      return { 
        'المعلم': t.name,
        'القسم': t.department || '-',
        'التخصص': t.specialization || '-',
        'التقييم': t.score + '%', 
        'الهاتف': t.phone || '-',
        'البريد الإلكتروني': t.email || '-',
        'سجل المخالفات': violationsStr || 'لا يوجد'
      };
    });
    
    const ws = XLSX.utils.json_to_sheet(data);
    
    const wscols = [
      { wch: 25 }, // Name
      { wch: 15 }, // Department
      { wch: 20 }, // Specialization
      { wch: 10 }, // Score
      { wch: 15 }, // Phone
      { wch: 25 }, // Email
      { wch: 50 }  // Violations
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تقرير المعلمين");
    
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `School_Report_${date}.xlsx`);
    
    this.addNotification('success', 'تصدير ناجح', 'تم تصدير التقرير بنجاح');
  }

  // ============ Utilities ============

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  parseXML(file: File) {
    // XML parsing logic
  }

  importTeacherData(file: File) {
    // Excel import logic
  }

  exportTeacherDataTemplate() {
    // Template export logic
  }
}
