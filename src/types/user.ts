// 유저 정보 요청
export interface CreateUserRequest {
    phoneNumber: string;
    height: number;
  }
  
  // 유저 정보 응답
  export interface CreateUserResponse {
    message: string;
    user_id: number;
    phone_number: string;
    height: string;
  }

// 운동 세트 저장 요청 타입
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
  