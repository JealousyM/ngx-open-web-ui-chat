import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ChatSession, ChatCompletionRequest, OpenWebUIChatConfig, TaskResponse } from '../models/chat.model';

export interface ChatEvent {
  chat_id: string;
  message_id: string;
  data: {
    type: string;
    data?: any;
  };
}

@Injectable({ providedIn: 'root' })
export class OpenWebUIService {
  private config = signal<OpenWebUIChatConfig | undefined>(undefined);
  private messageStream$?: Subject<string>;
  private abortController?: AbortController;
  private currentChatId?: string;
  private currentSessionId?: string;
  private currentTaskId?: string;
  private currentMessageId?: string;
  
  private socket?: Socket;
  private socketConnected = signal<boolean>(false);
  private maxReconnectAttempts = 3;

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private getCurrentDateTime(): Record<string, string> {
    const now = new Date();
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return {
      '{{USER_NAME}}': 'User',
      '{{USER_LOCATION}}': 'Unknown',
      '{{CURRENT_DATETIME}}': now.toISOString().slice(0, 19).replace('T', ' '),
      '{{CURRENT_DATE}}': now.toISOString().slice(0, 10),
      '{{CURRENT_TIME}}': now.toTimeString().slice(0, 8),
      '{{CURRENT_WEEKDAY}}': weekdays[now.getDay()],
      '{{CURRENT_TIMEZONE}}': Intl.DateTimeFormat().resolvedOptions().timeZone,
      '{{USER_LANGUAGE}}': navigator.language
    };
  }

  private connectSocketIO(): Promise<void> {
    return new Promise((resolve, reject) => {
      const endpoint = this.config()?.endpoint?.replace(/\/$/, '');
      if (!endpoint) {
        reject(new Error('No endpoint configured'));
        return;
      }

      this.debugLog('Connecting to Socket.IO:', endpoint);

      try {
        this.socket = io(endpoint, {
          path: '/ws/socket.io',
          transports: ['websocket', 'polling'],
          auth: {
            token: this.config()?.apiKey
          },
          extraHeaders: {
            'Authorization': `Bearer ${this.config()?.apiKey}`
          },
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
          this.debugLog('Socket.IO connected, session_id:', this.socket?.id);
          this.socketConnected.set(true);
          this.currentSessionId = this.socket?.id;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          this.debugLog('Socket.IO disconnected:', reason);
          this.socketConnected.set(false);
        });

        this.socket.on('connect_error', (error) => {
          this.debugLog('Socket.IO connection error:', error);
          reject(error);
        });

        this.socket.on('chat-events', (event: ChatEvent) => {
          this.handleChatEvent(event);
        });

      } catch (error) {
        this.debugLog('Failed to create Socket.IO connection:', error);
        reject(error);
      }
    });
  }

  private handleChatEvent(event: ChatEvent): void {
    this.debugLog('Chat event received:', event);

    if (event.chat_id !== this.currentChatId) {
      this.debugLog('Event for different chat, ignoring');
      return;
    }

    if (event.message_id !== this.currentMessageId) {
      this.debugLog('Event for different message, ignoring');
      return;
    }

    const type = event.data?.type;
    const data = event.data?.data;

    this.debugLog('Processing event type:', type);

    switch (type) {
      case 'chat:completion':
        this.handleCompletionEvent(data);
        break;

      case 'chat:message:delta':
      case 'message':
        if (data?.content) {
          this.messageStream$?.next(data.content);
        }
        break;

      case 'chat:message':
      case 'replace':
        if (data?.content) {
          this.messageStream$?.next(data.content);
        }
        break;

      case 'status':
        this.debugLog('Status update:', data);
        break;

      default:
        this.debugLog('Unknown event type:', type, data);
    }
  }

  private handleCompletionEvent(data: any): void {
    const { done, choices, content, error, usage } = data;

    if (error) {
      this.debugLog('Completion error:', error);
      this.messageStream$?.error(new Error(error));
      return;
    }

    if (choices && choices[0]?.delta?.content) {
      this.messageStream$?.next(choices[0].delta.content);
    }

    if (content) {
      this.messageStream$?.next(content);
    }

    if (done) {
      this.debugLog('Chat completion done');
      if (usage) {
        this.debugLog('Token usage:', usage);
      }
      this.messageStream$?.complete();
      this.currentTaskId = undefined;
      this.currentMessageId = undefined;
    }
  }

  private disconnectSocketIO(): void {
    if (this.socket) {
      this.debugLog('Disconnecting Socket.IO');
      this.socket.off('chat-events');
      this.socket.disconnect();
      this.socket = undefined;
      this.socketConnected.set(false);
    }
  }

  configure(config: OpenWebUIChatConfig): void {
    this.config.set(config);
    if (config.debug) {
      console.log('[OpenWebUI] Service configured:', { ...config, apiKey: '***' });
    }

    if (!this.socket) {
      this.connectSocketIO().catch(error => {
        this.debugLog('Failed to connect Socket.IO:', error);
      });
    }
  }

  createNewChat(): Observable<ChatSession> {
    this.debugLog('Creating new chat session');
    this.currentSessionId = this.generateUUID();
    const url = `${this.config()?.endpoint?.replace(/\/$/, '')}/api/v1/chats/new`;
    
    return new Observable<ChatSession>(observer => {
      fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          chat:{
            models: [this.config()?.modelId],
          }
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config()?.apiKey}`
        },
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          this.currentChatId = data.id;
          this.debugLog('Chat session created:', data.id);
          observer.next(data as ChatSession);
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Create chat error:', error);
          observer.error(error);
        });
    });
  }

  sendMessage(message: string, chatId?: string, conversationHistory?: Array<{ role: string; content: string }>): Observable<string> {
    this.debugLog('Sending message:', message);
    
    this.abortController = new AbortController();
    this.currentChatId = chatId;
    this.currentMessageId = this.generateUUID();
    
    this.messageStream$ = new Subject<string>();
    
    const url = `${this.config()?.endpoint?.replace(/\/$/, '')}/api/chat/completions`;
    
    const messages = conversationHistory && conversationHistory.length > 0 
      ? [...conversationHistory, { role: 'user', content: message }]
      : [{ role: 'user', content: message }];
    
    const request: any = {
      model: this.config()!.modelId,
      messages,
      stream: true,
      params: {},
      tool_servers: [],
      features: {
        image_generation: false,
        code_interpreter: false,
        web_search: false
      },
      variables: this.getCurrentDateTime(),
      background_tasks: {
        title_generation: true,
        tags_generation: true,
        follow_up_generation: true
      }
    };

    if (chatId) {
      const sessionId = this.socket?.id || this.currentSessionId;
      
      if (sessionId) {
        request.session_id = sessionId;
        request.chat_id = chatId;
        request.id = this.currentMessageId;
        
        this.debugLog('Request with Socket.IO session:', {
          session_id: sessionId,
          chat_id: chatId,
          message_id: this.currentMessageId
        });

        if (!this.socket || !this.socketConnected()) {
          this.debugLog('Socket.IO not connected, trying to connect...');
          this.connectSocketIO().catch(error => {
            this.debugLog('Failed to connect Socket.IO, falling back to HTTP stream:', error);
          });
        }
      } else {
        this.debugLog('No Socket.IO session_id available, using HTTP stream mode');
      }
    }

    this.sendCompletionRequest(url, request);
    
    return this.messageStream$.asObservable();
  }

  private async sendCompletionRequest(url: string, request: any): Promise<void> {
    this.debugLog('Sending completion request:', JSON.stringify(request, null, 2));
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config()?.apiKey}`
        },
        body: JSON.stringify(request),
        signal: this.abortController?.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status && data.task_id) {
        this.currentTaskId = data.task_id;
        this.debugLog('Task created with ID:', data.task_id, '- waiting for Socket.IO events');
        
      } else {
        this.debugLog('No task_id received, might be sync mode or error:', data);
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        this.debugLog('Request aborted by user');
        this.messageStream$?.complete();
      } else {
        this.debugLog('Fetch error:', error);
        this.messageStream$?.error(error);
      }
    }
  }

  private debugLog(...args: any[]): void {
    if (this.config()?.debug) {
      console.log('[OpenWebUI]', ...args);
    }
  }

  getMessageStream(): Observable<string> {
    if (!this.messageStream$) {
      this.messageStream$ = new Subject<string>();
    }
    return this.messageStream$.asObservable();
  }

  async stopGeneration(): Promise<void> {
    this.debugLog('Stopping generation, chat_id:', this.currentChatId, 'task_id:', this.currentTaskId);
    
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
    
    if (this.currentTaskId) {
      try {
        const stopUrl = `${this.config()?.endpoint?.replace(/\/$/, '')}/api/tasks/stop/${this.currentTaskId}`;
        this.debugLog('Stopping task via API:', stopUrl);
        
        const stopResponse = await fetch(stopUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config()?.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        this.debugLog('Stop task response:', stopResponse.status, this.currentTaskId);
        
        if (!stopResponse.ok) {
          throw new Error(`Failed to stop task: ${stopResponse.status}`);
        }
        
        this.currentTaskId = undefined;
      } catch (error) {
        this.debugLog('Error stopping task:', error);
      }
    }
    
    this.currentChatId = undefined;
    this.currentMessageId = undefined;
    
    if (this.messageStream$) {
      this.messageStream$.complete();
    }
  }

  async getModels(): Promise<any> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Fetching models list');
    const url = `${cfg.endpoint?.replace(/\/$/, '')}/api/models`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cfg.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    this.debugLog('Models fetched:', data);
    return data;
  }

  disconnect(): void {
    this.disconnectSocketIO();
    this.currentChatId = undefined;
    this.currentSessionId = undefined;
    this.currentTaskId = undefined;
    this.currentMessageId = undefined;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
  }

  isSocketConnected(): boolean {
    return this.socketConnected();
  }

  getSessionId(): string | undefined {
    return this.socket?.id;
  }
}

