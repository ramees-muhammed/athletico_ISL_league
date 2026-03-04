// src/api/adminApi.ts
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase.config';

export const verifyAdminLogin = async (idNumber: string, password: string): Promise<boolean> => {
  try {
    const adminsRef = collection(db, 'admins');
    
    // Query Firestore for matching credentials
    const q = query(
      adminsRef, 
      where('idNumber', '==', idNumber), 
      where('password', '==', password)
    );
    
    const snapshot = await getDocs(q);
    
    // If snapshot is NOT empty, the login is valid
    return !snapshot.empty; 
  } catch (error) {
    console.error("Admin verification failed:", error);
    return false;
  }
};