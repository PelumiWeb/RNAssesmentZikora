import { create } from 'zustand';
import {
  TransferEvent,
  TransferState,
  initialTransferState,
  transferReducer,
} from '../domain/transfer';

type TransferStore = {
  state: TransferState;
  dispatch: (event: TransferEvent) => void;
};

/** The reducer stays pure and unit-testable; the store is only a place to keep it. */
export const useTransferStore = create<TransferStore>((set, get) => ({
  state: initialTransferState,
  dispatch: (event) => set({ state: transferReducer(get().state, event) }),
}));
