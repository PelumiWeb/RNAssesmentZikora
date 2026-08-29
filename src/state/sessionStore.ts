import { create } from 'zustand';
import { Session, isSessionValid } from '../domain/session';
import { clearSession, readSession, writeSession } from '../services/sessionStorage';

export type SessionPhase = 'hydrating' | 'authenticated' | 'unauthenticated';

type SessionState = {
  phase: SessionPhase;
  session: Session | null;
  hydrate: () => Promise<void>;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
  /** Called on app resume; an expired session is dropped rather than silently kept. */
  revalidate: () => Promise<void>;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  phase: 'hydrating',
  session: null,

  hydrate: async () => {
    const stored = await readSession();
    if (isSessionValid(stored)) {
      set({ phase: 'authenticated', session: stored });
    } else {
      if (stored) await clearSession();
      set({ phase: 'unauthenticated', session: null });
    }
  },

  signIn: async (session) => {
    await writeSession(session);
    set({ phase: 'authenticated', session });
  },

  signOut: async () => {
    await clearSession();
    set({ phase: 'unauthenticated', session: null });
  },

  revalidate: async () => {
    const { session } = get();
    if (session && !isSessionValid(session)) {
      await clearSession();
      set({ phase: 'unauthenticated', session: null });
    }
  },
}));
