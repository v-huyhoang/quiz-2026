import React, { createContext, useContext } from 'react';
import { getEcho } from '../echo';

const SocketContext = createContext<{ echo: ReturnType<typeof getEcho> } | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <SocketContext.Provider value={{ echo: getEcho() }}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};
