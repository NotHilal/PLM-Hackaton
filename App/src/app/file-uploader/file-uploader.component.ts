import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackendApiService } from '../services/backend-api.service';
import { DataService } from '../services/data.service';

interface FileInfo {
  filename: string;
  size?: number;
  last_modified?: string;
  exists: boolean;
}

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.css']
})
export class FileUploaderComponent implements OnInit {
  currentFiles: { [key: string]: FileInfo } = {};
  loading = false;
  uploadingType: string | null = null;
  successMessage = '';
  errorMessage = '';

  constructor(
    private api: BackendApiService,
    private cdr: ChangeDetectorRef,
    private dataService: DataService
  ) {}

  ngOnInit() {
    this.loadCurrentFiles();
  }

  loadCurrentFiles() {
    this.api.getCurrentFiles().subscribe({
      next: (files) => {
        this.currentFiles = files;
      },
      error: (err) => {
        console.error('Error loading current files:', err);
      }
    });
  }

  onFileSelected(event: Event, type: 'mes' | 'erp' | 'plm') {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadFile(file, type);
    }
  }

  uploadFile(file: File, type: 'mes' | 'erp' | 'plm') {
    console.log('🔄 Starting upload:', file.name, 'Type:', type);
    this.loading = true;
    this.uploadingType = type;
    this.successMessage = '';
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.api.uploadFile(file, type).subscribe({
      next: (response) => {
        console.log('✅ Upload success:', response);
        this.loading = false;
        this.uploadingType = null;
        this.successMessage = `✅ ${response.message || 'Upload successful'}`;
        this.cdr.detectChanges();

        this.loadCurrentFiles();

        // If ERP file was uploaded, reload employees
        if (type === 'erp') {
          console.log('🔄 Reloading employees after ERP upload');
          this.dataService.reloadEmployees();
        }

        // Clear success message after 5 seconds
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 5000);
      },
      error: (err) => {
        console.error('❌ Upload error:', err);
        this.loading = false;
        this.uploadingType = null;
        this.errorMessage = `❌ Error: ${err.error?.error || err.message || 'Upload failed'}`;
        this.cdr.detectChanges();

        // Clear error message after 5 seconds
        setTimeout(() => {
          this.errorMessage = '';
          this.cdr.detectChanges();
        }, 5000);
      }
    });
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }
    return `${kb.toFixed(2)} KB`;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR');
  }
}
