import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null, // null significa que no ha iniciado sesión
  login: (userData) => set({ user: userData }),
  logout: () => set({ user: null }),
}));