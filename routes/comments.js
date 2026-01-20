const express = require('express');
const jwt = require('jsonwebtoken');
const Comment = require('../models/Comment');
const Item = require('../models/Item');
const router = express.Router();

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

// @route   POST /api/comments
// @desc    Post a new comment or reply to an approved item
// @access  Private (Students and Admins)
router.post('/', auth, async (req, res) => {
  const { itemId, content, parentCommentId } = req.body;

  if (!itemId || !content) {
    return res.status(400).json({ message: 'Please provide itemId and content' });
  }

  try {
    // 1. Ensure the item exists and is approved
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Report not found' });
    }
    if (item.status !== 'approved') {
      return res.status(403).json({ message: 'Cannot comment on unapproved reports' });
    }

    // 2. Create the new comment
    const newComment = new Comment({
      itemId,
      userId: req.user.id,
      content,
      parentCommentId: parentCommentId || null,
    });

    const comment = await newComment.save();
    // Populate user details for the response
    await comment.populate('userId', 'email role');
    
    res.status(201).json(comment);

  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid itemId or parentCommentId format' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/comments/:itemId
// @desc    Get all comments for a specific item, sorted by creation date
// @access  Private (Students and Admins)
router.get('/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;

    // Optional: Check if item is approved before fetching comments
    const item = await Item.findById(itemId);
    if (!item || item.status !== 'approved') {
        return res.status(404).json({ message: 'Approved item not found or inaccessible' });
    }

    // Fetch all comments and populate user info
    const comments = await Comment.find({ itemId })
      .populate('userId', 'email role')
      .sort({ createdAt: 1 });

    res.json(comments);

  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid itemId format' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
