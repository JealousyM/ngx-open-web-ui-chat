import { Component, input, output, signal, ViewChild, ElementRef, AfterViewChecked, OnInit, OnDestroy, effect, untracked, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Translation } from '../../i18n/translations';
import { UploadedFile, ToolItem, ChatHistoryItem, ReferenceChatFile } from '../../models/chat.model';
import { OpenWebUIService } from '../../services/openwebui-api';

@Component({
  selector: 'openwebui-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-input.component.html',
  styleUrls: ['./chat-input.component.scss']
})
export class ChatInputComponent implements OnInit, OnDestroy, AfterViewChecked {
  private canvasEmitted = false;
  private openWebUIService = inject(OpenWebUIService);
  public isLoading = input<boolean>(false);
  public uploadedFiles = input<UploadedFile[]>([]);
  public translations = input.required<Translation>();
  public isRecording = input<boolean>(false);
  public isTranscribing = input<boolean>(false);
  public recordingError = input<string | null>(null);
  public transcriptionError = input<string | null>(null);
  public messageText = input<string>('');
  public integrations = input<boolean>(false);
  public tools = input<boolean>(false);
  public showReferenceChats = input<boolean>(false);
  
  private _inputMessage = signal('');
  
  // Tools-related signals
  public availableTools = signal<ToolItem[]>([]);
  public selectedToolIds = signal<string[]>([]);
  public showToolsSubmenu = signal<boolean>(false);
  public isLoadingTools = signal<boolean>(false);
  public toolsError = signal<string | null>(null);
  
  // Reference chat signals
  public showReferenceChatMenu = signal<boolean>(false);
  public availableChatsForReference = signal<ChatHistoryItem[]>([]);
  public isLoadingReferenceChats = signal<boolean>(false);
  public referenceChatPage = signal<number>(1);
  public hasMoreReferenceChats = signal<boolean>(true);
  public referenceChatError = signal<string | null>(null);
  
  // Tools caching
  private toolsCache: ToolItem[] | null = null;
  private toolsCacheTimestamp: number | null = null;
  private readonly TOOLS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Timers for menu management
  private toolsMenuLeaveTimer: any = null;
  private toolsSubmenuLeaveTimer: any = null;
  public showFileMenu = signal(false);
  public showIntegrationsMenu = signal(false);
  
  public webSearchRequested = output<void>();
  public codeInterpreterRequested = output<void>();
  public referenceChatSelected = output<ReferenceChatFile>();
  
  public webSearchEnabled = signal(false);
  public codeInterpreterEnabled = signal(false);
  
  public features = computed(() => ({
    image_generation: false,
    web_search: this.webSearchEnabled(),
    code_interpreter: this.codeInterpreterEnabled()
  }));
  
  public featuresChanged = output<{image_generation: boolean, web_search: boolean, code_interpreter: boolean}>();
  public toolsChanged = output<string[]>();

  public get inputMessage(): string {
    return this._inputMessage();
  }
  
  public set inputMessage(value: string) {
    this._inputMessage.set(value);
  }

  constructor() {
    effect(() => {
      const text = this.messageText();
      untracked(() => {
        if (text !== this._inputMessage()) {
          this._inputMessage.set(text);
        }
      });
    });
    
    effect(() => {
      const feats = this.features();
      untracked(() => {
        this.featuresChanged.emit(feats);
      });
    });
  }

  public ngOnInit(): void {
    // Prefetch tools if tools functionality is enabled
    if (this.tools()) {
      this.fetchTools();
    }
  }

  public ngOnDestroy(): void {
    // Clear any pending timers
    if (this.toolsMenuLeaveTimer) {
      clearTimeout(this.toolsMenuLeaveTimer);
    }
    if (this.toolsSubmenuLeaveTimer) {
      clearTimeout(this.toolsSubmenuLeaveTimer);
    }
  }

  
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('spectrogramCanvas') spectrogramCanvas?: ElementRef<HTMLCanvasElement>;
  
  public sendMessage = output<string>();
  public stopGeneration = output<void>();
  public fileSelected = output<Event>();
  public removeFile = output<string>();
  public startVoiceRecording = output<void>();
  public stopVoiceRecording = output<void>();
  public retryTranscription = output<void>();
  public clearRecordingError = output<void>();
  public clearTranscriptionError = output<void>();
  public spectrogramCanvasReady = output<HTMLCanvasElement>();
  
  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
  
  public toggleFileMenu(): void {
    this.showFileMenu.update(v => !v);
    if (this.showFileMenu()) {
      this.showIntegrationsMenu.set(false);
      this.showToolsSubmenu.set(false);
    }
  }

  public toggleIntegrationsMenu(): void {
    this.showIntegrationsMenu.update(v => !v);
    if (this.showIntegrationsMenu()) {
      this.showFileMenu.set(false);
    } else {
      this.showToolsSubmenu.set(false);
    }
  }

  public toggleWebSearch(event?: Event): void {
    if (event) event.stopPropagation();
    this.webSearchEnabled.update(v => !v);
    if (this.webSearchEnabled()) {
       this.webSearchRequested.emit();
    }
    this.showIntegrationsMenu.set(false);
  }

  public toggleCodeInterpreter(event?: Event): void {
    if (event) event.stopPropagation();
    this.codeInterpreterEnabled.update(v => !v);
    if (this.codeInterpreterEnabled()) {
      this.codeInterpreterRequested.emit();
    }
    this.showIntegrationsMenu.set(false);
  }

  public toggleTool(toolId: string): void {
    this.selectedToolIds.update(ids => {
      const index = ids.indexOf(toolId);
      if (index === -1) {
        return [...ids, toolId];
      } else {
        return ids.filter(id => id !== toolId);
      }
    });
    this.toolsChanged.emit(this.selectedToolIds());
  }

  public onToolsMenuClick(event: Event): void {
    event.stopPropagation();
    this.showToolsSubmenu.update(v => !v);
    if (this.showToolsSubmenu() && this.availableTools().length === 0 && !this.isLoadingTools()) {
      this.fetchTools();
    }
  }

  public onToolsMenuHover(): void {
    // Clear any pending close timer
    if (this.toolsMenuLeaveTimer) {
      clearTimeout(this.toolsMenuLeaveTimer);
      this.toolsMenuLeaveTimer = null;
    }
    
    if (!this.showToolsSubmenu()) {
      this.showToolsSubmenu.set(true);
      if (this.availableTools().length === 0 && !this.isLoadingTools()) {
        this.fetchTools();
      }
    }
  }

  public onToolsMenuLeave(): void {
    // Set a timer to close the submenu after a delay
    this.toolsMenuLeaveTimer = setTimeout(() => {
      if (!this.showToolsSubmenu()) {
        return;
      }
      this.showToolsSubmenu.set(false);
    }, 300);
  }

  public onToolIndicatorClick(): void {
    this.showToolsSubmenu.update(v => !v);
    if (this.showToolsSubmenu() && this.availableTools().length === 0 && !this.isLoadingTools()) {
      this.fetchTools();
    }
  }

  public onToolsSubmenuEnter(): void {
    // Clear any pending close timers
    if (this.toolsMenuLeaveTimer) {
      clearTimeout(this.toolsMenuLeaveTimer);
      this.toolsMenuLeaveTimer = null;
    }
    if (this.toolsSubmenuLeaveTimer) {
      clearTimeout(this.toolsSubmenuLeaveTimer);
      this.toolsSubmenuLeaveTimer = null;
    }
    
    // Keep submenu open when mouse enters it
    this.showToolsSubmenu.set(true);
  }

  public onToolsSubmenuLeave(): void {
    // Set a timer to close the submenu after a delay
    this.toolsSubmenuLeaveTimer = setTimeout(() => {
      this.showToolsSubmenu.set(false);
    }, 200);
  }

  public async fetchTools(): Promise<void> {
    if (this.isLoadingTools()) {
      return;
    }
    
    // Check if we have valid cached tools
    const now = Date.now();
    if (this.toolsCache && 
        this.toolsCacheTimestamp && 
        (now - this.toolsCacheTimestamp) < this.TOOLS_CACHE_DURATION) {
      this.availableTools.set(this.toolsCache);
      return;
    }
    
    this.isLoadingTools.set(true);
    this.toolsError.set(null);
    
    try {
      const tools = await this.openWebUIService.getTools();
      this.availableTools.set(tools);
      
      // Cache the tools
      this.toolsCache = tools;
      this.toolsCacheTimestamp = now;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tools';
      this.toolsError.set(errorMessage);
    } finally {
      this.isLoadingTools.set(false);
    }
  }
  
  public triggerFileUpload(): void {
    this.showFileMenu.set(false);
    this.fileInput?.nativeElement.click();
  }
  
  public onFileSelected(event: Event): void {
    this.fileSelected.emit(event);
  }
  
  public onRemoveFile(fileId: string): void {
    this.removeFile.emit(fileId);
  }
  
  public onSendMessage(): void {
    const message = this._inputMessage().trim();
    if (message) {
      this.sendMessage.emit(message);
      this._inputMessage.set('');
    }
  }
  
  public onStopGeneration(): void {
    this.stopGeneration.emit();
  }
  
  public onKeyEnter(): void {
    if (!this.isLoading()) {
      this.onSendMessage();
    }
  }
  
  public onStartVoiceRecording(): void {
    this.startVoiceRecording.emit();
  }
  
  public onStopVoiceRecording(): void {
    this.stopVoiceRecording.emit();
  }
  
  public onRetryTranscription(): void {
    this.retryTranscription.emit();
  }
  
  public onClearRecordingError(): void {
    this.clearRecordingError.emit();
  }
  
  public onClearTranscriptionError(): void {
    this.clearTranscriptionError.emit();
  }
  
  public ngAfterViewChecked(): void {
    if (this.isRecording() && this.spectrogramCanvas && !this.canvasEmitted) {
      const canvas = this.spectrogramCanvas.nativeElement;
      if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        this.spectrogramCanvasReady.emit(canvas);
        this.canvasEmitted = true;
      }
    } else if (!this.isRecording()) {
      this.canvasEmitted = false;
    }
  }

  // Reference Chat Menu Methods

  public toggleReferenceChatMenu(): void {
    this.showReferenceChatMenu.update(v => !v);
    if (this.showReferenceChatMenu() && this.availableChatsForReference().length === 0) {
      this.fetchReferenceChats();
    }
  }

  public fetchReferenceChats(page: number = 1): void {
    if (this.isLoadingReferenceChats()) {
      return;
    }

    this.isLoadingReferenceChats.set(true);
    this.referenceChatError.set(null);

    this.openWebUIService.getChatsForReference(page).subscribe({
      next: (response) => {
        if (page === 1) {
          this.availableChatsForReference.set(response.chats);
        } else {
          this.availableChatsForReference.update(chats => [...chats, ...response.chats]);
        }
        this.referenceChatPage.set(page);
        this.hasMoreReferenceChats.set(response.hasMore);
        this.isLoadingReferenceChats.set(false);
      },
      error: (error) => {
        this.referenceChatError.set('Failed to load chats');
        this.isLoadingReferenceChats.set(false);
      }
    });
  }

  public selectReferenceChat(chat: ChatHistoryItem): void {
    const referenceChatFile: ReferenceChatFile = {
      id: chat.id,
      type: 'chat',
      name: chat.title,
      status: 'processed'
    };
    this.referenceChatSelected.emit(referenceChatFile);
    this.showReferenceChatMenu.set(false);
    this.showFileMenu.set(false);
  }

  public loadMoreReferenceChats(): void {
    if (this.hasMoreReferenceChats() && !this.isLoadingReferenceChats()) {
      this.fetchReferenceChats(this.referenceChatPage() + 1);
    }
  }

  public onReferenceChatScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const threshold = 50; // pixels from bottom to trigger load
    const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
    
    if (isNearBottom) {
      this.loadMoreReferenceChats();
    }
  }
}
