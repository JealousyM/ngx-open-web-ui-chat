import { ComponentFixture, TestBed } from '@angular/core/testing';

import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MarkdownModule } from 'ngx-markdown';
import { OpenWebUIService } from '../../services/openwebui-api';
import { OpenwebuiChatComponent } from '../openwebui-chat';

describe('OpenwebuiChatComponent - New Chat Functionality', () => {
  let component: OpenwebuiChatComponent;
  let fixture: ComponentFixture<OpenwebuiChatComponent>;
  let openWebUIService: jest.Mocked<OpenWebUIService>;

  beforeEach(async () => {
    const serviceMock = {
      configure: jest.fn(),
      createNewChat: jest.fn(),
      sendMessage: jest.fn(),
      stopGeneration: jest.fn()
    } as any;

    await TestBed.configureTestingModule({
      imports: [OpenwebuiChatComponent, MarkdownModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OpenWebUIService, useValue: serviceMock }
      ]
    }).compileComponents();

    openWebUIService = TestBed.inject(OpenWebUIService) as jest.Mocked<OpenWebUIService>;
    fixture = TestBed.createComponent(OpenwebuiChatComponent);
    component = fixture.componentInstance;

    // Set required inputs
    component.modelId = 'test-model';
    component.apiKey = 'test-key';
    component.endpoint = 'http://test.com';
  });

  describe('createNewChat', () => {
    it('should create a new chat with empty message list', (done) => {
      // Arrange
      const mockSession = { id: 'new-chat-123', created_at: Date.now() };
      openWebUIService.createNewChat.mockReturnValue(of(mockSession));

      // Set some existing messages
      component.messages.set([
        { role: 'user', content: 'Hello', timestamp: new Date() },
        { role: 'assistant', content: 'Hi there', timestamp: new Date() }
      ]);

      // Act
      component.createNewChat();

      // Assert
      setTimeout(() => {
        expect(openWebUIService.createNewChat).toHaveBeenCalled();
        expect(component.messages().length).toBe(0);
        expect(component['chatId']).toBe('new-chat-123');
        done();
      }, 10);
    });

    it('should emit newChatCreated event with chat ID', (done) => {
      // Arrange
      const mockSession = { id: 'new-chat-456', created_at: Date.now() };
      openWebUIService.createNewChat.mockReturnValue(of(mockSession));

      let emittedChatId: string | undefined;
      component.newChatCreated.subscribe((chatId) => {
        emittedChatId = chatId;
      });

      // Act
      component.createNewChat();

      // Assert
      setTimeout(() => {
        expect(emittedChatId).toBe('new-chat-456');
        done();
      }, 10);
    });

    it('should emit messagesChanged event with 0 count', (done) => {
      // Arrange
      const mockSession = { id: 'new-chat-789', created_at: Date.now() };
      openWebUIService.createNewChat.mockReturnValue(of(mockSession));

      let emittedCount: number | undefined;
      component.messagesChanged.subscribe((count) => {
        emittedCount = count;
      });

      // Set some existing messages
      component.messages.set([
        { role: 'user', content: 'Test', timestamp: new Date() }
      ]);

      // Act
      component.createNewChat();

      // Assert
      setTimeout(() => {
        expect(emittedCount).toBe(0);
        done();
      }, 10);
    });

    it('should set new chat as active conversation', (done) => {
      // Arrange
      const mockSession = { id: 'active-chat-123', created_at: Date.now() };
      openWebUIService.createNewChat.mockReturnValue(of(mockSession));

      const previousChatId = 'old-chat-id';
      component['chatId'] = previousChatId;

      // Act
      component.createNewChat();

      // Assert
      setTimeout(() => {
        expect(component['chatId']).toBe('active-chat-123');
        expect(component['chatId']).not.toBe(previousChatId);
        done();
      }, 10);
    });

    it('should clear conversation area when new chat is created', (done) => {
      // Arrange
      const mockSession = { id: 'clear-chat-123', created_at: Date.now() };
      openWebUIService.createNewChat.mockReturnValue(of(mockSession));

      // Set multiple messages
      component.messages.set([
        { role: 'user', content: 'Message 1', timestamp: new Date() },
        { role: 'assistant', content: 'Response 1', timestamp: new Date() },
        { role: 'user', content: 'Message 2', timestamp: new Date() },
        { role: 'assistant', content: 'Response 2', timestamp: new Date() }
      ]);

      const previousMessageCount = component.messages().length;
      expect(previousMessageCount).toBeGreaterThan(0);

      // Act
      component.createNewChat();

      // Assert
      setTimeout(() => {
        expect(component.messages().length).toBe(0);
        done();
      }, 10);
    });

    it('should handle errors gracefully', (done) => {
      // Arrange
      const error = new Error('Failed to create chat');
      openWebUIService.createNewChat.mockReturnValue(throwError(() => error));

      component.debug = true;
      jest.spyOn(console, 'error').mockImplementation();

      // Act
      component.createNewChat();

      // Assert
      setTimeout(() => {
        expect(console.error).toHaveBeenCalledWith(
          '[OpenWebUI] Failed to create new chat:',
          error
        );
        done();
      }, 10);
    });
  });

  describe('handleNewChatRequest', () => {
    it('should call createNewChat when handling new chat request', () => {
      // Arrange
      jest.spyOn(component, 'createNewChat').mockImplementation();

      // Act
      component.handleNewChatRequest();

      // Assert
      expect(component.createNewChat).toHaveBeenCalled();
    });
  });

  describe('history input property', () => {
    it('should default to false', () => {
      // Assert
      expect(component.history).toBe(false);
    });

    it('should accept true value', () => {
      // Act
      component.history = true;

      // Assert
      expect(component.history).toBe(true);
    });
  });
});
