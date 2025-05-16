import axios from 'axios';
import { CreateUserRequest, CreateUserResponse } from '../types/user';

export const createUser = async (
  data: CreateUserRequest
): Promise<CreateUserResponse> => {
  const response = await axios.post('http://127.0.0.1:5001/create_user', data);
  return response.data;
};
