import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatHistoryItem, ChatContextAction, FolderItem } from '../../../models/chat.model';
import { Translation } from '../../../i18n/translations';

@Component({
  selector: 'app-chat-context-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-context-menu.component.html',
  styleUrls: ['./chat-context-menu.component.scss']
})
export class ChatContextMenuComponent {
  @Input() chat!: ChatHistoryItem;
  @Input() position: { x: number; y: number } = { x: 0, y: 0 };
  @Input() isPinned = false;
  @Input() isActive = false;
  @Input() translations?: Translation;
  @Input() folders: FolderItem[] = [];
  
  public showMoveMenu = false;

  @Output() action = new EventEmitter<ChatContextAction>();
  @Output() closed = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closed.emit();
    }
  }

  @HostListener('document:contextmenu', ['$event'])
  public onDocumentContextMenu(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closed.emit();
    }
  }

  public emitAction(actionType: 'pin' | 'unpin' | 'delete' | 'rename' | 'export'): void {
    const contextAction: ChatContextAction = {
      action: actionType,
      chatId: this.chat.id
    };
    this.action.emit(contextAction);
    this.closed.emit();
  }

  public toggleMoveMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showMoveMenu = !this.showMoveMenu;
  }

  public emitMoveAction(folderId: string): void {
    const contextAction: ChatContextAction = {
      action: 'move',
      chatId: this.chat.id,
      targetFolderId: folderId
    };
    this.action.emit(contextAction);
    this.closed.emit();
  }

  public get pinText(): string {
    return this.translations?.pinChat || 'Pin Chat';
  }

  public get unpinText(): string {
    return this.translations?.unpinChat || 'Unpin Chat';
  }

  public get renameText(): string {
    return this.translations?.renameChat || 'Rename Chat';
  }

  public get exportText(): string {
    return this.translations?.exportChat || 'Export Chat';
  }

  public get moveText(): string {
    return this.translations?.moveChat || 'Move to Folder';
  }

  public get deleteText(): string {
    return this.translations?.deleteChat || 'Delete Chat';
  }

  /**
   * Handle keyboard navigation in context menu
   */
  public flattenedFolders: FolderDisplayItem[] = [];

  ngOnChanges(): void {
    this.flattenedFolders = this.getFlattenedFolders(this.folders);
  }

  private getFlattenedFolders(folders: FolderItem[]): FolderDisplayItem[] {
    if (!folders) return [];

    const buildTree = (parentId: string | null, level: number): FolderDisplayItem[] => {
      return folders
        .filter(f => f.parent_id === parentId)
        .sort((a, b) => a.name.localeCompare(b.name))
        .reduce((acc: FolderDisplayItem[], folder) => {
          const item: FolderDisplayItem = { ...folder, level };
          return [...acc, item, ...buildTree(folder.id, level + 1)];
        }, []);
    };

    return buildTree(null, 0);
  }

  public onKeyDown(event: KeyboardEvent): void {
    const menuItems = this.elementRef.nativeElement.querySelectorAll('.menu-item');
    const currentIndex = Array.from(menuItems).findIndex(item => item === document.activeElement);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % menuItems.length;
        (menuItems[nextIndex] as HTMLElement).focus();
        break;

      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = currentIndex <= 0 ? menuItems.length - 1 : currentIndex - 1;
        (menuItems[prevIndex] as HTMLElement).focus();
        break;

      case 'Home':
        event.preventDefault();
        (menuItems[0] as HTMLElement).focus();
        break;

      case 'End':
        event.preventDefault();
        (menuItems[menuItems.length - 1] as HTMLElement).focus();
        break;

      case 'Escape':
        event.preventDefault();
        this.closed.emit();
        break;
    }
  }
}

interface FolderDisplayItem extends FolderItem {
  level: number;
}
