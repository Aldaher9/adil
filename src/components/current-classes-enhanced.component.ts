import { Component, inject, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchoolStoreService, Teacher } from '../services/enhanced-school-store.service';

@Component({
  selector: 'app-current-classes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      
      <!-- Enhanced Section Header -->
      <div class="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700">
        <div class="flex flex-col lg:flex-row justify-between items-center gap-6">
          
          <div class="flex items-center gap-5">
            <div class="bg-gradient-to-br from-indigo-500 to-purple-600 text-white w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-2xl transform hover:scale-110 transition-transform">
              <i class="fas fa-chalkboard-teacher"></i>
            </div>
            <div>
              <h2 class="text-3xl font-black text-slate-900 dark:text-white mb-1">
                المتابعة المباشرة
              </h2>
              <p class="text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-2">
                <i class="fas fa-circle text-green-500 text-xs animate-pulse"></i>
                الحصص النشطة الآن
              </p>
            </div>
          </div>
          
          <!-- Current Period Info -->
          @if (store.currentPeriod(); as period) {
            <div class="flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 rounded-2xl shadow-lg text-white">
              <div class="text-center sm:text-right">
                <div class="text-sm opacity-90 mb-1">الحصة الحالية</div>
                <div class="text-3xl font-black">{{ period.id }}</div>
              </div>
              <div class="h-12 w-px bg-white/30 hidden sm:block"></div>
              <div class="text-center sm:text-left">
                <div class="text-sm opacity-90 mb-1">الوقت</div>
                <div class="font-mono text-xl font-bold">
                  {{ period.start }} - {{ period.end }}
                </div>
              </div>
            </div>
          } @else {
            <div class="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3">
              <i class="fas fa-coffee text-2xl"></i>
              <div>
                <div class="font-bold text-lg">استراحة</div>
                <div class="text-sm opacity-90">لا توجد حصص نشطة</div>
              </div>
            </div>
          }
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-slate-100 dark:border-slate-700">
            <div class="text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {{ store.activeLessons().length }}
            </div>
            <div class="text-xs text-slate-600 dark:text-slate-400 font-bold mt-1">حصة نشطة</div>
          </div>
          
          <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-slate-100 dark:border-slate-700">
            <div class="text-3xl font-black text-green-600 dark:text-green-400">
              {{ getActiveTeachersCount() }}
            </div>
            <div class="text-xs text-slate-600 dark:text-slate-400 font-bold mt-1">معلم نشط</div>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-slate-100 dark:border-slate-700">
            <div class="text-3xl font-black text-purple-600 dark:text-purple-400">
              {{ getAverageScore() }}%
            </div>
            <div class="text-xs text-slate-600 dark:text-slate-400 font-bold mt-1">متوسط التقييم</div>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-slate-100 dark:border-slate-700">
            <div class="text-3xl font-black text-blue-600 dark:text-blue-400">
              {{ store.periods().length }}
            </div>
            <div class="text-xs text-slate-600 dark:text-slate-400 font-bold mt-1">إجمالي الحصص</div>
          </div>
        </div>
      </div>

      <!-- Filter & Search -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-200 dark:border-slate-700">
        <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div class="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <i class="fas fa-filter text-indigo-600"></i>
            <span class="font-bold text-sm">الفلاتر السريعة:</span>
          </div>
          <div class="flex gap-2 flex-wrap">
            <button class="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-bold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition">
              <i class="fas fa-th-large ml-1"></i> الكل
            </button>
            <button class="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition">
              <i class="fas fa-star ml-1"></i> الأعلى تقييماً
            </button>
            <button class="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition">
              <i class="fas fa-exclamation-triangle ml-1"></i> يحتاج متابعة
            </button>
          </div>
        </div>
      </div>

      <!-- Teachers Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
        @for (item of store.activeLessons(); track item.teacher.id) {
          <div class="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border-2 border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 p-5 flex flex-col items-center aspect-[3/4] card-hover overflow-hidden">
            
            <!-- Background Pattern -->
            <div class="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
              <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full -mr-16 -mt-16"></div>
              <div class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-500 to-yellow-500 rounded-full -ml-12 -mb-12"></div>
            </div>

            <!-- Status Badge -->
            <div class="absolute top-3 left-3 z-10">
              <div 
                class="text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg backdrop-blur-sm"
                [class]="getScoreClass(item.teacher.score)">
                <i class="fas fa-star text-[8px]"></i>
                <span>{{ item.teacher.score }}%</span>
              </div>
            </div>

            <!-- Avatar -->
            <div class="relative z-10 mb-4">
              <div class="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 text-white flex items-center justify-center font-black text-3xl shadow-2xl border-4 border-white dark:border-slate-800 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                {{ item.teacher.short ? item.teacher.short[0] : '?' }}
              </div>
              <!-- Online Indicator -->
              <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center shadow-lg">
                <i class="fas fa-check text-white text-[10px]"></i>
              </div>
            </div>

            <!-- Teacher Info -->
            <div class="relative z-10 text-center w-full">
              <h3 class="font-black text-sm text-slate-800 dark:text-white mb-1 truncate px-2" 
                  title="{{ item.teacher.name }}">
                {{ item.teacher.name }}
              </h3>

              <div class="bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-1.5 mb-2">
                <p class="text-xs text-slate-600 dark:text-slate-300 font-bold truncate">
                  {{ item.className }}
                </p>
              </div>

              @if (item.subject) {
                <div class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  <i class="fas fa-book-open ml-1"></i>
                  {{ item.subject }}
                </div>
              }
            </div>

            <!-- Hover Action Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent backdrop-blur-sm rounded-2xl flex flex-col items-center justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 p-5 z-20">
              <button 
                (click)="onAction.emit({teacher: item.teacher, className: item.className})"
                class="w-full bg-white hover:bg-indigo-50 text-slate-800 font-bold text-sm py-3 px-4 rounded-xl shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center gap-2 mb-2">
                <i class="fas fa-cog"></i>
                <span>إجراءات</span>
              </button>
              
              <div class="flex gap-2 w-full">
                <button class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold text-xs py-2 px-3 rounded-lg transition flex items-center justify-center gap-1"
                        title="إضافة إنجاز">
                  <i class="fas fa-trophy text-[10px]"></i>
                </button>
                <button class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs py-2 px-3 rounded-lg transition flex items-center justify-center gap-1"
                        title="عرض التفاصيل">
                  <i class="fas fa-eye text-[10px]"></i>
                </button>
                <button class="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs py-2 px-3 rounded-lg transition flex items-center justify-center gap-1"
                        title="سجل الحضور">
                  <i class="fas fa-calendar-check text-[10px]"></i>
                </button>
              </div>
            </div>

          </div>
        } @empty {
          <div class="col-span-full py-24 text-center">
            <div class="inline-block bg-white dark:bg-slate-800 rounded-3xl p-12 shadow-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <div class="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <i class="fas fa-coffee text-5xl text-slate-400 dark:text-slate-500"></i>
              </div>
              <h3 class="text-2xl font-black text-slate-800 dark:text-white mb-2">لا توجد حصص حالياً</h3>
              <p class="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                استمتع بوقت الاستراحة ☕
                <br>سيتم عرض الحصص النشطة هنا تلقائياً
              </p>
            </div>
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.6s ease-out;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .card-hover {
      transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .card-hover:hover {
      transform: translateY(-8px) scale(1.02);
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }
  `]
})
export class CurrentClassesComponent {
  store = inject(SchoolStoreService);
  onAction = output<{teacher: Teacher, className?: string}>();

  getScoreClass(score: number): string {
    if (score >= 90) return "bg-emerald-500/90 text-white border border-emerald-400";
    if (score >= 70) return "bg-amber-500/90 text-white border border-amber-400";
    return "bg-red-500/90 text-white border border-red-400";
  }

  getActiveTeachersCount(): number {
    return new Set(this.store.activeLessons().map(l => l.teacher.id)).size;
  }

  getAverageScore(): number {
    const lessons = this.store.activeLessons();
    if (lessons.length === 0) return 0;
    
    const sum = lessons.reduce((acc, l) => acc + l.teacher.score, 0);
    return Math.round(sum / lessons.length);
  }
}
