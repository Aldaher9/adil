
export interface Criterion {
  "المعيار / البند": string;
  "وصف المعيار": string;
  "الحكم": string;
  "الوصف السلوكي لجوانب الإجادة / أولويات التطوير": string;
  "التوصيات": string;
}

export interface Teacher {
  id: string;
  name: string;
  phone: string;
  subject?: string;
}

export interface Period {
  id: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
}

export interface Lesson {
  day: string; // Sunday, Monday...
  periodId: string;
  classId: string;
  teacherId: string;
  subjectId: string;
}

export interface Visit {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string;
  class: string;
  subject: string;
  ratings: Record<string, string>; // Standard Name -> Rating String (e.g., "متميز (1)")
  notes: string;
}

export enum AppTab {
  DASHBOARD = 'dashboard',
  SCHEDULE = 'schedule',
  STAFF = 'staff',
  VISITS = 'visits',
  REPORTS = 'reports'
}
