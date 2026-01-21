import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchoolStoreService, Teacher } from './services/enhanced-school-store.service';
import { DashboardComponent } from './components/dashboard.component';
import { CurrentClassesComponent } from './components/current-classes-enhanced.component';
import { TeacherManagerComponent } from './components/teacher-manager-enhanced.component';
import { ReportsComponent } from './components/reports-enhanced.component';
import { ActionModalComponent } from './components/action-modal-enhanced.component';
import { SettingsModalComponent } from './components/settings-modal-enhanced.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    DashboardComponent,
    CurrentClassesComponent,
    TeacherManagerComponent,
    ReportsComponent,
    ActionModalComponent,
    SettingsModalComponent
  ],
  templateUrl: './app.component.html',
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }

    .slide-in {
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .notification-badge {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: .5;
      }
    }
  `]
})
export class AppComponent {
  store = inject(SchoolStoreService);
  
  currentView = signal<'dashboard' | 'now' | 'teachers' | 'reports'>('dashboard');
  
  navItems = [
    { view: 'dashboard', label: 'لوحة التحكم', icon: 'chart-line', color: 'indigo' },
    { view: 'now', label: 'الحصص', icon: 'chalkboard', color: 'blue' },
    { view: 'teachers', label: 'المعلمين', icon: 'users-cog', color: 'green' },
    { view: 'reports', label: 'التقارير', icon: 'file-invoice', color: 'purple' }
  ];

  // Modal State
  selectedTeacher = signal<Teacher | null>(null);
  selectedClassName = signal<string | undefined>(undefined);
  showSettings = signal<boolean>(false);
  showNotifications = signal<boolean>(false);

  // Notifications
  unreadNotifications = this.store.notifications;

  setView(view: string) {
    this.currentView.set(view as any);
  }

  openModal(data: {teacher: Teacher, className?: string}) {
    this.selectedTeacher.set(data.teacher);
    this.selectedClassName.set(data.className);
  }

  closeModal() {
    this.selectedTeacher.set(null);
    this.selectedClassName.set(undefined);
  }

  toggleNotifications() {
    this.showNotifications.update(v => !v);
  }

  toggleTheme() {
    this.store.toggleTheme();
  }

  async syncNow() {
    await this.store.syncToCloud();
  }
}
