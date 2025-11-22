import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatHistoryItem, ChatContextAction, ChatContextMenuEvent } from '../../../models/chat.model';
import { ChatHistoryHeaderComponent } from '../header/chat-history-header.component';
import { ChatHistoryListComponent } from '../list/chat-history-list.component';
import { ChatContextMenuComponent } from '../context-menu/chat-context-menu.component';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { ExportFormatMenuComponent } from '../../export-format-menu/export-format-menu.component';
import { Translation } from '../../../i18n/translations';
import { OpenWebUIService } from '../../../services/openwebui-api';

@Component({
  selector: 'app-chat-history-sidebar',
  standalone: true,
  imports: [CommonModule, ChatHistoryHeaderComponent, ChatHistoryListComponent, ChatContextMenuComponent, ConfirmDialogComponent, ExportFormatMenuComponent],
  templateUrl: './chat-history-sidebar.component.html',
  styleUrls: ['./chat-history-sidebar.component.scss']
})
export class ChatHistorySidebarComponent {
  @Input() public isOpen = false;
  @Input() public chats: ChatHistoryItem[] = [];
  @Input() public currentChatId: string | null = null;
  @Input() public isLoading = false;
  @Input() public translations?: Translation;

  @Output() public chatSelected = new EventEmitter<string>();
  @Output() public newChatRequested = new EventEmitter<void>();
  @Output() public searchRequested = new EventEmitter<void>();
  @Output() public loadMoreRequested = new EventEmitter<void>();
  @Output() public contextMenuAction = new EventEmitter<ChatContextAction>();
  @Output() public toggleSidebar = new EventEmitter<void>();
  @Output() public chatsUpdated = new EventEmitter<ChatHistoryItem[]>();

  public renamingChatId: string | null = null;
  public showContextMenu = signal(false);
  public contextMenuPosition = signal({ x: 0, y: 0 });
  public contextMenuChat = signal<ChatHistoryItem | null>(null);
  
  public showDeleteConfirm = signal(false);
  public chatToDelete = signal<ChatHistoryItem | null>(null);
  
  public showExportMenu = signal(false);
  public exportMenuChatId = signal<string | null>(null);
  public exportMenuPosition = signal({ x: 0, y: 0 });

  private openWebUIService = inject(OpenWebUIService);

  public onToggle(): void {
    this.toggleSidebar.emit();
  }

  public onChatSelected(chatId: string): void {
    this.chatSelected.emit(chatId);
  }

  public onNewChat(): void {
    this.newChatRequested.emit();
  }

  public onSearch(): void {
    this.searchRequested.emit();
  }

  public onLoadMore(): void {
    this.loadMoreRequested.emit();
  }

  public onContextMenuAction(action: ChatContextAction): void {
    this.contextMenuAction.emit(action);
  }

  public onContextMenu(event: ChatContextMenuEvent): void {
    event.mouseEvent.preventDefault();
    this.contextMenuChat.set(event.chat);
    const position = {
      x: event.mouseEvent.clientX,
      y: event.mouseEvent.clientY
    };
    this.contextMenuPosition.set(position);
    this.showContextMenu.set(true);
  }

  /**
   * Handle context menu action from the context menu component
   */
  public handleContextMenuAction(action: ChatContextAction): void {
    const menuPosition = this.contextMenuPosition();
    this.showContextMenu.set(false);
    this.contextMenuChat.set(null);
    
    switch (action.action) {
      case 'pin':
        this.handlePinChat(action.chatId);
        break;
      case 'unpin':
        this.handleUnpinChat(action.chatId);
        break;
      case 'delete':
        this.handleDeleteChat(action.chatId);
        break;
      case 'rename':
        this.handleRenameChat(action.chatId);
        break;
      case 'export':
        this.handleExportChat(action.chatId, menuPosition);
        break;
    }
  }

  /**
   * Close the context menu
   */
  public closeContextMenu(): void {
    this.showContextMenu.set(false);
    this.contextMenuChat.set(null);
  }

  public handlePinChat(chatId: string): void {
    const action: ChatContextAction = {
      action: 'pin',
      chatId: chatId
    };
    this.contextMenuAction.emit(action);

    this.openWebUIService.pinChat(chatId).subscribe({
      next: () => {
        const updatedChats = this.updateChatPinStatus(chatId, true);
        this.chatsUpdated.emit(updatedChats);
      },
      error: (error) => {
        console.error('Failed to pin chat:', error);
      }
    });
  }

  public handleUnpinChat(chatId: string): void {
    const action: ChatContextAction = {
      action: 'unpin',
      chatId: chatId
    };
    this.contextMenuAction.emit(action);

    this.openWebUIService.unpinChat(chatId).subscribe({
      next: () => {
        const updatedChats = this.updateChatPinStatus(chatId, false);
        this.chatsUpdated.emit(updatedChats);
      },
      error: (error) => {
        console.error('Failed to unpin chat:', error);
      }
    });
  }

  public handleDeleteChat(chatId: string): void {
    const chat = this.chats.find(c => c.id === chatId);
    if (!chat) {
      return;
    }
    
    this.chatToDelete.set(chat);
    this.showDeleteConfirm.set(true);
  }

  /**
   * Handle delete confirmation
   */
  public onDeleteConfirmed(): void {
    const chat = this.chatToDelete();
    if (!chat) {
      return;
    }

    const chatId = chat.id;
    this.showDeleteConfirm.set(false);
    this.chatToDelete.set(null);

    const action: ChatContextAction = {
      action: 'delete',
      chatId: chatId
    };
    this.contextMenuAction.emit(action);

    this.openWebUIService.deleteChat(chatId).subscribe({
      next: () => {
        const updatedChats = this.removeChatFromList(chatId);
        this.chatsUpdated.emit(updatedChats);
        if (this.currentChatId === chatId) {
          this.chatSelected.emit('');
        }
      },
      error: (error) => {
        console.error('Failed to delete chat:', error);
        const errorMessage = this.translations?.deleteError || 
          'Failed to delete chat. Please try again.';
        alert(errorMessage);
      }
    });
  }

  /**
   * Handle delete cancellation
   */
  public onDeleteCancelled(): void {
    this.showDeleteConfirm.set(false);
    this.chatToDelete.set(null);
  }

  /**
   * Update the pin status of a chat and reorder the list
   */
  private updateChatPinStatus(chatId: string, pinned: boolean): ChatHistoryItem[] {
    const updatedChats = this.chats.map(chat =>
      chat.id === chatId ? { ...chat, pinned } : chat
    );

    const pinnedChats = updatedChats.filter(c => c.pinned);
    const unpinnedChats = updatedChats.filter(c => !c.pinned);

    unpinnedChats.sort((a, b) => b.updated_at - a.updated_at);

    return [...pinnedChats, ...unpinnedChats];
  }

  /**
   * Remove a chat from the list
   */
  private removeChatFromList(chatId: string): ChatHistoryItem[] {
    return this.chats.filter(chat => chat.id !== chatId);
  }

  /**
   * Start renaming a chat
   */
  public handleRenameChat(chatId: string): void {
    this.renamingChatId = chatId;
    
    const action: ChatContextAction = {
      action: 'rename',
      chatId: chatId
    };
    this.contextMenuAction.emit(action);
  }

  /**
   * Submit the rename with the new title
   */
  public onChatRename(data: { chatId: string; newTitle: string }): void {
    const { chatId, newTitle } = data;
    
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle || trimmedTitle.length === 0) {
      this.renamingChatId = null;
      return;
    }

    if (trimmedTitle.length > 100) {
      const errorMessage = this.translations?.renameTooLong || 
        'Chat title is too long. Maximum 100 characters.';
      alert(errorMessage);
      return;
    }

    this.openWebUIService.renameChat(chatId, trimmedTitle).subscribe({
      next: () => {
        const updatedChats = this.updateChatTitle(chatId, trimmedTitle);
        this.chatsUpdated.emit(updatedChats);
        this.renamingChatId = null;
      },
      error: (error) => {
        console.error('Failed to rename chat:', error);
        const errorMessage = this.translations?.renameError || 
          'Failed to rename chat. Please try again.';
        alert(errorMessage);
        this.renamingChatId = null;
      }
    });
  }

  /**
   * Cancel the rename operation
   */
  public onCancelRename(): void {
    this.renamingChatId = null;
  }

  /**
   * Update the title of a chat in the list
   */
  private updateChatTitle(chatId: string, newTitle: string): ChatHistoryItem[] {
    return this.chats.map(chat =>
      chat.id === chatId ? { ...chat, title: newTitle } : chat
    );
  }

  /**
   * Handle export chat action
   */
  public handleExportChat(chatId: string, position?: { x: number; y: number }): void {
    const action: ChatContextAction = {
      action: 'export',
      chatId: chatId
    };
    this.contextMenuAction.emit(action);

    const x = position?.x ?? 100;
    const y = position?.y ?? 100;
    
    this.exportMenuChatId.set(chatId);
    this.exportMenuPosition.set({ x, y });
    this.showExportMenu.set(true);
  }
  
  /**
   * Handle export format selection
   */
  public onExportFormatSelected(format: 'json' | 'txt' | 'pdf'): void {
    const chatId = this.exportMenuChatId();
    if (chatId) {
      this.exportChatInFormat(chatId, format);
    }
    this.closeExportMenu();
  }
  
  /**
   * Close export menu
   */
  public closeExportMenu(): void {
    this.showExportMenu.set(false);
    this.exportMenuChatId.set(null);
  }

  /**
   * Export chat in the specified format
   */
  private async exportChatInFormat(chatId: string, format: 'json' | 'txt' | 'pdf'): Promise<void> {
    try {
      let blob: Blob;
      let filename: string;
      const chat = this.chats.find(c => c.id === chatId);
      const chatTitle = chat?.title || 'chat';
      const sanitizedTitle = chatTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();

      switch (format) {
        case 'json':
          blob = await this.openWebUIService.exportChatAsJson(chatId);
          filename = `${sanitizedTitle}.json`;
          break;
        case 'txt':
          blob = await this.openWebUIService.exportChatAsTxt(chatId);
          filename = `${sanitizedTitle}.txt`;
          break;
        case 'pdf':
          blob = await this.openWebUIService.exportChatAsPdf(chatId);
          filename = `${sanitizedTitle}.pdf`;
          break;
      }

      // Trigger download using file-saver
      const fileSaver = await import('file-saver');
      const saveAs = fileSaver.default || fileSaver.saveAs;
      saveAs(blob, filename);

    } catch (error) {
      console.error('Failed to export chat:', error);
      const errorMessage = this.translations?.exportError || 
        'Failed to export chat. Please try again.';
      alert(errorMessage);
    }
  }
}
