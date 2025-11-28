import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeSidebarComponent } from '../data-upload-tab/employee-sidebar/employee-sidebar';

@Component({
  selector: 'app-employee-info',
  standalone: true,
  imports: [CommonModule, EmployeeSidebarComponent],
  templateUrl: './employee-info.component.html',
  styleUrls: ['./employee-info.component.css']
})
export class EmployeeInfoComponent {

}
