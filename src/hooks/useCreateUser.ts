import { useMutation } from '@tanstack/react-query';
import { createUser } from '../apis/user';
import { CreateUserRequest, CreateUserResponse } from '../types/user';

export const useCreateUser = () =>
  useMutation<CreateUserResponse, Error, CreateUserRequest>({
    mutationFn: createUser,
    onSuccess: (data) => {
      console.log("✅ 사용자 생성 완료", data);
    },
    onError: (error) => {
      console.error("❌ 사용자 생성 실패", error);
    }
  });
