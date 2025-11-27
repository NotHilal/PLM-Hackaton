import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { signal } from '@angular/core';
import { DataService } from '../../services/data.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
})
export class SidebarComponent {

  files = signal<{ file: File, content: string | null, preview: string | null, loading: boolean }[]>([]);
  isCollapsed = false;

  // Bases de données internes (en mémoire)
  employees: any[] = []; // Pour les employés (de ERP_Equipes Airplus.xlsx par ex.)
  tasks: any[] = []; // Pour les tâches (de MES_Extraction.xlsx par ex.)
  components: any[] = []; // Pour les composants (de PLM_DataSet.xlsx par ex.)

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      const newFiles = Array.from(event.dataTransfer.files);
      for (const file of newFiles) {
        // Ajoute immédiatement le fichier avec état loading
        const item = { file, content: null, preview: null, loading: true };
        this.files.update(current => [...current, item]);
        const index = this.files().length - 1;

        if (file.name.endsWith('.xlsx') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
          this.readExcelFile(file, index);
        } else {
          this.readTextFile(file, index);
        }
      }
    }
  }

  private readTextFile(file: File, index: number): void {
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      this.files.update(current => {
        const updated = [...current];
        updated[index] = { ...updated[index], content, preview: content.substring(0, 50) + '...', loading: false };
        return updated;
      });
    };
    reader.onerror = () => {
      console.error('Error reading file');
      this.files.update(current => {
        const updated = [...current];
        updated[index] = { ...updated[index], preview: 'Erreur de lecture du contenu', loading: false };
        return updated;
      });
    };
    reader.readAsText(file);
  }

  private readExcelFile(file: File, index: number): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.files.update(current => {
        const updated = [...current];
        try {
          const data = e.target?.result as ArrayBuffer;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          const preview = JSON.stringify(json.slice(0, 3), null, 2);
          updated[index] = { ...updated[index], preview, loading: false };
        } catch (error) {
          console.error('Error reading Excel:', error);
          updated[index] = { ...updated[index], preview: 'Erreur de lecture du fichier Excel', loading: false };
        }
        return updated;
      });
    };
    reader.onerror = () => {
      console.error('Error reading file');
      this.files.update(current => {
        const updated = [...current];
        updated[index] = { ...updated[index], preview: 'Erreur de lecture du contenu', loading: false };
        return updated;
      });
    };
    reader.readAsArrayBuffer(file);
  }

  // Méthodes d'import
  importAsEmployees(index: number): void {
    this.importFileAsCategory(index, 'employees');
  }

  importAsTasks(index: number): void {
    this.importFileAsCategory(index, 'tasks');
  }

  importAsComponents(index: number): void {
    this.importFileAsCategory(index, 'components');
  }

  private importFileAsCategory(index: number, category: 'employees' | 'tasks' | 'components'): void {
    const item = this.files()[index];
    if (!item || item.loading) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet); // Parse en JSON

        // Mise à jour via le service (avec signals)
        if (category === 'employees') {
          this.dataService.employees.update(current => [...current, ...jsonData]);
          console.log('Employés importés :', this.dataService.employees());
        } else if (category === 'tasks') {
          this.dataService.tasks.update(current => [...current, ...jsonData]);
          console.log('Tâches importées :', this.dataService.tasks());
        } else if (category === 'components') {
          this.dataService.components.update(current => [...current, ...jsonData]);
          console.log('Composants importés :', this.dataService.components());
        }

        alert(`Fichier importé comme ${category} avec succès !`);
      } catch (error) {
        console.error('Erreur lors de l\'import :', error);
        alert('Erreur lors de l\'import du fichier.');
      }
    };
    reader.readAsArrayBuffer(item.file);
  }

  // Ajoute l'injection du service dans le constructor
  constructor(private dataService: DataService) {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  removeFile(index: number): void {
    this.files.update(current => current.filter((_, i) => i !== index));
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

}