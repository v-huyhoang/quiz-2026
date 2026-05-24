import { useEffect } from 'react';
import { registerStageListeners } from '../listeners/register-stage-listeners';

export function useStageSocket() {
  useEffect(() => {
    registerStageListeners();
  }, []);
}
