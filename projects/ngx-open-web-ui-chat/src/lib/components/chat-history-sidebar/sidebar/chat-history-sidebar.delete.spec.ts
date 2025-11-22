import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatHistorySidebarComponent } from './chat-history-sidebar.component';
import { OpenWebUIService } from '../../../services/openwebui-api';
import { of, throwError } from 'rxjs';
import { ChatHistoryItem } from '../../../models/chat.model';

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
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('handleDeleteChat', () => {
    const mockChats: ChatHistoryItem[] = [
      { id: 'chat-1', title: 'Chat 1', created_at: 1000, updated_at: 1000, pinned: false },
      { id: 'chat-2', title: 'Chat 2', created_at: 2000, updated_at: 2000, pinned: false },
      { id: 'chat-3', title: 'Chat 3', created_at: 3000, updated_at: 3000, pinned: true }
    ];

    beforeEach(() => {
      component.chats = [...mockChats];
      jest.spyOn(window, 'confirm').mockReturnValue(true);
    });

    it('should show confirmation dialog before deleting', () => {
      (mockOpenWebUIService.deleteChat as jest.Mock).mockReturnValue(of(void 0));
      
      component.handleDeleteChat('chat-1');
      
      expect(window.confirm).toHaveBeenCalled();
    });

    it('should not delete if user cancels confirmation', () => {
      (window.confirm as jest.Mock).mockReturnValue(false);
      
      component.handleDeleteChat('chat-1');
      
      expect(mockOpenWebUIService.deleteChat).not.toHaveBeenCalled();
    });

    it('should call deleteChat API with correct chat ID', () => {
      (mockOpenWebUIService.deleteChat as jest.Mock).mockReturnValue(of(void 0));
      
      component.handleDeleteChat('chat-2');
      
      expect(mockOpenWebUIService.deleteChat).toHaveBeenCalledWith('chat-2');
    });

    it('should emit contextMenuAction when delete is initiated', () => {
      (mockOpenWebUIService.deleteChat as jest.Mock).mockReturnValue(of(void 0));
      jest.spyOn(component.contextMenuAction, 'emit');
      
      component.handleDeleteChat('chat-1');
      
      expect(component.contextMenuAction.emit).toHaveBeenCalledWith({
        action: 'delete',
        chatId: 'chat-1'
      });
    });

    it('should remove deleted chat from list on success', (done) => {
      (mockOpenWebUIService.deleteChat as jest.Mock).mockReturnValue(of(void 0));
      
      component.chatsUpdated.subscribe((updatedChats) => {
        expect(updatedChats.length).toBe(2);
        expect(updatedChats.find(c => c.id === 'chat-2')).toBeUndefined();
        expect(updatedChats.find(c => c.id === 'chat-1')).toBeTruthy();
        expect(updatedChats.find(c => c.id === 'chat-3')).toBeTruthy();
        done();
      });
      
      component.handleDeleteChat('chat-2');
    });

    it('should emit empty string to clear active chat if deleted chat was active', (done) => {
      (mockOpenWebUIService.deleteChat as jest.Mock).mockReturnValue(of(void 0));
      component.currentChatId = 'chat-1';
      
      component.chatSelected.subscribe((chatId) => {
        expect(chatId).toBe('');
        done();
      });
      
      component.handleDeleteChat('chat-1');
    });

    it('should not emit chatSelected if deleted chat was not active', () => {
      (mockOpenWebUIService.deleteChat as jest.Mock).mockReturnValue(of(void 0));
      component.currentChatId = 'chat-1';
      jest.spyOn(component.chatSelected, 'emit');
      
      component.handleDeleteChat('chat-2');
      
      expect(component.chatSelected.emit).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', () => {
      const error = new Error('Delete failed');
      (mockOpenWebUIService.deleteChat as jest.Mock).mockReturnValue(throwError(() => error));
      jest.spyOn(window, 'alert').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();
      
      component.handleDeleteChat('chat-1');
      
      expect(console.error).toHaveBeenCalledWith('Failed to delete chat:', error);
      expect(window.alert).toHaveBeenCalled();
    });

    it('should preserve other chats when one is deleted', (done) => {
      (mockOpenWebUIService.deleteChat as jest.Mock).mockReturnValue(of(void 0));
      
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
      
      component.handleDeleteChat('chat-2');
    });
  });
});
