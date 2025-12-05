import { Component, Input, Output, EventEmitter, signal, inject, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatHistoryItem } from '../../models/chat.model';
import { Translation } from '../../i18n/translations';
import { OpenWebUIService } from '../../services/openwebui-api';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-archived-chats-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './archived-chats-modal.component.html',
  styleUrls: ['./archived-chats-modal.component.scss']
})
export class ArchivedChatsModalComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() public isOpen = false;
  @Input() public translations?: Translation;

  @Output() public closed = new EventEmitter<void>();
  @Output() public chatUnarchived = new EventEmitter<ChatHistoryItem>();
  @Output() public chatDeleted = new EventEmitter<string>();

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  public searchQuery = signal<string>('');
  public archivedChats = signal<ChatHistoryItem[]>([]);
  public isLoading = signal<boolean>(false);
  public hasMore = signal<boolean>(false);
  public currentPage = signal<number>(1);

  private searchSubject = new Subject<string>();
  private openWebUIService = inject(OpenWebUIService);
  private previousFocusedElement: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];

  public constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.currentPage.set(1);
      this.loadArchivedChats(query, 1);
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
        this.currentPage.set(1);
        this.loadArchivedChats('', 1);
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
    this.searchSubject.next(query);
  }

  private loadArchivedChats(query: string, page: number): void {
    this.isLoading.set(true);
    this.openWebUIService.getArchivedChats(page, query).subscribe({
      next: (response) => {
        if (page === 1) {
          this.archivedChats.set(response.chats);
        } else {
          this.archivedChats.update(chats => [...chats, ...response.chats]);
        }
        this.hasMore.set(response.hasMore);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load archived chats:', error);
        this.isLoading.set(false);
      }
    });
  }

  public loadMore(): void {
    if (!this.isLoading() && this.hasMore()) {
      const nextPage = this.currentPage() + 1;
      this.currentPage.set(nextPage);
      this.loadArchivedChats(this.searchQuery(), nextPage);
    }
  }

  public unarchiveChat(chat: ChatHistoryItem): void {
    this.openWebUIService.archiveChat(chat.id).subscribe({
      next: () => {
        this.archivedChats.update(chats => chats.filter(c => c.id !== chat.id));
        this.chatUnarchived.emit(chat);
      },
      error: (error) => {
        console.error('Failed to unarchive chat:', error);
      }
    });
  }

  public deleteChat(chatId: string): void {
    if (confirm(this.translations?.confirmDeleteChat || 'Are you sure you want to delete this chat?')) {
      this.openWebUIService.deleteChat(chatId).subscribe({
        next: () => {
          this.archivedChats.update(chats => chats.filter(c => c.id !== chatId));
          this.chatDeleted.emit(chatId);
        },
        error: (error) => {
          console.error('Failed to delete chat:', error);
        }
      });
    }
  }

  public closeModal(): void {
    this.searchQuery.set('');
    this.archivedChats.set([]);
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

  private setupFocusTrap(): void {
    const modalContent = document.querySelector('.modal-content');
    if (!modalContent) return;

    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    this.focusableElements = Array.from(modalContent.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }

  private restoreFocus(): void {
    if (this.previousFocusedElement) {
      this.previousFocusedElement.focus();
      this.previousFocusedElement = null;
    }
  }

  public onModalKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      this.handleTabKey(event);
    }
  }

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

  public ngOnDestroy(): void {
    this.searchSubject.complete();
  }
}
