export type LeadStatus = string;

export interface StatusUpdate {
  status: string;
  note: string;
  timestamp: any;
}

export interface Lead {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  status: LeadStatus;
  source: string;
  notes: string;
  createdAt: any;
  updatedAt: any;
  ownerUid: string;
  statusHistory?: StatusUpdate[];
  isDeleted?: boolean;
  deletedAt?: any;
}

export interface Property {
  id: string;
  leadId: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  arv: number;
  repairEstimate: number;
  askingPrice: number;
  mao: number;
  ownerUid: string;
}

export interface Task {
  id: string;
  leadId: string;
  title: string;
  dueDate: any;
  completed: boolean;
  ownerUid: string;
}

export interface Buyer {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  buyCriteria: string;
  areas: string;
  ownerUid: string;
}
