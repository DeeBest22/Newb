import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwtConfig from '../config/jwt.config';
import { JwtPayload } from '../interfaces';
import { UserDatabaseService } from '../db/user.db.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserDatabaseService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfiguration.secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userService.findFirstBy({ email: payload.email });
    return {
      ...user,
      account: {
        id: payload.currentAccountId,
        type: payload.currentAccountType,
      },
    };
  }
}
