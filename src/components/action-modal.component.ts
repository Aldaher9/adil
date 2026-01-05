import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Teacher, SchoolStoreService } from '../services/school-store.service';

@Component({
  selector: 'app-action-modal',
  imports: [CommonModule],
  template: `
    @if (teacher()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" (click)="close.emit()"></div>
        
        <!-- Modal Content -->
        <div class="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
            <!-- Header -->
            <div class="bg-gradient-to-r from-indigo-900 to-indigo-800 p-6 text-white">
                <h3 class="text-xl font-bold flex items-center gap-2">
                    <i class="fas fa-user-cog"></i>
                    {{ teacher()?.name }}
                </h3>
                <p class="text-indigo-200 text-sm mt-1">
                    @if(className()) {
                        الحصة الحالية: صف {{ className() }}
                    } @else {
                        قائمة الإدارة
                    }
                </p>
                <button (click)="close.emit()" class="absolute top-4 left-4 text-white/70 hover:text-white transition">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>

            <div class="p-6 space-y-4">
                <!-- WhatsApp Actions -->
                <div class="space-y-3">
                    <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">التواصل السريع</label>
                    <button (click)="sendWhatsApp('summon')" class="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 p-4 rounded-xl font-bold flex items-center justify-between transition group">
                        <span class="flex items-center gap-3">
                            <i class="fab fa-whatsapp text-2xl group-hover:scale-110 transition"></i>
                            استدعاء للمكتب
                        </span>
                        <i class="fas fa-chevron-left text-sm opacity-50"></i>
                    </button>
                    
                    @if (className()) {
                        <button (click)="sendWhatsApp('remind')" class="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 p-4 rounded-xl font-bold flex items-center justify-between transition group">
                            <span class="flex items-center gap-3">
                                <i class="fas fa-bell text-xl group-hover:scale-110 transition"></i>
                                تذكير بالحصة
                            </span>
                            <i class="fas fa-chevron-left text-sm opacity-50"></i>
                        </button>
                    }
                </div>

                <div class="h-px bg-slate-100 my-2"></div>

                <!-- Incidents -->
                <div class="space-y-3">
                    <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">تسجيل مخالفة</label>
                    
                    <button (click)="dockScore('late', 5)" class="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 p-4 rounded-xl font-bold flex items-center justify-between transition">
                         <span class="flex items-center gap-3">
                            <i class="fas fa-clock text-xl"></i>
                            تأخر عن الحصة
                        </span>
                        <span class="bg-white px-2 py-1 rounded text-xs border border-amber-200">-5 نقاط</span>
                    </button>

                    <button (click)="dockScore('absent', 15)" class="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 p-4 rounded-xl font-bold flex items-center justify-between transition">
                         <span class="flex items-center gap-3">
                            <i class="fas fa-user-slash text-xl"></i>
                            غياب عن الحصة
                        </span>
                        <span class="bg-white px-2 py-1 rounded text-xs border border-red-200">-15 نقطة</span>
                    </button>
                </div>
            </div>
            
            <div class="bg-slate-50 p-4 text-center border-t border-slate-100">
                <span class="text-xs text-slate-400">التقييم الحالي: <strong class="text-slate-700">{{ teacher()?.score }}%</strong></span>
            </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class ActionModalComponent {
  teacher = input<Teacher | null>(null);
  className = input<string | undefined>(undefined);
  close = output<void>();
  
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

  async dockScore(reason: string, amount: number) {
      const t = this.teacher();
      if (!t) return;
      
      if(confirm(`هل أنت متأكد من خصم ${amount} نقاط بسبب ${reason === 'late' ? 'التأخر' : 'الغياب'}؟`)) {
          await this.store.dockScore(t.id, amount);
          this.close.emit();
      }
  }
}
