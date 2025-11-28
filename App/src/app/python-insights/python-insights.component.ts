import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { BackendApiService } from '../services/backend-api.service';
import { AIInsights, Insight, Recommendation } from '../models/process-mining.model';

interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-python-insights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="insights-container">
      <!-- Header -->
      <div class="page-header mb-xl">
        <div class="header-content">
          <h2 class="page-title">💡 AI Insights & Recommendations</h2>
          <p class="page-subtitle">Recommandations intelligentes générées par l'IA</p>
        </div>
        <button class="btn btn-primary" (click)="refresh()" [disabled]="loading">
          {{ loading ? 'Chargement...' : 'Actualiser' }}
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Génération des insights IA...</p>
      </div>

      <!-- Error -->
      <div *ngIf="error && !loading" class="card error-card">
        <h3>❌ Erreur</h3>
        <p>{{ error }}</p>
        <button class="btn btn-primary mt-md" (click)="refresh()">Réessayer</button>
      </div>

      <!-- Content -->
      <div *ngIf="!loading && !error && insights">
        <!-- Summary Card -->
        <div class="card mb-xl summary-card">
          <div class="card-header">
            <span class="icon">📊</span>
            Résumé de l'Analyse
          </div>
          <div class="card-body">
            <p class="summary-text">{{ insights.summary }}</p>
          </div>
        </div>

        <!-- Insights Grid -->
        <div class="grid grid-cols-2 mb-xl">
          <div class="insights-column">
            <h3 class="section-title">🔍 Insights Détectés</h3>
            <div class="insight-card" *ngFor="let insight of insights.insights"
                 [ngClass]="'insight-' + insight.type">
              <div class="insight-header">
                <span class="insight-icon">{{ getInsightIcon(insight.type) }}</span>
                <span class="insight-title">{{ insight.title }}</span>
                <span class="badge" [ngClass]="'badge-' + insight.impact">
                  Impact: {{ insight.impact }}
                </span>
              </div>
              <p class="insight-description">{{ insight.description }}</p>
            </div>

            <div *ngIf="insights.insights.length === 0" class="empty-state">
              <span class="empty-icon">✅</span>
              <p>Aucun problème détecté. Le système fonctionne de manière optimale.</p>
            </div>
          </div>

          <div class="recommendations-column">
            <h3 class="section-title">🎯 Recommandations</h3>
            <div class="recommendation-card" *ngFor="let rec of insights.recommendations; let i = index">
              <div class="rec-number">{{ i + 1 }}</div>
              <div class="rec-content">
                <h4 class="rec-action">{{ rec.action }}</h4>
                <p class="rec-impact">
                  <strong>Impact attendu:</strong> {{ rec.expectedImpact }}
                </p>
                <div class="rec-meta">
                  <span class="badge" [ngClass]="'badge-' + rec.priority">
                    Priorité: {{ rec.priority }}
                  </span>
                  <span class="badge badge-info">
                    Coût: {{ rec.cost }}
                  </span>
                </div>
              </div>
            </div>

            <div *ngIf="insights.recommendations.length === 0" class="empty-state">
              <span class="empty-icon">👍</span>
              <p>Aucune recommandation pour le moment.</p>
            </div>
          </div>
        </div>

        <!-- AI Attribution -->
        <div class="card ai-attribution">
          <div class="flex items-center gap-md">
            <span style="font-size: 2rem;">🤖</span>
            <div>
              <strong style="color: var(--accent-purple);">Généré par Intelligence Artificielle</strong>
              <p class="text-muted" style="font-size: 0.875rem; margin-top: 0.25rem;">
                Ces insights sont calculés en temps réel par notre backend Python avec des algorithmes d'analyse avancés.
                Intégration future possible avec GPT/Claude pour des insights encore plus puissants.
              </p>
            </div>
          </div>
        </div>

      </div>

      <!-- AI Chatbot Section - Always visible -->
      <div class="chatbot-section">
        <div class="chatbot-container">
          <!-- Chatbot Header -->
          <div class="chatbot-header">
            <div class="chatbot-header-content">
              <span class="chatbot-icon">🤖</span>
              <div class="chatbot-title">
                <h3>Assistant AI</h3>
                <p>Posez vos questions sur les insights</p>
              </div>
            </div>
          </div>

          <!-- Chatbot Body -->
          <div class="chatbot-body">
            <div class="chat-messages" #chatMessagesContainer>
              <div
                *ngFor="let message of chatMessages"
                class="message"
                [class.user-message]="message.isUser"
                [class.bot-message]="!message.isUser">
                <div class="message-content">
                  <div class="message-avatar" *ngIf="!message.isUser">🤖</div>
                  <div class="message-bubble">
                    <p style="white-space: pre-wrap;">{{ message.text }}</p>
                    <span class="message-time">{{ message.timestamp | date: 'HH:mm' }}</span>
                  </div>
                  <div class="message-avatar" *ngIf="message.isUser">👤</div>
                </div>
              </div>

              <!-- Typing Indicator -->
              <div class="message bot-message" *ngIf="isTyping">
                <div class="message-content">
                  <div class="message-avatar">🤖</div>
                  <div class="message-bubble typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Chat Input -->
            <div class="chat-input-container">
              <button class="clear-chat-btn" (click)="clearChat()" title="Effacer la conversation">
                🗑️
              </button>
              <input
                type="text"
                class="chat-input"
                [(ngModel)]="userInput"
                (keyup.enter)="sendMessage()"
                placeholder="Posez votre question..."
                [disabled]="isTyping">
              <button
                class="send-btn"
                (click)="sendMessage()"
                [disabled]="!userInput.trim() || isTyping">
                📤
              </button>
            </div>

            <!-- Quick Questions -->
            <div class="quick-questions">
              <button class="quick-question-btn" (click)="userInput = 'Quels sont les principaux insights?'; sendMessage()">
                Principaux insights
              </button>
              <button class="quick-question-btn" (click)="userInput = 'Quelles sont les recommandations prioritaires?'; sendMessage()">
                Recommandations
              </button>
              <button class="quick-question-btn" (click)="userInput = 'Comment améliorer le processus?'; sendMessage()">
                Améliorer processus
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .insights-container {
      padding: var(--spacing-xl);
      background: var(--bg-primary);
      min-height: 100vh;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);
    }

    .summary-card {
      background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%);
      border-left: 4px solid var(--accent-cyan);
    }

    .summary-text {
      font-size: 1.1rem;
      line-height: 1.6;
      color: var(--text-primary);
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: var(--spacing-lg);
      color: var(--text-primary);
    }

    .insights-column, .recommendations-column {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .insight-card {
      background: var(--bg-card);
      padding: var(--spacing-lg);
      border-radius: var(--radius-lg);
      border-left: 4px solid;
      transition: all 0.2s ease;
    }

    .insight-card:hover {
      transform: translateX(4px);
      box-shadow: var(--shadow-lg);
    }

    .insight-success { border-color: var(--success); }
    .insight-info { border-color: var(--info); }
    .insight-warning { border-color: var(--warning); }
    .insight-error { border-color: var(--error); }

    .insight-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-sm);
    }

    .insight-icon {
      font-size: 1.5rem;
    }

    .insight-title {
      font-weight: 600;
      color: var(--text-primary);
      flex: 1;
    }

    .insight-description {
      color: var(--text-secondary);
      margin: 0;
    }

    .recommendation-card {
      display: flex;
      gap: var(--spacing-md);
      background: var(--bg-card);
      padding: var(--spacing-lg);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      transition: all 0.2s ease;
    }

    .recommendation-card:hover {
      border-color: var(--accent-purple);
      box-shadow: var(--shadow-lg);
    }

    .rec-number {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent-purple), var(--accent-cyan));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .rec-content {
      flex: 1;
    }

    .rec-action {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: var(--spacing-sm);
    }

    .rec-impact {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: var(--spacing-sm);
    }

    .rec-meta {
      display: flex;
      gap: var(--spacing-sm);
    }

    .empty-state {
      text-align: center;
      padding: var(--spacing-2xl);
      background: var(--bg-secondary);
      border-radius: var(--radius-lg);
      border: 2px dashed var(--border-color);
    }

    .empty-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: var(--spacing-md);
    }

    .ai-attribution {
      background: rgba(139, 92, 246, 0.1);
      border-color: var(--accent-purple);
    }

    .badge-low { background: rgba(59, 130, 246, 0.1); color: var(--info); }
    .badge-medium { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
    .badge-high { background: rgba(239, 68, 68, 0.1); color: var(--error); }

    @media (max-width: 1024px) {
      .grid-cols-2 {
        grid-template-columns: 1fr;
      }
    }

    /* Chatbot Section */
    .chatbot-section {
      margin-top: 3rem;
    }

    .chatbot-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .chatbot-header {
      background: linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-cyan) 100%);
      padding: 1.5rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chatbot-header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .chatbot-icon {
      font-size: 2.5rem;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }

    .chatbot-title h3 {
      margin: 0;
      color: white;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .chatbot-title p {
      margin: 0;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.875rem;
    }

    .chatbot-body {
      padding: 1.5rem;
      background: #fafbfc;
    }

    .chat-messages {
      max-height: 400px;
      overflow-y: auto;
      padding: 1rem;
      background: white;
      border-radius: 12px;
      margin-bottom: 1rem;
      scroll-behavior: smooth;
    }

    .chat-messages::-webkit-scrollbar {
      width: 8px;
    }

    .chat-messages::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }

    .chat-messages::-webkit-scrollbar-thumb {
      background: var(--accent-purple);
      border-radius: 4px;
    }

    .message {
      margin-bottom: 1.5rem;
      animation: messageSlide 0.3s ease;
    }

    @keyframes messageSlide {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message-content {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }

    .user-message .message-content {
      flex-direction: row-reverse;
    }

    .message-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
      background: linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-cyan) 100%);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .user-message .message-avatar {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .message-bubble {
      background: #f8f9fa;
      padding: 1rem 1.25rem;
      border-radius: 18px;
      max-width: 70%;
      position: relative;
    }

    .user-message .message-bubble {
      background: linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-cyan) 100%);
      color: white;
    }

    .message-bubble p {
      margin: 0 0 0.5rem 0;
      line-height: 1.6;
      font-size: 0.95rem;
      color: #000000;
    }

    .user-message .message-bubble p {
      color: white;
    }

    .message-time {
      font-size: 0.75rem;
      color: #6c757d;
      opacity: 0.7;
    }

    .user-message .message-time {
      color: rgba(255, 255, 255, 0.8);
    }

    .typing-indicator {
      display: flex;
      gap: 0.5rem;
      padding: 1rem;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent-purple);
      animation: typing 1.4s infinite;
    }

    .typing-indicator span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-indicator span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.7;
      }
      30% {
        transform: translateY(-10px);
        opacity: 1;
      }
    }

    .chat-input-container {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      background: white;
      padding: 1rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .clear-chat-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .clear-chat-btn:hover {
      background: #fee;
      border-color: #f5576c;
      color: #f5576c;
      transform: scale(1.1);
    }

    .chat-input {
      flex: 1;
      background: #f8f9fa;
      border: 2px solid transparent;
      border-radius: 24px;
      padding: 0.75rem 1.25rem;
      font-size: 0.95rem;
      outline: none;
      transition: all 0.2s ease;
    }

    .chat-input:focus {
      background: white;
      border-color: var(--accent-purple);
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
    }

    .chat-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .send-btn {
      background: linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-cyan) 100%);
      border: none;
      color: white;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
    }

    .send-btn:hover:not(:disabled) {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .quick-questions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .quick-question-btn {
      background: white;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .quick-question-btn:hover {
      background: linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-cyan) 100%);
      color: white;
      border-color: transparent;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    }

    @media (max-width: 768px) {
      .chatbot-header {
        padding: 1rem 1.5rem;
      }

      .chatbot-icon {
        font-size: 2rem;
      }

      .chatbot-title h3 {
        font-size: 1.1rem;
      }

      .chatbot-body {
        padding: 1rem;
      }

      .chat-messages {
        max-height: 300px;
      }

      .message-bubble {
        max-width: 85%;
      }

      .quick-questions {
        flex-direction: column;
      }

      .quick-question-btn {
        width: 100%;
      }
    }
  `]
})
export class PythonInsightsComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatMessagesContainer') private chatMessagesContainer?: ElementRef;

  private destroy$ = new Subject<void>();

  insights: AIInsights | null = null;
  loading = true;
  error: string | null = null;

  // Chatbot properties
  chatMessages: ChatMessage[] = [];
  userInput: string = '';
  isTyping: boolean = false;
  private shouldScrollToBottom = false;

  constructor(
    private backendApi: BackendApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadInsights();
    // Add welcome message after a short delay to ensure view is ready
    setTimeout(() => {
      this.addBotMessage('Bonjour! Je suis votre assistant AI. Comment puis-je vous aider avec les insights et recommandations?');
      this.cdr.detectChanges();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  loadInsights(): void {
    this.loading = true;
    this.error = null;

    this.backendApi.getInsights()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.insights = data;
          this.loading = false;
          this.cdr.detectChanges();
          console.log('✅ Insights loaded:', data);
        },
        error: (err) => {
          this.error = 'Impossible de charger les insights depuis le backend Python.';
          this.loading = false;
          this.cdr.detectChanges();
          console.error('❌ Error loading insights:', err);
        }
      });
  }

  refresh(): void {
    this.loadInsights();
  }

  getInsightIcon(type: string): string {
    const icons: Record<string, string> = {
      'success': '✅',
      'info': 'ℹ️',
      'warning': '⚠️',
      'error': '❌'
    };
    return icons[type] || 'ℹ️';
  }

  // Chatbot methods
  sendMessage(): void {
    if (!this.userInput.trim()) return;

    console.log('Sending message:', this.userInput);

    // Add user message
    this.chatMessages.push({
      text: this.userInput,
      isUser: true,
      timestamp: new Date()
    });
    this.shouldScrollToBottom = true;

    const userQuestion = this.userInput;
    this.userInput = '';

    // Show typing indicator
    this.isTyping = true;
    this.cdr.detectChanges();

    // Call backend AI API
    this.backendApi.chatWithAI(userQuestion, this.insights || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('AI Response received:', response);
          this.addBotMessage(response.response);
          this.isTyping = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error calling AI:', err);
          let errorMessage = 'Désolé, une erreur est survenue lors de la communication avec l\'IA.';

          if (err.status === 503) {
            errorMessage = 'Le service AI n\'est pas configuré. Veuillez définir la variable d\'environnement GROQ_API_KEY dans le backend.';
          } else if (err.status === 0) {
            errorMessage = 'Impossible de contacter le backend. Assurez-vous que le serveur Python est démarré (port 5000).';
          }

          this.addBotMessage(errorMessage);
          this.isTyping = false;
          this.cdr.detectChanges();
        }
      });
  }

  addBotMessage(text: string): void {
    console.log('Adding bot message:', text);
    this.chatMessages.push({
      text: text,
      isUser: false,
      timestamp: new Date()
    });
    this.shouldScrollToBottom = true;
  }

  clearChat(): void {
    this.chatMessages = [];
    this.addBotMessage('Conversation effacée. Comment puis-je vous aider?');
  }
}
