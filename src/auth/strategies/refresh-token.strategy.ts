import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configureService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: configureService.get('jwt_refresh_secret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const authHeader = req.get('authorization');
    const refreshToken = authHeader
      ? authHeader.replace('Bearer ', '').trim()
      : null;
    return {
      ...payload,
      refreshToken,
    };
  }
}
