import { Injectable, signal } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { lexer } from 'marked';
import { ChatSession, OpenWebUIChatConfig, Model, ChatHistoryItem, ChatListResponse, FolderItem, FolderListResponse, NoteItem } from '../models/chat.model';

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
  private messageStream$?: ReplaySubject<string>;
  private abortController?: AbortController;
  private currentChatId?: string;
  private currentSessionId?: string;
  private currentTaskId?: string;
  private currentMessageId?: string;
  
  private socket?: Socket;
  private socketConnected = signal<boolean>(false);
  private maxReconnectAttempts = 3;
  
  private lastContent: string = '';
  private currentMessages: Array<{ role: string; content: string; id?: string; timestamp?: number }> = [];
  private isCompletionFinalized = false; // ИСПРАВЛЕНИЕ: Флаг для предотвращения повторных вызовов

  private models: Model[] = [];

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
      '{{USER_NAME}}': 'admin',
      '{{USER_LOCATION}}': 'Unknown',
      '{{CURRENT_DATETIME}}': `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
      '{{CURRENT_DATE}}': now.toISOString().slice(0, 10),
      '{{CURRENT_TIME}}': now.toTimeString().slice(0, 8),
      '{{CURRENT_WEEKDAY}}': weekdays[now.getDay()],
      '{{CURRENT_TIMEZONE}}': Intl.DateTimeFormat().resolvedOptions().timeZone,
      '{{USER_LANGUAGE}}': navigator.language
    };
  }

  private connectSocketIO(): Promise<void> {
    return new Promise((resolve, reject) => {
      const configEndpoint = this.config()?.endpoint?.replace(/\/$/, '');
      const endpoint = configEndpoint || window.location.origin;
      
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

        this.socket.on('events', (event: ChatEvent) => {
          this.handleChatEvent(event);
        });


      } catch (error) {
        this.debugLog('Failed to create Socket.IO connection:', error);
        reject(error);
      }
    });
  }

  private handleChatEvent(event: ChatEvent): void {    
    this.debugLog('=== Chat event received ===');
    this.debugLog('Event chat_id:', event.chat_id, 'Current chat_id:', this.currentChatId);
    this.debugLog('Event message_id:', event.message_id, 'Current message_id:', this.currentMessageId);
    this.debugLog('Event type:', event.data?.type);

    if (event.chat_id && this.currentChatId && event.chat_id !== this.currentChatId) {
      this.debugLog('⚠️ Event for different chat, ignoring');
      return;
    }

    if (event.message_id && this.currentMessageId && 
        event.message_id !== this.currentMessageId) {
      this.debugLog('⚠️ Event message_id mismatch but processing anyway');
    }

    const type = event.data?.type;
    const data = event.data?.data;

    this.debugLog('✅ Processing event type:', type);
    this.debugLog('Event data keys:', data ? Object.keys(data) : 'null');
    if (data) {
      this.debugLog('Event data:', JSON.stringify(data, null, 2).substring(0, 500));
    }

    switch (type) {
      case 'chat:completion':
        this.debugLog('→ Handling chat:completion');
        this.handleCompletionEvent(data);
        break;

      case 'status':
        this.debugLog('→ Status update:', data?.action, 'done:', data?.done);
        if (data?.done && data?.status === 'complete') {
          this.debugLog('→ Status indicates completion');
          this.finalizeCompletion();
        }
        break;

      default:
        this.debugLog('→ Other event type:', type);
        break;
    }
  }

  private handleCompletionEvent(data: any): void {
    const { done, choices, content, error, usage, sources, title } = data;

    if (error) {
      this.messageStream$?.error(new Error(error));
      return;
    }

    if (choices && choices.length > 0) {
      const choice = choices[0];
      
      if (choice.delta?.content) {
        const deltaContent = choice.delta.content;
        this.messageStream$?.next(deltaContent);
        this.lastContent += deltaContent;
      } 
      
    }

    if (content && typeof content === 'string') {
      const delta = content.substring(this.lastContent.length);
      if (delta) {
        this.messageStream$?.next(delta);
        this.lastContent = content;
      }
    }

    const hasFinishReason = choices && choices[0]?.finish_reason === 'stop';
    const hasContent = this.lastContent.length > 0;
    
    const isFinished = (hasFinishReason && hasContent) ||
                      done || 
                      (title && done);
    
    if (isFinished) { 
      this.finalizeCompletion();
    }
  }

  private finalizeCompletion(): void {
    if (this.isCompletionFinalized) {
      this.debugLog('⚠️ Completion already finalized, skipping duplicate call');
      return;
    }
    
    this.debugLog('✅ Finalizing completion (content length:', this.lastContent.length, ')');
    this.isCompletionFinalized = true; // Устанавливаем флаг
    
    if ((this as any).streamTimeout) {
      clearTimeout((this as any).streamTimeout);
      (this as any).streamTimeout = undefined;
    }
    
    if (this.lastContent) {
      const messageExists = this.currentMessages.some(msg => msg.id === this.currentMessageId);
      
      if (!messageExists) {
        this.currentMessages.push({
          id: this.currentMessageId,
          role: 'assistant',
          content: this.lastContent,
          timestamp: Math.floor(Date.now() / 1000)
        });
        
        this.debugLog('Added assistant message to history');
      } else {
        this.debugLog('Assistant message already exists in history, skipping');
      }
    }
    
    this.completeChatMessage()
      .then(() => {
        this.debugLog('✅ Chat completion sent successfully');
      })
      .catch(error => {
        this.debugLog('Failed to send chat completion:', error);
      });
    
    this.currentTaskId = undefined;
    this.messageStream$?.complete();
    this.debugLog('Stream completed');
  }

  private async completeChatMessage(): Promise<void> {
    if (!this.currentChatId || !this.currentMessageId || this.currentMessages.length === 0) {
      this.debugLog('Skipping chat completion: missing required data');
      return;
    }

    await this.updateChatSession();    
    await this.sendCompletionFinalization();
  }

  private async sendCompletionFinalization(): Promise<void> {
    if (!this.currentChatId || !this.currentMessageId || !this.lastContent) {
      this.debugLog('Skipping completion finalization: missing required data');
      return;
    }

    const endpoint = this.config()?.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/chat/completed`;
    
    const sessionId = this.socket?.id || this.currentSessionId;
    
    const messages = this.currentMessages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp
    }));
    
    let modelItem: any;
    try {
      modelItem = await this.getModelById(this.config()!.modelId);
    } catch (error) {
      this.debugLog('Could not fetch model_item for completion:', error);
      modelItem = { id: this.config()?.modelId, name: this.config()?.modelId };
    }
    
    const payload = {
      id: this.currentMessageId,
      chat_id: this.currentChatId,
      session_id: sessionId,
      messages: messages,
      model: this.config()?.modelId,
      model_item: modelItem
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config()?.apiKey}`,
          'Cookie': `token=${this.config()?.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        this.debugLog('Completion finalization response error:', response.status);
        const errorText = await response.text();
        this.debugLog('Error details:', errorText);
      } else {
        this.debugLog('✅ Completion finalization sent successfully');
        const data = await response.json();
        this.debugLog('Finalization response:', data);
      }
    } catch (error) {
      this.debugLog('Error sending completion finalization:', error);
    }
  }

  private async updateChatSession(): Promise<void> {
    if (!this.currentChatId) {
      this.debugLog('No chat ID for update');
      return;
    }

    const endpoint = this.config()?.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/chats/${this.currentChatId}`;
    
    const uniqueMessages = this.currentMessages.filter((msg, index, self) => 
      index === self.findIndex(m => m.id === msg.id)
    );
        
    const messages: any[] = [];
    const historyMessages: any = {};
    
    let currentParentId: string | null = null;
    
    for (let i = 0; i < uniqueMessages.length; i++) {
      const msg = uniqueMessages[i];
      const messageId = msg.id || this.generateUUID();
      const nextMessageId = i < uniqueMessages.length - 1 
        ? (uniqueMessages[i + 1].id || this.generateUUID()) 
        : null;
      
      const messageData: any = {
        id: messageId,
        parentId: currentParentId,
        childrenIds: nextMessageId ? [nextMessageId] : [],
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || Math.floor(Date.now() / 1000)
      };
      
      if (msg.role === 'user') {
        messageData.models = [this.config()?.modelId];
      } else if (msg.role === 'assistant') {
        messageData.model = this.config()?.modelId;
        messageData.modelName = this.config()?.modelId;
        messageData.modelIdx = 0;
        messageData.done = true;
      }
      
      messages.push(messageData);
      historyMessages[messageId] = { ...messageData };
      currentParentId = messageId;
    }
    
    const payload = {
      chat: {
        models: [this.config()?.modelId],
        messages: messages,
        history: {
          messages: historyMessages,
          currentId: messages.length > 0 ? messages[messages.length - 1].id : null
        },
        params: {},
        files: []
      }
    };

    this.debugLog('Updating chat session:', this.currentChatId);
    this.debugLog('Payload:', JSON.stringify(payload, null, 2).substring(0, 500));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config()?.apiKey}`,
          'Cookie': `token=${this.config()?.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        this.debugLog('Chat update response error:', response.status);
        const errorText = await response.text();
        this.debugLog('Error details:', errorText);
      } else {
        this.debugLog('✅ Chat session updated successfully');
        const data = await response.json();
        this.debugLog('Updated chat:', data);
      }
    } catch (error) {
      this.debugLog('Error updating chat session:', error);
    }
  }

  private disconnectSocketIO(): void {
    if (this.socket) {
      this.debugLog('Disconnecting Socket.IO');
      this.socket.off('events');
      this.socket.disconnect();
      this.socket = undefined;
      this.socketConnected.set(false);
    }
  }

  configure(config: OpenWebUIChatConfig): void {
    this.config.set(config);

    if (!this.socket) {
      this.connectSocketIO().catch(error => {
        this.debugLog('Failed to connect Socket.IO:', error);
      });
    }
  }

  public createNewChat(): Observable<ChatSession> {
    this.debugLog('Creating new chat session');
    this.currentSessionId = this.generateUUID();
    const endpoint = this.config()?.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/chats/new`;
    
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
        }
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

  public sendMessage(message: string, chatId?: string, conversationHistory?: Array<{ role: string; content: string; id?: string; timestamp?: number }>, files?: any[]): Observable<string> {
    this.debugLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.debugLog('📤 Sending message:', message);
    this.debugLog('Files attached:', files?.length || 0);
    this.debugLog('Socket.IO connected:', this.socketConnected());
    
    this.abortController = new AbortController();
    this.currentChatId = chatId;
    this.currentMessageId = this.generateUUID();
    this.lastContent = '';
    this.isCompletionFinalized = false;
    
    (this as any).streamTimeout = setTimeout(() => {
      if (this.messageStream$ && !this.messageStream$.closed) {
        this.finalizeCompletion();
      }
    }, 60000);
    
    this.debugLog('Generated message_id for response:', this.currentMessageId);
    
    this.messageStream$ = new ReplaySubject<string>(1000);
    
    if (this.socket && this.socketConnected()) {
      this.socket.emit('user-join', {
        auth: {
          token: this.config()?.apiKey
        }
      });
    }
    
    const endpoint = this.config()?.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/chat/completions`;
    
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const userMessageId = this.generateUUID();
    
    this.currentMessages = conversationHistory && conversationHistory.length > 0 
      ? conversationHistory.map(msg => ({
          ...msg,
          id: msg.id || this.generateUUID(),
          timestamp: msg.timestamp || currentTimestamp
        }))
      : [];
    
    this.currentMessages.push({
      id: userMessageId,
      role: 'user',
      content: message,
      timestamp: currentTimestamp
    });
    
    const messages = conversationHistory && conversationHistory.length > 0 
      ? [...conversationHistory, { role: 'user', content: message }]
      : [{ role: 'user', content: message }];
    
    const sessionId = this.socket?.id || this.currentSessionId;
    
    const request: any = {
      stream: true,
      model: this.config()!.modelId,
      messages,
      params: {},
      tool_servers: [],
      features: {
        image_generation: false,
        code_interpreter: false,
        web_search: false
      },
      variables: this.getCurrentDateTime()
    };

    if (chatId && sessionId) {
      request.session_id = sessionId;
      request.chat_id = chatId;
      request.id = this.currentMessageId;
      request.background_tasks = {
      };
      
      this.debugLog('Request with Socket.IO session:', sessionId);

      if (!this.socket || !this.socketConnected()) {
        this.debugLog('Socket.IO not connected, trying to connect...');
        this.connectSocketIO().catch(error => {
          this.debugLog('Failed to connect Socket.IO:', error);
        });
      }
    }

    if (files && files.length > 0) {
      const filesData = files.map(file => ({
        type: "file",
        file: {
          id: file.id,
          user_id: file.user_id || "user",
          hash: file.hash || null,
          filename: file.filename || file.name,
          data: file.data || { status: "uploaded" },
          meta: file.meta || {
            name: file.filename || file.name,
            content_type: file.content_type || "application/octet-stream",
            size: file.size || 0,
            data: {}
          },
          created_at: file.created_at || Math.floor(Date.now() / 1000),
          updated_at: file.updated_at || Math.floor(Date.now() / 1000),
          status: file.status !== undefined ? file.status : true,
          path: file.path || "",
          access_control: file.access_control || null
        },
        id: file.id,
        url: file.url || `/api/v1/files/${file.id}`,
        name: file.filename || file.name,
        status: "uploaded",
        size: file.size || 0,
        error: file.error || "",
        itemId: file.itemId || this.generateUUID()
      }));
      
      request.files = filesData;
                  
      this.getModelById(this.config()!.modelId)
        .then(modelData => {
          request.model_item = modelData;
          this.updateChatBeforeCompletion().then(() => {
            this.sendCompletionRequest(url, request);
          });
        })
        .catch(err => {
          this.updateChatBeforeCompletion().then(() => {
            this.sendCompletionRequest(url, request);
          });
        });
    } else {
      this.updateChatBeforeCompletion().then(() => {
        this.sendCompletionRequest(url, request);
      });
    }
    
    return this.messageStream$.asObservable();
  }

  private async updateChatBeforeCompletion(): Promise<void> {
    await this.updateChatSession();
  }

  private async sendCompletionRequest(url: string, request: any): Promise<void> {    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config()?.apiKey}`,
          'Cookie': `token=${this.config()?.apiKey}`
        },
        body: JSON.stringify(request),
        signal: this.abortController?.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[OpenWebUI] ❌ Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status && data.task_id) {
        this.currentTaskId = data.task_id;
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('[OpenWebUI] Request aborted by user');
        this.messageStream$?.complete();
      } else {
        console.error('[OpenWebUI] ❌ Fetch error:', error);
        this.messageStream$?.error(error);
      }
    }
  }

  private debugLog(...args: any[]): void {
    if (this.config()?.debug) {
      console.log('[OpenWebUI]', ...args);
    }
  }

  public getMessageStream(): Observable<string> {
    if (!this.messageStream$) {
      this.messageStream$ = new ReplaySubject<string>(1000);
    }
    return this.messageStream$.asObservable();
  }

  public generateEphemeralCompletion(prompt: string): Observable<string> {
    this.debugLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.debugLog('📤 Generating ephemeral completion:', prompt);
    
    const stream$ = new ReplaySubject<string>(1000);
    const abortController = new AbortController();
    
    const endpoint = this.config()?.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/chat/completions`;
    
    const request: any = {
      stream: true,
      model: this.config()!.modelId,
      messages: [{ role: 'user', content: prompt }],
      params: {},
      features: {
        image_generation: false,
        code_interpreter: false,
        web_search: false
      }
    };

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config()?.apiKey}`,
        'Cookie': `token=${this.config()?.apiKey}`
      },
      body: JSON.stringify(request),
      signal: abortController.signal
    }).then(async response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is null');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.choices && data.choices[0]?.delta?.content) {
                stream$.next(data.choices[0].delta.content);
              }
            } catch (e) {
              // Ignore parse errors for partial chunks
            }
          }
        }
      }
      stream$.complete();
    }).catch(error => {
      stream$.error(error);
    });

    return stream$.asObservable();
  }

  public async stopGeneration(): Promise<void> {
    this.debugLog('Stopping generation');
    
    if ((this as any).streamTimeout) {
      clearTimeout((this as any).streamTimeout);
      (this as any).streamTimeout = undefined;
    }
    
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
    
    if (this.currentTaskId) {
      try {
        const endpoint = this.config()?.endpoint?.replace(/\/$/, '') || '';
        const stopUrl = `${endpoint}/api/tasks/stop/${this.currentTaskId}`;
        this.debugLog('Stopping task via API:', stopUrl);
        
        const stopResponse = await fetch(stopUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config()?.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        this.debugLog('Stop task response:', stopResponse.status);
        
        this.currentTaskId = undefined;
      } catch (error) {
        this.debugLog('Error stopping task:', error);
      }
    }
    
    this.lastContent = '';
    
    if (this.messageStream$) {
      this.messageStream$.complete();
    }
  }

  public async getModels(): Promise<any> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Fetching models list');
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/models`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cfg.apiKey}`,
        'Content-Type': 'application/json',
        'Cookie': `token=${cfg.apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    this.debugLog('Models fetched:', data);
    return data;
  }

  public async getModelById(modelId: string): Promise<any> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Fetching model by id:', modelId);
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/models`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        }
      });
      
      if (!response.ok) {
        this.debugLog('Model not found, returning minimal info');
        return { id: modelId, name: modelId };
      }
      
      this.models = (await response.json()).data;
      const data = this.models.find((model: Model) => model.id === modelId);
      this.debugLog('Model fetched');
      return data;
    } catch (error) {
      this.debugLog('Error fetching model:', error);
      return { id: modelId, name: modelId };
    }
  }

  public async getChatById(chatId: string): Promise<any> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Fetching chat by id:', chatId);
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/chats/${chatId}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        }
      });
      
      if (!response.ok) {
        this.debugLog('Chat not found');
        return null;
      }
      
      const data = await response.json();
      this.debugLog('Chat fetched');
      return data;
    } catch (error) {
      this.debugLog('Error fetching chat:', error);
      return null;
    }
  }

  public async uploadFile(file: File): Promise<any> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }
    
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/files/`;
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.apiKey}`,
        'Cookie': `token=${cfg.apiKey}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`File upload failed: ${response.status}`);
    }
    
    const uploadedFile = await response.json();
        
    try {
      const statusResponse = await this.checkFileStatus(uploadedFile.id, true);
      if (statusResponse?.error) {
        uploadedFile.error = statusResponse.error;
      }
    } catch (error) {
      console.error('[OpenWebUI] ⚠️ Could not check file processing status:', error);
    }
    
    return uploadedFile;
  }

  public async checkFileStatus(fileId: string, stream: boolean = true): Promise<any> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/files/${fileId}/process/status?stream=${stream}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cfg.apiKey}`,
        'Accept': 'application/json',
        'Cookie': `token=${cfg.apiKey}`
      }
    });
    
    if (!response.ok) {
      console.error('[OpenWebUI] ⚠️ Status check failed:', response.status);
      throw new Error(`File status check failed: ${response.status}`);
    }
    
    if (stream && response.body) {
      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader();
      
      let lastStatus: any = null;
      
      try {
        while (true) {
          const { value, done } = await reader.read();
          
          if (done) {
            break;
          }
          
          const lines = value.split('\n');
          
          for (const line of lines) {
            if (!line.trim()) continue;
                        
            if (line === 'data: [DONE]') {
              return lastStatus || { status: 'completed' };
            }
            
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.replace(/^data: /, ''));
                
                lastStatus = data;
                
                if (data.error) {
                  return { ...data, error: data.error };
                }
                
              } catch (parseError) {
                console.error('[OpenWebUI] ⚠️ Could not parse SSE data:', parseError);
              }
            }
          }
        }
      } catch (streamError) {
        console.error('[OpenWebUI] ⚠️ Stream reading error:', streamError);
      } finally {
        reader.releaseLock();
      }
      
      return lastStatus || { status: 'unknown' };
    }
    
    const data = await response.json();
    return data;
  }

  public disconnect(): void {
    this.disconnectSocketIO();
    this.currentChatId = undefined;
    this.currentSessionId = undefined;
    this.currentTaskId = undefined;
    this.currentMessageId = undefined;
    this.lastContent = '';
    this.currentMessages = [];
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
    if (this.messageStream$) {
      this.messageStream$.complete();
      this.messageStream$ = undefined;
    }
  }

  public isSocketConnected(): boolean {
    return this.socketConnected();
  }

  public getSessionId(): string | undefined {
    return this.socket?.id;
  }

  public getCurrentMessageId(): string | undefined {
    return this.currentMessageId;
  }

  public continueResponse(messageId: string, currentContent: string, chatId?: string, conversationHistory?: Array<{ role: string; content: string; id?: string; timestamp?: number }>): Observable<string> {
    this.debugLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.debugLog('📤 Continuing response for message:', messageId);
    this.debugLog('Current content length:', currentContent.length);
    this.debugLog('Socket.IO connected:', this.socketConnected());
    
    this.abortController = new AbortController();
    this.currentChatId = chatId;
    this.currentMessageId = messageId;
    this.lastContent = '';
    this.isCompletionFinalized = false;
    
    (this as any).streamTimeout = setTimeout(() => {
      if (this.messageStream$ && !this.messageStream$.closed) {
        this.finalizeCompletion();
      }
    }, 60000);
    
    this.debugLog('Reusing message_id for continuation:', this.currentMessageId);
    
    this.messageStream$ = new ReplaySubject<string>(1000);
    
    if (this.socket && this.socketConnected()) {
      this.socket.emit('user-join', {
        auth: {
          token: this.config()?.apiKey
        }
      });
    }
    
    const endpoint = this.config()?.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/chat/completions`;
    
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    this.currentMessages = conversationHistory && conversationHistory.length > 0 
      ? conversationHistory.map(msg => ({
          ...msg,
          id: msg.id || this.generateUUID(),
          timestamp: msg.timestamp || currentTimestamp
        }))
      : [];
    
    const messages = conversationHistory && conversationHistory.length > 0 
      ? conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      : [];
    
    const sessionId = this.socket?.id || this.currentSessionId;
    
    const request: any = {
      stream: true,
      model: this.config()!.modelId,
      messages,
      params: {},
      tool_servers: [],
      features: {
        image_generation: false,
        code_interpreter: false,
        web_search: false
      },
      variables: this.getCurrentDateTime()
    };

    if (chatId && sessionId) {
      request.session_id = sessionId;
      request.chat_id = chatId;
      request.id = this.currentMessageId;
      request.background_tasks = {};
      
      this.debugLog('Request with Socket.IO session:', sessionId);

      if (!this.socket || !this.socketConnected()) {
        this.debugLog('Socket.IO not connected, trying to connect...');
        this.connectSocketIO().catch(error => {
          this.debugLog('Failed to connect Socket.IO:', error);
        });
      }
    }

    this.sendCompletionRequest(url, request);
    
    return this.messageStream$.asObservable();
  }

  public async sendInitialRating(
    messageId: string,
    rating: 1 | -1,
    chatId?: string,
    messages?: Array<{ role: string; content: string; id?: string; timestamp?: number | Date; rating?: any }>
  ): Promise<string | null> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    if (!chatId) {
      this.debugLog('No chat ID provided for initial rating');
      return null;
    }

    this.debugLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.debugLog('⭐ Sending initial rating for message:', messageId);
    this.debugLog('Rating value:', rating);
    this.debugLog('Chat ID:', chatId);

    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const feedbackUrl = `${endpoint}/api/v1/evaluations/feedback`;

    let chatSnapshot: any;
    try {
      chatSnapshot = await this.getChatById(chatId);
    } catch (error) {
      this.debugLog('Could not fetch chat for snapshot:', error);
      chatSnapshot = null;
    }

    const messageIndex = messages?.findIndex(m => m.id === messageId) ?? -1;

    let modelItem: any;
    try {
      modelItem = await this.getModelById(cfg.modelId);
    } catch (error) {
      this.debugLog('Could not fetch model_item for rating:', error);
      modelItem = null;
    }

    const ratingPayload = {
      type: 'rating',
      data: {
        rating: rating,
        model_id: cfg.modelId
      },
      meta: {
        model_id: cfg.modelId,
        message_id: messageId,
        message_index: messageIndex,
        chat_id: chatId,
        base_models: modelItem ? { [cfg.modelId]: modelItem } : { [cfg.modelId]: null }
      },
      snapshot: chatSnapshot ? { chat: chatSnapshot } : {
        messages: messages || [],
        model: cfg.modelId
      }
    };

    this.debugLog('Initial rating payload:', JSON.stringify(ratingPayload, null, 2).substring(0, 500));

    try {
      const response = await fetch(feedbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Cookie': `token=${cfg.apiKey}`
        },
        body: JSON.stringify(ratingPayload)
      });

      if (!response.ok) {
        this.debugLog('Initial rating submission failed:', response.status);
        const errorText = await response.text();
        this.debugLog('Error details:', errorText);
        return null;
      }

      this.debugLog('✅ Initial rating submitted successfully');
      const responseData = await response.json();
      this.debugLog('Initial rating response:', responseData);

      const feedbackId = responseData.id;

      await this.updateChatSessionWithRating(chatId, messages, messageId, rating, [], '', rating === 1 ? 8 : 2);

      return feedbackId;
    } catch (error) {
      this.debugLog('Error sending initial rating:', error);
      return null;
    }
  }

  public async getSuggestedTags(
    messageId: string,
    chatId?: string
  ): Promise<string[] | null> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    if (!chatId) {
      this.debugLog('No chat ID provided for tags');
      return null;
    }

    this.debugLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.debugLog('🏷️ Getting suggested tags for message:', messageId);

    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const tagsUrl = `${endpoint}/api/v1/tasks/tags/completions`;

    try {
      const response = await fetch(tagsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Cookie': `token=${cfg.apiKey}`
        },
        body: JSON.stringify({
          message_id: messageId,
          chat_id: chatId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        
        if (errorData?.detail === 'Tags generation is disabled') {
          this.debugLog('⚠️ Tags generation is disabled');
          return [];
        }
        
        this.debugLog('Tags request failed:', response.status);
        return [];
      }

      const data = await response.json();
      this.debugLog('✅ Suggested tags received:', data);

      const tags = data.tags || [];
      return tags;
    } catch (error) {
      this.debugLog('Error getting suggested tags:', error);
      return [];
    }
  }

  public async updateRating(
    feedbackId: string | undefined,
    rating: 1 | -1,
    chatId?: string,
    messages?: Array<{ role: string; content: string; id?: string; timestamp?: number | Date; rating?: any }>,
    tags?: string[],
    comment?: string,
    detailedRating?: number,
    messageId?: string
  ): Promise<boolean> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    if (!chatId) {
      this.debugLog('No chat ID provided for rating update');
      return false;
    }

    this.debugLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.debugLog('⭐ Updating rating with feedback ID:', feedbackId);
    this.debugLog('Message ID:', messageId);
    this.debugLog('Rating value:', rating);
    this.debugLog('Detailed rating:', detailedRating);
    this.debugLog('Tags:', tags);
    this.debugLog('Comment:', comment);

    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const feedbackUrl = `${endpoint}/api/v1/evaluations/feedback/${feedbackId}`;

    let chatSnapshot: any;
    try {
      chatSnapshot = await this.getChatById(chatId);
    } catch (error) {
      this.debugLog('Could not fetch chat for snapshot:', error);
      chatSnapshot = null;
    }

    const searchId = messageId || feedbackId;
    const messageIndex = messages?.findIndex(m => m.id === searchId) ?? -1;

    let modelItem: any;
    try {
      modelItem = await this.getModelById(cfg.modelId);
    } catch (error) {
      this.debugLog('Could not fetch model_item for rating:', error);
      modelItem = null;
    }

    const ratingPayload = {
      type: 'rating',
      data: {
        rating: rating,
        tags: tags || [],
        reason: tags ? tags.join(', ') : '',
        comment: comment || '',
        details: {
          rating: detailedRating !== undefined ? detailedRating : rating
        },
        model_id: cfg.modelId
      },
      meta: {
        model_id: cfg.modelId,
        message_id: searchId,
        message_index: messageIndex,
        chat_id: chatId,
        base_models: modelItem ? { [cfg.modelId]: modelItem } : { [cfg.modelId]: null }
      },
      snapshot: chatSnapshot ? { chat: chatSnapshot } : {
        messages: messages || [],
        model: cfg.modelId
      }
    };

    this.debugLog('Rating update payload:', JSON.stringify(ratingPayload, null, 2).substring(0, 500));

    try {
      const response = await fetch(feedbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Cookie': `token=${cfg.apiKey}`
        },
        body: JSON.stringify(ratingPayload)
      });

      if (!response.ok) {
        this.debugLog('Rating update failed:', response.status);
        const errorText = await response.text();
        this.debugLog('Error details:', errorText);
        return false;
      }

      this.debugLog('✅ Rating updated successfully');
      const responseData = await response.json();
      this.debugLog('Rating update response:', responseData);

      if (searchId) {
        await this.updateChatSessionWithRating(chatId, messages, searchId, rating, tags, comment, detailedRating);
      }

      return true;
    } catch (error) {
      this.debugLog('Error updating rating:', error);
      return false;
    }
  }

  public async rateResponse(
    messageId: string,
    rating: 1 | -1,
    chatId?: string,
    messages?: Array<{ role: string; content: string; id?: string; timestamp?: number | Date; rating?: any }>,
    tags?: string[],
    comment?: string,
    detailedRating?: number
  ): Promise<boolean> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    if (!chatId) {
      this.debugLog('No chat ID provided for rating');
      return false;
    }

    this.debugLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.debugLog('⭐ Submitting rating for message:', messageId);
    this.debugLog('Rating value:', rating);
    this.debugLog('Detailed rating:', detailedRating);
    this.debugLog('Chat ID:', chatId);

    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const feedbackUrl = `${endpoint}/api/v1/evaluations/feedback/${messageId}`;

    let chatSnapshot: any;
    try {
      chatSnapshot = await this.getChatById(chatId);
    } catch (error) {
      this.debugLog('Could not fetch chat for snapshot:', error);
      chatSnapshot = null;
    }

    const messageIndex = messages?.findIndex(m => m.id === messageId) ?? -1;

    let modelItem: any;
    try {
      modelItem = await this.getModelById(cfg.modelId);
    } catch (error) {
      this.debugLog('Could not fetch model_item for rating:', error);
      modelItem = { id: cfg.modelId, name: cfg.modelId };
    }

    const ratingPayload = {
      type: 'rating',
      data: {
        rating: rating,
        tags: tags || [],
        reason: tags ? tags.join(', ') : '',
        comment: comment || '',
        details: {
          rating: detailedRating !== undefined ? detailedRating : rating
        },
        model_id: cfg.modelId
      },
      meta: {
        model_id: cfg.modelId,
        message_id: messageId,
        message_index: messageIndex,
        chat_id: chatId,
        base_models: modelItem ? { [cfg.modelId]: modelItem } : {}
      },
      snapshot: chatSnapshot ? { chat: chatSnapshot } : {
        messages: messages || [],
        model: cfg.modelId
      }
    };

    this.debugLog('Rating payload:', JSON.stringify(ratingPayload, null, 2).substring(0, 500));

    try {
      const response = await fetch(feedbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Cookie': `token=${cfg.apiKey}`
        },
        body: JSON.stringify(ratingPayload)
      });

      if (!response.ok) {
        this.debugLog('Rating submission failed:', response.status);
        const errorText = await response.text();
        this.debugLog('Error details:', errorText);
        return false;
      }

      this.debugLog('✅ Rating submitted successfully');
      const responseData = await response.json();
      this.debugLog('Rating response:', responseData);

      await this.updateChatSessionWithRating(chatId, messages, messageId, rating, tags, comment, detailedRating);

      return true;
    } catch (error) {
      this.debugLog('Error submitting rating:', error);
      return false;
    }
  }

  private async updateChatSessionWithRating(
    chatId: string,
    messages: Array<{ role: string; content: string; id?: string; timestamp?: number | Date; rating?: any }> | undefined,
    ratedMessageId: string,
    rating: 1 | -1,
    tags?: string[],
    comment?: string,
    detailedRating?: number
  ): Promise<void> {
    if (!chatId || !messages) {
      this.debugLog('Missing chat ID or messages for rating update');
      return;
    }

    const cfg = this.config();
    if (!cfg) {
      return;
    }

    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/chats/${chatId}`;

    const uniqueMessages = messages.filter((msg, index, self) => 
      index === self.findIndex(m => m.id === msg.id)
    );

    const messagesData: any[] = [];
    const historyMessages: any = {};

    let currentParentId: string | null = null;

    for (let i = 0; i < uniqueMessages.length; i++) {
      const msg = uniqueMessages[i];
      const messageId = msg.id || this.generateUUID();
      const nextMessageId = i < uniqueMessages.length - 1 
        ? (uniqueMessages[i + 1].id || this.generateUUID()) 
        : null;

      const timestamp = msg.timestamp 
        ? (typeof msg.timestamp === 'number' ? msg.timestamp : Math.floor(msg.timestamp.getTime() / 1000))
        : Math.floor(Date.now() / 1000);

      const messageData: any = {
        id: messageId,
        parentId: currentParentId,
        childrenIds: nextMessageId ? [nextMessageId] : [],
        role: msg.role,
        content: msg.content,
        timestamp: timestamp
      };

      if (messageId === ratedMessageId) {
        messageData.annotation = {
          rating: rating,
          tags: tags || [],
          reason: tags ? tags.join(', ') : '',
          comment: comment || '',
          details: {
            rating: detailedRating !== undefined ? detailedRating : rating
          }
        };
      } else if (msg.rating) {
        messageData.annotation = {
          rating: msg.rating.rating,
          tags: msg.rating.tags || [],
          reason: msg.rating.reason || '',
          comment: msg.rating.comment || '',
          details: msg.rating.details || { rating: msg.rating.rating }
        };
      }

      if (msg.role === 'user') {
        messageData.models = [cfg.modelId];
      } else if (msg.role === 'assistant') {
        messageData.model = cfg.modelId;
        messageData.modelName = cfg.modelId;
        messageData.modelIdx = 0;
        messageData.done = true;
      }

      messagesData.push(messageData);
      historyMessages[messageId] = { ...messageData };
      currentParentId = messageId;
    }

    const payload = {
      chat: {
        models: [cfg.modelId],
        messages: messagesData,
        history: {
          messages: historyMessages,
          currentId: messagesData.length > 0 ? messagesData[messagesData.length - 1].id : null
        },
        params: {},
        files: []
      }
    };

    this.debugLog('Updating chat session with rating annotation');
    this.debugLog('Payload:', JSON.stringify(payload, null, 2).substring(0, 500));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Cookie': `token=${cfg.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        this.debugLog('Chat update with rating failed:', response.status);
        const errorText = await response.text();
        this.debugLog('Error details:', errorText);
      } else {
        this.debugLog('✅ Chat session updated with rating annotation');
        const data = await response.json();
        this.debugLog('Updated chat:', data);
      }
    } catch (error) {
      this.debugLog('Error updating chat session with rating:', error);
    }
  }

  public async transcribeAudio(audioBlob: Blob): Promise<string> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.debugLog('🎤 Transcribing audio');
    this.debugLog('Audio blob size:', audioBlob.size, 'bytes');
    this.debugLog('Audio blob type:', audioBlob.type);

    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/audio/transcriptions`;

    const formData = new FormData();
    const timestamp = Date.now();
    const filename = `Recording-${timestamp}.webm`;
    
    formData.append('file', audioBlob, filename);

    this.debugLog('Sending transcription request to:', url);
    this.debugLog('Filename:', filename);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Cookie': `token=${cfg.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        this.debugLog('Transcription request failed:', response.status);
        const errorText = await response.text();
        this.debugLog('Error details:', errorText);
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      this.debugLog('✅ Transcription successful');
      this.debugLog('Response data:', data);

      const transcribedText = data.text || '';
      this.debugLog('Transcribed text:', transcribedText);

      return transcribedText;
    } catch (error) {
      this.debugLog('Error transcribing audio:', error);
      throw error;
    }
  }

  // Chat History API Methods

  public getChats(page: number = 1): Observable<ChatListResponse> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Fetching chat list, page:', page);
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/chats?page=${page}`;

    return new Observable<ChatListResponse>(observer => {
      fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          this.debugLog('Chat list fetched:', data);
          const chats: ChatHistoryItem[] = Array.isArray(data) ? data : [];
          const response: ChatListResponse = {
            chats,
            page,
            total: chats.length,
            hasMore: chats.length > 0
          };
          observer.next(response);
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Get chats error:', error);
          observer.error(error);
        });
    });
  }

  public getPinnedChats(): Observable<ChatHistoryItem[]> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Fetching pinned chats');
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/chats/pinned`;

    return new Observable<ChatHistoryItem[]>(observer => {
      fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          this.debugLog('Pinned chats fetched:', data);
          const chats: ChatHistoryItem[] = Array.isArray(data) ? data : [];
          observer.next(chats);
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Get pinned chats error:', error);
          observer.error(error);
        });
    });
  }

  public searchChats(query: string): Observable<ChatHistoryItem[]> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Searching chats with query:', query);
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/chats/search?text=${encodeURIComponent(query)}`;

    return new Observable<ChatHistoryItem[]>(observer => {
      fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          this.debugLog('Search results:', data);
          const results: ChatHistoryItem[] = Array.isArray(data) ? data : [];
          observer.next(results);
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Search chats error:', error);
          observer.error(error);
        });
    });
  }

  public pinChat(chatId: string): Observable<void> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Pinning chat:', chatId);
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/chats/${chatId}/pin`;

    return new Observable<void>(observer => {
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          this.debugLog('Chat pinned successfully');
          observer.next();
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Pin chat error:', error);
          observer.error(error);
        });
    });
  }

  public unpinChat(chatId: string): Observable<void> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Unpinning chat:', chatId);
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/chats/${chatId}/pin`;

    return new Observable<void>(observer => {
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          this.debugLog('Chat unpinned successfully');
          observer.next();
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Unpin chat error:', error);
          observer.error(error);
        });
    });
  }

  // ===== Folder Management API Methods =====
  
  public getFolders(): Observable<FolderItem[]> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Fetching folders');
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/folders/`;

    return new Observable<FolderItem[]>(observer => {
      fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          this.debugLog('Folders fetched:', data);
          const folders: FolderItem[] = Array.isArray(data) ? data : [];
          observer.next(folders);
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Get folders error:', error);
          observer.error(error);
        });
    });
  }

  public createFolder(name: string, parent_id?: string | null): Observable<FolderItem> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Creating folder:', name, 'with parent:', parent_id);
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/folders/`;
    //, parent_id: parent_id
    //api/v1/folders/5c88f368-969e-4958-a32d-aa11601c62ab/update/parent
    //{"parent_id":"68072b88-a45a-4e45-a487-194ad32678d3"}
    //const updateParentUrl = `${endpoint}/api/v1/folders/${folderId}/update/parent`;

    return new Observable<FolderItem>(observer => {
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        },
        body: JSON.stringify({ name, parent_id: parent_id || null })
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          this.debugLog('Folder created:', data);
          
          if (parent_id) {
            const updateParentUrl = `${endpoint}/api/v1/folders/${data.id}/update/parent`;
            this.debugLog('Updating folder parent:', updateParentUrl);
            
            return fetch(updateParentUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${cfg.apiKey}`,
                'Content-Type': 'application/json',
                'Cookie': `token=${cfg.apiKey}`
              },
              body: JSON.stringify({ parent_id: parent_id })
            })
            .then(res => {
              if (!res.ok) {
                throw new Error(`Failed to update parent folder: ${res.status}`);
              }
              return res.json();
            })
            .then(updatedData => {
              this.debugLog('Folder parent updated:', updatedData);
              observer.next(updatedData as FolderItem);
              observer.complete();
            });
          } else {
            observer.next(data as FolderItem);
            observer.complete();
          }
        })
        .catch(error => {
          this.debugLog('Create folder error:', error);
          observer.error(error);
        });
    });
  }

  public renameFolder(folderId: string, newName: string): Observable<FolderItem> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Renaming folder:', folderId, 'to:', newName);
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/folders/${folderId}/update`;

    return new Observable<FolderItem>(observer => {
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        },
        body: JSON.stringify({ name: newName })
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          this.debugLog('Folder renamed:', data);
          observer.next(data as FolderItem);
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Rename folder error:', error);
          observer.error(error);
        });
    });
  }

  public moveFolder(folderId: string, newParentId: string | null): Observable<FolderItem> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Moving folder:', folderId, 'to parent:', newParentId);
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/folders/${folderId}/update`;

    return new Observable<FolderItem>(observer => {
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        },
        body: JSON.stringify({ parent_id: newParentId })
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          this.debugLog('Folder moved:', data);
          observer.next(data as FolderItem);
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Move folder error:', error);
          observer.error(error);
        });
    });
  }

  public deleteFolder(folderId: string): Observable<void> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Deleting folder:', folderId);
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/folders/${folderId}`;

    return new Observable<void>(observer => {
      fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          this.debugLog('Folder deleted successfully');
          observer.next();
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Delete folder error:', error);
          observer.error(error);
        });
    });
  }

  public moveChatToFolder(chatId: string, folderId: string | null): Observable<void> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Moving chat:', chatId, 'to folder:', folderId);
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/chats/${chatId}/folder`;

    return new Observable<void>(observer => {
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        },
        body: JSON.stringify({ folder_id: folderId })
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          this.debugLog('Chat moved to folder successfully');
          observer.next();
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Move chat to folder error:', error);
          observer.error(error);
        });
    });
  }

  public getChatsInFolder(folderId: string, page: number = 1): Observable<ChatHistoryItem[]> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Fetching chats in folder:', folderId, 'page:', page);
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/chats/folder/${folderId}/list?page=${page}`;

    return new Observable<ChatHistoryItem[]>(observer => {
      fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          this.debugLog('Chats in folder fetched:', data);
          const chats: ChatHistoryItem[] = Array.isArray(data) ? data : [];
          observer.next(chats);
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Get chats in folder error:', error);
          observer.error(error);
        });
    });
  }

  /**
   * Toggle folder expanded state
   */
  public toggleFolderExpanded(folderId: string, isExpanded: boolean): Observable<void> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Toggling folder expanded:', folderId, 'to:', isExpanded);
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/folders/${folderId}/update/expanded`;

    return new Observable<void>(observer => {
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        },
        body: JSON.stringify({ is_expanded: isExpanded })
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          this.debugLog('Folder expanded state toggled successfully');
          observer.next();
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Toggle folder expanded error:', error);
          observer.error(error);
        });
    });
  }

  // ===== End Folder Management API Methods =====


  public deleteChat(chatId: string): Observable<void> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Deleting chat:', chatId);
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/chats/${chatId}`;

    return new Observable<void>(observer => {
      fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          this.debugLog('Chat deleted successfully');
          observer.next();
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Delete chat error:', error);
          observer.error(error);
        });
    });
  }

  public renameChat(chatId: string, newTitle: string): Observable<void> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Renaming chat:', chatId, 'to:', newTitle);
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/chats/${chatId}`;

    return new Observable<void>(observer => {
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        },
        body: JSON.stringify({
          chat: {
            title: newTitle
          }
        })
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          this.debugLog('Chat renamed successfully');
          observer.next();
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Rename chat error:', error);
          observer.error(error);
        });
    });
  }

  public loadChatById(chatId: string): Observable<ChatSession> {
    return new Observable<ChatSession>(observer => {
      this.getChatById(chatId)
        .then(data => {
          if (!data) {
            throw new Error('Chat not found');
          }
          
          const chatSession: ChatSession = {
            id: data.id,
            title: data.title,
            created_at: data.created_at,
            updated_at: data.updated_at
          };
          
          if (data.chat?.history?.messages) {
            const messagesObj = data.chat.history.messages;
            const messagesArray = Object.values(messagesObj);
            (chatSession as any).messages = messagesArray;
          }
          
          observer.next(chatSession);
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Load chat error:', error);
          observer.error(error);
        });
    });
  }

  public async exportChatAsJson(chatId: string): Promise<Blob> {
    const chat = await this.getChatById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }
    const jsonString = JSON.stringify(chat, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  public async exportChatAsTxt(chatId: string): Promise<Blob> {
    const chat = await this.getChatById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }
    
    let textContent = `Chat: ${chat.title || 'Untitled'}\n`;
    textContent += `Created: ${new Date(chat.created_at * 1000).toLocaleString()}\n\n`;
    
    if (chat.chat?.messages && Array.isArray(chat.chat.messages)) {
      const messages = chat.chat.messages;
      for (const msg of messages as any[]) {
        textContent += `${msg.role.toUpperCase()}: ${msg.content}\n\n`;
      }
    } else {
      console.warn('[Export] No messages found in chat.chat.messages');
    }
    
    return new Blob([textContent], { type: 'text/plain' });
  }

  public async exportChatAsPdf(chatId: string): Promise<Blob> {
    const chat = await this.getChatById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }
    
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    try {
      const fonts = [
        { url: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf', name: 'Roboto-Regular.ttf', style: 'normal' },
        { url: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf', name: 'Roboto-Medium.ttf', style: 'bold' }
      ];

      for (const font of fonts) {
        const response = await fetch(font.url);
        if (response.ok) {
          const blob = await response.blob();
          const reader = new FileReader();
          await new Promise((resolve, reject) => {
            reader.onloadend = () => {
              const base64data = reader.result as string;
              const base64 = base64data.split(',')[1] || base64data;
              doc.addFileToVFS(font.name, base64);
              doc.addFont(font.name, 'Roboto', font.style);
              resolve(null);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      }
      doc.setFont('Roboto', 'normal');
    } catch (e) {
      console.error('Error loading fonts:', e);
    }
    
    doc.setFontSize(16);
    doc.setFont('Roboto', 'bold');
    doc.text(chat.title || 'Untitled Chat', 10, 10);
    
    doc.setFontSize(10);
    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    doc.text(`Created: ${new Date(chat.created_at * 1000).toLocaleString()}`, 10, 20);
    
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = 30;

    const checkPageBreak = (height: number) => {
      if (yPosition + height > pageHeight - 10) {
        doc.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    const renderMarkdown = (text: string) => {
      const tokens = lexer(text);
      
      for (const token of tokens) {
        if (token.type === 'heading') {
          const fontSize = 16 - (token.depth - 1) * 2;
          doc.setFontSize(Math.max(10, fontSize));
          doc.setFont('Roboto', 'bold');
          
          const lines = doc.splitTextToSize(token.text, maxWidth);
          checkPageBreak(lines.length * fontSize * 0.5 + 5);
          
          for (const line of lines) {
            doc.text(line, margin, yPosition);
            yPosition += fontSize * 0.5;
          }
          yPosition += 5;
        } 
        else if (token.type === 'paragraph' || token.type === 'text') {
          doc.setFontSize(10);
          
          if (token.tokens) {
            let x = margin;
            const lineHeight = 5;
            
            for (const inline of token.tokens) {
               if (inline.type === 'strong') {
                 doc.setFont('Roboto', 'bold');
               } else {
                 doc.setFont('Roboto', 'normal');
               }
               
               const text = 'text' in inline ? (inline as any).text : '';
               if (!text) continue;

               const words = text.split(/(\s+)/);
               
               for (const word of words) {
                 const wordWidth = doc.getTextWidth(word);
                 
                 if (x + wordWidth > margin + maxWidth) {
                   yPosition += lineHeight;
                   x = margin;
                   checkPageBreak(lineHeight);
                 }
                 
                 doc.text(word, x, yPosition);
                 x += wordWidth;
               }
            }
            yPosition += lineHeight * 1.5;
            checkPageBreak(lineHeight);
            x = margin;
          } else {
             doc.setFont('Roboto', 'normal');
             const lines = doc.splitTextToSize(token.text, maxWidth);
             checkPageBreak(lines.length * 5 + 5);
             doc.text(lines, margin, yPosition);
             yPosition += lines.length * 5 + 5;
          }
        }
        else if (token.type === 'list') {
           doc.setFontSize(10);
           doc.setFont('Roboto', 'normal');
           
           for (const item of token.items) {
             const bullet = '• ';
             const bulletWidth = doc.getTextWidth(bullet);
             
             const lines = doc.splitTextToSize(item.text, maxWidth - bulletWidth);
             checkPageBreak(lines.length * 5 + 2);
             
             doc.text(bullet, margin, yPosition);
             doc.text(lines, margin + bulletWidth, yPosition);
             yPosition += lines.length * 5 + 2;
           }
           yPosition += 3;
        }
        else if (token.type === 'code') {
           doc.setFontSize(9);
           doc.setFont('Courier', 'normal'); // Use Courier for code
           const lines = doc.splitTextToSize(token.text, maxWidth);
           checkPageBreak(lines.length * 4 + 5);
           
           for (const line of lines) {
             doc.text(line, margin, yPosition);
             yPosition += 4;
           }
           yPosition += 5;
           doc.setFont('Roboto', 'normal'); // Reset font
        }
      }
    };
    
    if (chat.chat?.messages && Array.isArray(chat.chat.messages)) {
      const messages = chat.chat.messages;
      for (const msg of messages as any[]) {
        checkPageBreak(20);
        
        doc.setFontSize(12);
        doc.setFont('Roboto', 'bold');
        doc.text(`${msg.role.toUpperCase()}:`, margin, yPosition);
        yPosition += 7;
        
        renderMarkdown(msg.content);
        
        yPosition += 5;
      }
    }
    
    return doc.output('blob');
  }

  /**
   * Get all notes for the authenticated user
   */
  public getNotes(): Observable<NoteItem[]> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Fetching notes');
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/notes/`;

    return new Observable<NoteItem[]>(observer => {
      fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          this.debugLog('Notes fetched:', data);
          const notes: NoteItem[] = Array.isArray(data) ? data : [];
          observer.next(notes);
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Get notes error:', error);
          observer.error(error);
        });
    });
  }

  /**
   * Get a specific note by ID
   */
  public getNoteById(id: string): Observable<NoteItem> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Fetching note by id:', id);
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/notes/${id}`;

    return new Observable<NoteItem>(observer => {
      fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          this.debugLog('Note fetched:', data);
          observer.next(data as NoteItem);
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Get note error:', error);
          observer.error(error);
        });
    });
  }

  /**
   * Create a new note
   */
  public createNote(title: string, content?: string): Observable<NoteItem> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Creating note:', title);
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/notes/create`;

    const noteData = {
      title,
      data: {
        content: {
          json: null,
          html: '',
          md: content || ''
        }
      },
      meta: null,
      access_control: {}
    };

    return new Observable<NoteItem>(observer => {
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        },
        body: JSON.stringify(noteData)
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          this.debugLog('Note created:', data);
          observer.next(data as NoteItem);
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Create note error:', error);
          observer.error(error);
        });
    });
  }

  /**
   * Update an existing note
   */
  public updateNote(id: string, title: string, content: string): Observable<NoteItem> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Updating note:', id);
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/notes/${id}/update`;

    const noteData = {
      title,
      data: {
        content: {
          md: content
        }
      }
    };

    return new Observable<NoteItem>(observer => {
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        },
        body: JSON.stringify(noteData)
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          this.debugLog('Note updated:', data);
          observer.next(data as NoteItem);
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Update note error:', error);
          observer.error(error);
        });
    });
  }

  /**
   * Delete a note by ID
   */
  public deleteNote(id: string): Observable<void> {
    const cfg = this.config();
    if (!cfg) {
      throw new Error('OpenWebUIService not configured');
    }

    this.debugLog('Deleting note:', id);
    const endpoint = cfg.endpoint?.replace(/\/$/, '') || '';
    const url = `${endpoint}/api/v1/notes/${id}/delete`;

    return new Observable<void>(observer => {
      fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${cfg.apiKey}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          this.debugLog('Note deleted successfully');
          observer.next();
          observer.complete();
        })
        .catch(error => {
          this.debugLog('Delete note error:', error);
          observer.error(error);
        });
    });
  }
}
