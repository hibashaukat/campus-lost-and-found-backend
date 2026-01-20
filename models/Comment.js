const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  parentCommentId: { // For replies, this refers to the comment being replied to
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// We don't strictly need to index reportId on its own for this specific task, 
// but indexing on [reportId, parentCommentId] or just reportId can speed up fetching comments for a report.
commentSchema.index({ itemId: 1 });
commentSchema.index({ itemId: 1, parentCommentId: 1 }); // For fast fetching of thread/replies

module.exports = mongoose.model('Comment', commentSchema);