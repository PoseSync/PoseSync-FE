import axios from 'axios';
import { GetExerciseSetResultResponse } from '../types/exerciseSetResult';

export async function getExerciseSetResult(phone_number: string): Promise<GetExerciseSetResultResponse> {
  const response = await axios.get<GetExerciseSetResultResponse>(
    `http://127.0.0.1:5001/get_exercise_set?phone_number=${phone_number}`
  );
  return response.data;
} 