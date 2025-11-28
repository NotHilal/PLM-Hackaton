import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface FileVersion {
  id: string;
  original_name: string;
  stored_name: string;
  file_type: string;
  uploaded_at: string;
  size: number;
  active: boolean;
}

interface FileRegistry {
  mes: FileVersion[];
  erp: FileVersion[];
  plm: FileVersion[];
}

@Component({
  selector: 'app-file-versions-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-versions-modal.component.html',
  styleUrls: ['./file-versions-modal.component.css']
})
export class FileVersionsModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  fileRegistry: FileRegistry = { mes: [], erp: [], plm: [] };
  selectedTab: 'mes' | 'erp' | 'plm' = 'mes';
  loading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  // Confirmation dialog
  showConfirmDialog = false;
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  private baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {
    console.log('📁 File Versions Modal constructed');
  }

  ngOnInit() {
    console.log('📁 File Versions Modal initialized - loading versions...');
    this.loadFileVersions();
  }

  loadFileVersions() {
    console.log('🔄 Loading file versions from:', `${this.baseUrl}/v2/files/list`);
    this.loading = true;
    this.http.get<FileRegistry>(`${this.baseUrl}/v2/files/list`).subscribe({
      next: (data) => {
        console.log('✅ File versions loaded:', data);
        this.fileRegistry = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error loading file versions:', err);
        console.error('Error details:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          url: err.url
        });
        this.loading = false;
        this.showMessage(`Failed to load file versions: ${err.statusText || 'Unknown error'}`, 'error');
      }
    });
  }

  selectTab(tab: 'mes' | 'erp' | 'plm') {
    this.selectedTab = tab;
  }

  getTabFiles(): FileVersion[] {
    return this.fileRegistry[this.selectedTab] || [];
  }

  switchToVersion(fileId: string) {
    this.confirmMessage = 'Switch to this version? This will update all data displays.';
    this.confirmAction = () => {
      this.loading = true;
      this.http.post(`${this.baseUrl}/v2/files/active/${this.selectedTab}`, { file_id: fileId }).subscribe({
        next: (response: any) => {
          console.log('✅ Switched version:', response);
          this.showMessage(response.message || 'Version switched successfully', 'success');
          this.loadFileVersions();
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ Error switching version:', err);
          this.showMessage('Failed to switch version', 'error');
          this.loading = false;
        }
      });
    };
    this.showConfirmDialog = true;
  }

  deleteVersion(fileId: string, fileName: string) {
    this.confirmMessage = `Delete ${fileName}? This cannot be undone.`;
    this.confirmAction = () => {
      this.loading = true;
      this.http.delete(`${this.baseUrl}/v2/files/delete/${this.selectedTab}/${fileId}`).subscribe({
        next: (response: any) => {
          console.log('✅ Deleted version:', response);
          this.showMessage(response.message || 'Version deleted successfully', 'success');
          this.loadFileVersions();
        },
        error: (err) => {
          console.error('❌ Error deleting version:', err);
          this.showMessage(err.error?.error || 'Failed to delete version', 'error');
          this.loading = false;
        }
      });
    };
    this.showConfirmDialog = true;
  }

  confirmDialogYes() {
    this.showConfirmDialog = false;
    if (this.confirmAction) {
      this.confirmAction();
      this.confirmAction = null;
    }
  }

  confirmDialogNo() {
    this.showConfirmDialog = false;
    this.confirmAction = null;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(1) + ' KB';
    const mb = kb / 1024;
    return mb.toFixed(2) + ' MB';
  }

  getFileTypeLabel(type: string): string {
    const labels = {
      mes: '🏭 MES Data',
      erp: '💼 ERP Data',
      plm: '📐 PLM Data'
    };
    return labels[type as keyof typeof labels] || type.toUpperCase();
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }

  closeModal() {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal();
    }
  }
}
