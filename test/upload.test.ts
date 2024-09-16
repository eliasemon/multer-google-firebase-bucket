import request from 'supertest';
import express, { Request, Response } from 'express';
import multer from 'multer';
import { multerGoogleOrFirebaseStorage, Storage } from '../src';

const app = express();

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.Project_Id || '',
  credentials: {
    type: 'service_account',
    private_key: process.env.Private_key?.replace(/\\n/g, '\n') || '',
    client_email: process.env.Client_Email || '',
    client_id: process.env.Client_Id || '',
    universe_domain: process.env.Universe_Domain || '',
  },
});
// Get the Firebase Storage bucket
const bucket = storage.bucket(process.env.Storage_Bucket || '');
const storageEngine = multerGoogleOrFirebaseStorage({
  bucket,
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, 'uploads'); // Store files in the 'uploads' folder in Firebase
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, `${Date.now()}_${file.originalname.replace(/ /g, '_')}`); // Customize the file name
  },
});

const upload = multer({
  storage: storageEngine,
  limits: { fileSize: 1000 * 1024 * 1024 }, // 1000 MB file size limit
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [  
      'text/plain',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type') as any, false);
    }
  },
}).single('file');

// Route for testing file uploads
app.post('/upload', (req: Request, res: Response) => {
  upload(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'Multer error occurred during file upload' });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    return res.status(200).json({ message: 'File uploaded successfully', file: req.file });
  });
});

describe('File Upload Test', () => {
  it('should upload a valid file', (done) => {
    request(app)
      .post('/upload')
      .attach('file', Buffer.from('Test file content'), 'testfile.txt') // Attaching a test file
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        // Check if response contains file details
        if (!res.body.file) {
          return done(new Error('File upload failed'));
        }
        done();
      });
  });

  it('should fail with invalid file type', (done) => {
    request(app)
      .post('/upload')
      .attach('file', Buffer.from('Test content'), 'invalidfile.xyz') // Invalid file type
      .expect(400) // Expect failure
      .end((err, res) => {
        if (err) return done(err);
        if (!res.body.error) {
          return done(new Error('Expected an error for invalid file type'));
        }
        done();
      });
  });

  it('should fail without file upload', (done) => {
    request(app)
      .post('/upload')
      .expect(400) // Expect failure as no file is attached
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
});
