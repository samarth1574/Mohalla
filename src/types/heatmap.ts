export interface HeatmapPoint {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  category: 'EMERGENCY' | 'SOCIETY' | 'MARKETPLACE';
}

export type CategoryFilter = 'ALL' | 'EMERGENCY' | 'SOCIETY' | 'MARKETPLACE';
