import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { signal } from '@angular/core';

@Component({
  selector: 'app-employee-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-sidebar.html',
  styleUrls: ['./employee-sidebar.css'],
})
export class EmployeeSidebarComponent {
  selectedEmployee = signal<any | null>(null);
  searchTerm = signal<string>('');

  constructor(public dataService: DataService) {}

  // Filtered employees
  filteredEmployees = computed(() => {
    let employees = this.dataService.employees();

    // Filter by search term
    const search = this.searchTerm().toLowerCase().trim();
    if (search) {
      employees = employees.filter((emp: any) => {
        const fullName = `${emp['Prénom']} ${emp['Nom']}`.toLowerCase();
        const qualification = (emp['Qualification'] || '').toLowerCase();
        const poste = (emp['Poste de montage'] || '').toLowerCase();
        const matricule = (emp['Matricule'] || '').toLowerCase();

        return fullName.includes(search) ||
               qualification.includes(search) ||
               poste.includes(search) ||
               matricule.includes(search);
      });
    }

    return employees;
  });

  openPopup(employee: any): void {
    this.selectedEmployee.set(employee);
  }

  closePopup(): void {
    this.selectedEmployee.set(null);
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  getExperienceColor(level: string): string {
    const levelMap: Record<string, string> = {
      'Junior': '#f59e0b',
      'Confirmé': '#3b82f6',
      'Senior': '#10b981',
      'Expert': '#8b5cf6'
    };
    return levelMap[level] || '#6b7280';
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
}