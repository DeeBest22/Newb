import * as dotenv from 'dotenv';

dotenv.config();

export const contabo_config = {
  CONTABO_ACCESS_KEY: process.env.CONTABO_ACCESS_KEY || '',
  CONTABO_SECRET_KEY: process.env.CONTABO_SECRET_KEY || '',
  CONTABO_BUCKET_NAME: process.env.CONTABO_BUCKET_NAME || '',
  CONTABO_ENDPOINT: process.env.CONTABO_ENDPOINT || '',
  CONTABO_REGION: process.env.CONTABO_REGION || '',
  CONTABO_IDENTIFIER: process.env.CONTABO_IDENTIFY || '',
};
