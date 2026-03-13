import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      // Estado inicial: no hay usuario logueado
      user: null,

      // Función para iniciar sesión (guarda los datos del usuario)
      login: (userData) => set({ user: userData }),

      // Función para cerrar sesión (borra los datos del usuario)
      logout: () => set({ user: null }),
    }),
    {
      // Nombre con el que se guardará en el LocalStorage
      name: 'bilane-auth-storage',
    }
  )
);