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
  selectedQualification = signal<string>('all');
  selectedExperience = signal<string>('all');
  selectedAgeRange = signal<string>('all');
  selectedSalaryRange = signal<string>('all');

  constructor(public dataService: DataService) {}

  // Get unique qualifications
  uniqueQualifications = computed(() => {
    const qualifs = this.dataService.employees().map((e: any) => e['Qualification']);
    return ['all', ...Array.from(new Set(qualifs))].filter(q => q);
  });

  // Get unique experience levels
  uniqueExperiences = computed(() => {
    const experiences = this.dataService.employees().map((e: any) => e['Niveau d\'expérience']);
    return ['all', ...Array.from(new Set(experiences))].filter(e => e);
  });

  // Filtered employees
  filteredEmployees = computed(() => {
    let employees = this.dataService.employees();

    // Filter by qualification
    if (this.selectedQualification() !== 'all') {
      employees = employees.filter((emp: any) => emp['Qualification'] === this.selectedQualification());
    }

    // Filter by experience level
    if (this.selectedExperience() !== 'all') {
      employees = employees.filter((emp: any) => emp['Niveau d\'expérience'] === this.selectedExperience());
    }

    // Filter by age range
    const ageRange = this.selectedAgeRange();
    if (ageRange !== 'all') {
      employees = employees.filter((emp: any) => {
        const age = emp['Âge'];
        if (ageRange === '18-30') return age >= 18 && age <= 30;
        if (ageRange === '31-40') return age >= 31 && age <= 40;
        if (ageRange === '41-50') return age >= 41 && age <= 50;
        if (ageRange === '51+') return age >= 51;
        return true;
      });
    }

    // Filter by salary range
    const salaryRange = this.selectedSalaryRange();
    if (salaryRange !== 'all') {
      employees = employees.filter((emp: any) => {
        const salary = emp['Coût horaire (€)'];
        if (salaryRange === '0-20') return salary >= 0 && salary <= 20;
        if (salaryRange === '21-35') return salary >= 21 && salary <= 35;
        if (salaryRange === '36-50') return salary >= 36 && salary <= 50;
        if (salaryRange === '51+') return salary >= 51;
        return true;
      });
    }

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

  onQualificationChange(value: string): void {
    this.selectedQualification.set(value);
  }

  onExperienceChange(value: string): void {
    this.selectedExperience.set(value);
  }

  onAgeRangeChange(value: string): void {
    this.selectedAgeRange.set(value);
  }

  onSalaryRangeChange(value: string): void {
    this.selectedSalaryRange.set(value);
  }

  clearAllFilters(): void {
    this.searchTerm.set('');
    this.selectedQualification.set('all');
    this.selectedExperience.set('all');
    this.selectedAgeRange.set('all');
    this.selectedSalaryRange.set('all');
  }

  hasActiveFilters(): boolean {
    return this.searchTerm() !== '' ||
           this.selectedQualification() !== 'all' ||
           this.selectedExperience() !== 'all' ||
           this.selectedAgeRange() !== 'all' ||
           this.selectedSalaryRange() !== 'all';
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