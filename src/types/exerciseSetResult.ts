export interface ExerciseSetResult {
  id: number;
  created_at: string;
  current_count: number;
  exercise_type: string;
  exercise_weight: number;
  is_finished: boolean;
  is_success: boolean;
  routine_group: number;
  target_count: number;
}

export interface GetExerciseSetResultResponse {
  phone_number: string;
  routine_group: number;
  sets: ExerciseSetResult[];
} 