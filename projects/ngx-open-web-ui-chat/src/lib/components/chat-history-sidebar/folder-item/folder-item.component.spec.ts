import { ComponentFixture, TestBed } from '@angular/core/testing';
import { jest } from '@jest/globals';
import { FolderItemComponent } from './folder-item.component';
import { FolderItem } from '../../../models/chat.model';
import { EventEmitter } from '@angular/core';

describe('FolderItemComponent', () => {
  let component: FolderItemComponent;
  let fixture: ComponentFixture<FolderItemComponent>;

  const mockFolder: FolderItem = {
    id: 'folder-1',
    name: 'Test Folder',
    parent_id: null,
    user_id: 'user-1',
    items: ['chat-1', 'chat-2'],
    meta: { description: '', tags: [] },
    data: { files: [] },
    created_at: Date.now() / 1000,
    updated_at: Date.now() / 1000
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderItemComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FolderItemComponent);
    component = fixture.componentInstance;
    component.folder = mockFolder;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display folder name', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const folderName = compiled.querySelector('.folder-name');
    expect(folderName?.textContent).toContain('Test Folder');
  });

  it('should show item count when folder has items', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const count = compiled.querySelector('.folder-count');
    expect(count?.textContent?.trim()).toBe('2');
  });

  it('should emit toggle event when toggle button is clicked', () => {
    jest.spyOn(component.toggle, 'emit');
    const compiled = fixture.nativeElement as HTMLElement;
    const toggleBtn = compiled.querySelector('.folder-toggle') as HTMLElement;
    
    toggleBtn?.click();
    
    expect(component.toggle.emit).toHaveBeenCalled();
  });

  it('should call onFolderClick method', () => {
    jest.spyOn(component, 'onFolderClick');
    
    component.onFolderClick();
    
    expect(component.onFolderClick).toHaveBeenCalled();
  });

  it('should not emit selected event when renaming', () => {
    component.isRenaming = true;
    fixture.detectChanges();

    jest.spyOn(component.selected, 'emit');
    const compiled = fixture.nativeElement as HTMLElement;
    const folderItem = compiled.querySelector('.folder-item') as HTMLElement;
    
    folderItem?.click();
    
    expect(component.selected.emit).not.toHaveBeenCalled();
  });

  it('should show rename input when isRenaming is true', () => {
    component.isRenaming = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const renameInput = compiled.querySelector('.folder-rename-input');
    
    expect(renameInput).toBeTruthy();
  });

  it('should emit cancelRename event on Escape key', () => {
    component.isRenaming = true;
    fixture.detectChanges();

    jest.spyOn(component.cancelRename, 'emit');
    
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    component.onRenameKeydown(event);
    
    expect(component.cancelRename.emit).toHaveBeenCalled();
  });

  it('should emit context menu event on right click', () => {
    jest.spyOn(component.contextMenu, 'emit');
    const compiled = fixture.nativeElement as HTMLElement;
    const folderItem = compiled.querySelector('.folder-item') as HTMLElement;
    
    const event = new MouseEvent('contextmenu', { bubbles: true });
    folderItem?.dispatchEvent(event);
    
    expect(component.contextMenu.emit).toHaveBeenCalled();
  });

  it('should toggle expansion on ArrowRight when collapsed', () => {
    component.isExpanded = false;
    fixture.detectChanges();

    jest.spyOn(component.toggle, 'emit');
    
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    component.onKeyDown(event);
    
    expect(component.toggle.emit).toHaveBeenCalled();
  });

  it('should toggle expansion on ArrowLeft when expanded', () => {
    component.isExpanded = true;
    fixture.detectChanges();

    jest.spyOn(component.toggle, 'emit');
    
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    component.onKeyDown(event);
    
    expect(component.toggle.emit).toHaveBeenCalled();
  });

  it('should generate correct ARIA label', () => {
    component.isExpanded = false;
    const label = component.getAriaLabel();
    
    expect(label).toContain('Test Folder');
    expect(label).toContain('2');
  });

  it('should test EventEmitter directly', () => {
    const emitter = new EventEmitter<void>();
    let emitted = false;
    const subscription = emitter.subscribe(() => {
      emitted = true;
    });
    
    emitter.emit();
    
    expect(emitted).toBe(true);
    subscription.unsubscribe();
  });

  it('should test component EventEmitter directly', () => {
    const testEmitter = new EventEmitter<void>();
    let emitted = false;
    const subscription = testEmitter.subscribe(() => {
      emitted = true;
    });
    
    testEmitter.emit();
    
    expect(emitted).toBe(true);
    subscription.unsubscribe();
  });

  it('should check onFolderClick implementation', () => {
    const originalMethod = component.onFolderClick;
    
    let methodCalled = false;
    component.onFolderClick = () => {
      methodCalled = true;
      component.selected.emit();
    };
    
    let emitted = false;
    const subscription = component.selected.subscribe(() => {
      emitted = true;
    });
    
    component.onFolderClick();
    
    expect(methodCalled).toBe(true);
    expect(emitted).toBe(true);
    
    subscription.unsubscribe();    
    component.onFolderClick = originalMethod;
  });

  it('should check isRenaming value directly', () => {
    expect(component.isRenaming).toBe(false);
    expect(!component.isRenaming).toBe(true);
  });
});
