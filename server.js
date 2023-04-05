const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

//DB 스키마
const User = require("./models/users.js");
const Freeboard = require("./models/freeboard.js");
const practicePost = require("./models/practiceboard.js");
const livePost = require("./models/liveboard.js");

//dotenv
dotenv.config();

//익스프레스
const app = express();

//app.use
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

//서버, DB 연결
app.listen("3000", () => {
  console.log("listening on Server");
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(console.log("DB listening at MongoDB"))
    .catch((err) => console.log(err));
});

app.get("/", async (req, res) => {
  res.send({ Message: "서버가 성공적으로 배포되었습니다!" });
});

//POST 로그인 요청
app.post("/api/login", async (req, res) => {
  const loginId = req.body.loginId;
  const loginPw = req.body.loginPw;

  if (!loginId || !loginPw)
    return res.status(422).json({ message: "빈칸을 채워주세요" });

  const user = await User.findOne({ loginId }).exec();

  if (!user)
    return res.status(401).json({ message: "이메일 또는 비밀번호가 다릅니다" });

  const match = await bcrypt.compare(loginPw, user.loginPw);

  if (!match)
    return res.status(401).json({ message: "이메일 또는 비밀번호가 다릅니다" });

  const token = jwt.sign(
    { userId: user._id, username: user.username },
    "jwt_secret_key",
    { expiresIn: "7h" }
  );

  return res
    .status(200)
    .json({ success: true, user: { username: user.username }, token });
});

//POST 회원가입 요청
app.post("/api/register", async (req, res) => {
  const { username, loginId, loginPw } = req.body;
  if (!username) {
    return res.status(404).json({ message: "닉네임을 입력하세요" });
  }
  if (!loginId) {
    return res.status(404).json({ message: "아이디를 입력하세요" });
  }
  if (!loginPw) {
    return res.status(404).json({ message: "비밀번호를 입력하세요" });
  }

  const userExists = await User.exists({ loginId }).exec();

  if (userExists)
    return res.status(409).json({ message: "이미 사용중인 아이디 입니다" });

  try {
    hashedPassword = await bcrypt.hash(loginPw, 10);

    await User.create({ username, loginId, loginPw: hashedPassword });

    return res.status(201).json({ message: "회원가입 성공" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "회원가입에 실패하였습니다" });
  }
});

//POST 닉네임 중복확인 요청
app.post("/duplication", async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(404).json({ Message: "닉네임을 입력하세요" });
  }
  const usernameExists = await User.exists({ username }).exec();
  if (usernameExists) {
    return res
      .status(409)
      .json({ success: false, Message: "이미 사용중인 닉네임 입니다" });
  } else {
    return res
      .status(200)
      .json({
        username: username,
        success: true,
        Message: "사용가능한 닉네임 입니다",
      });
  }
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 자유게시판

let freeboardcount = 0
//POST 자유게시판 글 작성 요청
app.post("/write/freeboard", async (req, res) => {
  const { userId, title, content } = req.body;

  freeboardcount++

  const date = new Date();
  const newDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const year = newDate.getFullYear();
  const month = String(newDate.getMonth() + 1).padStart(2, "0");
  const day = String(newDate.getDate()).padStart(2, "0");
  const hour = String(newDate.getHours()).padStart(2, "0");
  const minute = String(newDate.getMinutes()).padStart(2, "0");
  const second = String(newDate.getSeconds()).padStart(2, "0");

  try {
    const findUser = await User.findOne({ _id: userId }).exec();
    if (!findUser) {
      return res.status(404).json({ Message: "유저를 찾을 수 없습니다" });
    }
    const post = new Freeboard({
      title,
      content,
      user: findUser._id,
      newDate: `${year}.${month}.${day} ${hour}:${minute}`,
      postNumber: freeboardcount
    });
    await post.save();
    return res.status(201).json({ success: true, Message: "글 작성 성공" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, Message: "글 작성에 실패하였습니다" });
  }
});

//GET 자유게시판 모든 글 요청
app.get("/allposts/freeboard", async (req, res) => {
  // allposts로 get요청이 들어오면 DB의 POST에서 모든 글을 찾아라 그리고 그것을 응답해라
  try {
    const allPosts = await Freeboard.find()
    .sort({ postNumber : -1 })
    .populate({
      path: "user",
      select: "username",
    });
    res.status(200).json(allPosts);
  } catch (error) {
    console.log(error);
    res.status(500).send("서버 에러 발생");
  }
});

//GET 자유게시판 글 상세페이지 요청
app.get("/freeboard/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Freeboard.findById(id).populate({
      path: "user",
      select: "username",
    });

    if (!post) {
      return res.json({ Message: "포스트를 찾을 수 없습니다" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.log(error);
  }
});

//DELETE 자유게시판 글 삭제 요청
app.delete("/freeboard/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Freeboard.findByIdAndRemove(id);
    res.json({ Message: "포스트가 삭제되었습니다" });
  } catch (error) {
    console.log(error);
  }
});

//PUT 자유게시판 글 수정 요청
app.put("/freeboard/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ Message: "포스트를 찾을 수 없습니다" });
    }

    const updatePost = { title, content };
    await Freeboard.findByIdAndUpdate(id, updatePost, { new: true });
    res.json(updatePost);
  } catch (error) {
    console.log(error);
  }
});

var commentcount = 0
//PUT 자유게시판 댓글 작성 요청
app.put("/freeboard/write/comment/:id", async (req, res) => {

  try {

    newcount++

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
  
    const { id } = req.params;
  
    const { comment, commentBy } = req.body;
  
    const post = await Freeboard.findById(id);

    if (!post) {
      return res.status(404).json({ message: "포스트를 찾을 수 없습니다" });
    }

    const newComment = {
      comment: comment,
      commentBy: commentBy,
      commentNewDate: `${year}.${month}.${day} ${hour}:${minute}`,
      commentNumber: commentcount
    };

    post.comments.push(newComment);
    const updatePost = await post.save();
    res.status(201).json(updatePost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//DELETE 자유게시판 댓글 삭제 요청
app.delete("/freeboard/delete/comment/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Freeboard.findByIdAndUpdate(
      req.body.postId,
      { $pull: { comments: { _id: id } } },
      { new: true }
    );
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "서버 오류 발생" });
  }
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 연습게시판

//POST 연습게시판 글 작성 요청
app.get('/allposts/practiceboard', async (req, res) => {

})


