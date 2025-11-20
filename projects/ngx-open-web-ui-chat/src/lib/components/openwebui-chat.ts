import { Component, signal, Input, OnInit, Output, EventEmitter, inject, HostListener, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ChatMessage, OpenWebUIChatConfig, UploadedFile } from '../models/chat.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpenWebUIService } from '../services/openwebui-api';
import { MarkdownModule } from 'ngx-markdown';
import { getTranslation, Translation } from '../i18n/translations';
import { ErrorBannerComponent } from './error-banner/error-banner.component';
import { ChatMessageComponent } from './chat-message/chat-message.component';
import { ChatInputComponent } from './chat-input/chat-input.component';
import { AudioRecorder } from '../utils/audio-recorder';

@Component({
  selector: 'openwebui-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MarkdownModule,
    ErrorBannerComponent,
    ChatMessageComponent,
    ChatInputComponent
  ],
  templateUrl: './openwebui-chat.html',
  styleUrls: ['./openwebui-chat.scss']
})
export class OpenwebuiChatComponent implements OnInit, OnDestroy {
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
  
  public isRecording = signal(false);
  public recordingError = signal<string | null>(null);
  public isTranscribing = signal(false);
  public transcriptionError = signal<string | null>(null);
  
  private audioRecorder?: AudioRecorder;
  private lastAudioBlob?: Blob;
  private animationFrameId?: number;
  
  public showRegenerateMenu = signal(false);
  public regenerateMenuTarget = signal<ChatMessage | null>(null);
  public regenerateInputText = signal('');
  public messageHoverStates = signal<Map<string, boolean>>(new Map());
  
  public showRatingForm = signal(false);
  public ratingFormTarget = signal<ChatMessage | null>(null);
  public ratingFormValue = signal<number>(5);
  public ratingFormTags = signal<string[]>([]);
  public ratingFormComment = ''; 
  private currentFeedbackId?: string;
  public initialRatingType: 1 | -1 = 1;
  
  public showRatingConfirmation = signal(false);
  private ratingConfirmationTimeout?: any;
  
  public errorMessage = signal<string>('');
  public showError = signal(false);
  private errorTimeout?: any;
  
  private activeRegenerations = signal<Set<string>>(new Set());
  private activeContinuations = signal<Set<string>>(new Set());
  
  private chatId?: string;
  private openWebUIService = inject(OpenWebUIService);
  private cdr = inject(ChangeDetectorRef);
  
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

  public ngOnDestroy(): void {
    if (this.audioRecorder) {
      this.audioRecorder.destroy();
      this.audioRecorder = undefined;
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  public sendMessage(message: string): void {
    if (!message.trim()) return;

    const currentFiles = [...this.uploadedFiles()];
    
    const history = this.messages().map(msg => ({ role: msg.role, content: msg.content, id: msg.id }));
    
    const userMessageId = this.generateUUID();
    
    this.messages.update(msgs => {
      const updated: ChatMessage[] = [...msgs, { 
        role: 'user' as const, 
        content: message, 
        timestamp: new Date(),
        id: userMessageId,
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
          const assistantMessageId = this.openWebUIService.getCurrentMessageId();
          
          this.messages.update(msgs => {
            const updated: ChatMessage[] = [...msgs, { 
              role: 'assistant' as const, 
              content: finalResponse, 
              timestamp: new Date(),
              id: assistantMessageId
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

  /**
   * Initialize audio recorder on first use
   */
  private initializeAudioRecorder(): void {
    if (!this.audioRecorder) {
      this.audioRecorder = new AudioRecorder();
    }
  }

  /**
   * Get the audio context for spectrogram visualization
   */
  public getAudioContext(): AudioContext | undefined {
    this.initializeAudioRecorder();
    return this.audioRecorder?.getAudioContext();
  }

  /**
   * Get the analyser node for frequency analysis
   */
  public getAnalyser(): AnalyserNode | undefined {
    this.initializeAudioRecorder();
    return this.audioRecorder?.getAnalyser();
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.regenerate-menu') && !target.closest('.regenerate-btn') && this.showRegenerateMenu()) {
      this.closeRegenerateMenu();
    }
    if (!target.closest('.rating-form') && !target.closest('.rate-good-btn') && !target.closest('.rate-bad-btn') && this.showRatingForm()) {
      this.closeRatingForm();
    }
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

  public isLatestMessage(message: ChatMessage): boolean {
    const msgs = this.messages();
    if (msgs.length === 0) return false;
    const lastAssistantMsg = [...msgs].reverse().find(m => m.role === 'assistant');
    return lastAssistantMsg === message;
  }

  private showErrorMessage(message: string, duration: number = 5000): void {
    this.errorMessage.set(message);
    this.showError.set(true);
    
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
    
    this.errorTimeout = setTimeout(() => {
      this.hideErrorMessage();
    }, duration);
  }

  public hideErrorMessage(): void {
    this.showError.set(false);
    this.errorMessage.set('');
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = undefined;
    }
  }

  private isMessageIdValid(messageId: string | undefined): boolean {
    if (!messageId) {
      if (this.debug) {
        console.error('[OpenWebUI] Message ID is missing');
      }
      this.showErrorMessage(this.t.errorMessageIdMissing ?? 'Message ID is missing. Please try again.');
      return false;
    }
    return true;
  }

  private isRegenerationInProgress(messageId: string): boolean {
    return this.activeRegenerations().has(messageId);
  }

  private isContinuationInProgress(messageId: string): boolean {
    return this.activeContinuations().has(messageId);
  }

  private startRegeneration(messageId: string): void {
    this.activeRegenerations.update(set => {
      const newSet = new Set(set);
      newSet.add(messageId);
      return newSet;
    });
  }

  private endRegeneration(messageId: string): void {
    this.activeRegenerations.update(set => {
      const newSet = new Set(set);
      newSet.delete(messageId);
      return newSet;
    });
  }

  private startContinuation(messageId: string): void {
    this.activeContinuations.update(set => {
      const newSet = new Set(set);
      newSet.add(messageId);
      return newSet;
    });
  }

  private endContinuation(messageId: string): void {
    this.activeContinuations.update(set => {
      const newSet = new Set(set);
      newSet.delete(messageId);
      return newSet;
    });
  }

  private regenerateWithPrompt(message: ChatMessage, prompt: string): void {
    if (!this.isMessageIdValid(message.id)) {
      return;
    }

    if (this.isLoading()) {
      this.showErrorMessage(this.t.errorOperationInProgress ?? 'Another operation is in progress. Please wait.');
      return;
    }

    if (this.isRegenerationInProgress(message.id!)) {
      this.showErrorMessage(this.t.errorRegenerationInProgress ?? 'Regeneration already in progress for this message.');
      return;
    }

    const msgs = this.messages();
    const messageIndex = msgs.findIndex(m => m.id === message.id);
    
    if (messageIndex === -1) {
      if (this.debug) {
        console.error('[OpenWebUI] Message not found in conversation history');
      }
      this.showErrorMessage(this.t.errorMessageNotFound ?? 'Message not found in conversation history.');
      return;
    }

    const originalContent = message.content;

    this.messages.update(msgs => {
      const updatedMsgs = [...msgs];
      updatedMsgs[messageIndex] = {
        ...updatedMsgs[messageIndex],
        content: ''
      };
      return updatedMsgs;
    });

    const conversationHistory = msgs.slice(0, messageIndex).map(msg => ({
      role: msg.role,
      content: msg.content,
      id: msg.id,
      timestamp: msg.timestamp 
        ? (typeof msg.timestamp === 'number' ? msg.timestamp : Math.floor(msg.timestamp.getTime() / 1000))
        : Math.floor(Date.now() / 1000)
    }));

    this.isLoading.set(true);
    this.currentResponse.set('');
    this.startRegeneration(message.id!);
    this.closeRegenerateMenu();

    this.openWebUIService.sendMessage(prompt, this.chatId, conversationHistory).subscribe({
      next: (chunk) => {
        this.currentResponse.update(current => current + chunk);
        
        this.messages.update(msgs => {
          const updatedMsgs = [...msgs];
          const msgIndex = updatedMsgs.findIndex(m => m.id === message.id);
          if (msgIndex !== -1) {
            updatedMsgs[msgIndex] = {
              ...updatedMsgs[msgIndex],
              content: this.currentResponse()
            };
          }
          return updatedMsgs;
        });
      },
      complete: () => {
        const newContent = this.currentResponse();
        if (newContent) {
          this.messages.update(msgs => {
            const updatedMsgs = [...msgs];
            const msgIndex = updatedMsgs.findIndex(m => m.id === message.id);
            if (msgIndex !== -1) {
              updatedMsgs[msgIndex] = {
                ...updatedMsgs[msgIndex],
                content: newContent
              };
            }
            this.messagesChanged.emit(updatedMsgs.length);
            return updatedMsgs;
          });
        }
        this.isLoading.set(false);
        this.currentResponse.set('');
        this.endRegeneration(message.id!);
      },
      error: (error) => {
        if (this.debug) {
          console.error('[OpenWebUI] Regenerate error:', error);
        }
        
        this.messages.update(msgs => {
          const updatedMsgs = [...msgs];
          const msgIndex = updatedMsgs.findIndex(m => m.id === message.id);
          if (msgIndex !== -1) {
            updatedMsgs[msgIndex] = {
              ...updatedMsgs[msgIndex],
              content: originalContent
            };
          }
          return updatedMsgs;
        });
        
        const errorMsg = error?.message || error?.toString() || 'Unknown error';
        if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          this.showErrorMessage(this.t.errorNetworkFailure ?? 'Network error. Please check your connection and try again.');
        } else if (errorMsg.includes('timeout')) {
          this.showErrorMessage(this.t.errorTimeout ?? 'Request timed out. Please try again.');
        } else {
          this.showErrorMessage(this.t.errorRegenerateFailed ?? 'Failed to regenerate response. Please try again.');
        }
        
        this.isLoading.set(false);
        this.currentResponse.set('');
        this.endRegeneration(message.id!);
      }
    });
  }

  public continueResponse(message: ChatMessage): void {
    if (!this.isMessageIdValid(message.id)) {
      return;
    }

    if (this.isLoading()) {
      this.showErrorMessage(this.t.errorOperationInProgress ?? 'Another operation is in progress. Please wait.');
      return;
    }

    if (this.isContinuationInProgress(message.id!)) {
      this.showErrorMessage(this.t.errorContinuationInProgress ?? 'Continuation already in progress for this message.');
      return;
    }

    const msgs = this.messages();
    const messageIndex = msgs.findIndex(m => m.id === message.id);
    
    if (messageIndex === -1) {
      if (this.debug) {
        console.error('[OpenWebUI] Message not found in conversation history');
      }
      this.showErrorMessage(this.t.errorMessageNotFound ?? 'Message not found in conversation history.');
      return;
    }

    const originalContent = message.content;

    const conversationHistory = msgs.slice(0, messageIndex + 1).map(msg => ({
      role: msg.role,
      content: msg.content,
      id: msg.id,
      timestamp: msg.timestamp 
        ? (typeof msg.timestamp === 'number' ? msg.timestamp : Math.floor(msg.timestamp.getTime() / 1000))
        : Math.floor(Date.now() / 1000)
    }));

    this.isLoading.set(true);
    this.currentResponse.set('');
    this.startContinuation(message.id!);

    this.openWebUIService.continueResponse(
      message.id!,
      message.content,
      this.chatId,
      conversationHistory
    ).subscribe({
      next: (chunk) => {
        this.currentResponse.update(current => current + chunk);
        
        this.messages.update(msgs => {
          const updatedMsgs = [...msgs];
          const msgIndex = updatedMsgs.findIndex(m => m.id === message.id);
          if (msgIndex !== -1) {
            updatedMsgs[msgIndex] = {
              ...updatedMsgs[msgIndex],
              content: this.currentResponse()
            };
          }
          return updatedMsgs;
        });
      },
      complete: () => {
        const newContent = this.currentResponse();
        if (newContent) {
          this.messages.update(msgs => {
            const updatedMsgs = [...msgs];
            const msgIndex = updatedMsgs.findIndex(m => m.id === message.id);
            if (msgIndex !== -1) {
              updatedMsgs[msgIndex] = {
                ...updatedMsgs[msgIndex],
                content: newContent
              };
            }
            this.messagesChanged.emit(updatedMsgs.length);
            return updatedMsgs;
          });
        }
        this.isLoading.set(false);
        this.currentResponse.set('');
        this.endContinuation(message.id!);
      },
      error: (error) => {
        if (this.debug) {
          console.error('[OpenWebUI] Continue response error:', error);
        }
        
        this.messages.update(msgs => {
          const updatedMsgs = [...msgs];
          const msgIndex = updatedMsgs.findIndex(m => m.id === message.id);
          if (msgIndex !== -1) {
            updatedMsgs[msgIndex] = {
              ...updatedMsgs[msgIndex],
              content: originalContent
            };
          }
          return updatedMsgs;
        });
        
        const errorMsg = error?.message || error?.toString() || 'Unknown error';
        if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          this.showErrorMessage(this.t.errorNetworkFailure ?? 'Network error. Please check your connection and try again.');
        } else if (errorMsg.includes('timeout')) {
          this.showErrorMessage(this.t.errorTimeout ?? 'Request timed out. Please try again.');
        } else {
          this.showErrorMessage(this.t.errorContinueFailed ?? 'Failed to continue response. Please try again.');
        }
        
        this.isLoading.set(false);
        this.currentResponse.set('');
        this.endContinuation(message.id!);
      }
    });
  }

  public toggleRegenerateMenu(message: ChatMessage): void {
    if (this.showRegenerateMenu() && this.regenerateMenuTarget() === message) {
      this.closeRegenerateMenu();
    } else {
      this.showRegenerateMenu.set(true);
      this.regenerateMenuTarget.set(message);
      this.regenerateInputText.set('');
    }
  }

  public closeRegenerateMenu(): void {
    this.showRegenerateMenu.set(false);
    this.regenerateMenuTarget.set(null);
    this.regenerateInputText.set('');
  }

  public regenerateWithCustomInput(message: ChatMessage, customInput: string): void {
    if (!customInput.trim()) {
      this.showErrorMessage(this.t.errorEmptyInput ?? 'Please enter custom instructions.');
      return;
    }

    if (!this.isMessageIdValid(message.id)) {
      return;
    }

    if (this.isLoading()) {
      this.showErrorMessage(this.t.errorOperationInProgress ?? 'Another operation is in progress. Please wait.');
      return;
    }

    if (this.isRegenerationInProgress(message.id!)) {
      this.showErrorMessage(this.t.errorRegenerationInProgress ?? 'Regeneration already in progress for this message.');
      return;
    }

    const msgs = this.messages();
    const messageIndex = msgs.findIndex(m => m.id === message.id);
    
    if (messageIndex === -1) {
      if (this.debug) {
        console.error('[OpenWebUI] Message not found in conversation history');
      }
      this.showErrorMessage(this.t.errorMessageNotFound ?? 'Message not found in conversation history.');
      return;
    }

    const originalContent = message.content;

    this.messages.update(msgs => {
      const updatedMsgs = [...msgs];
      updatedMsgs[messageIndex] = {
        ...updatedMsgs[messageIndex],
        content: ''
      };
      return updatedMsgs;
    });

    const conversationHistory = msgs.slice(0, messageIndex).map(msg => ({
      role: msg.role,
      content: msg.content,
      id: msg.id,
      timestamp: msg.timestamp 
        ? (typeof msg.timestamp === 'number' ? msg.timestamp : Math.floor(msg.timestamp.getTime() / 1000))
        : Math.floor(Date.now() / 1000)
    }));

    this.isLoading.set(true);
    this.currentResponse.set('');
    this.startRegeneration(message.id!);
    this.closeRegenerateMenu();

    this.openWebUIService.sendMessage(customInput, this.chatId, conversationHistory).subscribe({
      next: (chunk) => {
        this.currentResponse.update(current => current + chunk);
        
        this.messages.update(msgs => {
          const updatedMsgs = [...msgs];
          const msgIndex = updatedMsgs.findIndex(m => m.id === message.id);
          if (msgIndex !== -1) {
            updatedMsgs[msgIndex] = {
              ...updatedMsgs[msgIndex],
              content: this.currentResponse()
            };
          }
          return updatedMsgs;
        });
      },
      complete: () => {
        const newContent = this.currentResponse();
        if (newContent) {
          this.messages.update(msgs => {
            const updatedMsgs = [...msgs];
            const msgIndex = updatedMsgs.findIndex(m => m.id === message.id);
            if (msgIndex !== -1) {
              updatedMsgs[msgIndex] = {
                ...updatedMsgs[msgIndex],
                content: newContent
              };
            }
            this.messagesChanged.emit(updatedMsgs.length);
            return updatedMsgs;
          });
        }
        this.isLoading.set(false);
        this.currentResponse.set('');
        this.endRegeneration(message.id!);
      },
      error: (error) => {
        if (this.debug) {
          console.error('[OpenWebUI] Regenerate with custom input error:', error);
        }
        
        this.messages.update(msgs => {
          const updatedMsgs = [...msgs];
          const msgIndex = updatedMsgs.findIndex(m => m.id === message.id);
          if (msgIndex !== -1) {
            updatedMsgs[msgIndex] = {
              ...updatedMsgs[msgIndex],
              content: originalContent
            };
          }
          return updatedMsgs;
        });
        
        const errorMsg = error?.message || error?.toString() || 'Unknown error';
        if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          this.showErrorMessage(this.t.errorNetworkFailure ?? 'Network error. Please check your connection and try again.');
        } else if (errorMsg.includes('timeout')) {
          this.showErrorMessage(this.t.errorTimeout ?? 'Request timed out. Please try again.');
        } else {
          this.showErrorMessage(this.t.errorRegenerateFailed ?? 'Failed to regenerate response. Please try again.');
        }
        
        this.isLoading.set(false);
        this.currentResponse.set('');
        this.endRegeneration(message.id!);
      }
    });
  }

  public regenerateTryAgain(message: ChatMessage): void {
    if (!this.isMessageIdValid(message.id)) {
      return;
    }

    if (this.isLoading()) {
      this.showErrorMessage(this.t.errorOperationInProgress ?? 'Another operation is in progress. Please wait.');
      return;
    }

    if (this.isRegenerationInProgress(message.id!)) {
      this.showErrorMessage(this.t.errorRegenerationInProgress ?? 'Regeneration already in progress for this message.');
      return;
    }

    const msgs = this.messages();
    const messageIndex = msgs.findIndex(m => m.id === message.id);
    
    if (messageIndex === -1 || messageIndex === 0) {
      if (this.debug) {
        console.error('[OpenWebUI] Message not found or no previous user message');
      }
      this.showErrorMessage(this.t.errorMessageNotFound ?? 'Message not found in conversation history.');
      return;
    }

    let previousUserMessageIndex = -1;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        previousUserMessageIndex = i;
        break;
      }
    }

    if (previousUserMessageIndex === -1) {
      if (this.debug) {
        console.error('[OpenWebUI] No previous user message found');
      }
      this.showErrorMessage(this.t.errorNoPreviousMessage ?? 'No previous user message found.');
      return;
    }

    const previousUserMessage = msgs[previousUserMessageIndex];
    
    const originalContent = message.content;

    this.messages.update(msgs => {
      const updatedMsgs = [...msgs];
      updatedMsgs[messageIndex] = {
        ...updatedMsgs[messageIndex],
        content: ''
      };
      return updatedMsgs;
    });

    const conversationHistory = msgs.slice(0, previousUserMessageIndex).map(msg => ({
      role: msg.role,
      content: msg.content,
      id: msg.id,
      timestamp: msg.timestamp 
        ? (typeof msg.timestamp === 'number' ? msg.timestamp : Math.floor(msg.timestamp.getTime() / 1000))
        : Math.floor(Date.now() / 1000)
    }));

    this.isLoading.set(true);
    this.currentResponse.set('');
    this.startRegeneration(message.id!);
    this.closeRegenerateMenu();

    this.openWebUIService.sendMessage(previousUserMessage.content, this.chatId, conversationHistory).subscribe({
      next: (chunk) => {
        this.currentResponse.update(current => current + chunk);
        
        this.messages.update(msgs => {
          const updatedMsgs = [...msgs];
          const msgIndex = updatedMsgs.findIndex(m => m.id === message.id);
          if (msgIndex !== -1) {
            updatedMsgs[msgIndex] = {
              ...updatedMsgs[msgIndex],
              content: this.currentResponse()
            };
          }
          return updatedMsgs;
        });
      },
      complete: () => {
        const newContent = this.currentResponse();
        if (newContent) {
          this.messages.update(msgs => {
            const updatedMsgs = [...msgs];
            const msgIndex = updatedMsgs.findIndex(m => m.id === message.id);
            if (msgIndex !== -1) {
              updatedMsgs[msgIndex] = {
                ...updatedMsgs[msgIndex],
                content: newContent
              };
            }
            this.messagesChanged.emit(updatedMsgs.length);
            return updatedMsgs;
          });
        }
        this.isLoading.set(false);
        this.currentResponse.set('');
        this.endRegeneration(message.id!);
      },
      error: (error) => {
        if (this.debug) {
          console.error('[OpenWebUI] Regenerate try again error:', error);
        }
        
        this.messages.update(msgs => {
          const updatedMsgs = [...msgs];
          const msgIndex = updatedMsgs.findIndex(m => m.id === message.id);
          if (msgIndex !== -1) {
            updatedMsgs[msgIndex] = {
              ...updatedMsgs[msgIndex],
              content: originalContent
            };
          }
          return updatedMsgs;
        });
        
        const errorMsg = error?.message || error?.toString() || 'Unknown error';
        if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          this.showErrorMessage(this.t.errorNetworkFailure ?? 'Network error. Please check your connection and try again.');
        } else if (errorMsg.includes('timeout')) {
          this.showErrorMessage(this.t.errorTimeout ?? 'Request timed out. Please try again.');
        } else {
          this.showErrorMessage(this.t.errorRegenerateFailed ?? 'Failed to regenerate response. Please try again.');
        }
        
        this.isLoading.set(false);
        this.currentResponse.set('');
        this.endRegeneration(message.id!);
      }
    });
  }

  public regenerateMoreConcise(message: ChatMessage): void {
    this.regenerateWithPrompt(message, 'More Concise');
  }

  public regenerateAddDetails(message: ChatMessage): void {
    this.regenerateWithPrompt(message, 'Add Details');
  }

  public async openRatingForm(message: ChatMessage, initialRating: 1 | -1): Promise<void> {
    if (!this.isMessageIdValid(message.id)) {
      return;
    }

    if (this.isLoading()) {
      this.showErrorMessage(this.t.errorOperationInProgress ?? 'Another operation is in progress. Please wait.');
      return;
    }

    if (this.showRatingForm() && this.ratingFormTarget() === message) {
      const currentFormRating = this.ratingFormValue() <= 4 ? -1 : (this.ratingFormValue() === 5 ? 0 : 1);
      const clickedRating = initialRating;
      
      if (currentFormRating === clickedRating) {
        this.closeRatingForm();
        return;
      }
    }

    const initialValue = initialRating === 1 ? 8 : 2;
    
    this.initialRatingType = initialRating;
    
    try {
      let feedbackId: string | null = null;
      let suggestedTags: string[] = [];
      
      if (message.rating) {
        this.currentFeedbackId = message.id;
        suggestedTags = message.rating.tags || [];
        
        if (message.rating.rating !== initialRating) {
          feedbackId = await this.openWebUIService.sendInitialRating(
            message.id!,
            initialRating,
            this.chatId,
            this.messages()
          );
          
          if (!feedbackId) {
            if (this.debug) {
              console.error('[OpenWebUI] Failed to update rating type');
            }
            this.showErrorMessage(this.t.errorRatingFailed ?? 'Failed to update rating. Please try again.');
            return;
          }
          
          this.currentFeedbackId = feedbackId;
          
          this.messages.update(msgs => {
            const updatedMsgs = [...msgs];
            const msgIndex = updatedMsgs.findIndex(m => m.id === message.id);
            if (msgIndex !== -1) {
              updatedMsgs[msgIndex] = {
                ...updatedMsgs[msgIndex],
                rating: {
                  ...updatedMsgs[msgIndex].rating!,
                  rating: initialRating,
                  details: {
                    rating: initialValue
                  }
                }
              };
            }
            return updatedMsgs;
          });
        }
      } else {
        feedbackId = await this.openWebUIService.sendInitialRating(
          message.id!,
          initialRating,
          this.chatId,
          this.messages()
        );

        if (!feedbackId) {
          if (this.debug) {
            console.error('[OpenWebUI] Failed to send initial rating');
          }
          this.showErrorMessage(this.t.errorRatingFailed ?? 'Failed to submit rating. Please try again.');
          return;
        }

        this.currentFeedbackId = feedbackId;

        try {
          const tags = await this.openWebUIService.getSuggestedTags(
            message.id!,
            this.chatId
          );
          suggestedTags = tags || [];

        } catch (tagError) {
          if (this.debug) {
            console.warn('[OpenWebUI] Could not fetch suggested tags:', tagError);
          }
        }
        
        this.messages.update(msgs => {
          const updatedMsgs = [...msgs];
          const msgIndex = updatedMsgs.findIndex(m => m.id === message.id);
          if (msgIndex !== -1) {
            updatedMsgs[msgIndex] = {
              ...updatedMsgs[msgIndex],
              rating: {
                rating: initialRating,
                tags: suggestedTags || [],
                reason: '',
                comment: '',
                details: {
                  rating: initialValue
                }
              }
            };
          }
          return updatedMsgs;
        });
      }

      this.showRatingForm.set(true);
      this.ratingFormTarget.set(message);
      this.ratingFormValue.set(message.rating?.details?.rating || initialValue);
      this.ratingFormTags.set(suggestedTags);
      this.ratingFormComment = message.rating?.comment || '';

      this.cdr.detectChanges();

    } catch (error) {
      if (this.debug) {
        console.error('[OpenWebUI] Error opening rating form:', error);
      }
      
      const errorMsg = error?.toString() || 'Unknown error';
      if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
        this.showErrorMessage(this.t.errorNetworkFailure ?? 'Network error. Please check your connection and try again.');
      } else if (errorMsg.includes('timeout')) {
        this.showErrorMessage(this.t.errorTimeout ?? 'Request timed out. Please try again.');
      } else {
        this.showErrorMessage(this.t.errorRatingFailed ?? 'Failed to submit rating. Please try again.');
      }
    }
  }

  public closeRatingForm(): void {
    this.showRatingForm.set(false);
    this.ratingFormTarget.set(null);
    this.ratingFormValue.set(5);
    this.ratingFormTags.set([]);
    this.ratingFormComment = '';
    this.currentFeedbackId = undefined;
  }

  public toggleRatingTag(tag: string): void {
    this.ratingFormTags.update(tags => {
      if (tags.includes(tag)) {
        return tags.filter(t => t !== tag);
      } else {
        return [...tags, tag];
      }
    });
  }

  public isRatingDisabled(num: number): boolean {
    if (this.initialRatingType === 1) {
      return num <= 5;
    } else {
      return num >= 6;
    }
  }

  public submitRating(message: ChatMessage): void {
    if (!this.isMessageIdValid(message.id)) {
      return;
    }

    if (this.isLoading()) {
      this.showErrorMessage(this.t.errorOperationInProgress ?? 'Another operation is in progress. Please wait.');
      return;
    }

    const ratingValue = this.ratingFormValue();
    const tags = this.ratingFormTags();
    const comment = this.ratingFormComment;

    let apiRating: 1 | -1;
    if (ratingValue <= 4) {
      apiRating = -1;
    } else if (ratingValue === 5) {
      apiRating = -1;
    } else {
      apiRating = 1;
    }

    const feedbackId = this.currentFeedbackId || message.id;
    
    const previousRating = message.rating;

    this.messages.update(msgs => {
      const updatedMsgs = [...msgs];
      const msgIndex = updatedMsgs.findIndex(m => m.id === message.id);
      if (msgIndex !== -1) {
        updatedMsgs[msgIndex] = {
          ...updatedMsgs[msgIndex],
          rating: {
            rating: apiRating,
            tags: tags,
            reason: tags.join(', '),
            comment: comment,
            details: {
              rating: ratingValue
            }
          }
        };
      }
      return updatedMsgs;
    });

    this.closeRatingForm();

    this.openWebUIService.updateRating(
      feedbackId,
      apiRating,
      this.chatId,
      this.messages(),
      tags,
      comment,
      ratingValue,
      message.id
    ).then(success => {
      if (success) {
        if (this.debug) {
          console.log('[OpenWebUI] Rating updated successfully');
        }
        
        this.showRatingConfirmation.set(true);
        
        if (this.ratingConfirmationTimeout) {
          clearTimeout(this.ratingConfirmationTimeout);
        }
        this.ratingConfirmationTimeout = setTimeout(() => {
          this.showRatingConfirmation.set(false);
        }, 3000);
      } else {
        this.messages.update(msgs => {
          const updatedMsgs = [...msgs];
          const msgIndex = updatedMsgs.findIndex(m => m.id === message.id);
          if (msgIndex !== -1) {
            updatedMsgs[msgIndex] = {
              ...updatedMsgs[msgIndex],
              rating: previousRating
            };
          }
          return updatedMsgs;
        });
        
        if (this.debug) {
          console.error('[OpenWebUI] Failed to update rating');
        }
        
        this.showErrorMessage(this.t.errorRatingUpdateFailed ?? 'Failed to update rating. Please try again.');
      }
    }).catch(error => {
      this.messages.update(msgs => {
        const updatedMsgs = [...msgs];
        const msgIndex = updatedMsgs.findIndex(m => m.id === message.id);
        if (msgIndex !== -1) {
          updatedMsgs[msgIndex] = {
            ...updatedMsgs[msgIndex],
            rating: previousRating
          };
        }
        return updatedMsgs;
      });
      
      if (this.debug) {
        console.error('[OpenWebUI] Error updating rating:', error);
      }
      
      const errorMsg = error?.toString() || 'Unknown error';
      if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
        this.showErrorMessage(this.t.errorNetworkFailure ?? 'Network error. Please check your connection and try again.');
      } else if (errorMsg.includes('timeout')) {
        this.showErrorMessage(this.t.errorTimeout ?? 'Request timed out. Please try again.');
      } else {
        this.showErrorMessage(this.t.errorRatingUpdateFailed ?? 'Failed to update rating. Please try again.');
      }
    });
  }

  public submitRatingFromEvent(event: { message: ChatMessage; rating: number; tags: string[]; comment: string }): void {
    this.ratingFormValue.set(event.rating);
    this.ratingFormTags.set(event.tags);
    this.ratingFormComment = event.comment;
    
    this.submitRating(event.message);
  }

  /**
   * Handle spectrogram canvas ready event
   */
  public onSpectrogramCanvasReady(canvas: HTMLCanvasElement): void {
    this.startSpectrogramVisualization(canvas);
  }

  /**
   * Start spectrogram visualization
   */
  public startSpectrogramVisualization(canvas: HTMLCanvasElement): void {
    const analyser = this.getAnalyser();
    if (!analyser) {
      if (this.debug) {
        console.error('[OpenWebUI] Analyser not available for spectrogram');
      }
      return;
    }

    const canvasContext = canvas.getContext('2d');
    if (!canvasContext) {
      if (this.debug) {
        console.error('[OpenWebUI] Canvas context not available');
      }
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      if (!this.isRecording()) {
        return;
      }

      this.animationFrameId = requestAnimationFrame(renderFrame);

      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      canvasContext.fillStyle = 'rgb(26, 26, 46)';
      canvasContext.fillRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height;

        const red = Math.floor((dataArray[i] / 255) * 255);
        const green = Math.floor(100 + (dataArray[i] / 255) * 155);
        const blue = Math.floor(200 - (dataArray[i] / 255) * 100);

        canvasContext.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        canvasContext.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    renderFrame();
  }

  /**
   * Stop spectrogram visualization
   */
  public stopSpectrogramVisualization(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }

  /**
   * Start voice recording
   */
  public async startVoiceRecording(): Promise<void> {
    if (!AudioRecorder.isSupported()) {
      this.recordingError.set('Your browser does not support audio recording');
      if (this.debug) {
        console.error('[OpenWebUI] Browser does not support getUserMedia');
      }
      return;
    }

    this.recordingError.set(null);

    try {
      this.initializeAudioRecorder();

      if (!this.audioRecorder) {
        throw new Error('Failed to initialize audio recorder');
      }

      await this.audioRecorder.startRecording();

      this.isRecording.set(true);

      if (this.debug) {
        console.log('[OpenWebUI] Voice recording started');
      }
    } catch (error) {
      if (this.debug) {
        console.error('[OpenWebUI] Failed to start recording:', error);
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('Microphone permission denied')) {
        this.recordingError.set('Microphone permission denied. Please enable it in your browser settings.');
      } else if (errorMessage.includes('No microphone found')) {
        this.recordingError.set('No microphone found. Please connect a microphone and try again.');
      } else if (errorMessage.includes('does not support audio recording')) {
        this.recordingError.set('Your browser does not support audio recording');
      } else if (errorMessage.includes('audio context') || errorMessage.includes('AudioContext')) {
        this.recordingError.set('Unable to initialize audio recording');
      } else if (errorMessage.includes('initialize')) {
        this.recordingError.set('Unable to initialize audio recording');
      } else {
        this.recordingError.set('Failed to record audio. Please try again');
      }

      this.isRecording.set(false);
    }
  }

  /**
   * Stop voice recording
   */
  public async stopVoiceRecording(): Promise<void> {
    this.stopSpectrogramVisualization();
    
    this.isRecording.set(false);

    if (!this.audioRecorder) {
      if (this.debug) {
        console.error('[OpenWebUI] Audio recorder not initialized');
      }
      this.recordingError.set('Recording not started. Please try again.');
      return;
    }

    try {
      const audioBlob = await this.audioRecorder.stopRecording();

      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('No audio data recorded');
      }

      this.lastAudioBlob = audioBlob;

      if (this.debug) {
        console.log('[OpenWebUI] Voice recording stopped, audio blob size:', audioBlob.size);
      }

      await this.transcribeAudio(audioBlob);

    } catch (error) {
      if (this.debug) {
        console.error('[OpenWebUI] Failed to stop recording:', error);
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('Recording not started')) {
        this.recordingError.set('Recording not started. Please try again.');
      } else if (errorMessage.includes('No audio data')) {
        this.recordingError.set('No audio was recorded. Please try again.');
      } else if (errorMessage.includes('Recording error')) {
        this.recordingError.set('Failed to record audio. Please try again.');
      } else {
        this.recordingError.set('Failed to record audio. Please try again.');
      }
    }
  }

  /**
   * Clear recording error
   */
  public clearRecordingError(): void {
    this.recordingError.set(null);
  }

  /**
   * Clear transcription error
   */
  public clearTranscriptionError(): void {
    this.transcriptionError.set(null);
  }

  /**
   * Retry transcription with last audio blob
   */
  public async retryTranscription(): Promise<void> {
    if (!this.lastAudioBlob) {
      this.transcriptionError.set('No audio available to retry');
      return;
    }

    this.transcriptionError.set(null);
    await this.transcribeAudio(this.lastAudioBlob);
  }

  /**
   * Transcribe audio blob to text
   */
  private async transcribeAudio(audioBlob: Blob): Promise<void> {
    this.isTranscribing.set(true);
    this.transcriptionError.set(null);

    try {
      if (this.debug) {
        console.log('[OpenWebUI] Starting transcription...');
      }

      const transcribedText = await this.openWebUIService.transcribeAudio(audioBlob);

      if (this.debug) {
        console.log('[OpenWebUI] Transcription completed:', transcribedText);
      }

      this.inputMessage = transcribedText;
      this.cdr.detectChanges();

    } catch (error) {
      if (this.debug) {
        console.error('[OpenWebUI] Transcription failed:', error);
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        this.transcriptionError.set('Network error. Please check your connection and try again.');
      } else if (errorMessage.includes('timeout')) {
        this.transcriptionError.set('Transcription timed out. Please try again.');
      } else if (errorMessage.includes('404')) {
        this.transcriptionError.set('Transcription service not available. Please contact support.');
      } else {
        this.transcriptionError.set('Failed to transcribe audio. Please try again.');
      }
    } finally {
      this.isTranscribing.set(false);
    }
  }
}
