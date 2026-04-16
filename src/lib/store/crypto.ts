import { create } from 'zustand';

interface CryptoState {
  masterKey: CryptoKey | null;
  setMasterKey: (key: CryptoKey) => void;
  clearMasterKey: () => void;
}

export const useCryptoStore = create<CryptoState>((set) => ({
  masterKey: null,
  setMasterKey: (key) => set({ masterKey: key }),
  clearMasterKey: () => set({ masterKey: null }),
}));