import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatContextMenuComponent } from './chat-context-menu.component';
import { ChatHistoryItem, ChatContextAction } from '../../../models/chat.model';
import * as fc from 'fast-check';

describe('ChatContextMenuComponent', () => {
  let component: ChatContextMenuComponent;
  let fixture: ComponentFixture<ChatContextMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatContextMenuComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatContextMenuComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Feature: chat-history, Property 9: Context menu display on right-click
  // **Validates: Requirements 4.1**
  describe('Property 9: Context menu display on right-click', () => {
    it('should display context menu at cursor position for any chat item when right-clicked', () => {
      fc.assert(
        fc.property(
          // Generator for chat items
          fc.record({
            id: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            created_at: fc.integer({ min: 0 }),
            updated_at: fc.integer({ min: 0 }),
            pinned: fc.boolean()
          }),
          // Generator for mouse position
          fc.record({
            x: fc.integer({ min: 0, max: 1920 }),
            y: fc.integer({ min: 0, max: 1080 })
          }),
          (chat: ChatHistoryItem, position: { x: number; y: number }) => {
            // Set up component with generated data
            component.chat = chat;
            component.position = position;
            component.isPinned = chat.pinned || false;
            
            fixture.detectChanges();
            
            // Verify the context menu is rendered
            const contextMenuElement = fixture.nativeElement.querySelector('.context-menu');
            expect(contextMenuElement).toBeTruthy();
            
            // Verify the menu is positioned at the correct coordinates
            const computedStyle = window.getComputedStyle(contextMenuElement);
            const leftValue = parseInt(computedStyle.left, 10);
            const topValue = parseInt(computedStyle.top, 10);
            
            expect(leftValue).toBe(position.x);
            expect(topValue).toBe(position.y);
            
            // Verify menu items are present
            const menuItems = contextMenuElement.querySelectorAll('.menu-item');
            expect(menuItems.length).toBeGreaterThan(0);
            
            // Verify pin/unpin button is present based on pinned state
            const pinButton = Array.from(menuItems).find((item: any) => 
              item.textContent.includes('Pin') || item.textContent.includes('Unpin')
            );
            expect(pinButton).toBeTruthy();
            
            // Verify other menu items are present
            const renameButton = Array.from(menuItems).find((item: any) => 
              item.textContent.includes('Rename')
            );
            const exportButton = Array.from(menuItems).find((item: any) => 
              item.textContent.includes('Export')
            );
            const deleteButton = Array.from(menuItems).find((item: any) => 
              item.textContent.includes('Delete')
            );
            
            expect(renameButton).toBeTruthy();
            expect(exportButton).toBeTruthy();
            expect(deleteButton).toBeTruthy();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should emit action and close when menu item is clicked', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            created_at: fc.integer({ min: 0 }),
            updated_at: fc.integer({ min: 0 }),
            pinned: fc.boolean()
          }),
          fc.constantFrom('pin', 'unpin', 'rename', 'export', 'delete'),
          (chat: ChatHistoryItem, actionType: 'pin' | 'unpin' | 'rename' | 'export' | 'delete') => {
            component.chat = chat;
            component.isPinned = chat.pinned || false;
            
            let emittedAction: ChatContextAction | undefined = undefined;
            let closedEmitted = false;
            
            component.action.subscribe((action: ChatContextAction) => {
              emittedAction = action;
            });
            
            component.closed.subscribe(() => {
              closedEmitted = true;
            });
            
            // Emit the action
            component.emitAction(actionType);
            
            // Verify action was emitted with correct data
            expect(emittedAction).toBeTruthy();
            if (emittedAction) {
              expect((emittedAction as ChatContextAction).action).toBe(actionType);
              expect((emittedAction as ChatContextAction).chatId).toBe(chat.id);
            }
            
            // Verify closed was emitted
            expect(closedEmitted).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should close when clicking outside the menu', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            created_at: fc.integer({ min: 0 }),
            updated_at: fc.integer({ min: 0 }),
            pinned: fc.boolean()
          }),
          (chat: ChatHistoryItem) => {
            component.chat = chat;
            fixture.detectChanges();
            
            let closedEmitted = false;
            component.closed.subscribe(() => {
              closedEmitted = true;
            });
            
            // Simulate click outside the component
            const outsideElement = document.createElement('div');
            document.body.appendChild(outsideElement);
            
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            
            Object.defineProperty(clickEvent, 'target', {
              value: outsideElement,
              enumerable: true
            });
            
            component.onDocumentClick(clickEvent);
            
            // Verify closed was emitted
            expect(closedEmitted).toBe(true);
            
            // Cleanup
            document.body.removeChild(outsideElement);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
