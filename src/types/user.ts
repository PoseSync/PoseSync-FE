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
  