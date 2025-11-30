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
  folder_id?: string | null;
}

export interface ChatListResponse {
  chats: ChatHistoryItem[];
  page: number;
  total: number;
  hasMore: boolean;
}

export interface ChatContextAction {
  action: 'pin' | 'unpin' | 'delete' | 'rename' | 'export' | 'move';
  chatId: string;
  data?: any;
  targetFolderId?: string | null;
}

export interface ChatContextMenuEvent {
  chat: ChatHistoryItem;
  mouseEvent: MouseEvent;
}

export type ExportFormat = 'json' | 'txt' | 'pdf';

// Folder interfaces
export interface FolderData {
  system_prompt?: string;
  files?: any[];
}

export interface FolderItem {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  items: string[];
  meta: {
    description: string;
    tags: string[];
  };
  data: {
    system_prompt?: string;
    files: any[];
  };
  created_at: number;
  updated_at: number;
  is_expanded?: boolean;
  chats?: ChatHistoryItem[];
}

export type FolderContextAction = 'create' | 'delete' | 'rename' | 'move';

export interface FolderContextMenuEvent {
  folder: FolderItem;
  action: FolderContextAction;
  mouseEvent: MouseEvent;
}

export interface FolderListResponse {
  folders: FolderItem[];
  page?: number;
  total?: number;
  hasMore?: boolean;
}

// Note interfaces
export interface NoteContent {
  md: string;       // Markdown format
  html: string;     // HTML format
  json: any | null; // ProseMirror JSON format
}

export interface NoteData {
  content: NoteContent;
  files?: any[];
}

export interface NoteItem {
  id: string;
  user_id: string;
  title: string;
  data: NoteData;
  meta: any | null;
  access_control: Record<string, any>;
  created_at: number;
  updated_at: number;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    profile_image_url: string;
  };
}

export type NoteContextAction = 'delete' | 'open';

export interface NoteContextMenuEvent {
  note: NoteItem;
  action: NoteContextAction;
  mouseEvent: MouseEvent;
}

