export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    username: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}
