import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { FolderItem, ChatContextMenuEvent } from '../../../models/chat.model';
import { Translation } from '../../../i18n/translations';

@Component({
  selector: 'app-folder-item',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './folder-item.component.html',
  styleUrls: ['./folder-item.component.scss']
})
export class FolderItemComponent implements OnChanges {
  @Input() public folder!: FolderItem;
  @Input() public isExpanded = false;
  @Input() public isRenaming = false;
  @Input() public translations?: Translation;
  @Input() public tabindex = -1;
  @Input() public depth = 0;
  @Input() public folderChats: any[] = []; // Chats belonging to this folder
  @Input() public currentChatId: string | null = null;

  @Output() public toggle = new EventEmitter<void>();
  @Output() public selected = new EventEmitter<void>();
  @Output() public contextMenu = new EventEmitter<MouseEvent>();
  @Output() public rename = new EventEmitter<string>();
  @Output() public cancelRename = new EventEmitter<void>();
  @Output() public itemDrop = new EventEmitter<CdkDragDrop<any[]>>();

  @Input() public connectedDropLists: string[] = [];
  @Output() public folderClick = new EventEmitter<string>(); // Emit folder ID when clicked
  @Output() public chatSelected = new EventEmitter<string>(); // Emit chat ID when a chat is selected
  @Output() public chatContextMenu = new EventEmitter<ChatContextMenuEvent>();

  public renameValue = '';

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['isRenaming'] && changes['isRenaming'].currentValue === true) {
      this.renameValue = this.folder.name;
    }
  }

  public onFolderClick(): void {
    if (!this.isRenaming) {
      this.folderClick.emit(this.folder.id);
    }
  }

  public onChatClick(chatId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.chatSelected.emit(chatId);
  }

  public onToggleClick(event: MouseEvent): void {
    event.stopPropagation();
    this.toggle.emit();
  }

  public onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenu.emit(event);
  }

  public onChatContextMenu(event: MouseEvent, chat: any): void {
    event.preventDefault();
    event.stopPropagation();
    this.chatContextMenu.emit({ mouseEvent: event, chat });
  }

  public submitRename(): void {
    const trimmedValue = this.renameValue.trim();
    if (trimmedValue && trimmedValue !== this.folder.name) {
      this.rename.emit(trimmedValue);
    } else {
      this.cancelRename.emit();
    }
  }

  public onRenameKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (event.target) {
        (event.target as HTMLElement).blur();
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelRename.emit();
    }
  }

  public onRenameBlur(): void {
    this.submitRename();
  }

  public onCancelRename(): void {
    this.cancelRename.emit();
  }

  public onDrop(event: CdkDragDrop<any[]>): void {
    this.itemDrop.emit(event);
  }

  /**
   * Get ARIA label for the folder item
   */
  public getAriaLabel(): string {
    const parts: string[] = [];
    
    parts.push(this.folder.name);
    parts.push(this.translations?.folder || 'Folder');
    
    if (this.folder.items && this.folder.items.length > 0) {
      const itemsText = this.translations?.items || 'items';
      parts.push(`${this.folder.items.length} ${itemsText}`);
    }
    
    if (this.isExpanded) {
      parts.push(this.translations?.expanded || 'Expanded');
    } else {
      parts.push(this.translations?.collapsed || 'Collapsed');
    }
    
    return parts.join(', ');
  }

  /**
   * Handle keyboard events on folder item
   */
  public onKeyDown(event: KeyboardEvent): void {
    if (this.isRenaming) {
      return;
    }

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.onFolderClick();
        break;
      case 'ArrowRight':
        if (!this.isExpanded) {
          event.preventDefault();
          this.toggle.emit();
        }
        break;
      case 'ArrowLeft':
        if (this.isExpanded) {
          event.preventDefault();
          this.toggle.emit();
        }
        break;
    }
  }
}
