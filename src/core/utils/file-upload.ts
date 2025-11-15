import { extname } from 'path';

export const fileFilter = (req, file, callback) => {
  if (
    !file.originalname.match(/\.(jpg|jpeg|png|PNG|pdf|docs|docx|xlsx|xls|csv)$/)
  ) {
    return callback(new Error('Only images and pdfs are allowed!'), false);
  }
  callback(null, true);
};

export const editFileName = (req, file, callback) => {
  const name = file.originalname.split('.')[0];
  const fileExtName = extname(file.originalname);
  const randomName = Array(12)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};
