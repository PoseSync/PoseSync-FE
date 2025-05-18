import { useMutation } from '@tanstack/react-query';
import { saveExerciseSets } from '../apis/exerciseSet';
import { ExerciseSetRequest, ExerciseSetResponse } from '../types/exerciseSet';

export const useSaveExerciseSets = () =>
  useMutation<ExerciseSetResponse[], Error, ExerciseSetRequest[]>({
    mutationFn: saveExerciseSets,
    onSuccess: (data) => {
      console.log("✅ 운동 세트 저장 완료", data);
    },
    onError: (error) => {
      console.error("❌ 운동 세트 저장 실패", error);
    }
  }); 