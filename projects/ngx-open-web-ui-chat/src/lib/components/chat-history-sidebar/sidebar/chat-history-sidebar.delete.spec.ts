import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatHistorySidebarComponent } from './chat-history-sidebar.component';
import { OpenWebUIService } from '../../../services/openwebui-api';
import { of, throwError } from 'rxjs';
import { ChatHistoryItem } from '../../../models/chat.model';
import { translations } from '../../../i18n/translations';

describe('ChatHistorySidebarComponent - Delete Functionality', () => {
  let component: ChatHistorySidebarComponent;
  let fixture: ComponentFixture<ChatHistorySidebarComponent>;
  let mockOpenWebUIService: Partial<OpenWebUIService>;

  beforeEach(async () => {
    mockOpenWebUIService = {
      deleteChat: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ChatHistorySidebarComponent],
      providers: [
        { provide: OpenWebUIService, useValue: mockOpenWebUIService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatHistorySidebarComponent);
    component = fixture.componentInstance;
    component.translations = translations.en; // Set translations
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('handleDeleteChat', () => {
    it('should set chatToDelete and show confirmation dialog', () => {
      const chat: ChatHistoryItem = { 
        id: 'chat-1', 
        title: 'Chat 1', 
        created_at: 1000, 
        updated_at: 1000, 
        pinned: false 
      };
      component.chats = [chat];
      
      component.handleDeleteChat('chat-1');
      
      expect(component.chatToDelete()).toEqual(chat);
      expect(component.showDeleteConfirm()).toBe(true);
    });

    it('should do nothing if chat ID is not found', () => {
      component.chats = [];
      
      component.handleDeleteChat('non-existent');
      
      expect(component.chatToDelete()).toBeNull();
      expect(component.showDeleteConfirm()).toBe(false);
    });
  });

  describe('onDeleteConfirmed', () => {
    const mockChats: ChatHistoryItem[] = [
      { id: 'chat-1', title: 'Chat 1', created_at: 1000, updated_at: 1000, pinned: false },
      { id: 'chat-2', title: 'Chat 2', created_at: 2000, updated_at: 2000, pinned: false },
      { id: 'chat-3', title: 'Chat 3', created_at: 3000, updated_at: 3000, pinned: true }
    ];

    beforeEach(() => {
      component.chats = [...mockChats];
    });

    it('should call deleteChat API with correct chat ID', (done) => {
      (mockOpenWebUIService.deleteChat as jest.Mock).mockReturnValue(of(void 0));
      component.chatToDelete.set(mockChats[1]); // Chat 2
      
      component.chatsUpdated.subscribe((updatedChats) => {
        expect(mockOpenWebUIService.deleteChat).toHaveBeenCalledWith('chat-2');
        done();
      });
      
      component.onDeleteConfirmed();
    });

    it('should emit contextMenuAction when delete is confirmed', () => {
      (mockOpenWebUIService.deleteChat as jest.Mock).mockReturnValue(of(void 0));
      component.chatToDelete.set(mockChats[0]);
      jest.spyOn(component.contextMenuAction, 'emit');
      
      component.onDeleteConfirmed();
      
      expect(component.contextMenuAction.emit).toHaveBeenCalledWith({
        action: 'delete',
        chatId: 'chat-1'
      });
    });

    it('should remove deleted chat from list on success', (done) => {
      (mockOpenWebUIService.deleteChat as jest.Mock).mockReturnValue(of(void 0));
      component.chatToDelete.set(mockChats[1]); // Chat 2
      
      component.chatsUpdated.subscribe((updatedChats) => {
        expect(updatedChats.length).toBe(2);
        expect(updatedChats.find(c => c.id === 'chat-2')).toBeUndefined();
        expect(updatedChats.find(c => c.id === 'chat-1')).toBeTruthy();
        expect(updatedChats.find(c => c.id === 'chat-3')).toBeTruthy();
        done();
      });
      
      component.onDeleteConfirmed();
    });

    it('should emit empty string to clear active chat if deleted chat was active', (done) => {
      (mockOpenWebUIService.deleteChat as jest.Mock).mockReturnValue(of(void 0));
      component.currentChatId = 'chat-1';
      component.chatToDelete.set(mockChats[0]);
      
      component.chatSelected.subscribe((chatId) => {
        expect(chatId).toBe('');
        done();
      });
      
      component.onDeleteConfirmed();
    });

    it('should not emit chatSelected if deleted chat was not active', (done) => {
      (mockOpenWebUIService.deleteChat as jest.Mock).mockReturnValue(of(void 0));
      component.currentChatId = 'chat-1';
      component.chatToDelete.set(mockChats[1]); // Delete chat-2
      jest.spyOn(component.chatSelected, 'emit');
      
      // Wait for deletion to complete
      component.chatsUpdated.subscribe(() => {
        expect(component.chatSelected.emit).not.toHaveBeenCalled();
        done();
      });
      
      component.onDeleteConfirmed();
    });

    it('should handle API errors gracefully', (done) => {
      const error = new Error('Delete failed');
      (mockOpenWebUIService.deleteChat as jest.Mock).mockReturnValue(throwError(() => error));
      component.chatToDelete.set(mockChats[0]);
      
      jest.spyOn(window, 'alert').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();
      
      // Since error doesn't emit to chatsUpdated, we need to wait differently
      setTimeout(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to delete chat:', error);
        expect(window.alert).toHaveBeenCalled();
        done();
      }, 100);
      
      component.onDeleteConfirmed();
    });

    it('should preserve other chats when one is deleted', (done) => {
      (mockOpenWebUIService.deleteChat as jest.Mock).mockReturnValue(of(void 0));
      component.chatToDelete.set(mockChats[1]); // Delete chat-2
      
      component.chatsUpdated.subscribe((updatedChats) => {
        // Verify the deleted chat is gone
        expect(updatedChats.find(c => c.id === 'chat-2')).toBeUndefined();
        
        // Verify other chats are preserved with correct data
        const chat1 = updatedChats.find(c => c.id === 'chat-1');
        const chat3 = updatedChats.find(c => c.id === 'chat-3');
        
        expect(chat1).toEqual(mockChats[0]);
        expect(chat3).toEqual(mockChats[2]);
        done();
      });
      
      component.onDeleteConfirmed();
    });

    it('should do nothing if chatToDelete is null', () => {
      component.chatToDelete.set(null);
      
      component.onDeleteConfirmed();
      
      expect(mockOpenWebUIService.deleteChat).not.toHaveBeenCalled();
    });

    it('should reset confirmation dialog state', (done) => {
      (mockOpenWebUIService.deleteChat as jest.Mock).mockReturnValue(of(void 0));
      component.chatToDelete.set(mockChats[0]);
      component.showDeleteConfirm.set(true);
      
      component.chatsUpdated.subscribe(() => {
        expect(component.showDeleteConfirm()).toBe(false);
        expect(component.chatToDelete()).toBeNull();
        done();
      });
      
      component.onDeleteConfirmed();
    });
  });

  describe('onDeleteCancelled', () => {
    it('should reset confirmation dialog state', () => {
      const chat: ChatHistoryItem = { 
        id: 'chat-1', 
        title: 'Chat 1', 
        created_at: 1000, 
        updated_at: 1000, 
        pinned: false 
      };
      component.chatToDelete.set(chat);
      component.showDeleteConfirm.set(true);
      
      component.onDeleteCancelled();
      
      expect(component.showDeleteConfirm()).toBe(false);
      expect(component.chatToDelete()).toBeNull();
    });
  });
});
