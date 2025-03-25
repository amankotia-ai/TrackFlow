import React, { createContext, useContext, useState, useEffect } from "react";

interface NavigationContextType {
  isFirstLoad: boolean;
  setIsFirstLoad: (value: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // When component mounts, set isFirstLoad to false after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFirstLoad(false);
    }, 500); // Shorter delay for animations to complete

    return () => clearTimeout(timer);
  }, []);

  return (
    <NavigationContext.Provider value={{ isFirstLoad, setIsFirstLoad }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}; 