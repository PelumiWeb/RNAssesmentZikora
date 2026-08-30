import { create } from 'zustand';

type DevFlags = {
  forceOffline: boolean;
  setForceOffline: (value: boolean) => void;
  reset: () => void;
};

/** Backs the dev-only "Force offline" switch. Readable outside React via getState(). */
export const useDevFlags = create<DevFlags>((set) => ({
  forceOffline: false,
  setForceOffline: (forceOffline) => set({ forceOffline }),
  reset: () => set({ forceOffline: false }),
}));

export const isOffline = (): boolean => useDevFlags.getState().forceOffline;
