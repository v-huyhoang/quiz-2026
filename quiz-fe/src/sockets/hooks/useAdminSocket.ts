import { useEffect } from 'react';
import { registerAdminListeners } from '../listeners/register-admin-listeners';

export function useAdminSocket() {
  useEffect(() => {
    registerAdminListeners();
  }, []);
}
