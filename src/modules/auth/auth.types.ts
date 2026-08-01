export interface IRegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: string;
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ITokenPayload {
  id: string;
  email: string;
  role: string;
}