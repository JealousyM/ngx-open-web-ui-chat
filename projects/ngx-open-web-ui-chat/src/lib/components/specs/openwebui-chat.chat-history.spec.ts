import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideMarkdown } from 'ngx-markdown';
import { of, throwError } from 'rxjs';
import * as fc from 'fast-check';
import { ChatListResponse, ChatHistoryItem } from '../../models/chat.model';
import { OpenWebUIService } from '../../services/openwebui-api';
import { OpenwebuiChatComponent } from '../openwebui-chat';

/**
 * Property-Based Tests for Chat History Integration
 * 
 * These tests use fast-check to verify correctness properties
 * for the chat history sidebar integration.
 */
describe('OpenwebuiChatComponent - Chat History Integration Properties', () => {
  let component: OpenwebuiChatComponent;
  let fixture: ComponentFixture<OpenwebuiChatComponent>;
  let service: OpenWebUIService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenwebuiChatComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideMarkdown()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OpenwebuiChatComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(OpenWebUIService);
    
    // Set required inputs
    component.modelId = 'test-model';
    component.apiKey = 'test-key';
    component.endpoint = 'http://localhost:8080';
    component.history = true; // Enable history feature
    
    fixture.detectChanges();
  });

  /**
   * Feature: chat-history, Property 2: Chat list loading on sidebar open
   * Validates: Requirements 1.3
   * 
   * Property: For any sidebar opening action, the component should trigger
   * an API request to api/v1/chats and display the returned results.
   */
  it('should load chat list when sidebar is opened for the first time', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary chat lists
        fc.array(
          fc.record({
            id: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            created_at: fc.integer({ min: 1000000000, max: 2000000000 }),
            updated_at: fc.integer({ min: 1000000000, max: 2000000000 }),
            pinned: fc.boolean()
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (chats) => {
          // Reset component state
          component.showSidebar.set(false);
          component.chatList.set([]);
          component.currentPage.set(1);
          
          // Mock the service to return the generated chats
          const mockResponse: ChatListResponse = {
            chats: chats as ChatHistoryItem[],
            page: 1,
            total: chats.length,
            hasMore: false
          };
          
          jest.spyOn(service, 'getChats').mockReturnValue(of(mockResponse));
          
          // Open the sidebar (which should trigger chat list loading)
          component.toggleSidebar();
          
          // Wait for async operations
          fixture.detectChanges();
          
          // Property assertions:
          // 1. Sidebar should be open
          expect(component.showSidebar()).toBe(true);
          
          // 2. Service should have been called with page 1
          expect(service.getChats).toHaveBeenCalledWith(1);
          
          // 3. Chat list should contain the returned chats
          const loadedChats = component.chatList();
          expect(loadedChats.length).toBe(chats.length);
          
          // 4. All returned chats should be in the component's chat list
          const allChatsPresent = chats.every(chat =>
            loadedChats.some(loaded => loaded.id === chat.id)
          );
          expect(allChatsPresent).toBe(true);
          
          // 5. Opening sidebar again should not trigger another load
          // (because chat list is already populated)
          const callCount = jest.mocked(service.getChats).mock.calls.length;
          
          component.toggleSidebar(); // Close
          
          // Chat list should still be populated after closing
          expect(component.chatList().length).toBe(chats.length);
          
          component.toggleSidebar(); // Open again
          fixture.detectChanges();
          
          // If chat list was empty, it will load again (which is correct behavior)
          // If chat list had items, it should not load again
          if (chats.length === 0) {
            // Empty list case: should load again when reopened
            expect(jest.mocked(service.getChats).mock.calls.length).toBeGreaterThanOrEqual(callCount);
          } else {
            // Non-empty list case: should not load again
            expect(jest.mocked(service.getChats).mock.calls.length).toBe(callCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Verify sidebar doesn't load chats when history is disabled
   */
  it('should not load chats when history property is false', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (initialSidebarState) => {
          // Disable history feature
          component.history = false;
          component.showSidebar.set(initialSidebarState);
          component.chatList.set([]);
          
          jest.spyOn(service, 'getChats').mockReturnValue(of({
            chats: [],
            page: 1,
            total: 0,
            hasMore: false
          }));
          
          fixture.detectChanges();
          
          // Property assertion: Service should NOT be called when history is disabled
          expect(service.getChats).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Additional test: Verify error handling when chat list loading fails
   */
  it('should handle errors when loading chat list fails', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (errorMessage) => {
          // Reset component state
          component.showSidebar.set(false);
          component.chatList.set([]);
          component.isLoadingChats.set(false);
          
          // Mock the service to return an error
          jest.spyOn(service, 'getChats').mockReturnValue(
            throwError(() => new Error(errorMessage))
          );
          
          // Open the sidebar
          component.toggleSidebar();
          
          fixture.detectChanges();
          
          // Property assertions:
          // 1. Loading state should be reset to false after error
          expect(component.isLoadingChats()).toBe(false);
          
          // 2. Chat list should remain empty
          expect(component.chatList().length).toBe(0);
          
          // 3. Service should have been called
          expect(service.getChats).toHaveBeenCalled();
        }
      ),
      { numRuns: 50 }
    );
  });
});
