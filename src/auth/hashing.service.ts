import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class HashingService {
  async hashPassword(password: string): Promise<string> {
    const saltOrRounds = 15;
    return bcrypt.hash(password, saltOrRounds);
  }
  async comparePasswords(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
