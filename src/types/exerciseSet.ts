export interface ExerciseSetRequest {
    phone_number: string;
    exerciseType: string;
    exercise_weight: number;
    exercise_cnt: number;
  }
  
  // 운동 세트 저장 응답 타입
  export interface ExerciseSetResponse {
    exercise_set_id: number;
    phone_number: string;
    status: string;
  }