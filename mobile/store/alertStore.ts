import { create } from "zustand";

interface AlertStore {
  deviceToken: string | null;
  cheapAlertEnabled: boolean;
  cheapThreshold: string;
  expensiveAlertEnabled: boolean;
  expensiveThreshold: string;

  setDeviceToken: (token: string) => void;
  setCheapAlert: (enabled: boolean) => void;
  setCheapThreshold: (threshold: string) => void;
  setExpensiveAlert: (enabled: boolean) => void;
  setExpensiveThreshold: (threshold: string) => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  deviceToken: null,
  cheapAlertEnabled: false,
  cheapThreshold: "10.00",
  expensiveAlertEnabled: false,
  expensiveThreshold: "18.00",

  setDeviceToken: (token) => set({ deviceToken: token }),
  setCheapAlert: (enabled) => set({ cheapAlertEnabled: enabled }),
  setCheapThreshold: (threshold) => set({ cheapThreshold: threshold }),
  setExpensiveAlert: (enabled) =>
    set({ expensiveAlertEnabled: enabled }),
  setExpensiveThreshold: (threshold) => set({ expensiveThreshold: threshold }),
}));
