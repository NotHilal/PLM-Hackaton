import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, UploadedFile } from '../services/data.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
})
export class SidebarComponent implements OnInit {
  documents: UploadedFile[] = [];
  selectedDocument: UploadedFile | null = null;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.documents$.subscribe(docs => {
      this.documents = docs;
    });

    this.dataService.selectedDocument$.subscribe(doc => {
      this.selectedDocument = doc;
    });
  }

  selectDocument(doc: UploadedFile): void {
    this.dataService.selectDocument(doc);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  getFileIcon(type: string): string {
    if (type.includes('csv')) return '📊';
    if (type.includes('json')) return '📄';
    return '📁';
  }
}
