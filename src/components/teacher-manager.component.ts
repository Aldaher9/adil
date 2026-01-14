import { Component, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchoolStoreService, Teacher } from '../services/school-store.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-teacher-manager',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">
        <!-- Toolbar -->
        <div class="flex flex-col md:flex-row justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div>
                <h2 class="text-2xl font-bold text-slate-800">سجل المعلمين</h2>
                <p class="text-slate-500 text-sm">إدارة بيانات التواصل والتقييمات</p>
            </div>
            <div class="relative w-full md:w-96">
                <input 
                    type="text" 
                    [(ngModel)]="searchTerm"
                    placeholder="بحث عن معلم..." 
                    class="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-slate-50 focus:bg-white"
                >
                <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            </div>
        </div>

        <!-- Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            @for (t of filteredTeachers(); track t.id) {
                <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-slate-100 p-5 flex flex-col gap-4">
                    <div class="flex justify-between items-start">
                        <div class="flex items-center gap-3 flex-1 min-w-0">
                             <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                                {{ t.short ? t.short[0] : '?' }}
                            </div>
                            <div class="flex-1 min-w-0">
                                <input 
                                    type="text" 
                                    [value]="t.name" 
                                    (change)="updateTeacher(t.id, 'name', $event)"
                                    placeholder="اسم المعلم"
                                    class="w-full bg-transparent font-bold text-slate-800 focus:bg-slate-50 focus:ring-1 focus:ring-indigo-500 rounded p-1 -m-1 transition outline-none"
                                >
                                <input 
                                    type="text" 
                                    [value]="t.short" 
                                    (change)="updateTeacher(t.id, 'short', $event)"
                                    placeholder="الاسم المختصر"
                                    class="w-full bg-transparent text-xs text-slate-500 focus:bg-slate-50 focus:ring-1 focus:ring-indigo-500 rounded p-1 -m-1 mt-1 transition outline-none"
                                >
                            </div>
                        </div>
                        <div [class]="getScoreClass(t.score)" class="ml-2 shrink-0">
                            {{ t.score }}%
                        </div>
                    </div>

                    <!-- Phone Input -->
                    <div class="relative group/input">
                         <i class="fas fa-phone absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-indigo-500 transition-colors"></i>
                        <input 
                            type="tel" 
                            [value]="t.phone" 
                            (change)="updateTeacher(t.id, 'phone', $event)"
                            placeholder="أضف رقم الهاتف" 
                            class="w-full pr-9 pl-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all dir-ltr text-right"
                        >
                    </div>

                    <div class="flex gap-2 mt-auto pt-2 border-t border-slate-50">
                        <button (click)="onAction.emit({teacher: t})" class="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 py-2 rounded-lg text-xs font-bold transition">
                            خيارات
                        </button>
                         <button (click)="openWhatsApp(t)" class="w-10 flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 rounded-lg transition">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                    </div>
                </div>
            } @empty {
                 <div class="col-span-full py-12 text-center text-slate-400">
                    لا توجد نتائج مطابقة للبحث
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
export class TeacherManagerComponent {
  store = inject(SchoolStoreService);
  searchTerm = signal('');
  onAction = output<{teacher: Teacher}>();

  filteredTeachers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const list = this.store.teachers().filter(t => t.name.toLowerCase().includes(term));
    // Sort ascending by name
    return list.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  });

  updateTeacher(id: string, field: 'name' | 'short' | 'phone', event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.store.updateTeacher(id, { [field]: value });
  }

  getScoreClass(score: number): string {
    const base = "font-bold text-sm px-2 py-1 rounded-md ";
    if (score >= 90) return base + "bg-emerald-50 text-emerald-600 border border-emerald-100";
    if (score >= 70) return base + "bg-yellow-50 text-yellow-600 border border-yellow-100";
    return base + "bg-red-50 text-red-600 border border-red-100";
  }

  openWhatsApp(t: Teacher) {
      if(!t.phone) {
          alert("الرجاء إضافة رقم الهاتف أولاً");
          return;
      }
      window.open(`https://wa.me/${t.phone}`, '_blank');
  }
}