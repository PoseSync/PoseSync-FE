import { create } from 'zustand';
import { Exercise } from '../data/exercises';

export interface SetData {
  weight: number;
  reps: number;
}

interface ExerciseStore {
  selectedExercise: Exercise | null;
  setSelectedExercise: (exercise: Exercise) => void;
  sets: SetData[];
  setSets: (sets: SetData[]) => void;
}

export const useExerciseStore = create<ExerciseStore>((set) => ({
  selectedExercise: null,
  setSelectedExercise: (exercise) => set({ selectedExercise: exercise }),
  sets: [],
  setSets: (sets) => set({ sets }),
})); 