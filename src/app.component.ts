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
  
  // Modal State
  selectedTeacher = signal<Teacher | null>(null);
  selectedClassName = signal<string | undefined>(undefined);
  showSettings = signal<boolean>(false);

  setView(view: 'now' | 'teachers' | 'reports') {
    this.currentView.set(view);
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