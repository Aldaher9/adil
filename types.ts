
export interface Teacher {
  id: string;
  name: string;
  phone: string;
  notes: string[];
  infractions: Infraction[];
  points: number;
  averageRating?: number;
}

export interface Infraction {
  type: 'delay_class' | 'delay_assembly' | 'delay_duty';
  date: string;
  description: string;
}

export interface Period {
  id: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface Lesson {
  day: string;
  periodId: string;
  classId: string;
  teacherId: string;
  subject: string;
}

export interface SchoolData {
  teachers: Record<string, string>; // ID -> Name
  classes: Record<string, string>;  // ID -> Short Name
  subjects: Record<string, string>; // ID -> Name
  lessons: Lesson[];
  periods: Period[];
}

export interface SupervisionItem {
  id: string;
  category: string;
  descriptions: {
    1: string; // متميز
    2: string; // جيد
    3: string; // ملائم
    4: string; // غير ملائم
    5: string; // يحتاج تدخل
  };
}

export interface VisitReport {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  periodId: string;
  subject: string;
  lessonTitle: string;
  date: string;
  ratings: Record<string, number>; // ItemId -> 1-5
  aiReport?: {
    strengths: string[];
    improvements: string[];
    recommendations: string;
    summary: string;
  };
  totalAverage: number;
}

export type View = 'dashboard' | 'classes' | 'teachers' | 'visits' | 'settings' | 'visit_form';
