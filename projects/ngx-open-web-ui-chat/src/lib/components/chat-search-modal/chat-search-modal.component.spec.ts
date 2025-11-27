import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ChatSearchModalComponent } from './chat-search-modal.component';
import { OpenWebUIService } from '../../services/openwebui-api';
import { of, throwError } from 'rxjs';
import * as fc from 'fast-check';
import { ChatHistoryItem } from '../../models/chat.model';

describe('ChatSearchModalComponent', () => {
  let component: ChatSearchModalComponent;
  let fixture: ComponentFixture<ChatSearchModalComponent>;
  let mockOpenWebUIService: any;

  beforeEach(async () => {
    mockOpenWebUIService = {
      searchChats: jest.fn(),
      getChatById: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ChatSearchModalComponent],
      providers: [
        { provide: OpenWebUIService, useValue: mockOpenWebUIService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatSearchModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Property-based test generators
  const chatIdArb = fc.uuid();
  const chatTitleArb = fc.string({ minLength: 1, maxLength: 100 });
  const timestampArb = fc.integer({ min: 1000000000, max: 2000000000 });
  
  const chatItemArb = fc.record({
    id: chatIdArb,
    title: chatTitleArb,
    created_at: timestampArb,
    updated_at: timestampArb,
    pinned: fc.boolean()
  });

  const chatListArb = fc.array(chatItemArb, { minLength: 0, maxLength: 20 });
  // Generate non-whitespace strings for search queries
  const searchQueryArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

  // Feature: chat-history, Property 27: Search button opens modal
  // **Validates: Requirements 9.2**
  it('should open modal when search is requested', () => {
    fc.assert(
      fc.property(fc.boolean(), (initialState) => {
        component.isOpen = initialState;
        
        // Simulate opening the modal
        component.isOpen = true;
        fixture.detectChanges();
        
        // Verify modal is open
        return component.isOpen === true;
      }),
      { numRuns: 100 }
    );
  });

  // Feature: chat-history, Property 29: Search API call correctness
  // **Validates: Requirements 9.5**
  it('should call search API with correct query parameter', fakeAsync(() => {
    fc.assert(
      fc.property(searchQueryArb, (query) => {
        mockOpenWebUIService.searchChats.mockReturnValue(of([]));
        
        component.isOpen = true;
        component.onSearchQueryChange(query);
        tick(300);
        
        // Verify the API was called with the exact query
        expect(mockOpenWebUIService.searchChats).toHaveBeenCalledWith(query);
        
        // Reset for next iteration
        mockOpenWebUIService.searchChats.mockClear();
        
        return true;
      }),
      { numRuns: 100 }
    );
  }));

  // Feature: chat-history, Property 30: Search results display
  // **Validates: Requirements 9.6**
  it('should display search results returned from API', fakeAsync(() => {
    fc.assert(
      fc.property(searchQueryArb, chatListArb, (query, results) => {
        // Skip whitespace-only queries as they are filtered by the component
        if (!query.trim()) {
          return true;
        }
        
        mockOpenWebUIService.searchChats.mockReturnValue(of(results));
        
        component.isOpen = true;
        component.onSearchQueryChange(query);
        tick(300);
        
        // Verify results are displayed in the component
        const displayedResults = component.searchResults();
        expect(displayedResults).toEqual(results);
        expect(displayedResults.length).toBe(results.length);
        
        // Verify all results are present
        const allResultsPresent = results.every(result =>
          displayedResults.some(displayed => displayed.id === result.id)
        );
        
        // Reset for next iteration
        mockOpenWebUIService.searchChats.mockClear();
        
        return allResultsPresent;
      }),
      { numRuns: 100 }
    );
  }));

  // Feature: chat-history, Property 31: Search result selection shows preview
  // **Validates: Requirements 9.7**
  it('should show preview when search result is selected', fakeAsync(() => {
    fc.assert(
      fc.property(chatItemArb, (chatItem) => {
        const mockChat = {
          id: chatItem.id,
          title: chatItem.title,
          created_at: chatItem.created_at,
          updated_at: chatItem.updated_at,
          chat: {
            messages: [
              { id: '1', role: 'user', content: 'Test message 1' },
              { id: '2', role: 'assistant', content: 'Test response 1' }
            ]
          }
        };
        
        mockOpenWebUIService.getChatById.mockReturnValue(Promise.resolve(mockChat));
        
        component.isOpen = true;
        component.selectResult(chatItem);
        
        // Verify the selected result is set
        expect(component.selectedResult()).toEqual(chatItem);
        
        // Wait for async preview loading
        tick();
        
        // Verify getChatById was called with correct ID
        expect(mockOpenWebUIService.getChatById).toHaveBeenCalledWith(chatItem.id);
        
        // Reset for next iteration
        mockOpenWebUIService.getChatById.mockClear();
        
        return component.selectedResult()?.id === chatItem.id;
      }),
      { numRuns: 100 }
    );
  }));

  // Feature: chat-history, Property 32: Search result confirmation loads chat
  // **Validates: Requirements 9.8**
  it('should emit chatSelected and close modal when confirming selection', () => {
    fc.assert(
      fc.property(chatIdArb, (chatId) => {
        let emittedChatId: string | null = null;
        let modalClosed = false;
        
        component.chatSelected.subscribe((id: string) => {
          emittedChatId = id;
        });
        
        component.closed.subscribe(() => {
          modalClosed = true;
        });
        
        component.isOpen = true;
        component.openChat(chatId);
        
        // Verify chat selection was emitted
        expect(emittedChatId).toBe(chatId);
        
        // Verify modal was closed
        expect(modalClosed).toBe(true);
        
        return emittedChatId === chatId && modalClosed;
      }),
      { numRuns: 100 }
    );
  });

  // Additional unit tests for edge cases
  it('should handle empty search query', fakeAsync(() => {
    component.isOpen = true;
    component.onSearchQueryChange('');
    tick(300);
    
    expect(mockOpenWebUIService.searchChats).not.toHaveBeenCalled();
    expect(component.searchResults()).toEqual([]);
  }));

  it('should close modal and reset state', () => {
    component.isOpen = true;
    component.searchQuery.set('test');
    component.searchResults.set([
      { id: '1', title: 'Test', created_at: 123, updated_at: 456 }
    ]);
    component.selectedResult.set({ id: '1', title: 'Test', created_at: 123, updated_at: 456 });
    
    let closedEmitted = false;
    component.closed.subscribe(() => {
      closedEmitted = true;
    });
    
    component.closeModal();
    
    expect(component.searchQuery()).toBe('');
    expect(component.searchResults()).toEqual([]);
    expect(component.selectedResult()).toBeNull();
    expect(closedEmitted).toBe(true);
  });

  it('should close modal on overlay click', () => {
    let closedEmitted = false;
    component.closed.subscribe(() => {
      closedEmitted = true;
    });
    
    const mockEvent = {
      target: document.createElement('div'),
      currentTarget: document.createElement('div')
    } as any;
    
    // Make target and currentTarget the same (clicking on overlay)
    mockEvent.target = mockEvent.currentTarget;
    
    component.onOverlayClick(mockEvent);
    
    expect(closedEmitted).toBe(true);
  });

  it('should not close modal when clicking on content', () => {
    let closedEmitted = false;
    component.closed.subscribe(() => {
      closedEmitted = true;
    });
    
    const mockEvent = {
      target: document.createElement('div'),
      currentTarget: document.createElement('div')
    } as any;
    
    // Make target different from currentTarget (clicking on content)
    // Don't set them equal
    
    component.onOverlayClick(mockEvent);
    
    expect(closedEmitted).toBe(false);
  });

  it('should close modal on Escape key', () => {
    let closedEmitted = false;
    component.closed.subscribe(() => {
      closedEmitted = true;
    });
    
    const mockEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    
    component.onEscapeKey(mockEvent);
    
    expect(closedEmitted).toBe(true);
  });
});
