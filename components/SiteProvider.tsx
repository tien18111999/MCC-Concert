"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type SiteContextValue = {
  waitlistOpen: boolean;
  openWaitlist: () => void;
  closeWaitlist: () => void;
  notify: (message: string) => void;
};

const SiteContext = createContext<SiteContextValue | null>(null);

export function useSite() {
  const value = useContext(SiteContext);
  if (!value) {
    throw new Error("useSite must be used within SiteProvider");
  }
  return value;
}

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const openWaitlist = useCallback(() => setWaitlistOpen(true), []);
  const closeWaitlist = useCallback(() => setWaitlistOpen(false), []);
  const notify = useCallback((next: string) => {
    setMessage(next);
    window.setTimeout(() => {
      setMessage((current) => (current === next ? null : current));
    }, 2800);
  }, []);

  const value = useMemo(
    () => ({ waitlistOpen, openWaitlist, closeWaitlist, notify }),
    [waitlistOpen, openWaitlist, closeWaitlist, notify],
  );

  return (
    <SiteContext.Provider value={value}>
      {children}
      {message ? (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-[70] max-w-[90vw] -translate-x-1/2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-2xl"
        >
          {message}
        </div>
      ) : null}
    </SiteContext.Provider>
  );
}
