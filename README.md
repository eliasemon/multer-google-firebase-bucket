
# multer-google-or-firebase-bucket

`multer-google-or-firebase-bucket` is a custom storage engine for Multer that allows you to upload files directly to Google Cloud Storage or Firebase Storage.

## Installation

To install the package, use the following command:

```bash
npm install multer-google-or-firebase-bucket
```

## Usage

This package integrates Google Cloud Storage or Firebase Storage with Multer for file uploads. Here's how you can use it in your Express project.

### 1. Import the necessary modules and set up the Firebase Storage bucket

```javascript
import multer from 'multer';
import { multerGoogleOrFirebaseStorage, Storage } from 'multer-google-or-firebase-bucket';

// Initialize Google Cloud Storage start

// @example 1
// Create a client with credentials passed by value as a JavaScript object
const storage = new Storage({
  projectId: process.env.Project_Id,
  credentials: {
    type: 'service_account',
    private_key: process.env.Private_key.replace(/\\n/g, '\n'),
    client_email: process.env.Client_Email,
    client_id: process.env.Client_Id,
    universe_domain: process.env.Universe_Domain,
  },
});

// @example 2
// Create a client with explicit credentials
const storage = new Storage({
  projectId: 'your-project-id',
  keyFilename: '/path/to/keyfile.json'
});

// Initialize Google Cloud Storage end

// Get the Firebase Storage bucket
const bucket = storage.bucket(process.env.Storage_Bucket || '');
```

### 2. Configure Multer to use `multerGoogleOrFirebaseStorage`

You can now configure Multer to use the custom storage engine for uploading files.

```javascript
const storageEngin = multerGoogleOrFirebaseStorage({
  bucket,
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // Store files in the 'uploads' folder in Firebase
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname.replace(/ /g, '_')}`); // Customize the file name
  },
});

const upload = multer({
  storage: storageEngin,
  limits: { fileSize: 1000 * 1024 * 1024 }, // 1000 MB file size limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
}).single('file');
```

### 3. Use the `upload` middleware in your Express routes

You can now use the `upload` middleware in your Express routes to handle file uploads.

```javascript
import express from 'express';
import { upload } from './path/to/your/uploadFile'; // Adjust the path

const router = express.Router();

// Middleware to handle Multer and Firebase or Google bucket upload
router.post('/', upload, (req, res) => {
  res.status(200).json({
    message: 'File uploaded successfully',
    file: req.file,
  });
});

export default router;
```

### 4. Environment Variables

Make sure you have the following environment variables set up in your `.env` file:

```bash
Project_Id=your-project-id
Private_key=your-private-key
Client_Email=your-client-email
Client_Id=your-client-id
Universe_Domain=your-universe-domain
Storage_Bucket=your-storage-bucket
```

### 5. Example `.env` file

```env
Project_Id=your-project-id
Private_key="-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY
-----END PRIVATE KEY-----
"
Client_Email=your-client-email@your-project.iam.gserviceaccount.com
Client_Id=your-client-id
Universe_Domain=your-universe-domain
Storage_Bucket=your-bucket-name.appspot.com
```

### 6. Example Request

To test the file upload, you can send a POST request to the `/upload` route using tools like Postman or cURL, with a `file` parameter containing the file to be uploaded.

---

### Notes

- The file is uploaded directly to your Firebase or Google Cloud Storage bucket, and the public URL to the file is returned in the response.
- Ensure that the service account you are using has the necessary permissions to access Google Cloud Storage.
