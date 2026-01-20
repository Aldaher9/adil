import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchoolStoreService } from '../services/enhanced-school-store.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      
      <!-- Welcome Header -->
      <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div class="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
        
        <div class="relative z-10">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h1 class="text-3xl font-black mb-2">مرحباً بك في لوحة التحكم 👋</h1>
              <p class="text-indigo-100 text-lg">{{ store.schoolSettings().schoolName }}</p>
              <p class="text-indigo-200 text-sm mt-1">{{ store.schoolSettings().academicYear }} - {{ store.schoolSettings().semester }}</p>
            </div>
            <div class="text-right">
              <div class="text-4xl font-black">{{ currentTime() | date:'HH:mm' }}</div>
              <div class="text-indigo-200 text-sm mt-1">{{ currentTime() | date:'EEEE, dd MMMM' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <!-- Total Teachers -->
        <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-200">
          <div class="flex items-center justify-between mb-4">
            <div class="bg-blue-100 text-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl">
              <i class="fas fa-users"></i>
            </div>
            <div class="text-right">
              <div class="text-3xl font-black text-slate-800">{{ stats().totalTeachers }}</div>
              <div class="text-sm text-slate-500 font-bold">معلم</div>
            </div>
          </div>
          <div class="text-sm text-slate-600 font-semibold">إجمالي المعلمين</div>
          <div class="mt-2 flex items-center gap-2 text-xs">
            <span class="bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold">نشط</span>
          </div>
        </div>

        <!-- Active Classes -->
        <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-200">
          <div class="flex items-center justify-between mb-4">
            <div class="bg-green-100 text-green-600 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl">
              <i class="fas fa-chalkboard-teacher"></i>
            </div>
            <div class="text-right">
              <div class="text-3xl font-black text-slate-800">{{ stats().activeClasses }}</div>
              <div class="text-sm text-slate-500 font-bold">حصة</div>
            </div>
          </div>
          <div class="text-sm text-slate-600 font-semibold">الحصص النشطة الآن</div>
          <div class="mt-2 flex items-center gap-2 text-xs">
            @if (store.currentPeriod(); as period) {
              <span class="bg-green-50 text-green-600 px-2 py-1 rounded-full font-bold">
                <i class="fas fa-circle text-[6px] animate-pulse"></i> الحصة {{ period.id }}
              </span>
            } @else {
              <span class="bg-amber-50 text-amber-600 px-2 py-1 rounded-full font-bold">
                <i class="fas fa-coffee text-[8px]"></i> استراحة
              </span>
            }
          </div>
        </div>

        <!-- Average Score -->
        <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-200">
          <div class="flex items-center justify-between mb-4">
            <div class="bg-purple-100 text-purple-600 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl">
              <i class="fas fa-star"></i>
            </div>
            <div class="text-right">
              <div class="text-3xl font-black text-slate-800">{{ stats().averageScore }}%</div>
              <div class="text-sm text-slate-500 font-bold">متوسط</div>
            </div>
          </div>
          <div class="text-sm text-slate-600 font-semibold">متوسط التقييم</div>
          <div class="mt-2">
            <div class="w-full bg-slate-100 rounded-full h-2">
              <div 
                class="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                [style.width.%]="stats().averageScore">
              </div>
            </div>
          </div>
        </div>

        <!-- Today Violations -->
        <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-red-200">
          <div class="flex items-center justify-between mb-4">
            <div class="bg-red-100 text-red-600 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="text-right">
              <div class="text-3xl font-black text-slate-800">{{ stats().todayViolations }}</div>
              <div class="text-sm text-slate-500 font-bold">مخالفة</div>
            </div>
          </div>
          <div class="text-sm text-slate-600 font-semibold">مخالفات اليوم</div>
          <div class="mt-2 flex items-center gap-2 text-xs">
            @if (stats().todayViolations === 0) {
              <span class="bg-green-50 text-green-600 px-2 py-1 rounded-full font-bold">
                <i class="fas fa-check"></i> يوم خالٍ من المخالفات
              </span>
            } @else {
              <span class="bg-red-50 text-red-600 px-2 py-1 rounded-full font-bold">
                <i class="fas fa-bell"></i> تحتاج متابعة
              </span>
            }
          </div>
        </div>

      </div>

      <!-- Two Columns Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Top Performers -->
        <div class="bg-white rounded-2xl p-6 shadow-lg">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-black text-slate-800 flex items-center gap-2">
              <i class="fas fa-trophy text-yellow-500"></i>
              المعلمون المتميزون
            </h3>
            <span class="bg-yellow-50 text-yellow-600 px-3 py-1 rounded-full text-xs font-bold">
              أفضل 3
            </span>
          </div>

          <div class="space-y-4">
            @for (teacher of stats().topPerformers; track teacher.id; let idx = $index) {
              <div class="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-transparent rounded-xl hover:from-slate-100 transition-all">
                <div class="flex-shrink-0">
                  @if (idx === 0) {
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-white flex items-center justify-center font-black text-xl shadow-lg">
                      🥇
                    </div>
                  } @else if (idx === 1) {
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 text-white flex items-center justify-center font-black text-xl shadow-lg">
                      🥈
                    </div>
                  } @else {
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-black text-xl shadow-lg">
                      🥉
                    </div>
                  }
                </div>
                <div class="flex-1">
                  <div class="font-bold text-slate-800">{{ teacher.name }}</div>
                  <div class="text-sm text-slate-500">{{ teacher.department || 'لا يوجد قسم' }}</div>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-black text-green-600">{{ teacher.score }}%</div>
                  <div class="text-xs text-slate-500">التقييم</div>
                </div>
              </div>
            } @empty {
              <div class="text-center py-8 text-slate-400">
                <i class="fas fa-user-graduate text-4xl mb-2"></i>
                <p class="text-sm">لا يوجد معلمون حالياً</p>
              </div>
            }
          </div>
        </div>

        <!-- Need Attention -->
        <div class="bg-white rounded-2xl p-6 shadow-lg">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-black text-slate-800 flex items-center gap-2">
              <i class="fas fa-exclamation-circle text-red-500"></i>
              يحتاجون إلى متابعة
            </h3>
            <span class="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold">
              {{ stats().needsAttention.length }} معلم
            </span>
          </div>

          <div class="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
            @for (teacher of stats().needsAttention; track teacher.id) {
              <div class="flex items-center gap-4 p-4 bg-red-50/50 rounded-xl hover:bg-red-50 transition-all border border-red-100">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 rounded-full bg-gradient-to-br from-red-100 to-red-200 text-red-600 flex items-center justify-center font-black text-lg">
                    {{ teacher.short[0] }}
                  </div>
                </div>
                <div class="flex-1">
                  <div class="font-bold text-slate-800">{{ teacher.name }}</div>
                  <div class="text-sm text-slate-500">{{ teacher.department || 'لا يوجد قسم' }}</div>
                  @if (teacher.violations && teacher.violations.length > 0) {
                    <div class="text-xs text-red-600 mt-1">
                      <i class="fas fa-exclamation-triangle"></i>
                      {{ teacher.violations.length }} مخالفة
                    </div>
                  }
                </div>
                <div class="text-right">
                  <div class="text-2xl font-black text-red-600">{{ teacher.score }}%</div>
                  <div class="text-xs text-slate-500">التقييم</div>
                </div>
              </div>
            } @empty {
              <div class="text-center py-8 text-slate-400">
                <i class="fas fa-check-circle text-4xl mb-2 text-green-400"></i>
                <p class="text-sm">جميع المعلمين بحالة جيدة! 🎉</p>
              </div>
            }
          </div>
        </div>

      </div>

      <!-- Recent Activity -->
      <div class="bg-white rounded-2xl p-6 shadow-lg">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-black text-slate-800 flex items-center gap-2">
            <i class="fas fa-history text-indigo-500"></i>
            النشاط الأخير
          </h3>
          <button 
            (click)="store.clearAllNotifications()"
            class="text-sm text-slate-500 hover:text-indigo-600 font-bold transition">
            مسح الكل
          </button>
        </div>

        <div class="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          @for (notification of recentNotifications(); track notification.id) {
            <div 
              class="flex items-start gap-4 p-4 rounded-xl transition-all"
              [class]="getNotificationClass(notification.type)">
              <div class="flex-shrink-0">
                <div 
                  class="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  [class]="getNotificationIconBg(notification.type)">
                  <i [class]="getNotificationIcon(notification.type)"></i>
                </div>
              </div>
              <div class="flex-1">
                <div class="font-bold text-slate-800 text-sm">{{ notification.title }}</div>
                <div class="text-sm text-slate-600 mt-1">{{ notification.message }}</div>
                <div class="text-xs text-slate-400 mt-2">
                  {{ notification.timestamp | date:'short' }}
                </div>
              </div>
            </div>
          } @empty {
            <div class="text-center py-8 text-slate-400">
              <i class="fas fa-inbox text-4xl mb-2"></i>
              <p class="text-sm">لا توجد إشعارات حديثة</p>
            </div>
          }
        </div>
      </div>

    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.5s ease-out;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 10px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 10px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `]
})
export class DashboardComponent {
  store = inject(SchoolStoreService);
  
  currentTime = this.store.currentTime;
  stats = this.store.dashboardStats;
  
  recentNotifications = computed(() => {
    return this.store.notifications().slice(0, 10);
  });

  getNotificationClass(type: string): string {
    const classes = {
      'success': 'bg-green-50 border border-green-100',
      'error': 'bg-red-50 border border-red-100',
      'warning': 'bg-amber-50 border border-amber-100',
      'info': 'bg-blue-50 border border-blue-100'
    };
    return classes[type as keyof typeof classes] || classes.info;
  }

  getNotificationIconBg(type: string): string {
    const classes = {
      'success': 'bg-green-100 text-green-600',
      'error': 'bg-red-100 text-red-600',
      'warning': 'bg-amber-100 text-amber-600',
      'info': 'bg-blue-100 text-blue-600'
    };
    return classes[type as keyof typeof classes] || classes.info;
  }

  getNotificationIcon(type: string): string {
    const icons = {
      'success': 'fas fa-check-circle',
      'error': 'fas fa-times-circle',
      'warning': 'fas fa-exclamation-triangle',
      'info': 'fas fa-info-circle'
    };
    return icons[type as keyof typeof icons] || icons.info;
  }
}
