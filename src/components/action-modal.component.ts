import { Component, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Teacher, SchoolStoreService, ViolationType, RewardType } from '../services/school-store.service';

@Component({
  selector: 'app-action-modal',
  imports: [CommonModule],
  template: `
    @if (teacher()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" (click)="close.emit()"></div>
        
        <!-- Modal Content -->
        <div class="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
            <!-- Header -->
            <div class="bg-slate-800 p-5 text-white flex justify-between items-start shrink-0">
                <div>
                    <h3 class="text-xl font-bold flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 shadow-inner">
                             <i class="fas fa-user-edit text-amber-400"></i>
                        </div>
                        <div class="flex flex-col">
                            <span>{{ teacher()?.name }}</span>
                            <span class="text-xs font-normal text-slate-300 mt-0.5">{{ teacher()?.score }}% نقطة الأداء</span>
                        </div>
                    </h3>
                </div>
                <button (click)="close.emit()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Tabs -->
            <div class="flex border-b border-slate-100 shrink-0">
                <button (click)="activeTab.set('negative')" 
                    [class]="activeTab() === 'negative' ? 'text-red-600 border-b-2 border-red-600 bg-red-50' : 'text-slate-500 hover:bg-slate-50'"
                    class="flex-1 py-3 font-bold text-sm transition flex items-center justify-center gap-2">
                    <i class="fas fa-exclamation-circle"></i> المخالفات
                </button>
                <button (click)="activeTab.set('positive')" 
                    [class]="activeTab() === 'positive' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50' : 'text-slate-500 hover:bg-slate-50'"
                    class="flex-1 py-3 font-bold text-sm transition flex items-center justify-center gap-2">
                    <i class="fas fa-star"></i> السلوك الإيجابي
                </button>
                <button (click)="activeTab.set('history')" 
                    [class]="activeTab() === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-slate-500 hover:bg-slate-50'"
                    class="flex-1 py-3 font-bold text-sm transition flex items-center justify-center gap-2">
                    <i class="fas fa-history"></i> السجل
                </button>
            </div>

            <div class="p-5 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
                
                @if (activeTab() === 'negative') {
                    <div class="space-y-3 animate-fade-in">
                        <div class="grid grid-cols-2 gap-3 mb-4">
                             <button (click)="sendWhatsApp('summon')" class="bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-200 p-3 rounded-2xl font-bold text-xs flex flex-col items-center gap-2 transition shadow-sm">
                                <div class="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500"><i class="fab fa-whatsapp text-lg"></i></div>
                                <span>استدعاء للإدارة</span>
                            </button>
                            <button [disabled]="!className()" (click)="sendWhatsApp('remind')" class="bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 p-3 rounded-2xl font-bold text-xs flex flex-col items-center gap-2 transition shadow-sm disabled:opacity-50">
                                <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><i class="fas fa-bell text-lg"></i></div>
                                <span>تذكير بالحصة</span>
                            </button>
                        </div>

                        <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">تسجيل تقصير / مخالفة</label>
                        <div class="space-y-2">
                            @for (violation of store.violationTypes(); track violation.id) {
                                <button (click)="dockScore(violation)" class="w-full bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-200 p-3 rounded-xl flex items-center justify-between transition group shadow-sm">
                                    <span class="flex items-center gap-3 font-bold text-xs">
                                        <div class="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-red-500 transition">
                                            <i class="fas {{violation.icon}}"></i>
                                        </div>
                                        {{ violation.label }}
                                    </span>
                                    <span class="bg-red-50 px-2 py-1 rounded-lg text-xs font-bold text-red-600 border border-red-100">
                                        -{{ violation.points }}
                                    </span>
                                </button>
                            }
                        </div>
                    </div>
                }

                @if (activeTab() === 'positive') {
                    <div class="space-y-3 animate-fade-in">
                        <div class="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-4 flex items-center gap-3">
                            <i class="fas fa-trophy text-emerald-500 text-2xl"></i>
                            <div>
                                <h4 class="font-bold text-emerald-900 text-sm">تعزيز المعلم</h4>
                                <p class="text-xs text-emerald-700 mt-1">إضافة نقاط للسلوك الإيجابي ترفع من تقييم الأداء.</p>
                            </div>
                        </div>

                        <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">نقاط التميز</label>
                        <div class="space-y-2">
                            @for (reward of store.rewardTypes(); track reward.id) {
                                <button (click)="rewardTeacher(reward)" class="w-full bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 p-3 rounded-xl flex items-center justify-between transition group shadow-sm">
                                    <span class="flex items-center gap-3 font-bold text-xs">
                                        <div class="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-emerald-500 transition">
                                            <i class="fas {{reward.icon}}"></i>
                                        </div>
                                        {{ reward.label }}
                                    </span>
                                    <span class="bg-emerald-50 px-2 py-1 rounded-lg text-xs font-bold text-emerald-600 border border-emerald-100">
                                        +{{ reward.points }}
                                    </span>
                                </button>
                            }
                        </div>
                    </div>
                }

                @if (activeTab() === 'history') {
                    <div class="space-y-4 animate-fade-in h-full flex flex-col">
                        <div class="flex justify-between items-center">
                            <h4 class="font-bold text-slate-800 text-sm">سجل النشاط التفصيلي</h4>
                            <button (click)="exportReport()" class="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-2">
                                <i class="fas fa-file-export"></i> تصدير التقرير
                            </button>
                        </div>

                        <div class="space-y-2 overflow-y-auto pr-1 flex-1 min-h-[200px]">
                            @for (log of teacher()?.violations; track $index) {
                                <div class="flex items-center justify-between p-3 rounded-xl border shadow-sm bg-white"
                                     [class]="log.type === 'positive' ? 'border-emerald-100' : 'border-red-100'">
                                    
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                                             [class]="log.type === 'positive' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'">
                                            <i class="fas" [class]="log.type === 'positive' ? 'fa-check' : 'fa-exclamation'"></i>
                                        </div>
                                        <div>
                                            <div class="text-xs font-bold text-slate-800">{{ log.label }}</div>
                                            <div class="text-[10px] text-slate-400 font-mono">{{ log.date }}</div>
                                        </div>
                                    </div>

                                    <span class="text-xs font-bold px-2 py-1 rounded-lg"
                                          [class]="log.type === 'positive' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'">
                                        {{ log.type === 'positive' ? '+' : '-' }}{{ log.points }}
                                    </span>
                                </div>
                            } @empty {
                                <div class="flex flex-col items-center justify-center py-10 text-slate-400">
                                    <i class="fas fa-clipboard-check text-4xl mb-3 opacity-30"></i>
                                    <p class="text-xs font-bold">لا يوجد نشاط مسجل حتى الآن</p>
                                </div>
                            }
                        </div>
                    </div>
                }
            </div>
            
            <!-- Footer -->
            <div class="bg-white p-4 border-t border-slate-200 shrink-0">
                 <button (click)="startEvaluation()" class="w-full bg-slate-800 hover:bg-slate-900 text-white p-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg">
                    <i class="fas fa-clipboard-list text-lg"></i>
                    <span>تقييم زيارة إشرافية (جديد)</span>
                </button>
            </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
  `]
})
export class ActionModalComponent {
  teacher = input<Teacher | null>(null);
  className = input<string | undefined>(undefined);
  close = output<void>();
  
  store = inject(SchoolStoreService);
  activeTab = signal<'negative' | 'positive' | 'history'>('negative');

  sendWhatsApp(type: 'summon' | 'remind') {
    const t = this.teacher();
    if (!t || !t.phone) {
        alert('يرجى إضافة رقم الهاتف للمعلم أولاً');
        return;
    }

    let msg = "";
    if (type === 'summon') {
        msg = `السلام عليكم أستاذ ${t.name}، يرجى التكرم بزيارة مكتب الإدارة في أقرب وقت.`;
    } else {
        msg = `السلام عليكم أستاذ ${t.name}، تذكير بموعد حصتكم الحالية في الصف ${this.className() || ''}.`;
    }

    window.open(`https://wa.me/${t.phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  async dockScore(v: ViolationType) {
      const t = this.teacher();
      if (!t) return;
      
      if(confirm(`تأكيد خصم ${v.points} نقاط من المعلم ${t.name} بسبب: ${v.label}؟`)) {
          await this.store.dockScore(t.id, v);
          // Don't close immediately, user might want to see history
          this.activeTab.set('history'); 
      }
  }

  async rewardTeacher(r: RewardType) {
      const t = this.teacher();
      if (!t) return;
      
      // Auto confirm for positive actions usually or quick confirm
      if(confirm(`إضافة ${r.points} نقاط للمعلم ${t.name} للتميز: ${r.label}؟`)) {
          await this.store.rewardTeacher(t.id, r);
          this.activeTab.set('history');
      }
  }

  exportReport() {
      const t = this.teacher();
      if(t) {
          this.store.exportSingleTeacherReport(t);
      }
  }

  startEvaluation() {
      // In a real scenario, this routes to the supervision form.
      // For this implementation, we alert or invoke a parent method if connected.
      alert('انتقل إلى قسم "الزيارات" من القائمة الرئيسية لبدء تقييم كامل.');
      this.close.emit();
  }
}