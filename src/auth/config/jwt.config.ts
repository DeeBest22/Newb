import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export default registerAs('jwt', () => {
  const values = {
    secret: process.env.JWT_SECRET,
    audience: process.env.JWT_TOKEN_AUDIENCE,
    issuer: process.env.JWT_TOKEN_ISSUER,
    accessTokenTtl: parseInt(process.env.JWT_ACCESS_TOKEN_TTL ?? '86400', 10),
    refreshTokenTtl: parseInt(process.env.JWT_REFRESH_TOKEN_TTL ?? '86400', 10),
  };

  const schemas = Joi.object({
    secret: Joi.string().required(),
    audience: Joi.string().required(),
    issuer: Joi.string().required(),
    accessTokenTtl: Joi.number().required(),
    refreshTokenTtl: Joi.number().required(),
  });

  const { error } = schemas.validate(values, { abortEarly: false });

  if (error) {
    throw new Error(
      `Validation failed - Ensure your env is updated. ${error.message}`,
    );
  }

  return values;
});
