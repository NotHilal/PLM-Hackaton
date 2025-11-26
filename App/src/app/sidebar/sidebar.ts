import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
})
export class SidebarComponent {

  files: File[] = [];

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.files = Array.from(event.dataTransfer.files);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

}
