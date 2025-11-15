export interface ActiveQuiz {
  pollId: string;
  correctOptionIndex: number;
  chatId: string | number;
  answeredUsers: Set<number>;
  messageId?: number;
}

export interface ActivePoll {
  pollId: string;
  chatId: string | number;
  answeredUsers: Set<number>;
}

export interface ScheduledQuiz {
  id?: number;
  chatId: string | number;
  question: string;
  options: string[];
  correctOptionIndex: number;
  scheduledTime: Date;
  status: 'pending' | 'sent' | 'failed';
  createdAt?: Date;
}

export interface CreatePollDto {
  chatId: string | number;
  question: string;
  options: string[];
}

export interface MessageResult {
  chatId: string;
  success: boolean;
  message: string;
  error?: string;
}

export interface BulkMessageResponse {
  totalSent: number;
  totalFailed: number;
  results: MessageResult[];
  duration: number;
  failedChats: Array<{
    chatId: string;
    reason: string;
  }>;
}

export interface ImageResult {
  chatId: string;
  success: boolean;
  message: string;
  error?: string;
  data?: any;
}

export interface BulkImageResponse {
  totalSent: number;
  totalFailed: number;
  results: ImageResult[];
  duration: number;
  failedChats: Array<{
    chatId: string;
    reason: string;
  }>;
}

export interface MessageButton {
  text: string;
  url: string;
  isWebApp?: boolean;
}

export interface ScheduleQuizRequest {
  chatIds: (string | number)[];
  quizzes: {
    question: string;
    options: string[];
    correctOptionIndex: number;
  }[];
  startTime: Date;
  intervalMinutes: number;
}

export interface LeaderboardEntry {
  telegramId: string;
  firstName: string | null;
  points: number;
  rank: number;
}

export interface ChatInviteInfo {
  inviteLink: string;
  chatTitle?: string;
  chatType: string;
  chatId: string | number;
  name?: string;
  creator?: any;
  isPrimary?: boolean;
  isRevoked?: boolean;
  expireDate?: number;
  memberLimit?: number;
  pendingJoinRequestCount?: number;
}

export interface ChatInfo {
  id: number;
  type: string;
  title?: string;
  username?: string;
  description?: string;
  inviteLink?: string;
  memberCount?: number;
  botStatus?: string;
  canSendMessages?: boolean | null;
  botPermissions?: any;
  linkedChatId?: number;
  slowModeDelay?: number;
  stickerSetName?: string;
  canSetStickerSet?: boolean;
  location?: any;
}
