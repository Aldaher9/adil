import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchoolStoreService } from '../services/school-store.service';

@Component({
  selector: 'app-reports',
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">
        <div class="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div>
                 <h2 class="text-2xl font-bold text-slate-800">تقارير الأداء</h2>
                 <p class="text-sm text-slate-500">نظرة عامة على انضباط المعلمين</p>
            </div>
            <button 
                (click)="store.exportToExcel()"
                class="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-emerald-200">
                <i class="fas fa-file-excel"></i>
                <span>تصدير Excel</span>
            </button>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-right">
                    <thead class="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase">
                        <tr>
                            <th class="p-5 font-bold">المعلم</th>
                            <th class="p-5 font-bold text-center">التقييم</th>
                            <th class="p-5 font-bold text-center">الهاتف</th>
                            <th class="p-5 font-bold text-center">الحالة</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        @for (t of store.teachers(); track t.id) {
                            <tr class="hover:bg-slate-50/50 transition-colors group">
                                <td class="p-5 font-semibold text-slate-700">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                            {{ t.short[0] }}
                                        </div>
                                        {{ t.name }}
                                    </div>
                                </td>
                                <td class="p-5 text-center">
                                    <span [class]="getScoreBadge(t.score)">{{ t.score }}%</span>
                                </td>
                                <td class="p-5 text-center text-slate-500 font-mono text-sm">
                                    {{ t.phone || '-' }}
                                </td>
                                <td class="p-5 text-center">
                                    @if (t.score < 80) {
                                        <span class="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded">يحتاج متابعة</span>
                                    } @else {
                                        <span class="text-xs text-green-500 font-bold bg-green-50 px-2 py-1 rounded">ممتاز</span>
                                    }
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
      const base = "inline-block px-3 py-1 rounded-full text-xs font-bold ";
      if(score >= 90) return base + "bg-green-100 text-green-700";
      if(score >= 70) return base + "bg-yellow-100 text-yellow-700";
      return base + "bg-red-100 text-red-700";
  }
}
