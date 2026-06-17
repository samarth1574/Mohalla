import { describe, it, expect } from 'vitest';
import type { HeatmapPoint, CategoryFilter } from '../heatmap';
import type { ChatThread, ChatMessage, ChatMember } from '../messaging';
import type { AnalyticsData, AuditLogEntry } from '../analytics';

describe('Type Definitions', () => {
  describe('Heatmap Types', () => {
    it('should allow valid HeatmapPoint objects', () => {
      const point: HeatmapPoint = {
        id: '1',
        title: 'Test Emergency',
        latitude: 28.5355,
        longitude: 77.3910,
        category: 'EMERGENCY'
      };
      expect(point).toBeDefined();
    });

    it('should allow valid CategoryFilter values', () => {
      const filters: CategoryFilter[] = ['ALL', 'EMERGENCY', 'SOCIETY', 'MARKETPLACE'];
      expect(filters.length).toBe(4);
    });
  });

  describe('Messaging Types', () => {
    it('should allow valid ChatMessage objects', () => {
      const message: ChatMessage = {
        id: '1',
        senderId: 'user1',
        content: 'Hello neighbor!',
        createdAt: new Date(),
        sender: {
          name: 'John Doe',
          avatar: null
        }
      };
      expect(message).toBeDefined();
    });

    it('should allow valid ChatThread objects', () => {
      const thread: ChatThread = {
        id: '1',
        name: 'Society Group',
        isPrivate: false,
        members: [],
        lastMessage: 'Last message',
        lastMessageAt: new Date()
      };
      expect(thread).toBeDefined();
    });

    it('should allow valid ChatMember objects', () => {
      const member: ChatMember = {
        id: '1',
        userId: 'user1',
        user: {
          id: 'user1',
          name: 'John Doe',
          avatar: null
        },
        joinedAt: new Date()
      };
      expect(member).toBeDefined();
    });
  });

  describe('Analytics Types', () => {
    it('should allow valid AnalyticsData objects', () => {
      const analytics: AnalyticsData = {
        dauCount: 100,
        mauCount: 500,
        sevenDayData: [
          { day: 'Mon', count: 50 },
          { day: 'Tue', count: 60 }
        ],
        contentSummary: {
          activeEmergencies: 5,
          availableListings: 20,
          openRequests: 10,
          activeLostItems: 3
        }
      };
      expect(analytics).toBeDefined();
    });

    it('should allow valid AuditLogEntry objects', () => {
      const entry: AuditLogEntry = {
        id: '1',
        type: 'POST',
        authorName: 'John Doe',
        content: 'Test content',
        moderationStatus: 'FLAGGED_SPAM',
        moderationReason: 'Spam detected',
        createdAt: new Date()
      };
      expect(entry).toBeDefined();
    });
  });
});
