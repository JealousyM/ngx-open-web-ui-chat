export interface OpenWebUIChatConfig {
  modelId: string;
  apiKey: string;
  endpoint: string;
  style?: Partial<CSSStyleDeclaration>;
  debug?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id?: string;
  timestamp?: number | Date;
  files?: UploadedFile[];
  rating?: MessageRating;
}

export interface MessageRating {
  rating: 1 | -1;
  tags: string[];
  reason: string;
  comment: string;
  details: {
    rating: number;
  };
}

export interface RatingRequest {
  type: 'rating';
  data: {
    rating: 1 | -1;
    tags: string[];
    reason: string;
    comment: string;
    details: {
      rating: number;
    };
    model_id: string;
  };
  meta: {
    model_id: string;
    message_id: string;
    message_index: number;
    chat_id: string;
    base_models: Record<string, any>;
  };
  snapshot: any;
}

export interface UploadedFile {
  id: string;
  filename: string;
  user_id: string;
  hash?: string | null;
  data?: {
    status?: string;
    [key: string]: any;
  };
  meta?: {
    name: string;
    content_type: string;
    size: number;
    data?: Record<string, any>;
  };
  created_at?: number;
  updated_at?: number;
  status?: boolean;
  path?: string;
  access_control?: any;
}

export interface FileProcessStatus {
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
  error?: string;
}

export interface ChatSession {
  id: string;
  title?: string;
  created_at?: number;
  updated_at?: number;
  messages?: any[];
}

export interface ChatCompletionRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  chat_id?: string;
  id?: string; // message_id
  session_id?: string;
  params?: {
    stream_delta_chunk_size?: number;
    reasoning_tags?: any;
    function_calling?: 'native' | 'default';
    [key: string]: any;
  };
  tool_servers?: any[];
  features?: {
    image_generation?: boolean;
    code_interpreter?: boolean;
    web_search?: boolean;
    [key: string]: any;
  };
  variables?: Record<string, any>;
  model_item?: any;
  background_tasks?: {
    title_generation?: boolean;
    tags_generation?: boolean;
    follow_up_generation?: boolean;
    [key: string]: any;
  };
  tool_ids?: string[];
  filter_ids?: string[];
  files?: any;
}

export interface TaskResponse {
  status: boolean;
  task_id: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

export interface Model {
  id: string;
  name: string;
  object: string;
  created: number;
  owned_by: string;
  pipe: {
    type: string;
  };
  has_user_valves: boolean;
  actions: any[];
  filters: any[];
  tags: string[];
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  pinned?: boolean;
  preview?: string;
}

export interface ChatListResponse {
  chats: ChatHistoryItem[];
  page: number;
  total: number;
  hasMore: boolean;
}

export interface ChatContextAction {
  action: 'pin' | 'unpin' | 'delete' | 'rename' | 'export';
  chatId: string;
  data?: any;
}

export interface ChatContextMenuEvent {
  chat: ChatHistoryItem;
  mouseEvent: MouseEvent;
}

export type ExportFormat = 'json' | 'txt' | 'pdf';




