const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const Item = require('../models/Item');
const Comment = require('../models/Comment');
const User = require('../models/User');

const router = express.Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.resolve(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
    cb(null, true);
  } else {
    req.fileValidationError = 'Invalid file type';
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5 MB limit
  },
  fileFilter: fileFilter
});

// Middleware to verify JWT token
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    if (decoded.user && decoded.user.email) {
      req.user.email = decoded.user.email;
    }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check if user is admin
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

// @route   GET /api/items
// @desc    Get all items (for Admin/General view)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const items = await Item.find().populate('createdBy', 'email role').sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('Error fetching all items:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/items/approved
// @desc    Get all approved items
// @access  Private
router.get('/approved', auth, async (req, res) => {
  try {
    console.log('Fetching approved items for user:', req.user.email);
    const items = await Item.find({ status: 'approved' }).populate('createdBy', 'email role').sort({ createdAt: -1 });
    console.log(`Found ${items.length} approved items`);
    res.json(items);
  } catch (err) {
    console.error('Error fetching approved items:', err.message);
    res.status(500).json({ message: 'Server error while fetching approved items' });
  }
});

// @route   POST /api/items
// @desc    Create a new item
// @access  Private
router.post('/', auth, upload.single('image'), async (req, res) => {
  console.log('POST /api/items hit. User:', req.user.email);
  
  if (req.user.role !== 'student' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Only students and admins can report items.' });
  }

  if (req.fileValidationError) {
    return res.status(400).json({ message: 'Invalid File Type. Only JPEG, JPG, and PNG are allowed.' });
  }

  const { title, description } = req.body;
  const imagePath = req.file ? req.file.filename : null;

  try {
    if (!req.user || !req.user.id) {
       return res.status(401).json({ message: 'User not authenticated properly' });
    }

    const newItem = new Item({
      title,
      description,
      image: imagePath,
      createdBy: req.user.id,
      reporterEmail: req.user.email || 'unknown@campus.edu'
    });

    let item = await newItem.save();
    item = await item.populate('createdBy', 'email role');
    console.log('Item created successfully:', item.title);
    res.json(item);
  } catch (dbErr) {
    if (dbErr.name === 'ValidationError') {
      const errors = Object.values(dbErr.errors).map(val => val.message);
      return res.status(400).json({ message: `Validation Error: ${errors.join(', ')}` });
    }
    console.error('Database Error on Item Creation:', dbErr);
    res.status(500).json({ message: 'Database Connection Error' });
  }
});

// @route   PUT /api/items/:id
// @desc    Approve/Update an item status
// @access  Private (Admin only)
router.put('/:id', [auth, adminAuth], async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    if (req.body.status) {
        if (req.body.status === 'approved' || req.body.status === 'pending') {
            item.status = req.body.status;
        } else {
            return res.status(400).json({ message: 'Invalid status provided.' });
        }
    } else {
        item.status = 'approved'; 
    }

    await item.save();
    const populatedItem = await Item.findById(item._id).populate('createdBy', 'email role');
    res.json(populatedItem);
  } catch (err) {
    console.error('Error approving item:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/items/:id
// @desc    Delete an item
// @access  Private (Admin only)
router.delete('/:id', [auth, adminAuth], async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await item.deleteOne();
    res.json({ message: 'Item removed' });
  } catch (err) {
    console.error('Error deleting item:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
