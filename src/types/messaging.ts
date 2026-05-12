export interface ChatThread {
  id: string;
  name: string;
  isPrivate: boolean;
  members: ChatMember[];
  lastMessage: string | null;
  lastMessageAt: Date;
}

export interface ChatMember {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  joinedAt: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date;
  sender: {
    name: string | null;
    avatar: string | null;
  };
}
