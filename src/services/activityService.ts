import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ActivityType } from '../types';

export const logActivity = async (
  ownerUid: string,
  type: ActivityType,
  description: string,
  leadId?: string,
  leadName?: string
) => {
  try {
    await addDoc(collection(db, 'activities'), {
      ownerUid,
      type,
      description,
      leadId: leadId || null,
      leadName: leadName || null,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};
