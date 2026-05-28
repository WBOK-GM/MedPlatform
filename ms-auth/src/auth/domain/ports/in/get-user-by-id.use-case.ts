import { UserView } from '../../../application/views/user.view';

export const GET_USER_BY_ID_USE_CASE = Symbol('GET_USER_BY_ID_USE_CASE');

export interface GetUserByIdUseCase {
  getById(id: string): Promise<UserView>;
}
