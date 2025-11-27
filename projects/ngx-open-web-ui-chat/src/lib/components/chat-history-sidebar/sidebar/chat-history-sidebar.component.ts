import { Component, Input, Output, EventEmitter, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ChatHistoryItem, ChatContextAction, ChatContextMenuEvent, FolderItem, FolderContextMenuEvent, FolderContextAction } from '../../../models/chat.model';
import { ChatHistoryHeaderComponent } from '../header/chat-history-header.component';
import { ChatHistoryListComponent } from '../list/chat-history-list.component';
import { ChatContextMenuComponent } from '../context-menu/chat-context-menu.component';
import { FolderListComponent } from '../folder-list/folder-list.component';
import { FolderContextMenuComponent } from '../folder-context-menu/folder-context-menu.component';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { ExportFormatMenuComponent } from '../../export-format-menu/export-format-menu.component';
import { Translation } from '../../../i18n/translations';
import { OpenWebUIService } from '../../../services/openwebui-api';

@Component({
  selector: 'app-chat-history-sidebar',
  standalone: true,
  imports: [CommonModule, ChatHistoryHeaderComponent, ChatHistoryListComponent, ChatContextMenuComponent, FolderListComponent, FolderContextMenuComponent, ConfirmDialogComponent, ExportFormatMenuComponent, DragDropModule],
  templateUrl: './chat-history-sidebar.component.html',
  styleUrls: ['./chat-history-sidebar.component.scss']
})
export class ChatHistorySidebarComponent implements OnChanges {
  @Input() public isOpen = false;
  @Input() public chats: ChatHistoryItem[] = [];
  @Input() public currentChatId: string | null = null;
  @Input() public isLoading = false;
  @Input() public translations?: Translation;
  @Input() public folders = false;
  @Input() public folderList: FolderItem[] = [];
  @Input() public renamingFolderId: string | null = null;

  @Output() public chatSelected = new EventEmitter<string>();
  @Output() public newChatRequested = new EventEmitter<void>();
  @Output() public searchRequested = new EventEmitter<void>();
  @Output() public loadMoreRequested = new EventEmitter<void>();
  @Output() public contextMenuAction = new EventEmitter<ChatContextAction>();
  @Output() public toggleSidebar = new EventEmitter<void>();
  @Output() public chatsUpdated = new EventEmitter<ChatHistoryItem[]>();
  @Output() public folderAction = new EventEmitter<{ action: FolderContextAction; folderId: string }>();
  @Output() public folderRenamed = new EventEmitter<{ folderId: string; newName: string }>();
  @Output() public foldersUpdated = new EventEmitter<FolderItem[]>();

  public renamingChatId: string | null = null;
  public showContextMenu = signal(false);
  public contextMenuPosition = signal({ x: 0, y: 0 });
  public contextMenuChat = signal<ChatHistoryItem | null>(null);
  
  public showDeleteConfirm = signal(false);
  public chatToDelete = signal<ChatHistoryItem | null>(null);
  
  public showExportMenu = signal(false);
  public exportMenuChatId = signal<string | null>(null);
  public exportMenuPosition = signal({ x: 0, y: 0 });
  
  public expandedFolderIds = signal<Set<string>>(new Set());
  public showFolderContextMenu = signal(false);
  public folderContextMenuPosition = signal({ x: 0, y: 0 });
  public folderContextMenuFolder = signal<FolderItem | null>(null);
  
  public showFolderDeleteConfirm = signal(false);
  public folderToDelete = signal<FolderItem | null>(null);

  public connectedDropLists: string[] = [];

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['folderList']) {
      this.updateConnectedDropLists();
    }
  }

  private updateConnectedDropLists(): void {
    const folderIds = this.getAllFolderIds(this.folderList);
    this.connectedDropLists = ['pinned-list', 'root-list', 'folder-structure', ...folderIds.map(id => `folder-${id}`)];
  }

  private getAllFolderIds(folders: FolderItem[]): string[] {
    let ids: string[] = [];
    for (const folder of folders) {
      ids.push(folder.id);
    }
    return ids;
  }

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
      case 'move':
        if (action.targetFolderId) {
          this.handleMoveChat(action.chatId, action.targetFolderId);
        }
        break;
    }
  }

  /**
   * Handle move chat to folder
   */
  public handleMoveChat(chatId: string, folderId: string | null): void {
    const action: ChatContextAction = {
      action: 'move',
      chatId: chatId,
      targetFolderId: folderId
    };
    this.contextMenuAction.emit(action);

    let chatToMove: ChatHistoryItem | undefined = this.chats.find(c => c.id === chatId);
    let sourceFolderId: string | null = null;

    if (!chatToMove) {
      for (const folder of this.folderList) {
        if (folder.chats) {
          const found = folder.chats.find(c => c.id === chatId);
          if (found) {
            chatToMove = found;
            sourceFolderId = folder.id;
            break;
          }
        }
      }
    }

    this.openWebUIService.moveChatToFolder(chatId, folderId).subscribe({
      next: () => {
        if (folderId === null) {
          if (sourceFolderId !== null) {
            const updatedFolders = this.folderList.map(folder => {
              if (folder.id === sourceFolderId) {
                return {
                  ...folder,
                  chats: (folder.chats || []).filter(c => c.id !== chatId)
                };
              }
              return folder;
            });
            this.foldersUpdated.emit(updatedFolders);
          }
          
          if (chatToMove) {
            const updatedChat = { ...chatToMove, folder_id: null, pinned: false };
            const updatedChats = [updatedChat, ...this.chats].sort((a, b) => {
              if (a.pinned && !b.pinned) return -1;
              if (!a.pinned && b.pinned) return 1;
              return b.updated_at - a.updated_at;
            });
            this.chatsUpdated.emit(updatedChats);
          }
        } else {
          if (sourceFolderId === null) {
            const updatedChats = this.chats.filter(chat => chat.id !== chatId);
            this.chatsUpdated.emit(updatedChats);
          }

          if (chatToMove) {
            const updatedFolders = this.folderList.map(folder => {
              let newFolder = { ...folder };
              
              if (sourceFolderId !== null && folder.id === sourceFolderId) {
                newFolder.chats = (folder.chats || []).filter(c => c.id !== chatId);
              }
              
              if (folder.id === folderId && folder.is_expanded) {
                const currentChats = newFolder.chats || [];
                if (!currentChats.find(c => c.id === chatId)) {
                   const updatedChat = { ...chatToMove!, folder_id: folderId };
                   newFolder.chats = [updatedChat, ...currentChats].sort((a, b) => b.updated_at - a.updated_at);
                }
              }
              
              return newFolder;
            });
            
            this.foldersUpdated.emit(updatedFolders);
          }
        }
      },
      error: (error) => {
        console.error('Failed to move chat:', error);
      }
    });
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

  /**
   * Handle folder selection
   */
  public onFolderSelected(folderId: string): void {
    // Toggle folder expansion
    this.onFolderToggled(folderId);
  }

  /**
   * Handle folder toggle (expand/collapse)
   */
  public onFolderToggled(folderId: string): void {
    const folder = this.folderList.find(f => f.id === folderId);
    if (!folder) return;

    const newExpandedState = !folder.is_expanded;

    this.openWebUIService.toggleFolderExpanded(folderId, newExpandedState).subscribe({
      next: () => {
        if (newExpandedState) {
          this.openWebUIService.getChatsInFolder(folderId).subscribe({
            next: (chats) => {
              const updatedFolders = this.folderList.map(f => 
                f.id === folderId 
                  ? { ...f, is_expanded: true, chats: chats }
                  : f
              );
              this.foldersUpdated.emit(updatedFolders);
            },
            error: (error) => {
              console.error('Failed to load folder chats:', error);
            }
          });
        } else {
          const updatedFolders = this.folderList.map(f => 
            f.id === folderId 
              ? { ...f, is_expanded: false, chats: [] }
              : f
          );
          this.foldersUpdated.emit(updatedFolders);
        }
      },
      error: (error) => {
        console.error('Failed to toggle folder expansion:', error);
      }
    });
  }

  /**
   * Handle folder context menu
   */
  public onFolderContextMenu(event: FolderContextMenuEvent): void {
    event.mouseEvent.preventDefault();
    this.folderContextMenuFolder.set(event.folder);
    const position = {
      x: event.mouseEvent.clientX,
      y: event.mouseEvent.clientY
    };
    this.folderContextMenuPosition.set(position);
    this.showFolderContextMenu.set(true);
  }

  /**
   * Handle folder context menu action
   */
  public handleFolderContextMenuAction(data: { action: FolderContextAction; folderId: string }): void {
    this.showFolderContextMenu.set(false);
    const folder = this.folderContextMenuFolder();
    this.folderContextMenuFolder.set(null);
    
    if (data.action === 'delete' && folder && folder.id === data.folderId) {
      this.folderToDelete.set(folder);
      this.showFolderDeleteConfirm.set(true);
      return;
    }
    
    this.folderAction.emit(data);
    
    if (data.action === 'rename') {
      this.renamingFolderId = data.folderId;
    }
  }

  public onFolderDeleteConfirmed(): void {
    const folder = this.folderToDelete();
    if (folder) {
      this.folderAction.emit({ action: 'delete', folderId: folder.id });
    }
    this.showFolderDeleteConfirm.set(false);
    this.folderToDelete.set(null);
  }

  public onFolderDeleteCancelled(): void {
    this.showFolderDeleteConfirm.set(false);
    this.folderToDelete.set(null);
  }

  /**
   * Close folder context menu
   */
  public closeFolderContextMenu(): void {
    this.showFolderContextMenu.set(false);
    this.folderContextMenuFolder.set(null);
  }

  /**
   * Handle folder rename
   */
  public onFolderRename(data: { folderId: string; newName: string }): void {
    this.renamingFolderId = null;
    this.folderRenamed.emit(data);
  }

  /**
   * Cancel folder rename
   */
  public onCancelFolderRename(): void {
    this.renamingFolderId = null;
  }

  /**
   * Create root folder (no parent)
   */
  public onCreateRootFolder(): void {
    this.folderAction.emit({
      action: 'create',
      folderId: '' // Empty folderId means root level
    });
  }

  /**
   * Handle chat selection from a folder
   */
  public handleFolderChatClick(chatId: string): void {
    let foundChat: ChatHistoryItem | undefined;
    
    for (const folder of this.folderList) {
      if (folder.chats) {
        foundChat = folder.chats.find(c => c.id === chatId);
        if (foundChat) break;
      }
    }

    if (foundChat) {
      this.chatSelected.emit(foundChat.id);
    } else {
      console.warn('Chat not found in loaded folders:', chatId);
    }
  }

  public moveFolder(folderId: string, parentId: string | null): void {
    this.openWebUIService.moveFolder(folderId, parentId).subscribe({
      next: (updatedFolder) => {
        // We need to update the folder list.
        // Since we don't have the full list from the API response, we might need to reload folders
        // or manually update the local list.
        // For now, let's emit an event to request folder list refresh or update local state.
        // The parent component (OpenWebUiChatComponent) usually handles folder loading.
        // But here we are in ChatHistorySidebarComponent.
        // We can emit foldersUpdated, but that expects a list.
        
        // Let's manually update the local folder list to reflect the move
        const updatedFolders = this.folderList.map(f => 
          f.id === folderId ? { ...f, parent_id: parentId } : f
        );
        this.foldersUpdated.emit(updatedFolders);
      },
      error: (error) => {
        console.error('Failed to move folder:', error);
      }
    });
  }

  public drop(event: CdkDragDrop<any[]>): void {
    const isFolderDrag = event.previousContainer.id === 'folder-structure';
    const isFolderDropTarget = event.container.id === 'folder-structure';

    if (isFolderDrag) {
      const folder = event.item.data as FolderItem;
      
      if (isFolderDropTarget) {
        if (folder.parent_id) {
           this.moveFolder(folder.id, null);
        }
      } else if (event.container.id.startsWith('folder-')) {
         const targetFolderId = event.container.id.replace('folder-', '');
         if (targetFolderId !== folder.id) {
            this.moveFolder(folder.id, targetFolderId);
         }
      }
      return;
    }

    if (isFolderDropTarget) {
       this.handleMoveChat(event.item.data.id, null);
       return;
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      
      const item = event.container.data[event.currentIndex];
      const targetId = event.container.id;
      
      if (targetId === 'pinned-list') {
        this.handlePinChat(item.id);
      } else if (targetId === 'root-list') {
        if (item.pinned) {
          this.handleUnpinChat(item.id);
        } else {
          this.handleMoveChat(item.id, null); 
        }
      } else if (targetId.startsWith('folder-')) {
        const folderId = targetId.startsWith('folder-chats-') 
          ? targetId.replace('folder-chats-', '')
          : targetId.replace('folder-', '');
        this.handleMoveChat(item.id, folderId);
      }
    }
  }
}
