import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig: JwtModuleOptions = {
  secret: process.env.JWT_SECRET || 'siscetran-secret-key',
  signOptions: {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};