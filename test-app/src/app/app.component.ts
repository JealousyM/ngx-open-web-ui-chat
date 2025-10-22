import { Component, ViewChild, OnInit, AfterViewInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpenwebuiChatComponent } from 'ngx-open-web-ui-chat';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [OpenwebuiChatComponent, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('chatComponent') chatComponent?: OpenwebuiChatComponent;

  hostUrl = signal<string>('');
  apiKey = signal<string>('');
  
  models = signal<any[]>([]);
  selectedModelId = signal<string>('');
  loadingModels = signal<boolean>(false);
  currentLanguage = signal<string>('en');
  chatConnected = signal<boolean>(false);
  messageCount = signal<number>(0);
  
  languages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'es', name: 'Español' },
    { code: 'ar', name: 'العربية' },
    { code: 'fr', name: 'Français' },
    { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'ja', name: '日本語' }
  ];

  canLoadModels = computed(() => {
    return this.hostUrl().trim() !== '' && this.apiKey().trim() !== '' && !this.chatConnected();
  });

  hasMessages = computed(() => {
    return this.messageCount() > 0;
  });

  ngOnInit(): void {
    // Setup done
  }

  ngAfterViewInit(): void {
    // ViewChild available
  }

  async loadModels(): Promise<void> {
    if (!this.canLoadModels()) return;

    this.loadingModels.set(true);
    this.models.set([]);
    this.selectedModelId.set('');

    try {
      const response = await fetch(`${this.hostUrl().replace(/\/$/, '')}/api/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Models response:', data);
      
      if (data.data && Array.isArray(data.data)) {
        this.models.set(data.data);
      } else if (Array.isArray(data)) {
        this.models.set(data);
      }
    } catch (error) {
      console.error('Error loading models:', error);
      alert('Failed to load models. Please check your host URL and API key.');
    } finally {
      this.loadingModels.set(false);
    }
  }

  onModelChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newModelId = select.value;
    this.selectedModelId.set(newModelId);
  }

  connectChat(): void {
    if (!this.selectedModelId()) return;
    this.chatConnected.set(true);
  }

  onChatInitialized(): void {
    console.log('Chat has been initialized!');
  }

  onMessagesChanged(count: number): void {
    this.messageCount.set(count);
  }

  clearChat(): void {
    if (this.chatComponent) {
      this.chatComponent.clearChat();
      console.log('Chat cleared!');
    }
  }

  disconnect(): void {
    this.chatConnected.set(false);
    this.messageCount.set(0);
    this.models.set([]);
    this.selectedModelId.set('');
  }

  onLanguageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newLanguage = select.value;
    this.currentLanguage.set(newLanguage);
    console.log('Language changed to:', newLanguage);
  }
}
