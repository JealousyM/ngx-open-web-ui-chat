import { ComponentFixture, TestBed } from '@angular/core/testing';
import { jest } from '@jest/globals';
import { FolderListComponent } from './folder-list.component';
import { FolderItem } from '../../../models/chat.model';

describe('FolderListComponent', () => {
  let component: FolderListComponent;
  let fixture: ComponentFixture<FolderListComponent>;

  const mockFolders: FolderItem[] = [
    {
      id: 'folder-1',
      name: 'Root Folder',
      parent_id: null,
      user_id: 'user-1',
      items: ['chat-1'],
      meta: { description: '', tags: [] },
      data: { files: [] },
      created_at: Date.now() / 1000,
      updated_at: Date.now() / 1000
    },
    {
      id: 'folder-2',
      name: 'Child Folder',
      parent_id: 'folder-1',
      user_id: 'user-1',
      items: [],
      meta: { description: '', tags: [] },
      data: { files: [] },
      created_at: Date.now() / 1000,
      updated_at: Date.now() / 1000
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FolderListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show empty state when no folders', () => {
    component.folders = [];
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emptyState = compiled.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should display folders when provided', () => {
    component.folders = mockFolders;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const folderItems = compiled.querySelectorAll('app-folder-item');
    expect(folderItems.length).toBeGreaterThan(0);
  });

  it('should build hierarchical folder tree', () => {
    component.folders = mockFolders;
    const tree = component.folderTree;
    
    expect(tree.length).toBe(1);
    expect(tree[0].folder.id).toBe('folder-1');
    expect(tree[0].children.length).toBe(1);
    expect(tree[0].children[0].folder.id).toBe('folder-2');
  });

  it('should flatten folder tree correctly when expanded', () => {
    component.folders = mockFolders;
    component.expandedFolderIds = new Set(['folder-1']);
    
    const flattened = component.flattenedFolders;
    expect(flattened.length).toBe(2);
    expect(flattened[0].folder.id).toBe('folder-1');
    expect(flattened[1].folder.id).toBe('folder-2');
  });

  it('should not show children when folder is collapsed', () => {
    component.folders = mockFolders;
    component.expandedFolderIds = new Set();
    
    const flattened = component.flattenedFolders;
    expect(flattened.length).toBe(1);
    expect(flattened[0].folder.id).toBe('folder-1');
  });

  it('should emit folderSelected event when folder is clicked', () => {
    jest.spyOn(component.folderSelected, 'emit');
    
    component.onFolderClick('folder-1');
    
    expect(component.folderSelected.emit).toHaveBeenCalledWith('folder-1');
  });

  it('should emit folderToggled event when folder is toggled', () => {
    jest.spyOn(component.folderToggled, 'emit');
    
    component.onFolderToggle('folder-1');
    
    expect(component.folderToggled.emit).toHaveBeenCalledWith('folder-1');
  });

  it('should emit rename event with folder id and new name', () => {
    jest.spyOn(component.rename, 'emit');
    
    component.onFolderRename('folder-1', 'New Name');
    
    expect(component.rename.emit).toHaveBeenCalledWith({ 
      folderId: 'folder-1', 
      newName: 'New Name' 
    });
  });

  it('should emit cancelRename event', () => {
    jest.spyOn(component.cancelRename, 'emit');
    
    component.onCancelRename();
    
    expect(component.cancelRename.emit).toHaveBeenCalled();
  });

  it('should correctly identify renaming folder', () => {
    component.renamingFolderId = 'folder-1';
    
    expect(component.isRenaming('folder-1')).toBe(true);
    expect(component.isRenaming('folder-2')).toBe(false);
  });
});
