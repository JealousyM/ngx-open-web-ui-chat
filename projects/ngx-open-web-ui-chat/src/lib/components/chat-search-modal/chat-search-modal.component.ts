import { Component, Input, Output, EventEmitter, signal, effect, inject, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatHistoryItem } from '../../models/chat.model';
import { Translation } from '../../i18n/translations';
import { OpenWebUIService } from '../../services/openwebui-api';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-chat-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownModule],
  templateUrl: './chat-search-modal.component.html',
  styleUrls: ['./chat-search-modal.component.scss']
})
export class ChatSearchModalComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() public isOpen = false;
  @Input() public translations?: Translation;

  @Output() public closed = new EventEmitter<void>();
  @Output() public chatSelected = new EventEmitter<string>();

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  public searchQuery = signal<string>('');
  public searchResults = signal<ChatHistoryItem[]>([]);
  public selectedResult = signal<ChatHistoryItem | null>(null);
  public isSearching = signal<boolean>(false);
  public previewMessages = signal<any[]>([]);

  private searchSubject = new Subject<string>();
  private openWebUIService = inject(OpenWebUIService);
  private previousFocusedElement: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];
  
  private previewCache = new Map<string, any[]>();
  private hoverTimeout: any;

  public constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  public ngAfterViewInit(): void {
    if (this.isOpen) {
      this.setupFocusTrap();
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (changes['isOpen'].currentValue) {
        this.previousFocusedElement = document.activeElement as HTMLElement;
        setTimeout(() => {
          this.setupFocusTrap();
          this.searchInput?.nativeElement.focus();
        }, 0);
      } else if (changes['isOpen'].previousValue) {
        this.restoreFocus();
      }
    }
  }

  public onSearchQueryChange(query: string): void {
    this.searchQuery.set(query);
    if (query.trim()) {
      this.isSearching.set(true);
      this.searchSubject.next(query);
    } else {
      this.searchResults.set([]);
      this.selectedResult.set(null);
      this.isSearching.set(false);
    }
  }

  private performSearch(query: string): void {
    this.openWebUIService.searchChats(query).subscribe({
      next: (results) => {
        this.searchResults.set(results);
        this.isSearching.set(false);
      },
      error: (error) => {
        console.error('Search failed:', error);
        this.searchResults.set([]);
        this.isSearching.set(false);
      }
    });
  }

  public onResultHover(result: ChatHistoryItem): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }

    if (this.selectedResult()?.id === result.id) {
      return;
    }

    this.hoverTimeout = setTimeout(() => {
      this.selectResult(result);
    }, 200);
  }

  public selectResult(result: ChatHistoryItem): void {
    this.selectedResult.set(result);
    this.loadChatPreview(result.id);
  }

  private async loadChatPreview(chatId: string): Promise<void> {
    if (this.previewCache.has(chatId)) {
      this.previewMessages.set(this.previewCache.get(chatId)!);
      return;
    }

    try {
      const chat = await this.openWebUIService.getChatById(chatId);
      if (chat && chat.chat && chat.chat.messages) {
        const messages = chat.chat.messages || [];
        const preview = messages.slice(0, 5); 
        
        this.previewCache.set(chatId, preview);
        this.previewMessages.set(preview);
      } else {
        this.previewMessages.set([]);
      }
    } catch (error) {
      console.error('Failed to load chat preview:', error);
      this.previewMessages.set([]);
    }
  }

  public openChat(chatId: string): void {
    this.chatSelected.emit(chatId);
    this.closeModal();
  }

  public closeModal(): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.selectedResult.set(null);
    this.previewMessages.set([]);
    this.previewCache.clear(); 
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    this.closed.emit();
  }

  public onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  public onEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeModal();
    }
  }

  /**
   * Set up focus trap for modal
   */
  private setupFocusTrap(): void {
    const modalContent = document.querySelector('.modal-content');
    if (!modalContent) return;

    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    this.focusableElements = Array.from(modalContent.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }

  /**
   * Restore focus to previously focused element
   */
  private restoreFocus(): void {
    if (this.previousFocusedElement) {
      this.previousFocusedElement.focus();
      this.previousFocusedElement = null;
    }
  }

  /**
   * Handle keyboard navigation in modal
   */
  public onModalKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      this.handleTabKey(event);
    }
  }

  /**
   * Handle Tab key for focus trap
   */
  private handleTabKey(event: KeyboardEvent): void {
    if (this.focusableElements.length === 0) return;

    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Handle keyboard navigation on search results
   */
  public onResultKeyDown(event: KeyboardEvent, result: ChatHistoryItem): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectResult(result);
        break;
    }
  }

  ngOnDestroy(): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
  }

  /**
   * Get search results announcement for screen readers
   */
  public getSearchResultsAnnouncement(): string {
    if (this.isSearching()) {
      return this.translations?.searching || 'Searching...';
    }
    
    const count = this.searchResults().length;
    if (count === 0 && this.searchQuery()) {
      return this.translations?.noSearchResults || 'No results found';
    }
    
    if (count > 0) {
      const resultsText = count === 1 ? 
        (this.translations?.oneResult || '1 result found') : 
        `${count} ${this.translations?.resultsFound || 'results found'}`;
      return resultsText;
    }
    
    return '';
  }
}
