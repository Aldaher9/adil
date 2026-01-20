import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchoolStoreService, Teacher } from './services/school-store.service';
import { CurrentClassesComponent } from './components/current-classes.component';
import { TeacherManagerComponent } from './components/teacher-manager.component';
import { ReportsComponent } from './components/reports.component';
import { ActionModalComponent } from './components/action-modal.component';
import { SettingsModalComponent } from './components/settings-modal.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule, 
    CurrentClassesComponent, 
    TeacherManagerComponent, 
    ReportsComponent,
    ActionModalComponent,
    SettingsModalComponent
  ],
  templateUrl: './app.component.html'
})
export class AppComponent {
  store = inject(SchoolStoreService);
  
  currentView = signal<'now' | 'teachers' | 'reports'>('now');
  
  navItems = [
    { view: 'now', label: 'الحصص', icon: 'chalkboard' },
    { view: 'teachers', label: 'المعلمين', icon: 'users-cog' },
    { view: 'reports', label: 'التقارير', icon: 'file-invoice' }
  ];

  // Modal State
  selectedTeacher = signal<Teacher | null>(null);
  selectedClassName = signal<string | undefined>(undefined);
  showSettings = signal<boolean>(false);

  setView(view: string) {
    this.currentView.set(view as 'now' | 'teachers' | 'reports');
  }

  openModal(data: {teacher: Teacher, className?: string}) {
      this.selectedTeacher.set(data.teacher);
      this.selectedClassName.set(data.className);
  }

  closeModal() {
      this.selectedTeacher.set(null);
      this.selectedClassName.set(undefined);
  }
}