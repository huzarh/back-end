const Book = require("../models/Book");
const path = require("path");
const Category = require("../models/Category");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");
const paginate = require("../utils/paginate");
const User = require("../models/User");
const dotenv = require("dotenv");
const axios = require("axios");
var gtts = require("node-gtts")("tr");
dotenv.config({ path: "./config/config.env" });

const translateText = async (text) => {
  try {
    console.log(
      "\n--------------------- translate ---------------------\n",
      text
    );
    const response = await axios.get(
      `https://api.mymemory.translated.net/get?q=${text}&langpair=en|tr`
    );

    const translatedText = response.data.responseData.translatedText;
    console.log(
      "\n---------------------\n",
      translatedText,
      "\n--------------------- exit translate ---------------------\n"
    );
    return translatedText;
  } catch (error) {
    console.error("Error TRANSLATE !!! \n\n ", error);
    throw error;
  }
};
exports.aiChat = async (req, res) => {
  const { prompt } = req.body;
  import("node-llama-cpp").then(async (mod) => {
    const { LlamaModel, LlamaContext, LlamaChatSession } = mod;

    const modelPath = path.resolve(
      "./models/mistral-7b-instruct-v0.1.Q2_K.gguf"
    );
    const model = new LlamaModel({ modelPath });

    const context = new LlamaContext({ model });
    const session = new LlamaChatSession({ context });

    const quistion = await session.prompt(prompt, {
      maxTokens: 50,
    });
    const translated = await translateText(quistion);
    gtts.save("test.mp3", translated, function () {
      console.log("save done");
    });
    res.status(200).json({
      success: true,
      data: translated,
    });
  });
  // import("./test.js").then((mod) => {
  //   console.log(mod.msg);
  //   res.status(200).json({
  //     success: true,
  //     data: mod.msg,
  //   });
  // });
};

// api/v1/books

exports.getBooks = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const sort = req.query.sort;
  const select = req.query.select;

  [("select", "sort", "page", "limit")].forEach((el) => delete req.query[el]);

  const pagination = await paginate(page, limit, Book);

  const books = await Book.find(req.query, select)
    .populate({
      path: "category",
      select: "name averagePrice",
    })
    .sort(sort)
    .skip(pagination.start - 1)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: books.length,
    data: books,
    pagination,
  });
});

exports.getUserBooks = asyncHandler(async (req, res, next) => {
  req.query.createUser = req.userId;
  return this.getBooks(req, res, next);
});

// api/v1/categories/:catId/books
exports.getCategoryBooks = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 2;
  const sort = req.query.sort;
  const select = req.query.select;

  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

  const pagination = await paginate(page, limit, Book);

  //req.query, select
  const books = await Book.find(
    { ...req.query, category: req.params.categoryId },
    select
  )
    .sort(sort)
    .skip(pagination.start - 1)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: books.length,
    data: books,
    pagination,
  });
});

exports.getBook = asyncHandler(async (req, res, next) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    throw new MyError(req.params.id + " ID-тэй ном байхгүй байна.", 404);
  }

  res.status(200).json({
    success: true,
    data: book,
  });
});

exports.createCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.create(req.body);

  res.status(200).json({
    success: true,
    data: category,
  });
});

exports.createBook = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.body.category);

  if (!category) {
    throw new MyError(req.body.category + " ID-тэй категори байхгүй!", 400);
  }

  req.body.createUser = req.userId;

  const book = await Book.create(req.body);

  res.status(200).json({
    success: true,
    data: book,
  });
});

exports.deleteBook = asyncHandler(async (req, res, next) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    throw new MyError(req.params.id + " ID-тэй ном байхгүй байна.", 404);
  }

  if (book.createUser.toString() !== req.userId && req.userRole !== "admin") {
    throw new MyError("Та зөвхөн өөрийнхөө номыг л засварлах эрхтэй", 403);
  }

  const user = await User.findById(req.userId);

  book.remove();

  res.status(200).json({
    success: true,
    data: book,
    whoDeleted: user.name,
  });
});

//--------

exports.updateCom = async (req, res, next) => {
  const book = await Book.findById(req.params.id);

  if (!book) return res.status(404).send(" ID-тэй ном байхгүйээээ.");

  // user.userPoint = user.userPoint + req.body.userPoint;
  book.comment = null;
  book.comment = req.body.comment;

  const result = await book.save();

  res.status(200).json({
    success: true,
    data: result,
  });
};

exports.updateBook = asyncHandler(async (req, res, next) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    throw new MyError(req.params.id + " ID-тэй ном байхгүйээээ.", 400);
  }

  if (book.createUser.toString() !== req.userId && req.userRole !== "admin") {
    throw new MyError("Та зөвхөн өөрийнхөө номыг л засварлах эрхтэй", 403);
  }

  req.body.updateUser = req.userId;

  for (let attr in req.body) {
    book[attr] = req.body[attr];
  }

  book.save();

  res.status(200).json({
    success: true,
    data: book,
  });
});

// PUT:  api/v1/books/:id/photo
exports.uploadBookPhoto = asyncHandler(async (req, res, next) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    throw new MyError(req.params.id + " ID-тэй ном байхгүйээ.", 400);
  }

  // image upload

  const file = req.files.file;

  if (!file.mimetype.startsWith("image")) {
    throw new MyError("Та зураг upload хийнэ үү.", 400);
  }

  if (file.size > process.env.MAX_UPLOAD_FILE_SIZE) {
    throw new MyError("Таны зурагны хэмжээ хэтэрсэн байна.", 400);
  }

  file.name = `photo_${req.params.id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, (err) => {
    if (err) {
      throw new MyError(
        "Файлыг хуулах явцад алдаа гарлаа. Алдаа : " + err.message,
        400
      );
    }

    book.photo = file.name;
    book.save();

    res.status(200).json({
      success: true,
      data: file.name,
    });
  });
});
