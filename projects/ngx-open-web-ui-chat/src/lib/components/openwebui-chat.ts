import { Component, signal, Input, OnInit, Output, EventEmitter, inject, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ChatMessage, OpenWebUIChatConfig, UploadedFile } from '../models/chat.model';
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

  public messages = signal<ChatMessage[]>([]);
  public isLoading = signal(false);
  public currentResponse = signal('');
  public inputMessage = '';
  public uploadedFiles = signal<UploadedFile[]>([]);
  public isUploadingFile = signal(false);
  public showFileMenu = signal(false);
  private chatId?: string;
  private openWebUIService = inject(OpenWebUIService);
  
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  
  get t(): Translation {
    return getTranslation(this.language);
  }

  public ngOnInit(): void {
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
        this.chatInitialized.emit();
      },
      error: (error) => {
        if (this.debug) {
          console.error('[OpenWebUI] Failed to initialize chat:', error);
        }
      }
    });
  }

  public sendMessage(message: string): void {
    if (!message.trim()) return;

    const currentFiles = [...this.uploadedFiles()];
    
    const history = this.messages().map(msg => ({ role: msg.role, content: msg.content }));
    
    this.messages.update(msgs => {
      const updated: ChatMessage[] = [...msgs, { 
        role: 'user' as const, 
        content: message, 
        timestamp: new Date(),
        files: currentFiles.length > 0 ? currentFiles : undefined
      }];
      this.messagesChanged.emit(updated.length);
      return updated;
    });
    this.isLoading.set(true);
    this.currentResponse.set('');
    this.uploadedFiles.set([]);

    this.openWebUIService.sendMessage(message, this.chatId, history, currentFiles.length > 0 ? currentFiles : undefined).subscribe({
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

  public sendMessageInternal(): void {
    const message = this.inputMessage.trim();
    if (message) {
      this.sendMessage(message);
      this.inputMessage = '';
    }
  }

  public createNewChat(): void {
    this.openWebUIService.createNewChat().subscribe({
      next: (session) => {
        this.chatId = session.id;
        this.messages.set([]);      },
      error: (error) => {
        if (this.debug) {
          console.error('[OpenWebUI] Failed to create new chat:', error);
        }
      }
    });
  }

  public async stopGeneration(): Promise<void> {
    await this.openWebUIService.stopGeneration();
    const partialResponse = this.currentResponse();
    if (partialResponse) {
      this.messages.update(msgs => {
        const updated: ChatMessage[] = [...msgs, { 
          role: 'assistant' as const, 
          content: partialResponse, 
          timestamp: new Date() 
        }];
        this.messagesChanged.emit(updated.length);
        return updated;
      });
    }
    this.isLoading.set(false);
    this.currentResponse.set('');
  }

  public clearChat(): void {
    this.messages.set([]);
    this.messagesChanged.emit(0);
    this.inputMessage = '';
    this.currentResponse.set('');
    this.isLoading.set(false);
  }

  public changeModel(newModelId: string): void {
    this.modelId = newModelId;
    this.openWebUIService.configure({
      modelId: newModelId,
      apiKey: this.apiKey,
      endpoint: this.endpoint,
      debug: this.debug
    });
    this.createNewChat();
  }

  public async getModels(): Promise<any> {
    return await this.openWebUIService.getModels();
  }

  toggleFileMenu(): void {
    this.showFileMenu.update(v => !v);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.input-actions') && this.showFileMenu()) {
      this.showFileMenu.set(false);
    }
  }

  public triggerFileUpload(): void {
    this.showFileMenu.set(false);
    this.fileInput?.nativeElement.click();
  }

  public async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isUploadingFile.set(true);

    try {
      const uploadedFile = await this.openWebUIService.uploadFile(file);
      this.uploadedFiles.update(files => [...files, uploadedFile]);
    } catch (error) {
      if (this.debug) {
        console.error('[OpenWebUI] File upload failed:', error);
      }
    } finally {
      this.isUploadingFile.set(false);
      input.value = '';
    }
  }

  public removeFile(fileId: string): void {
    this.uploadedFiles.update(files => files.filter(f => f.id !== fileId));
  }

  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
