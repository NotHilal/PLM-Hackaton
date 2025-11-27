import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar';
import { EmployeeSidebarComponent } from './employee-sidebar/employee-sidebar';

@Component({
  selector: 'app-data-upload-tab',
  standalone: true,
  imports: [SidebarComponent, EmployeeSidebarComponent],
  templateUrl: './data-upload.html',
  styleUrls: ['./data-upload.css']
})
export class DataUploadTabComponent {
  protected readonly title = signal('Data Upload');
}
