import { Component, signal, Input, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { ChatMessage, OpenWebUIChatConfig } from '../models/chat.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpenWebUIService } from '../services/openwebui-api';
import { MarkdownModule } from 'ngx-markdown';
import { getTranslation, Translation } from '../i18n/translations';

@Component({
  selector: 'openwebui-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownModule],
  templateUrl: './openwebui-chat.html',
  styleUrls: ['./openwebui-chat.scss']
})
export class OpenwebuiChatComponent implements OnInit {
  @Input({ required: true }) modelId!: string;
  @Input({ required: true }) apiKey!: string;
  @Input({ required: true }) endpoint!: string;
  @Input() style?: Partial<CSSStyleDeclaration>;
  @Input() debug = false;
  @Input() enableMarkdown = true;
  @Input() language = 'en';

  @Output() chatInitialized = new EventEmitter<void>();
  @Output() messagesChanged = new EventEmitter<number>();

  messages = signal<ChatMessage[]>([]);
  isLoading = signal(false);
  currentResponse = signal('');
  inputMessage = '';
  private chatId?: string;
  private openWebUIService = inject(OpenWebUIService);
  
  get t(): Translation {
    return getTranslation(this.language);
  }

  ngOnInit(): void {
    const config: OpenWebUIChatConfig = {
      modelId: this.modelId,
      apiKey: this.apiKey,
      endpoint: this.endpoint,
      style: this.style,
      debug: this.debug
    };

    this.openWebUIService.configure(config);

    this.openWebUIService.createNewChat().subscribe({
      next: (session) => {
        this.chatId = session.id;
        if (this.debug) {
          console.log('[OpenWebUI] Chat initialized:', session);
        }
        this.chatInitialized.emit();
      },
      error: (error) => {
        if (this.debug) {
          console.error('[OpenWebUI] Failed to initialize chat:', error);
        }
      }
    });
  }

  sendMessage(message: string): void {
    if (!message.trim()) return;

    this.messages.update(msgs => {
      const updated: ChatMessage[] = [...msgs, { role: 'user' as const, content: message, timestamp: new Date() }];
      this.messagesChanged.emit(updated.length);
      return updated;
    });
    this.isLoading.set(true);
    this.currentResponse.set('');

    const history = this.messages().map(msg => ({ role: msg.role, content: msg.content }));

    this.openWebUIService.sendMessage(message, this.chatId, history).subscribe({
      next: (chunk) => {
        this.currentResponse.update(current => current + chunk);
      },
      complete: () => {
        const finalResponse = this.currentResponse();
        if (finalResponse) {
          this.messages.update(msgs => {
            const updated: ChatMessage[] = [...msgs, { 
              role: 'assistant' as const, 
              content: finalResponse, 
              timestamp: new Date() 
            }];
            this.messagesChanged.emit(updated.length);
            return updated;
          });
        }
        this.isLoading.set(false);
        this.currentResponse.set('');
      },
      error: (error) => {
        if (this.debug) {
          console.error('[OpenWebUI] Message error:', error);
        }
        this.isLoading.set(false);
        this.currentResponse.set('');
      }
    });
  }

  sendMessageInternal(): void {
    const message = this.inputMessage.trim();
    if (message) {
      this.sendMessage(message);
      this.inputMessage = '';
    }
  }

  createNewChat(): void {
    this.openWebUIService.createNewChat().subscribe({
      next: (session) => {
        this.chatId = session.id;
        this.messages.set([]);
        if (this.debug) {
          console.log('[OpenWebUI] New chat created:', session);
        }
      },
      error: (error) => {
        if (this.debug) {
          console.error('[OpenWebUI] Failed to create new chat:', error);
        }
      }
    });
  }

  clearChat(): void {
    this.messages.set([]);
    this.messagesChanged.emit(0);
    this.inputMessage = '';
    this.currentResponse.set('');
    this.isLoading.set(false);
    if (this.debug) {
      console.log('[OpenWebUI] Chat cleared');
    }
  }

  changeModel(newModelId: string): void {
    this.modelId = newModelId;
    this.openWebUIService.configure({
      modelId: newModelId,
      apiKey: this.apiKey,
      endpoint: this.endpoint,
      debug: this.debug
    });
    this.createNewChat();
    if (this.debug) {
      console.log('[OpenWebUI] Model changed to:', newModelId);
    }
  }

  async getModels(): Promise<any> {
    return await this.openWebUIService.getModels();
  }
}
