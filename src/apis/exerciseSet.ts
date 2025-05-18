import axios from 'axios';
import { ExerciseSetRequest, ExerciseSetResponse } from '../types/exerciseSet';

// 여러 세트 저장 (배열 요청)
export async function saveExerciseSets(
  sets: ExerciseSetRequest[]
): Promise<ExerciseSetResponse[]> {
  const response = await axios.post<ExerciseSetResponse[]>(
    'http://127.0.0.1:5001/create_exercise_set', 
    sets
  );
  return response.data;
}

