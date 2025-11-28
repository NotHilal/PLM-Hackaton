import { Component, OnInit, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, KPIData } from '../services/data.service';

interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-insights-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './insights-tab.html',
  styleUrls: ['./insights-tab.css'],
})
export class InsightsTabComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatMessagesContainer') private chatMessagesContainer?: ElementRef;

  kpiData: KPIData | null = null;
  Math = Math; // Expose Math to template

  // Chatbot properties
  chatMessages: ChatMessage[] = [];
  userInput: string = '';
  isTyping: boolean = false;
  isChatOpen: boolean = false;
  private shouldScrollToBottom = false;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.graphData$.subscribe(() => {
      this.kpiData = this.dataService.calculateKPIs();
    });

    // Add welcome message
    this.addBotMessage('Bonjour! Je suis votre assistant AI. Comment puis-je vous aider à optimiser vos processus de fabrication aujourd\'hui?');
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.chatMessagesContainer) {
        this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'high': return '#f5576c';
      case 'medium': return '#f093fb';
      case 'low': return '#4facfe';
      default: return '#667eea';
    }
  }

  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;
  }

  sendMessage(): void {
    if (!this.userInput.trim()) return;

    // Add user message
    this.chatMessages.push({
      text: this.userInput,
      isUser: true,
      timestamp: new Date()
    });
    this.shouldScrollToBottom = true;

    const userQuestion = this.userInput.toLowerCase();
    this.userInput = '';

    // Simulate typing
    this.isTyping = true;

    // Generate response
    setTimeout(() => {
      const response = this.generateResponse(userQuestion);
      this.addBotMessage(response);
      this.isTyping = false;
      this.shouldScrollToBottom = true;
    }, 1000);
  }

  addBotMessage(text: string): void {
    this.chatMessages.push({
      text: text,
      isUser: false,
      timestamp: new Date()
    });
    this.shouldScrollToBottom = true;
  }

  generateResponse(question: string): string {
    // Context-aware responses based on KPI data
    if (question.includes('goulot') || question.includes('bottleneck')) {
      if (this.kpiData && this.kpiData.bottlenecks.length > 0) {
        const topBottleneck = this.kpiData.bottlenecks[0];
        return `Le principal goulot d'étranglement est "${topBottleneck.label}" avec ${topBottleneck.wip} unités en cours et ${topBottleneck.waitingTime} minutes de temps d'attente. ${topBottleneck.reason}`;
      }
      return 'Bonne nouvelle! Aucun goulot d\'étranglement majeur n\'a été détecté actuellement.';
    }

    if (question.includes('optimisation') || question.includes('amélioration') || question.includes('recommandation')) {
      if (this.kpiData && this.kpiData.optimizationActions.length > 0) {
        const topAction = this.kpiData.optimizationActions[0];
        return `Ma principale recommandation est: "${topAction.title}". ${topAction.description} Impact estimé: ${topAction.estimatedImpact}.`;
      }
      return 'Consultez la section "Optimisation Recommendations" ci-dessus pour voir toutes les suggestions.';
    }

    if (question.includes('wip') || question.includes('encours')) {
      if (this.kpiData) {
        return `Actuellement, la réduction potentielle du WIP est de ${Math.abs(this.kpiData.deltaWIP)}%. Cela signifie qu'en appliquant les optimisations recommandées, vous pourriez réduire significativement les stocks en cours.`;
      }
      return 'Les données WIP ne sont pas encore disponibles.';
    }

    if (question.includes('lead time') || question.includes('délai')) {
      if (this.kpiData) {
        return `Vous pouvez potentiellement réduire le lead time de ${Math.abs(this.kpiData.deltaLeadTime)}% en appliquant les optimisations recommandées.`;
      }
      return 'Les données de lead time ne sont pas encore disponibles.';
    }

    if (question.includes('aide') || question.includes('help') || question.includes('?')) {
      return 'Je peux vous aider avec:\n• Analyse des goulots d\'étranglement\n• Recommandations d\'optimisation\n• Métriques WIP et Lead Time\n• Priorisation des actions d\'amélioration\n\nQue souhaitez-vous savoir?';
    }

    if (question.includes('priorité') || question.includes('priority')) {
      if (this.kpiData && this.kpiData.optimizationActions.length > 0) {
        const priorities = this.kpiData.optimizationActions
          .slice(0, 3)
          .map(a => `${a.priority}. ${a.title}`)
          .join('\n');
        return `Voici les principales priorités:\n${priorities}`;
      }
      return 'Aucune action prioritaire n\'est définie pour le moment.';
    }

    // Default responses
    const defaultResponses = [
      'Intéressant! Pouvez-vous préciser votre question?',
      'Je peux vous aider à analyser vos données de production. Posez-moi une question sur les goulots d\'étranglement, les optimisations, ou les métriques WIP/Lead Time.',
      'Pour mieux vous aider, essayez de poser une question plus spécifique sur l\'analyse de vos processus de fabrication.',
      'Je suis là pour vous aider à optimiser vos processus. Demandez-moi des informations sur les bottlenecks, les recommandations, ou les métriques clés.'
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  clearChat(): void {
    this.chatMessages = [];
    this.addBotMessage('Conversation effacée. Comment puis-je vous aider?');
  }
}
