const Step = require("../models/Step");
const path = require("path");
const Category = require("../models/Category");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");
const paginate = require("../utils/paginate");
const User = require("../models/User");
const { Configuration, OpenAIApi } = require("openai");
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPEN_AI_API_KEY,
  })
);

exports.aiChat = async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt + " türkçe cevap ver" }],
    });

    const aiAnswer = response.data.choices[0].message.content;
    res.status(200).json({
      success: true,
      data: aiAnswer,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error });
  }
};

// api/v1/steps

exports.getSteps = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const sort = req.query.sort;
  const select = req.query.select;

  [("select", "sort", "page", "limit")].forEach((el) => delete req.query[el]);

  const pagination = await paginate(page, limit, Step);

  const steps = await Step.find(req.query, select)
    .populate({
      path: "category",
      select: "name averagePrice",
    })
    .sort(sort)
    .skip(pagination.start - 1)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: steps.length,
    data: steps,
    pagination,
  });
});

exports.getUserSteps = asyncHandler(async (req, res, next) => {
  req.query.createUser = req.userId;
  return this.getSteps(req, res, next);
});

// api/v1/categories/:catId/steps
exports.getCategorySteps = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 2;
  const sort = req.query.sort;
  const select = req.query.select;

  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

  const pagination = await paginate(page, limit, Step);

  //req.query, select
  const steps = await Step.find(
    { ...req.query, category: req.params.categoryId },
    select
  )
    .sort(sort)
    .skip(pagination.start - 1)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: steps.length,
    data: steps,
    pagination,
  });
});

exports.getStep = asyncHandler(async (req, res, next) => {
  const step = await Step.findById(req.params.id);

  if (!step) {
    throw new MyError(req.params.id + " ID-тэй ном байхгүй байна.", 404);
  }

  res.status(200).json({
    success: true,
    data: step,
  });
});

exports.createCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.create(req.body);

  res.status(200).json({
    success: true,
    data: category,
  });
});

exports.createStep = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.body.category);

  if (!category) {
    throw new MyError(req.body.category + " ID-тэй категори байхгүй!", 400);
  }

  req.body.createUser = req.userId;

  const step = await Step.create(req.body);

  res.status(200).json({
    success: true,
    data: step,
  });
});

exports.deleteStep = asyncHandler(async (req, res, next) => {
  const step = await Step.findById(req.params.id);

  if (!step) {
    throw new MyError(req.params.id + " ID-тэй ном байхгүй байна.", 404);
  }

  if (step.createUser.toString() !== req.userId && req.userRole !== "admin") {
    throw new MyError("Та зөвхөн өөрийнхөө номыг л засварлах эрхтэй", 403);
  }

  const user = await User.findById(req.userId);

  step.remove();

  res.status(200).json({
    success: true,
    data: step,
    whoDeleted: user.name,
  });
});

//--------

exports.updateCom = async (req, res, next) => {
  const step = await Step.findById(req.params.id);

  if (!step) return res.status(404).send(" ID-тэй ном байхгүйээээ.");

  // user.userPoint = user.userPoint + req.body.userPoint;
  step.comment = null;
  step.comment = req.body.comment;

  const result = await step.save();

  res.status(200).json({
    success: true,
    data: result,
  });
};

exports.updateStep = asyncHandler(async (req, res, next) => {
  const step = await Step.findById(req.params.id);

  if (!step) {
    throw new MyError(req.params.id + " ID-тэй ном байхгүйээээ.", 400);
  }

  // if (step.createUser.toString() !== req.userId && req.userRole !== "admin") {
  //   throw new MyError("Та зөвхөн өөрийнхөө номыг л засварлах эрхтэй", 403);
  // }

  req.body.updateUser = req.userId;

  for (let attr in req.body) {
    step[attr] = req.body[attr];
  }

  step.save();

  res.status(200).json({
    success: true,
    data: step,
  });
});

// PUT:  api/v1/steps/:id/photo
exports.uploadStepPhoto = asyncHandler(async (req, res, next) => {
  const step = await Step.findById(req.params.id);

  if (!step) {
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

    step.photo = file.name;
    step.save();

    res.status(200).json({
      success: true,
      data: file.name,
    });
  });
});
