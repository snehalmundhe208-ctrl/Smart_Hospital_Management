const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hospital_system/reports',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto'
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @desc    Upload lab report/file
// @route   POST /api/upload
// @access  Private
router.post('/', (req, res, next) => {
  console.log('[UPLOAD FLOW] Upload started...');
  next();
}, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      console.log('[UPLOAD FLOW] No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Return Cloudinary secure URL
    console.log('[UPLOAD FLOW] Cloudinary response received:', req.file);
    res.status(201).json({ url: req.file.path });
  } catch (error) {
    console.error('[UPLOAD FLOW] Error during upload:', error);
    res.status(500).json({ message: 'File upload failed' });
  }
});

module.exports = router;
