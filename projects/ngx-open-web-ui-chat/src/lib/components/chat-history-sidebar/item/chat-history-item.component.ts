import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatHistoryItem } from '../../../models/chat.model';
import { Translation } from '../../../i18n/translations';
import { formatRelativeTime } from '../../../utils/date-formatter';

@Component({
  selector: 'app-chat-history-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-history-item.component.html',
  styleUrls: ['./chat-history-item.component.scss']
})
export class ChatHistoryItemComponent implements OnChanges {
  @Input() public chat!: ChatHistoryItem;
  @Input() public isActive = false;
  @Input() public isPinned = false;
  @Input() public isRenaming = false;
  @Input() public translations?: Translation;
  @Input() public tabindex = -1;

  @Output() public selected = new EventEmitter<void>();
  @Output() public contextMenu = new EventEmitter<MouseEvent>();
  @Output() public rename = new EventEmitter<string>();
  @Output() public cancelRename = new EventEmitter<void>();

  public renameValue = '';

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['isRenaming'] && changes['isRenaming'].currentValue === true) {
      this.renameValue = this.chat.title;
    }
  }

  public onChatClick(): void {
    if (!this.isRenaming) {
      this.selected.emit();
    }
  }

  public onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.contextMenu.emit(event);
  }

  public submitRename(): void {
    const trimmedValue = this.renameValue.trim();
    if (trimmedValue && trimmedValue !== this.chat.title) {
      this.rename.emit(trimmedValue);
    } else {
      this.cancelRename.emit();
    }
  }

  public onRenameKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submitRename();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelRename.emit();
    }
  }

  public onRenameBlur(): void {
    this.submitRename();
  }

  public formatDate(timestamp: number): string {
    if (this.translations) {
      return formatRelativeTime(timestamp, this.translations);
    }
    
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Get ARIA label for the chat item
   */
  public getAriaLabel(): string {
    const parts: string[] = [];
    
    if (this.isPinned) {
      parts.push(this.translations?.pinned || 'Pinned');
    }
    
    parts.push(this.chat.title);
    
    if (this.isActive) {
      parts.push(this.translations?.active || 'Active');
    }
    
    parts.push(this.formatDate(this.chat.updated_at));
    
    return parts.join(', ');
  }

  /**
   * Handle keyboard events on chat item
   */
  public onKeyDown(event: KeyboardEvent): void {
    if (this.isRenaming) {
      return;
    }

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.onChatClick();
        break;
    }
  }
}
