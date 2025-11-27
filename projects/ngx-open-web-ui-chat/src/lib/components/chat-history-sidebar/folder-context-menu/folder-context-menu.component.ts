import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FolderItem, FolderContextAction } from '../../../models/chat.model';
import { Translation } from '../../../i18n/translations';

@Component({
  selector: 'app-folder-context-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './folder-context-menu.component.html',
  styleUrls: ['./folder-context-menu.component.scss']
})
export class FolderContextMenuComponent {
  @Input() public folder!: FolderItem;
  @Input() public position: { x: number; y: number } = { x: 0, y: 0 };
  @Input() public translations?: Translation;

  @Output() public action = new EventEmitter<{ action: FolderContextAction; folderId: string }>();
  @Output() public closed = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent): void {
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

  public emitAction(actionType: FolderContextAction): void {
    this.action.emit({ action: actionType, folderId: this.folder.id });
    this.closed.emit();
  }

  public get createText(): string {
    return this.translations?.createSubfolder || 'Create Subfolder';
  }

  public get renameText(): string {
    return this.translations?.renameFolder || 'Rename Folder';
  }

  public get deleteText(): string {
    return this.translations?.deleteFolder || 'Delete Folder';
  }

  /**
   * Handle keyboard navigation in context menu
   */
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
