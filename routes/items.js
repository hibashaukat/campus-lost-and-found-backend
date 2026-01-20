const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
// Cloudinary ke liye naye packages
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const Item = require('../models/Item');
const Comment = require('../models/Comment');
const User = require('../models/User');

const router = express.Router();

// 1. Cloudinary Storage Configuration
// Ye setup image ko direct cloud par bhejay ga
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'campus_lost_found', // Cloudinary par ye folder ban jaye ga
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5 MB limit
  }
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

// GET /api/items (All items for Admin)
router.get('/', auth, async (req, res) => {
  try {
    const items = await Item.find().populate('createdBy', 'email role').sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/items/approved (Approved items for Students)
router.get('/approved', auth, async (req, res) => {
  try {
    const items = await Item.find({ status: 'approved' }).populate('createdBy', 'email role').sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/items (Create item - Cloudinary logic added)
router.post('/', auth, upload.single('image'), async (req, res) => {
  if (req.user.role !== 'student' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const { title, description } = req.body;
  
  // AB YAHAN CHANGE HAI: req.file.path mein Cloudinary ka pura URL hota hai
  const imagePath = req.file ? req.file.path : null;

  try {
    const newItem = new Item({
      title,
      description,
      image: imagePath, // Ab database mein "https://..." save hoga
      createdBy: req.user.id,
      reporterEmail: req.user.email || 'unknown@campus.edu'
    });

    let item = await newItem.save();
    item = await item.populate('createdBy', 'email role');
    res.json(item);
  } catch (dbErr) {
    res.status(500).json({ message: 'Database Connection Error' });
  }
});

// PUT /api/items/:id (Approve)
router.put('/:id', [auth, adminAuth], async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    item.status = req.body.status || 'approved';
    await item.save();
    const populatedItem = await Item.findById(item._id).populate('createdBy', 'email role');
    res.json(populatedItem);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/items/:id
router.delete('/:id', [auth, adminAuth], async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    await item.deleteOne();
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;