'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getCustomer, onCustomerChange, syncCustomer, type Customer } from '@/lib/customer';
import { getCart, onCartChange } from '@/lib/cart';
import { getFavorites, onFavoritesChange } from '@/lib/favorites';

type Ctx = { customer: Customer | null };
const CustomerContext = createContext<Ctx>({ customer: null });

export function useCustomer(): Customer | null {
  return useContext(CustomerContext).customer;
}

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCustomer(getCustomer());
    return onCustomerChange(() => setCustomer(getCustomer()));
  }, []);

  // Persist cart + favorites to the DB (debounced) whenever they change while
  // a shopper is logged in — this is what makes the data survive a cleared
  // browser: the DB is the source of truth, localStorage is only a cache.
  useEffect(() => {
    const pushSoon = () => {
      const c = getCustomer();
      if (!c) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void syncCustomer(c.id, getCart(), getFavorites());
      }, 600);
    };
    const off1 = onCartChange(pushSoon);
    const off2 = onFavoritesChange(pushSoon);
    return () => {
      off1();
      off2();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return <CustomerContext.Provider value={{ customer }}>{children}</CustomerContext.Provider>;
}
