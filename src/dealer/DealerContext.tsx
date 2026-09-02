import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { Dealer } from '../types/firestore';

type DealerWithUid = Dealer & { uid: string };

interface DealerContextType {
  dealer: DealerWithUid | null;
  dealerLoading: boolean;
  logout: () => Promise<void>;
}

const DealerContext = createContext<DealerContextType | undefined>(undefined);

export const DealerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dealer, setDealer] = useState<DealerWithUid | null>(null);
  const [dealerLoading, setDealerLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) { setDealer(null); setDealerLoading(false); return; }
      const snap = await getDoc(doc(db, 'dealers', user.uid));
      if (snap.exists()) {
        setDealer({ uid: user.uid, ...(snap.data() as Dealer) });
      } else {
        setDealer(null);
      }
      setDealerLoading(false);
    });
    return unsub;
  }, []);

  const logout = async () => {
    await signOut(auth);
    setDealer(null);
  };

  return (
    <DealerContext.Provider value={{ dealer, dealerLoading, logout }}>
      {children}
    </DealerContext.Provider>
  );
};

export const useDealer = () => {
  const ctx = useContext(DealerContext);
  if (!ctx) throw new Error('useDealer must be used within DealerProvider');
  return ctx;
};
