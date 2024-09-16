import { Storage ,Bucket, File } from '@google-cloud/storage';
import * as multer from 'multer';
import { Request } from 'express';


// Define the custom type with `firebasePath`
interface CustomMulterFile extends Express.Multer.File {
  firebasePath?: string;
}

interface MulterGoogleFirebaseBucketOptions {
  bucket: Bucket;
  destination?: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => void;
  filename?: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => void;
}

class MulterFirebaseStorage implements multer.StorageEngine {
  private bucket: Bucket;
  private destination?: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => void;
  private filename?: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => void;

  constructor(options: MulterGoogleFirebaseBucketOptions) {
    this.bucket = options.bucket;
    this.destination = options.destination;
    this.filename = options.filename;
  }

  _handleFile(req: Request, file: Express.Multer.File, cb: (error: Error | null, info?: { [key: string]: any }) => void): void {
    // Determine the destination and filename
    const destinationCallback = this.destination || ((req, file, cb) => cb(null, ''));
    const filenameCallback = this.filename || ((req, file, cb) => cb(null, file.originalname));

    destinationCallback(req, file, (destErr, destination) => {
      if (destErr) {
        return cb(destErr);
      }

      filenameCallback(req, file, (fileErr, filename) => {
        if (fileErr) {
          return cb(fileErr);
        }

        const filePath = `${destination}/${filename}`;

        // Cast file to CustomMulterFile to add firebasePath
        const customFile = file as CustomMulterFile;
        customFile.firebasePath = filePath; // Set the custom property

        // Create a blob in Firebase Storage
        const blob: File = this.bucket.file(filePath);
        const blobStream = blob.createWriteStream({
          resumable: false,
          gzip: true,
        });

        blobStream.on('error', (err: Error) => cb(err));
        blobStream.on('finish', () => {
          // Make the file public and return the public URL
          blob.makePublic().then(() => {
            cb(null, {
              bucket: this.bucket.name,
              filename: filePath,
              publicUrl: `https://storage.googleapis.com/${this.bucket.name}/${filePath}`,
            });
          });
        });

        // Pipe the file stream to Firebase Storage
        file.stream.pipe(blobStream);
      });
    });
  }

  _removeFile(req: Request, file: Express.Multer.File, cb: (error: Error | null) => void): void {
    // Cast file to CustomMulterFile to access the firebasePath
    const customFile = file as CustomMulterFile;
    const filePath = customFile.firebasePath;

    if (!filePath) {
      return cb(new Error('File path not available.'));
    }

    this.bucket.file(filePath).delete().then(() => {
      cb(null);
    }).catch(cb);
  }
}

// Export the storage engine function
function multerGoogleOrFirebaseStorage(options: MulterGoogleFirebaseBucketOptions): multer.StorageEngine {
  return new MulterFirebaseStorage(options);
}

export {Storage ,Bucket ,File , multerGoogleOrFirebaseStorage}
