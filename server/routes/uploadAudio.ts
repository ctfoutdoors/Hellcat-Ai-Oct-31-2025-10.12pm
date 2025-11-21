import { Router } from 'express';
import multer from 'multer';
import { storagePut } from '../storage';
import { randomBytes } from 'crypto';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB limit for Whisper API
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/webm', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

/**
 * Upload audio file to S3 for voice transcription
 */
router.post('/upload-audio', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate random suffix to prevent enumeration
    const randomSuffix = randomBytes(8).toString('hex');
    const fileKey = `voice-recordings/${Date.now()}-${randomSuffix}.${req.file.mimetype.split('/')[1]}`;

    // Upload to S3
    const { url } = await storagePut(
      fileKey,
      req.file.buffer,
      req.file.mimetype
    );

    res.json({
      success: true,
      audioUrl: url,
      fileKey,
    });
  } catch (error) {
    console.error('[UploadAudio] Error:', error);
    res.status(500).json({
      error: 'Failed to upload audio file',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
