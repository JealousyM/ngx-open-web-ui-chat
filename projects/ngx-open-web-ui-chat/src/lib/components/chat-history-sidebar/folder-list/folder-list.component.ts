import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FolderItem, FolderContextMenuEvent, ChatContextMenuEvent } from '../../../models/chat.model';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { FolderItemComponent } from '../folder-item/folder-item.component';
import { Translation } from '../../../i18n/translations';

interface FolderTree {
  folder: FolderItem;
  children: FolderTree[];
  isExpanded: boolean;
  depth: number;
}

@Component({
  selector: 'app-folder-list',
  standalone: true,
  imports: [CommonModule, FolderItemComponent, DragDropModule],
  templateUrl: './folder-list.component.html',
  styleUrls: ['./folder-list.component.scss']
})
export class FolderListComponent {
  @Input() public folders: FolderItem[] = [];
  @Input() public expandedFolderIds: Set<string> = new Set();
  @Input() public renamingFolderId: string | null = null;
  @Input() public translations?: Translation;
  @Input() public currentChatId: string | null = null;

  @Output() public folderSelected = new EventEmitter<string>();
  @Output() public chatSelected = new EventEmitter<string>();
  @Output() public folderToggled = new EventEmitter<string>();
  @Output() public contextMenu = new EventEmitter<FolderContextMenuEvent>();
  @Output() public chatContextMenu = new EventEmitter<ChatContextMenuEvent>();
  @Output() public rename = new EventEmitter<{ folderId: string; newName: string }>();
  @Output() public cancelRename = new EventEmitter<void>();
  @Output() public itemDrop = new EventEmitter<CdkDragDrop<any[]>>();

  @Input() public connectedDropLists: string[] = [];

  /**
   * Build hierarchical folder tree
   */
  public get folderTree(): FolderTree[] {
    return this.buildFolderTree(null, 0);
  }

  private buildFolderTree(parentId: string | null, depth: number): FolderTree[] {
    return this.folders
      .filter(folder => folder.parent_id === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(folder => ({
        folder,
        children: this.buildFolderTree(folder.id, depth + 1),
        isExpanded: folder.is_expanded ?? this.expandedFolderIds.has(folder.id),
        depth
      }));
  }

  /**
   * Flatten folder tree for rendering
   */
  public get flattenedFolders(): Array<{ folder: FolderItem; isExpanded: boolean; depth: number }> {
    const result: Array<{ folder: FolderItem; isExpanded: boolean; depth: number }> = [];
    
    const flatten = (trees: FolderTree[]) => {
      trees.forEach(tree => {
        result.push({
          folder: tree.folder,
          isExpanded: tree.isExpanded,
          depth: tree.depth
        });
        
        if (tree.isExpanded && tree.children.length > 0) {
          flatten(tree.children);
        }
      });
    };
    
    flatten(this.folderTree);
    return result;
  }

  public onFolderClick(folderId: string): void {
    this.folderSelected.emit(folderId);
  }

  public onChatSelected(chatId: string): void {
    this.chatSelected.emit(chatId);
  }

  public onFolderToggle(folderId: string): void {
    this.folderToggled.emit(folderId);
  }

  public onFolderContextMenu(event: MouseEvent, folder: FolderItem): void {
    this.contextMenu.emit({ folder, mouseEvent: event, action: 'create' });
  }

  public onChatContextMenu(event: ChatContextMenuEvent): void {
    this.chatContextMenu.emit(event);
  }

  public onFolderRename(folderId: string, newName: string): void {
    this.rename.emit({ folderId, newName });
  }

  public onCancelRename(): void {
    this.cancelRename.emit();
  }

  public onDrop(event: CdkDragDrop<any[]>): void {
    this.itemDrop.emit(event);
  }

  public isRenaming(folderId: string): boolean {
    return this.renamingFolderId === folderId;
  }

  public getTabIndex(index: number): number {
    return index === 0 ? 0 : -1;
  }

  public trackByFolderId(index: number, item: { folder: FolderItem }): string {
    return item.folder.id;
  }
}
