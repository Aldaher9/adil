import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchoolStoreService } from '../services/school-store.service';

@Component({
  selector: 'app-reports',
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl shadow-soft border border-slate-200">
            <div class="flex items-center gap-4">
                <div class="bg-indigo-50 text-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-xl"><i class="fas fa-file-invoice"></i></div>
                <div>
                    <h2 class="text-2xl font-extrabold text-slate-900">تقارير الأداء</h2>
                    <p class="text-slate-500 font-medium text-sm">تحليل شامل لبيانات المعلمين</p>
                </div>
            </div>
            <button 
                (click)="store.exportToExcel()"
                class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-100 cursor-pointer text-sm">
                <i class="fas fa-file-excel"></i><span>تصدير Excel</span>
            </button>
        </div>

        <div class="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-right">
                    <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-extrabold uppercase tracking-wider">
                        <tr>
                            <th class="p-4">المعلم</th>
                            <th class="p-4 text-center">التقييم</th>
                            <th class="p-4 text-center">الهاتف</th>
                            <th class="p-4 text-center">الحالة</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm">
                        @for (t of store.teachers(); track t.id; let e = $even) {
                            <tr [class]="e ? 'bg-slate-50' : 'bg-white'" class="border-b border-slate-100 last:border-0 hover:bg-indigo-50/50 transition-colors">
                                <td class="p-4 font-bold text-slate-800 align-middle">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold shrink-0">
                                            {{ t.short ? t.short[0] : '?' }}
                                        </div>
                                        <span>{{ t.name }}</span>
                                    </div>
                                </td>
                                <td class="p-4 text-center align-middle">
                                    <span [class]="getScoreBadge(t.score)">{{ t.score }}%</span>
                                </td>
                                <td class="p-4 text-center text-slate-500 font-mono align-middle">
                                    {{ t.phone || '-' }}
                                </td>
                                <td class="p-4 text-center align-middle">
                                    @if (t.score < 80) {
                                        <span class="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-md border border-red-200">يحتاج متابعة</span>
                                    } @else {
                                        <span class="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200">أداء جيد</span>
                                    }
                                </td>
                            </tr>
                        } @empty {
                            <tr>
                                <td colspan="4" class="p-12 text-center text-slate-400">
                                    <i class="fas fa-users-slash text-3xl mb-3"></i>
                                    <p>لا يوجد معلمون لعرضهم. يرجى استيراد البيانات من الإعدادات.</p>
                                </td>
                            </tr>
                        }
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ReportsComponent {
  store = inject(SchoolStoreService);

  getScoreBadge(score: number): string {
      const base = "inline-block px-2.5 py-1 rounded-md text-xs font-bold border ";
      if(score >= 90) return base + "bg-emerald-100 text-emerald-700 border-emerald-200";
      if(score >= 70) return base + "bg-amber-100 text-amber-700 border-amber-200";
      return base + "bg-red-100 text-red-700 border-red-200";
  }
}
