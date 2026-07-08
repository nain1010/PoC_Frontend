import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProjectState {
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      activeProjectId: null,
      setActiveProjectId: (id) => set({ activeProjectId: id }),
    }),
    {
      name: 'luma-project-storage', // name of the item in the storage (must be unique)
    }
  )
);
