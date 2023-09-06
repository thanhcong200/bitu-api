import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Min length: 6' })
  @MaxLength(100, { message: 'Max length: 100' })
  username: string;

  @IsNotEmpty()
  @IsString()
  @IsStrongPassword(
    {
      minLength: 8,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
    },
    { message: 'Password invalid' },
  )
  @MaxLength(20, { message: 'Max length: 20' })
  password: string;

  @IsOptional()
  @IsString()
  avatar: string;
}
