import { useQuery } from '@tanstack/react-query';
import { getExerciseSetResult } from '../apis/getExerciseSetResult';
import { GetExerciseSetResultResponse } from '../types/exerciseSetResult';

export const useGetExerciseSetResult = (phone_number: string) =>
  useQuery<GetExerciseSetResultResponse, Error>({
    queryKey: ['exerciseSetResult', phone_number],
    queryFn: () => getExerciseSetResult(phone_number),
    enabled: !!phone_number,
  }); 