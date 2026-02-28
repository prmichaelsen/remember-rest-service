export interface JwtPayload {
  sub: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  userId: string;
}
