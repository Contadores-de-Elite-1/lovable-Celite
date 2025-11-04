import { useState, useEffect } from 'react';
import type { AuthSecurityStatusState, SecurityStatus } from '@/types/auth-security';

const STORAGE_KEY = 'authSecurityStatus';

const initialStatus: AuthSecurityStatusState = {
  hibp: 'nao-verificado',
  db_structure: 'nao-verificado',
  user_mgmt: 'nao-verificado',
};

export const useAuthSecurityStatus = () => {
  const [status, setStatus] = useState<AuthSecurityStatusState>(initialStatus);

  useEffect(() => {
    // Load from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setStatus(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading auth security status:', error);
    }
  }, []);

  const updateStatus = (key: keyof AuthSecurityStatusState, value: SecurityStatus) => {
    const newStatus = { ...status, [key]: value };
    setStatus(newStatus);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStatus));
  };

  const resetStatus = () => {
    setStatus(initialStatus);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialStatus));
  };

  return { status, updateStatus, resetStatus };
};
