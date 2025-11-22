import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatHistoryItem, ChatContextMenuEvent } from '../../../models/chat.model';
import { ChatHistoryItemComponent } from '../item/chat-history-item.component';
import { Translation } from '../../../i18n/translations';

@Component({
  selector: 'app-chat-history-list',
  standalone: true,
  imports: [CommonModule, ChatHistoryItemComponent],
  templateUrl: './chat-history-list.component.html',
  styleUrls: ['./chat-history-list.component.scss']
})
export class ChatHistoryListComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() public chats: ChatHistoryItem[] = [];
  @Input() public currentChatId: string | null = null;
  @Input() public isLoading = false;
  @Input() public renamingChatId: string | null = null;
  @Input() public translations?: Translation;

  @Output() public chatSelected = new EventEmitter<string>();
  @Output() public loadMore = new EventEmitter<void>();
  @Output() public contextMenu = new EventEmitter<ChatContextMenuEvent>();
  @Output() public rename = new EventEmitter<{ chatId: string; newTitle: string }>();
  @Output() public cancelRename = new EventEmitter<void>();

  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('loadMoreTrigger', { static: false }) loadMoreTrigger?: ElementRef<HTMLDivElement>;

  private intersectionObserver?: IntersectionObserver;
  private focusedIndex = 0;
  
  public screenReaderAnnouncement = '';

  public ngOnInit(): void {
    // Intersection Observer will be set up in ngAfterViewInit
  }

  public ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  public ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  private setupIntersectionObserver(): void {
    if (!this.loadMoreTrigger) {
      return;
    }

    const options: IntersectionObserverInit = {
      root: this.scrollContainer?.nativeElement || null,
      rootMargin: '50px',
      threshold: 0.1
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.isLoading) {
          this.loadMore.emit();
        }
      });
    }, options);

    this.intersectionObserver.observe(this.loadMoreTrigger.nativeElement);
  }

  public get pinnedChats(): ChatHistoryItem[] {
    return this.chats.filter(chat => chat.pinned);
  }

  public get unpinnedChats(): ChatHistoryItem[] {
    return this.chats.filter(chat => !chat.pinned);
  }

  public onChatClick(chatId: string): void {
    this.chatSelected.emit(chatId);
  }

  public onChatContextMenu(event: MouseEvent, chat: ChatHistoryItem): void {
    this.contextMenu.emit({ chat, mouseEvent: event });
  }

  public onChatRename(chatId: string, newTitle: string): void {
    this.rename.emit({ chatId, newTitle });
  }

  public onCancelRename(): void {
    this.cancelRename.emit();
  }

  public isRenaming(chatId: string): boolean {
    return this.renamingChatId === chatId;
  }

  /**
   * Get tabindex for chat item based on position
   */
  public getTabIndex(index: number, isPinned: boolean): number {
    return index === 0 && (isPinned ? this.pinnedChats.length > 0 : this.pinnedChats.length === 0) ? 0 : -1;
  }

  /**
   * Handle keyboard navigation in chat list
   */
  public onKeyDown(event: KeyboardEvent): void {
    const allChats = [...this.pinnedChats, ...this.unpinnedChats];
    
    if (allChats.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex = Math.min(this.focusedIndex + 1, allChats.length - 1);
        this.focusChatAtIndex(this.focusedIndex);
        this.announceChat(allChats[this.focusedIndex]);
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
        this.focusChatAtIndex(this.focusedIndex);
        this.announceChat(allChats[this.focusedIndex]);
        break;

      case 'Home':
        event.preventDefault();
        this.focusedIndex = 0;
        this.focusChatAtIndex(this.focusedIndex);
        this.announceChat(allChats[this.focusedIndex]);
        break;

      case 'End':
        event.preventDefault();
        this.focusedIndex = allChats.length - 1;
        this.focusChatAtIndex(this.focusedIndex);
        this.announceChat(allChats[this.focusedIndex]);
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        const selectedChat = allChats[this.focusedIndex];
        if (selectedChat) {
          this.onChatClick(selectedChat.id);
          this.announceSelection(selectedChat);
        }
        break;
    }
  }

  /**
   * Focus chat item at specific index
   */
  private focusChatAtIndex(index: number): void {
    if (!this.scrollContainer) {
      return;
    }

    const chatItems = this.scrollContainer.nativeElement.querySelectorAll('.chat-item');
    const targetItem = chatItems[index] as HTMLElement;
    
    if (targetItem) {
      targetItem.focus();
    }
  }

  /**
   * Announce chat for screen readers
   */
  private announceChat(chat: ChatHistoryItem): void {
    const pinnedStatus = chat.pinned ? (this.translations?.pinned || 'Pinned') + ', ' : '';
    const activeStatus = chat.id === this.currentChatId ? (this.translations?.active || 'Active') + ', ' : '';
    this.screenReaderAnnouncement = `${pinnedStatus}${activeStatus}${chat.title}`;
  }

  /**
   * Announce chat selection for screen readers
   */
  private announceSelection(chat: ChatHistoryItem): void {
    const message = this.translations?.chatSelected || 'Chat selected';
    this.screenReaderAnnouncement = `${message}: ${chat.title}`;
  }
}
