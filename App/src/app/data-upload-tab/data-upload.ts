import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FileUploaderComponent } from '../file-uploader/file-uploader.component';

@Component({
  selector: 'app-data-upload-tab',
  standalone: true,
  imports: [FileUploaderComponent],
  templateUrl: './data-upload.html',
  styleUrls: ['./data-upload.css']
})
export class DataUploadTabComponent {
  protected readonly title = signal('Data Upload');
}
