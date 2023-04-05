const mongoose = require("mongoose");

const boardSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  comments: [
    {
      comment: {
        type: String,
      },
      commentBy: {
        type: String,
        required: true,
      },
      commentAt: {
        type: Date,
        required: true,
        default: Date.now()
      },
      commentNewDate: {
        type: String,
        required: true,
      }
    },
  ],
  created_at: {
    type: Date,
    default: Date.now() + 9 * 60 * 60 * 1000, // 한국 시간
    required: true,
  },
  newDate: {
    type: String,
    required: true,
  },
  postNumber: {
    type: Number,
    unique: true,
  }
});

const Board = mongoose.model("Board", boardSchema);
module.exports = Board;
