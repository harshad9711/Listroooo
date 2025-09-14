import React, { createContext, useContext, useState } from 'react';

interface AiAssistantContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const AiAssistantContext = createContext<AiAssistantContextType | undefined>(undefined);

export const useAiAssistant = () => {
  const context = useContext(AiAssistantContext);
  if (context === undefined) {
    throw new Error('useAiAssistant must be used within an AiAssistantProvider');
  }
  return context;
};

export const AiAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AiAssistantContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </AiAssistantContext.Provider>
  );
};


