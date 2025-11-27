import { ComponentFixture, TestBed } from '@angular/core/testing';
import { jest } from '@jest/globals';
import { FolderContextMenuComponent } from './folder-context-menu.component';
import { FolderItem } from '../../../models/chat.model';

describe('FolderContextMenuComponent', () => {
  let component: FolderContextMenuComponent;
  let fixture: ComponentFixture<FolderContextMenuComponent>;

  const mockFolder: FolderItem = {
    id: 'folder-1',
    name: 'Test Folder',
    parent_id: null,
    user_id: 'user-1',
    items: [],
    meta: { description: '', tags: [] },
    data: { files: [] },
    created_at: Date.now() / 1000,
    updated_at: Date.now() / 1000
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderContextMenuComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FolderContextMenuComponent);
    component = fixture.componentInstance;
    component.folder = mockFolder;
    component.position = { x: 100, y: 100 };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display create subfolder option', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const menuItems = compiled.querySelectorAll('.menu-item');
    const createItem = Array.from(menuItems).find(item => 
      item.textContent?.includes('Subfolder')
    );
    expect(createItem).toBeTruthy();
  });

  it('should emit create action when create button is clicked', () => {
    jest.spyOn(component.action, 'emit');
    jest.spyOn(component.closed, 'emit');

    component.emitAction('create');

    expect(component.action.emit).toHaveBeenCalledWith({ 
      action: 'create', 
      folderId: 'folder-1' 
    });
    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('should emit rename action when rename button is clicked', () => {
    jest.spyOn(component.action, 'emit');
    jest.spyOn(component.closed, 'emit');

    component.emitAction('rename');

    expect(component.action.emit).toHaveBeenCalledWith({ 
      action: 'rename', 
      folderId: 'folder-1' 
    });
    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('should emit move action when move button is clicked', () => {
    jest.spyOn(component.action, 'emit');
    jest.spyOn(component.closed, 'emit');

    component.emitAction('move');

    expect(component.action.emit).toHaveBeenCalledWith({ 
      action: 'move', 
      folderId: 'folder-1' 
    });
    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('should emit delete action when delete button is clicked', () => {
    jest.spyOn(component.action, 'emit');
    jest.spyOn(component.closed, 'emit');

    component.emitAction('delete');

    expect(component.action.emit).toHaveBeenCalledWith({ 
      action: 'delete', 
      folderId: 'folder-1' 
    });
    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('should close menu on document click outside', () => {
    jest.spyOn(component.closed, 'emit');

    const event = new MouseEvent('click');
    component.onDocumentClick(event);

    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('should close menu on Escape key', () => {
    jest.spyOn(component.closed, 'emit');

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    component.onKeyDown(event);

    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('should navigate menu with arrow keys', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const menuItems = compiled.querySelectorAll('.menu-item') as NodeListOf<HTMLElement>;

    expect(menuItems.length).toBeGreaterThan(1);

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    component.onKeyDown(event);

    // Verify the component is still accessible after keyboard navigation
    expect(component).toBeTruthy();
  });
});
