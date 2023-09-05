export enum Role {
  User = 'user',
  Admin = 'admin',
}

export class UserJWT {
  address: string;
  role: Role;
}
