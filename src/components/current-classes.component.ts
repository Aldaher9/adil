import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchoolStoreService, Teacher } from '../services/school-store.service';

@Component({
  selector: 'app-current-classes',
  imports: [CommonModule],
  template: `
    <div class="space-y-4 animate-fade-in">
      <div class="flex flex-col md:flex-row justify-between items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-3">
            <div class="bg-indigo-100 text-indigo-700 w-10 h-10 rounded-full flex items-center justify-center text-lg">
                <i class="fas fa-clock"></i>
            </div>
            <div>
                <h2 class="text-xl font-bold text-slate-800">الحصص القائمة الآن</h2>
            </div>
        </div>
        
        @if (store.currentPeriod(); as period) {
            <div class="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 shadow-sm">
                <span class="text-indigo-900 font-bold">الحصة {{ period.id }}</span>
                <span class="text-indigo-300">|</span>
                <span class="text-indigo-600 font-mono text-sm">{{ period.start }} - {{ period.end }}</span>
            </div>
        } @else {
            <div class="bg-amber-50 text-amber-700 px-4 py-2 rounded-lg border border-amber-100 font-bold text-sm">
                لا توجد حصص نشطة
            </div>
        }
      </div>

      <!-- Compact Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        @for (item of store.activeLessons(); track item.teacher.id) {
            <div class="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 overflow-hidden relative flex flex-col">
                <!-- Slim Top Border -->
                <div class="h-1 w-full bg-indigo-500"></div>
                
                <div class="p-2 flex-1 flex flex-col">
                    <div class="flex justify-between items-center mb-1">
                        <span class="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-bold border border-slate-200 truncate max-w-[70%]">
                            {{ item.className }}
                        </span>
                        <div class="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[9px] font-bold border border-indigo-100">
                           {{ item.teacher.short ? item.teacher.short[0] : '?' }}
                        </div>
                    </div>
                    
                    <h3 class="font-bold text-xs text-slate-700 mb-1 truncate" title="{{ item.teacher.name }}">{{ item.teacher.name }}</h3>
                    
                    <div class="flex items-center gap-1 text-[9px] text-slate-400 mb-2">
                        <i class="fas fa-star text-yellow-400"></i> 
                        <span>{{ item.teacher.score }}%</span>
                    </div>

                    <button 
                        (click)="onAction.emit({teacher: item.teacher, className: item.className})"
                        class="mt-auto w-full py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] transition-colors flex justify-center items-center gap-1">
                        <i class="fas fa-cog"></i> إجراء
                    </button>
                </div>
            </div>
        } @empty {
            <div class="col-span-full py-16 text-center text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
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
  `]
})
export class CurrentClassesComponent {
  store = inject(SchoolStoreService);
  onAction = output<{teacher: Teacher, className?: string}>();
}