const mongoose = require("mongoose");

const practiceboardSchema = mongoose.Schema({
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
      },
      commentNumber : {
        type: Number,
        unique: true,
        default: 0,
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
    default: 0,
  }
});

const Practiceboard = mongoose.model("Practiceboard", practiceboardSchema);
module.exports = Practiceboard;
