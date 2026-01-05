import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchoolStoreService, Teacher } from '../services/school-store.service';

@Component({
  selector: 'app-current-classes',
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-3">
            <div class="bg-indigo-100 text-indigo-700 w-12 h-12 rounded-full flex items-center justify-center text-xl">
                <i class="fas fa-clock"></i>
            </div>
            <div>
                <h2 class="text-2xl font-bold text-slate-800">الحصص القائمة الآن</h2>
                <p class="text-slate-500 text-sm">متابعة حية للجدول المدرسي</p>
            </div>
        </div>
        
        @if (store.currentPeriod(); as period) {
            <div class="flex items-center gap-3 bg-indigo-50 px-6 py-3 rounded-xl border border-indigo-100">
                <span class="text-indigo-900 font-bold text-lg">الحصة {{ period.id }}</span>
                <span class="text-indigo-400">|</span>
                <span class="text-indigo-600 font-mono">{{ period.start }} - {{ period.end }}</span>
            </div>
        } @else {
            <div class="bg-amber-50 text-amber-700 px-6 py-3 rounded-xl border border-amber-100 font-bold">
                لا توجد حصص نشطة حالياً
            </div>
        }
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        @for (item of store.activeLessons(); track item.teacher.id) {
            <div class="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100 overflow-hidden relative">
                <!-- Decorative Top Border -->
                <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                
                <div class="p-5">
                    <div class="flex justify-between items-start mb-4">
                        <span class="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-sm font-bold border border-indigo-100">
                            {{ item.className }}
                        </span>
                        <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                           {{ item.teacher.short[0] }}
                        </div>
                    </div>
                    
                    <h3 class="font-bold text-lg text-slate-800 mb-1 truncate">{{ item.teacher.name }}</h3>
                    <p class="text-xs text-slate-400 mb-4">
                        <i class="fas fa-star text-yellow-400 mr-1"></i> الأداء: {{ item.teacher.score }}%
                    </p>

                    <button 
                        (click)="onAction.emit({teacher: item.teacher, className: item.className})"
                        class="w-full py-2.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 font-bold text-sm transition-colors border border-slate-200 hover:border-indigo-200 flex justify-center items-center gap-2">
                        <i class="fas fa-sliders-h"></i> إجراءات سريعة
                    </button>
                </div>
            </div>
        } @empty {
            <div class="col-span-full py-20 text-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <i class="fas fa-coffee text-4xl mb-4 text-slate-300"></i>
                <p>لا توجد حصص في الوقت الحالي</p>
                @if (store.teachers().length === 0) {
                    <p class="text-sm mt-2 text-indigo-500">ملاحظة: تأكد من استيراد ملف الجدول XML</p>
                }
            </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class CurrentClassesComponent {
  store = inject(SchoolStoreService);
  onAction = output<{teacher: Teacher, className?: string}>();
}
