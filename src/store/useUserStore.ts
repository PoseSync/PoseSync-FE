import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  height: string;
  phoneNumber: string;
  setHeight: (height: string) => void;
  setPhoneNumber: (phoneNumber: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      height: '',
      phoneNumber: '',
      setHeight: (height) => set({ height }),
      setPhoneNumber: (phoneNumber) => set({ phoneNumber }),
    }),
    {
      name: 'user-storage', // 로컬 스토리지에 저장될 키 이름
    }
  )
); 