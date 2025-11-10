import { Injectable, signal } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ChatSession, OpenWebUIChatConfig, Model } from '../models/chat.model';

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
    // ИСПРАВЛЕНИЕ: Проверяем флаг чтобы избежать повторных вызовов
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
    this.isCompletionFinalized = false; // ИСПРАВЛЕНИЕ: Сбрасываем флаг для нового сообщения
    
    (this as any).streamTimeout = setTimeout(() => {
      if (this.messageStream$ && !this.messageStream$.closed) {
        this.finalizeCompletion();
      }
    }, 60000); // 60 секунд таймаут
    
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
        const stopUrl = `${endpoint}/api/tasks/${this.currentTaskId}/cancel`;
        this.debugLog('Stopping task via API:', stopUrl);
        
        const stopResponse = await fetch(stopUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config()?.apiKey}`,
            'Content-Type': 'application/json',
            'Cookie': `token=${this.config()?.apiKey}`
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
}
