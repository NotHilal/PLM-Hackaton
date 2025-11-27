import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { signal } from '@angular/core';

@Component({
  selector: 'app-employee-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-sidebar.html',
  styleUrls: ['./employee-sidebar.css'],
})
export class EmployeeSidebarComponent {
  isCollapsed = false;
  selectedEmployee = signal<any | null>(null); // Pour la popup

  constructor(public dataService: DataService) {} // Injecte le service pour accéder aux employees

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  openPopup(employee: any): void {
    this.selectedEmployee.set(employee);
  }

  closePopup(): void {
    this.selectedEmployee.set(null);
  }
}