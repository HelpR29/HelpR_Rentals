interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'document_request' | 'system';
}

// Mock message storage (in production, use database)
export const mockMessages: { [chatId: string]: Message[] } = {};

// Track unread message notifications per user
export const unreadNotifications: { [userId: string]: number } = {};

// Clear storage on server restart for clean testing
console.log('🧹 Chat storage initialized and cleared for fresh testing');
