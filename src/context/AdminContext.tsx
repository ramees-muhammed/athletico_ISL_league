// src/context/AdminContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { verifyAdminLogin } from '../api/adminApi';


interface AdminContextType {
  isAdmin: boolean;
  login: (id: string, pass: string) => Promise<boolean>; // Changed to Promise
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem('admin_session') === 'active';
  });

  // Now an async function calling Firebase
  const login = async (id: string, pass: string) => {
    const isValid = await verifyAdminLogin(id, pass);
    
    if (isValid) {
      setIsAdmin(true);
      sessionStorage.setItem('admin_session', 'active');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('admin_session');
  };

  return (
    <AdminContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within AdminProvider');
  return context;
};