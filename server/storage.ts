import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  conversations,
  messages,
  type User,
  type InsertUser,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { email?: string }): Promise<User>;

  createConversation(data: InsertConversation): Promise<Conversation>;
  getConversation(id: number): Promise<Conversation | undefined>;
  getUserConversations(userId: string): Promise<Conversation[]>;
  updateConversation(id: number, updates: Partial<Pick<Conversation, "title">>): Promise<Conversation | undefined>;
  deleteConversation(id: number): Promise<boolean>;
  duplicateConversation(id: number): Promise<Conversation | undefined>;

  createMessage(data: InsertMessage): Promise<Message>;
  getConversationMessages(conversationId: number): Promise<Message[]>;
  saveMessages(conversationId: number, msgs: { role: string; content: string }[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser & { email?: string }): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createConversation(data: InsertConversation): Promise<Conversation> {
    const [convo] = await db.insert(conversations).values(data).returning();
    return convo;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [convo] = await db.select().from(conversations).where(eq(conversations.id, id));
    return convo;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    return db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async updateConversation(id: number, updates: Partial<Pick<Conversation, "title">>): Promise<Conversation | undefined> {
    const [convo] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return convo;
  }

  async deleteConversation(id: number): Promise<boolean> {
    const result = await db.delete(conversations).where(eq(conversations.id, id)).returning();
    return result.length > 0;
  }

  async duplicateConversation(id: number): Promise<Conversation | undefined> {
    const original = await this.getConversation(id);
    if (!original) return undefined;

    const [newConvo] = await db
      .insert(conversations)
      .values({
        userId: original.userId,
        title: `${original.title} (copy)`,
        agentId: original.agentId,
      })
      .returning();

    const originalMessages = await this.getConversationMessages(id);
    if (originalMessages.length > 0) {
      await db.insert(messages).values(
        originalMessages.map((m) => ({
          conversationId: newConvo.id,
          role: m.role,
          content: m.content,
        }))
      );
    }

    return newConvo;
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(messages).values(data).returning();
    return msg;
  }

  async getConversationMessages(conversationId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async saveMessages(conversationId: number, msgs: { role: string; content: string }[]): Promise<void> {
    await db.delete(messages).where(eq(messages.conversationId, conversationId));
    if (msgs.length > 0) {
      await db.insert(messages).values(
        msgs.map((m) => ({
          conversationId,
          role: m.role,
          content: m.content,
        }))
      );
    }
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));
  }
}

export const storage = new DatabaseStorage();
