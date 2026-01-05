import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Teacher, SchoolStoreService, ViolationType } from '../services/school-store.service';

@Component({
  selector: 'app-action-modal',
  imports: [CommonModule],
  template: `
    @if (teacher()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" (click)="close.emit()"></div>
        
        <!-- Modal Content -->
        <div class="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <!-- Header -->
            <div class="bg-slate-800 p-4 text-white flex justify-between items-start">
                <div>
                    <h3 class="text-lg font-bold flex items-center gap-2">
                        <i class="fas fa-user-edit text-yellow-400"></i>
                        {{ teacher()?.name }}
                    </h3>
                    <p class="text-slate-300 text-xs mt-1">
                        @if(className()) {
                            الحصة الحالية: <span class="text-white font-bold">{{ className() }}</span>
                        } @else {
                            قائمة الإدارة
                        }
                    </p>
                </div>
                <button (click)="close.emit()" class="text-white/50 hover:text-white transition">
                    <i class="fas fa-times text-lg"></i>
                </button>
            </div>

            <div class="p-4 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <!-- Smart Evaluation Button -->
                <button (click)="startEvaluation()" class="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 p-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer mb-2">
                    <i class="fas fa-clipboard-list text-xl"></i>
                    <span>تقييم زيارة إشرافية</span>
                </button>

                <div class="h-px bg-slate-100 mb-2"></div>

                <!-- WhatsApp Actions -->
                <div class="space-y-2">
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">التواصل</label>
                    <div class="grid grid-cols-2 gap-2">
                        <button (click)="sendWhatsApp('summon')" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 p-3 rounded-lg font-bold text-xs flex flex-col items-center gap-2 transition text-center">
                            <i class="fab fa-whatsapp text-xl"></i>
                            <span>استدعاء</span>
                        </button>
                        
                        <button [disabled]="!className()" (click)="sendWhatsApp('remind')" class="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 p-3 rounded-lg font-bold text-xs flex flex-col items-center gap-2 transition text-center disabled:opacity-50 disabled:cursor-not-allowed">
                            <i class="fas fa-bell text-xl"></i>
                            <span>تذكير</span>
                        </button>
                    </div>
                </div>

                <div class="h-px bg-slate-100"></div>

                <!-- Dynamic Incidents -->
                <div class="space-y-2">
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">المخالفات والخصومات</label>
                    
                    <div class="space-y-2">
                        @for (violation of store.violationTypes(); track violation.id) {
                            <button (click)="dockScore(violation)" class="w-full bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-200 p-3 rounded-lg flex items-center justify-between transition group">
                                <span class="flex items-center gap-3 font-bold text-sm">
                                    <div class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-red-500 group-hover:border-red-200 transition">
                                        <i class="fas {{violation.icon}}"></i>
                                    </div>
                                    {{ violation.label }}
                                </span>
                                <span class="bg-white px-2 py-1 rounded text-xs font-bold text-red-500 border border-slate-200 group-hover:border-red-200 shadow-sm">
                                    -{{ violation.points }}
                                </span>
                            </button>
                        }
                        @if (store.violationTypes().length === 0) {
                            <div class="text-center p-4 text-slate-400 text-xs bg-slate-50 rounded border border-dashed border-slate-200">
                                لا توجد أنواع مخالفات. قم بإضافتها من الإعدادات.
                            </div>
                        }
                    </div>
                </div>
            </div>
            
            <div class="bg-slate-50 p-3 text-center border-t border-slate-200 flex justify-between items-center px-6">
                <span class="text-xs text-slate-500">التقييم الحالي</span>
                <span class="text-lg font-bold text-slate-800">{{ teacher()?.score }}%</span>
            </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
  `]
})
export class ActionModalComponent {
  teacher = input<Teacher | null>(null);
  className = input<string | undefined>(undefined);
  close = output<void>();
  evaluate = output<void>();
  
  store = inject(SchoolStoreService);

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
          await this.store.dockScore(t.id, v.points);
          this.close.emit();
      }
  }

  startEvaluation() {
      // Logic handled by main app or output event
      // Since this is the Angular version, we can route or show the supervision component
      // However, we need to bridge this.
      alert('الرجاء استخدام النسخة الكاملة لخاصية التقييم (Vanilla JS Version currently implements full flow)');
      this.close.emit();
  }
}