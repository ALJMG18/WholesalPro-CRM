import { Timestamp } from 'firebase/firestore';

export enum LeadStatus {
  NEW = 'New',
  CONTACTED = 'Contacted',
  QUALIFIED = 'Qualified',
  UNQUALIFIED = 'Unqualified',
  APPOINTMENT = 'Appointment',
  UNDER_CONTRACT = 'Under Contract',
  CLOSED = 'Closed',
  DEAD = 'Dead',
}

export enum LeadSource {
  WEB = 'Web',
  REFERRAL = 'Referido',
  ADVERTISING = 'Publicidad',
  COLD_CALL = 'Llamada en frío',
  OTHER = 'Otro',
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string; // For backward compatibility
  phone: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;
  source: LeadSource;
  status: LeadStatus | string; // Allow string for existing data
  notes: string;
  ownerUid: string;
  deleted?: boolean;
  deletedAt?: any;
  createdAt: any; // Can be Timestamp or string
  score?: number;
  isHot?: boolean;
  sequenceId?: string;
  currentStepIndex?: number;
  lastStepRunAt?: any;
  propertyDetails?: {
    equity?: 'High' | 'Low' | 'Unknown';
    occupancy?: 'Vacant' | 'Occupied' | 'Unknown';
    motivation?: string;
  };
}

export enum ActivityType {
  LEAD_CREATED = 'lead_created',
  LEAD_UPDATED = 'lead_updated',
  LEAD_DELETED = 'lead_deleted',
  SMS_SENT = 'sms_sent',
  EMAIL_SENT = 'email_sent',
  TASK_COMPLETED = 'task_completed',
  CONTRACT_GENERATED = 'contract_generated',
}

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  leadId?: string;
  leadName?: string;
  ownerUid: string;
  createdAt: any;
}

export interface Property {
  id: string;
  leadId: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  askingPrice: number;
  arv: number;
  repairEstimate: number;
  mao: number;
  ownerUid: string;
  createdAt?: any;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  leadId: string;
  ownerUid: string;
  dueDate: any;
  dueTime?: string;
  notified?: boolean;
  createdAt?: any;
}

export interface Buyer {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  buyCriteria: string;
  areas: string;
  ownerUid: string;
  createdAt?: any;
}

export interface Template {
  id: string;
  name: string;
  type: string;
  subject?: string;
  body: string;
  ownerUid: string;
}
