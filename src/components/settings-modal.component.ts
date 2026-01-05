import { Component, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SchoolStoreService } from '../services/school-store.service';

@Component({
  selector: 'app-settings-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="close.emit()"></div>
        
        <!-- Modal -->
        <div class="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
            <!-- Header -->
            <div class="bg-slate-800 text-white p-5 flex justify-between items-center shrink-0">
                <h3 class="text-xl font-bold flex items-center gap-2">
                    <i class="fas fa-cog"></i> الإعدادات
                </h3>
                <button (click)="close.emit()" class="text-white/70 hover:text-white transition">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>

            <div class="p-6 overflow-y-auto custom-scrollbar space-y-8">
                
                <!-- Section: Violations Management -->
                <div class="space-y-4">
                    <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                        <h4 class="font-bold text-slate-800 flex items-center gap-2">
                            <i class="fas fa-gavel text-red-500"></i> إدارة المخالفات
                        </h4>
                        <span class="text-xs text-slate-400">تخصيص الخصومات</span>
                    </div>

                    <!-- Add New -->
                    <div class="flex gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 items-end">
                        <div class="flex-1 space-y-1">
                            <label class="text-[10px] font-bold text-slate-500">اسم المخالفة</label>
                            <input type="text" [(ngModel)]="newViolationLabel" placeholder="مثلاً: عدم تحضير" class="w-full text-sm p-2 rounded border border-slate-300 focus:border-indigo-500 outline-none">
                        </div>
                        <div class="w-24 space-y-1">
                            <label class="text-[10px] font-bold text-slate-500">الخصم</label>
                            <input type="number" [(ngModel)]="newViolationPoints" class="w-full text-sm p-2 rounded border border-slate-300 focus:border-indigo-500 outline-none text-center">
                        </div>
                        <button (click)="addViolation()" class="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded h-[38px] w-10 flex items-center justify-center transition">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>

                    <!-- List -->
                    <div class="space-y-2">
                        @for (v of store.violationTypes(); track v.id) {
                            <div class="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 shadow-sm group hover:border-red-100 transition">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded bg-slate-100 text-slate-500 flex items-center justify-center">
                                        <i class="fas {{v.icon}}"></i>
                                    </div>
                                    <span class="font-bold text-sm text-slate-700">{{ v.label }}</span>
                                </div>
                                <div class="flex items-center gap-3">
                                    <span class="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded border border-red-100">-{{ v.points }}</span>
                                    <button (click)="store.removeViolationType(v.id)" class="text-slate-300 hover:text-red-500 transition px-2">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        }
                    </div>
                </div>

                <!-- Section: Data Import -->
                <div class="grid md:grid-cols-2 gap-4">
                    <div class="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <h4 class="font-bold text-indigo-900 mb-2 flex items-center gap-2 text-sm">
                            <i class="fas fa-calendar-alt"></i> جدول الحصص (XML)
                        </h4>
                        <p class="text-xs text-indigo-700/70 mb-3">
                            استيراد ملف الجدول من برنامج aSc Timetables.
                        </p>
                        <button (click)="triggerXml()" class="w-full bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 py-2 rounded-lg font-bold text-xs transition">
                             رفع ملف XML
                        </button>
                        <input type="file" id="xmlInput" accept=".xml" class="hidden" (change)="handleXml($event)">
                    </div>

                    <div class="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <h4 class="font-bold text-emerald-900 mb-2 flex items-center gap-2 text-sm">
                            <i class="fas fa-users"></i> بيانات المعلمين (Excel)
                        </h4>
                        <p class="text-xs text-emerald-700/70 mb-3">
                            تحديث الأسماء وأرقام الهواتف.
                        </p>
                        <div class="flex gap-2">
                            <button (click)="store.exportTeacherDataTemplate()" class="flex-1 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 py-2 rounded-lg font-bold text-xs transition">
                                <i class="fas fa-download"></i> تصدير
                            </button>
                            <button (click)="triggerExcel()" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold text-xs transition">
                                <i class="fas fa-upload"></i> استيراد
                            </button>
                        </div>
                        <input type="file" id="excelInput" accept=".xlsx, .xls" class="hidden" (change)="handleExcel($event)">
                    </div>
                </div>
            </div>
        </div>
    </div>
  `,
  styles: [`
    .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  `]
})
export class SettingsModalComponent {
  store = inject(SchoolStoreService);
  close = output<void>();
  
  newViolationLabel = signal('');
  newViolationPoints = signal(5);

  triggerXml() { document.getElementById('xmlInput')?.click(); }
  triggerExcel() { document.getElementById('excelInput')?.click(); }

  handleXml(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
        this.store.parseXML(file);
        this.close.emit();
    }
  }

  handleExcel(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
        this.store.importTeacherData(file);
        this.close.emit();
    }
  }

  addViolation() {
      if(!this.newViolationLabel().trim()) return;
      this.store.addViolationType({
          id: Date.now().toString(),
          label: this.newViolationLabel(),
          points: this.newViolationPoints(),
          icon: 'fa-exclamation-circle' // Default icon
      });
      this.newViolationLabel.set('');
      this.newViolationPoints.set(5);
  }
}