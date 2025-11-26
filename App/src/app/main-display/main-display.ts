import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main-display.html',
  styleUrls: ['./main-display.css'],
})
export class MainDisplayComponent {
  placeholderText: string = 'Diagramme de flux (placeholder)';
}
