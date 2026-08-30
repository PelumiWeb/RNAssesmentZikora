import * as SecureStore from 'expo-secure-store';
import { Session, parseStoredSession } from '../domain/session';

const KEY = 'zikora.session';

/**
 * Read/write/clear only. Nothing in this module inspects expiry or navigates -- a
 * storage helper that redirects is a storage helper you cannot test or reason about.
 */
export const readSession = async (): Promise<Session | null> => {
  try {
    return parseStoredSession(await SecureStore.getItemAsync(KEY));
  } catch {
    return null;
  }
};

export const writeSession = async (session: Session): Promise<void> => {
  await SecureStore.setItemAsync(KEY, JSON.stringify(session));
};

export const clearSession = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(KEY);
};
