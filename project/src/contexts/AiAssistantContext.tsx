import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";



interface AiAssistantContextType {
  userId: string | null;
  preferences: Record<string, any>;
  memory: Record<string, any>;
  recentActions: { type: string; payload?: any; timestamp: number }[];
  setPreference: (key: string, value: any) => void;
  addMemory: (key: string, value: any) => void;
  addAction: (type: string, payload?: any) => void;
  clearMemory: () => void;
}

const AiAssistantContext = createContext<AiAssistantContextType | undefined>(undefined);

export const AiAssistantProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<Record<string, any>>({});
  const [memory, setMemory] = useState<Record<string, any>>({});
  const [recentActions, setRecentActions] = useState<{ type: string; payload?: any; timestamp: number }[]>([]);

  useEffect(() => {
    // Load userId, preferences, and memory from Supabase or localStorage
    // (Stub: replace with real fetch logic)
    setUserId('demo-user');
    setPreferences({ theme: 'dark', language: 'en' });
    setMemory({ lastVisited: Date.now() });
  }, []);

  const setPreference = (key: string, value: any) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    // Persist to Supabase or localStorage
  };

  const addMemory = (key: string, value: any) => {
    setMemory((prev) => ({ ...prev, [key]: value }));
    // Persist to Supabase or localStorage
  };

  const addAction = (type: string, payload?: any) => {
    setRecentActions((prev) => [
      ...prev.slice(-19),
      { type, payload, timestamp: Date.now() }
    ]);
  };

  const clearMemory = () => setMemory({});

  return (
    <AiAssistantContext.Provider value={{ userId, preferences, memory, recentActions, setPreference, addMemory, addAction, clearMemory }}>
      {children}
    </AiAssistantContext.Provider>
  );
};

export const useAiAssistant = () => {
  const context = useContext(AiAssistantContext);
  if (!context) throw new Error('useAiAssistant must be used within AiAssistantProvider');
  return context;
}; 