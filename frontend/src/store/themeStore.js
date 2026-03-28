import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  isDarkMode: false, // Por defecto iniciamos en modo claro
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));