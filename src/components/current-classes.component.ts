import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchoolStoreService, Teacher } from '../services/school-store.service';

@Component({
  selector: 'app-current-classes',
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Section Header -->
      <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-soft border border-slate-200">
        <div class="flex items-center gap-4">
            <div class="bg-indigo-50 text-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-xl">
                <i class="fas fa-chalkboard-teacher"></i>
            </div>
            <div>
                <h2 class="text-2xl font-extrabold text-slate-900">لوحة المتابعة المباشرة</h2>
                <p class="text-slate-500 font-medium text-sm">الحصص القائمة حالياً</p>
            </div>
        </div>
        
        @if (store.currentPeriod(); as period) {
            <div class="flex items-center gap-3 bg-indigo-50 px-4 py-2.5 rounded-xl border border-indigo-100 shadow-sm">
                <span class="text-indigo-900 font-extrabold text-sm">الحصة {{ period.id }}</span>
                <span class="text-indigo-300 mx-1">|</span>
                <span class="text-indigo-600 font-mono text-sm font-bold">{{ period.start }} - {{ period.end }}</span>
            </div>
        } @else {
            <div class="bg-amber-50 text-amber-700 px-4 py-2.5 rounded-xl border border-amber-100 font-bold text-sm flex items-center gap-2">
                <i class="fas fa-coffee"></i>
                <span>لا توجد حصص نشطة</span>
            </div>
        }
      </div>

      <!-- Compact Grid of Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        @for (item of store.activeLessons(); track item.teacher.id) {
            <div class="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 p-3 text-center flex flex-col items-center justify-center aspect-[4/5] card-hover">
                
                <div class="w-12 h-12 mb-2 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 flex items-center justify-center font-black text-xl border-4 border-white shadow-md transition-transform group-hover:scale-110">
                    {{ item.teacher.short ? item.teacher.short[0] : '?' }}
                </div>

                <h3 class="font-bold text-sm text-slate-800 truncate w-full" title="{{ item.teacher.name }}">{{ item.teacher.name }}</h3>

                <p class="text-xs text-slate-500 font-medium truncate w-full">{{ item.className }}</p>

                <div class="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1" [class]="getScoreClass(item.teacher.score)">
                    <i class="fas fa-star"></i>
                    <span>{{ item.teacher.score }}%</span>
                </div>

                <div class="absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                        (click)="onAction.emit({teacher: item.teacher, className: item.className})"
                        class="bg-white/90 hover:bg-white text-slate-800 font-bold text-xs py-2 px-4 rounded-lg shadow-lg transition transform hover:scale-105">
                        <i class="fas fa-cog mr-1"></i> إجراء
                    </button>
                </div>
            </div>
        } @empty {
            <div class="col-span-full py-16 text-center text-slate-400 bg-white rounded-xl border-2 border-dashed border-slate-200">
                <i class="fas fa-coffee text-3xl mb-3 text-slate-300"></i>
                <p class="text-sm">لا توجد حصص في الوقت الحالي</p>
            </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    .card-hover:hover {
        transform: translateY(-4px);
    }
  `]
})
export class CurrentClassesComponent {
  store = inject(SchoolStoreService);
  onAction = output<{teacher: Teacher, className?: string}>();

  getScoreClass(score: number): string {
    if (score >= 90) return "bg-emerald-100 text-emerald-700";
    if (score >= 70) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  }
}