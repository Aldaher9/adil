import { Component, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchoolStoreService } from '../services/school-store.service';

@Component({
  selector: 'app-settings-modal',
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="close.emit()"></div>
        
        <!-- Modal -->
        <div class="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
            <!-- Header -->
            <div class="bg-slate-800 text-white p-6 flex justify-between items-center">
                <h3 class="text-xl font-bold flex items-center gap-2">
                    <i class="fas fa-cog"></i> الإعدادات
                </h3>
                <button (click)="close.emit()" class="text-white/70 hover:text-white transition">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>

            <div class="p-6 space-y-6">
                <!-- Section 1: Timetable -->
                <div class="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                    <h4 class="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <i class="fas fa-calendar-alt"></i> جدول الحصص
                    </h4>
                    <p class="text-sm text-indigo-700/70 mb-4">
                        استيراد ملف XML من برنامج الجدول المدرسي (ASC) لتحديث الحصص والفترات.
                    </p>
                    <button (click)="triggerXml()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2">
                        <i class="fas fa-upload"></i> رفع ملف XML
                    </button>
                    <input type="file" id="xmlInput" accept=".xml" class="hidden" (change)="handleXml($event)">
                </div>

                <!-- Section 2: Teachers Data -->
                <div class="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                    <h4 class="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                        <i class="fas fa-users"></i> بيانات المعلمين
                    </h4>
                    <p class="text-sm text-emerald-700/70 mb-4">
                        تصدير قائمة المعلمين لتعديل الأسماء وأرقام الهواتف في Excel ثم إعادة استيرادها.
                    </p>
                    <div class="flex gap-3">
                        <button (click)="store.exportTeacherDataTemplate()" class="flex-1 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2">
                            <i class="fas fa-download"></i> تصدير القائمة
                        </button>
                        <button (click)="triggerExcel()" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2">
                            <i class="fas fa-file-import"></i> استيراد
                        </button>
                    </div>
                    <input type="file" id="excelInput" accept=".xlsx, .xls" class="hidden" (change)="handleExcel($event)">
                </div>
            </div>
        </div>
    </div>
  `,
  styles: [`
    .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class SettingsModalComponent {
  store = inject(SchoolStoreService);
  close = output<void>();

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
}
