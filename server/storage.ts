import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  conversations,
  messages,
  userSettings,
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

  getUserSettings(userId: string): Promise<Record<string, string>>;
  setUserSetting(userId: string, key: string, value: string): Promise<void>;
  deleteUserSetting(userId: string, key: string): Promise<void>;
  getUserAnalytics(userId: string): Promise<{
    totalProjects: number;
    totalMessages: number;
    agentUsage: Record<string, number>;
    recentActivity: { date: string; count: number }[];
  }>;
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
    await db.transaction(async (tx) => {
      await tx.delete(messages).where(eq(messages.conversationId, conversationId));
      if (msgs.length > 0) {
        await tx.insert(messages).values(
          msgs.map((m) => ({
            conversationId,
            role: m.role,
            content: m.content,
          }))
        );
      }
      await tx
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
    });
  }

  async getUserSettings(userId: string): Promise<Record<string, string>> {
    const rows = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }

  async setUserSetting(userId: string, key: string, value: string): Promise<void> {
    const existing = await db
      .select()
      .from(userSettings)
      .where(and(eq(userSettings.userId, userId), eq(userSettings.key, key)));

    if (existing.length > 0) {
      await db
        .update(userSettings)
        .set({ value, updatedAt: new Date() })
        .where(and(eq(userSettings.userId, userId), eq(userSettings.key, key)));
    } else {
      await db.insert(userSettings).values({ userId, key, value });
    }
  }

  async deleteUserSetting(userId: string, key: string): Promise<void> {
    await db
      .delete(userSettings)
      .where(and(eq(userSettings.userId, userId), eq(userSettings.key, key)));
  }

  async getUserAnalytics(userId: string): Promise<{
    totalProjects: number;
    totalMessages: number;
    agentUsage: Record<string, number>;
    recentActivity: { date: string; count: number }[];
  }> {
    const userConvos = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId));

    const totalProjects = userConvos.length;

    const agentUsage: Record<string, number> = {};
    for (const c of userConvos) {
      agentUsage[c.agentId] = (agentUsage[c.agentId] || 0) + 1;
    }

    let totalMessages = 0;
    if (totalProjects > 0) {
      const convoIds = userConvos.map((c) => c.id);
      for (const cid of convoIds) {
        const msgs = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, cid));
        totalMessages += msgs.length;
      }
    }

    const activityMap: Record<string, number> = {};
    for (const c of userConvos) {
      const dateKey = c.updatedAt.toISOString().split('T')[0];
      activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;
    }
    const recentActivity = Object.entries(activityMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 14)
      .map(([date, count]) => ({ date, count }));

    return { totalProjects, totalMessages, agentUsage, recentActivity };
  }
}

export const storage = new DatabaseStorage();
