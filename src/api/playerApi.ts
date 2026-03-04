
//playerApi.ts//

import type { Player } from '../types';

import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase.config';
import axios from 'axios';


const playerCol = collection(db, 'players');
const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/players`;

export const fetchPlayers = async (isAdmin: boolean) => {
  // If not admin, only fetch accepted players
  const q = isAdmin 
    ? query(playerCol, orderBy('createdAt', 'desc'))
    : query(playerCol, where('status', '==', 'accepted'), orderBy('createdAt', 'desc'));
    
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
};


// Helper function to get current counts
export const getLeagueStatus = async () => {
  const allPlayersSnapshot = await getDocs(playerCol);
  const players = allPlayersSnapshot.docs.map(doc => doc.data() as Player);

  const gkCount = players.filter(p => p.position === 'GK').length;
  const outfieldCount = players.length - gkCount;

  return {
    total: players.length,
    gkCount,
    outfieldCount
  };
};

export const registerPlayer = async (playerData: Omit<Player, 'id' | 'status' | 'createdAt'>) => {


  // throw new Error('League is full! (Max 48 players reached)');
  
  // We keep the safety check here too, just in case
  const status = await getLeagueStatus();

  if (status.total >= 48) throw new Error('League is full! (Max 48)');
  
  if (playerData.position === 'GK') {
    if (status.gkCount >= 7) throw new Error('Goalkeeper slots are full! (Max 7)');
  } else {
    if (status.outfieldCount >= 41) throw new Error('Outfield slots are full! (Max 41)');
  }

  return await addDoc(playerCol, {
    ...playerData,
    status: 'Pending', 
    createdAt: Date.now()
  });
};


export const updatePlayerStatusAxios = async ({ id, newStatus }: { id: string; newStatus: string }) => {
  const url = `${BASE_URL}/${id}?updateMask.fieldPaths=status`;
  // Firebase REST API expects a specific JSON structure for updates
  const payload = {
    fields: {
      status: { stringValue: newStatus }
    }
  };
  return axios.patch(url, payload);
};

export const deletePlayerAxios = async (id: string) => {
  const url = `${BASE_URL}/${id}`;
  return axios.delete(url);
};