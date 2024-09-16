import { Storage, Bucket, File } from '@google-cloud/storage';
import { Request } from 'express';
import * as multer from 'multer';

// Define the custom file type with the optional firebasePath
interface CustomMulterFile extends Express.Multer.File {
  firebasePath?: string;
}

// Define the options for MulterFirebaseStorage
interface MulterGoogleFirebaseBucketOptions {
  bucket: Bucket;
  destination?: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => void;
  filename?: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => void;
}

// Define the MulterFirebaseStorage class that implements multer.StorageEngine
declare class MulterFirebaseStorage implements multer.StorageEngine {
  constructor(options: MulterGoogleFirebaseBucketOptions);

  _handleFile(req: Request, file: Express.Multer.File, cb: (error: Error | null, info?: { [key: string]: any }) => void): void;
  
  _removeFile(req: Request, file: CustomMulterFile, cb: (error: Error | null) => void): void;
}

// Export the multerFirebaseStorage function and types
declare function multerGoogleOrFirebaseStorage(options: MulterGoogleFirebaseBucketOptions): multer.StorageEngine;

export { Storage, Bucket, File, CustomMulterFile, MulterGoogleFirebaseBucketOptions, multerGoogleOrFirebaseStorage };
