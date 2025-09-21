const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const mongoose = require('mongoose');

/*
GET /messages/:conversationId?limit=20&before=<objectId>
- returns messages sorted newest->oldest (we'll send to client newest last in UI)
- cursor: `before` is an ObjectId (string). If not provided, return latest messages.
*/

router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const before = req.query.before; // ObjectId string, optional

    const query = { conversationId };

    if (before) {
      // convert before ObjectId -> timestamp cutoff
      // fetch messages with _id < before (older ones)
      query._id = { $lt: mongoose.Types.ObjectId(before) };
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 })       // newest first
      .limit(limit)
      .lean();

    // return in ascending order (oldest first) so client can append at top easily
    res.json({
      ok: true,
      messages: messages.reverse(),
      // nextCursor: the smallest _id in this batch (can be used to fetch older)
      nextCursor: messages.length ? messages[messages.length - 1]._id : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
