export interface AnalyticsData {
  dauCount: number;
  mauCount: number;
  sevenDayData: Array<{
    day: string;
    count: number;
  }>;
  contentSummary: {
    activeEmergencies: number;
    availableListings: number;
    openRequests: number;
    activeLostItems: number;
  };
}

export interface AuditLogEntry {
  id: string;
  type: 'POST' | 'LISTING';
  authorName: string;
  content: string;
  moderationStatus: string;
  moderationReason: string | null;
  createdAt: Date;
}
