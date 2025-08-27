export interface User {
  id: string;
  email: string;
}

export interface Intervention {
  id?: string;
  user_id: string;
  date: string;
  time: string;
  line: 'A' | 'B' | 'C' | 'Autres';
  custom_line?: string;
  vehicle_number: string;
  stop: string;
  regulation: number;
  incivility: number;
  help: number;
  information: number;
  link: number;
  bike_scooter: number;
  stroller: number;
  physical_aggression: number;
  verbal_aggression: number;
  other: number;
  created_at?: string;
  updated_at?: string;
}

export interface RouteSheet {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface UsefulLink {
  id: string;
  label: string;
  url: string;
  type: 'https' | 'pdf' | 'other';
  information?: string;
  order_index: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export type LineType = 'A' | 'B' | 'C' | 'Autres';

export interface InterventionCounts {
  regulation: number;
  incivility: number;
  help: number;
  information: number;
  link: number;
  bike_scooter: number;
  stroller: number;
  physical_aggression: number;
  verbal_aggression: number;
  other: number;
}