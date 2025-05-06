import { create } from 'zustand';

interface UserState {
  height: string;
  phoneNumber: string;
  setHeight: (height: string) => void;
  setPhoneNumber: (phoneNumber: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  height: '',
  phoneNumber: '',
  setHeight: (height) => set({ height }),
  setPhoneNumber: (phoneNumber) => set({ phoneNumber }),
})); 