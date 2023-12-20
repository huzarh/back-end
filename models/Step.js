const mongoose = require("mongoose");
const { transliterate, slugify } = require("transliteration");

const stepSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Konu ismin yazmanız lazım !"],
      unique: true,
      trim: true,
      maxlength: [100, "Konu adı en fazla 250 karakter uzunluğunda olmalıdır !"],
    },
    desc: {
        type: String,
        required: [true, "Konu tanımın yazmanız lazım"],
        maxlength: [5000, "Konu açıklamasının maksimum uzunluğu 5000 karakter olmalıdır !"],
    },
    exampleSentence: {
        type: [String],
        trim: true,
        maxlength: [250, "Konu açıklamasının maksimum uzunluğu 5000 karakter olmalıdır !"],
    },
    audio: {
      type: String,
      trim: true
    },
    video: {
      type: String,
      trim: true
    },
    photo: {
      type: [String],
      trim: true
    },
    desc2: {
      type: String,
      maxlength: [3000, "Konu açıklamasının maksimum uzunluğu 5000 karakter olmalıdır !"],
  },
    stepExam: {
        type: [Object],
        trim: true,
        default:[]
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: true,
    },

    createUser: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },

    updateUser: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

stepSchema.statics.computeCategoryAveragePrice = async function (catId) {
  const obj = await this.aggregate([
    { $match: { category: catId } },
    { $group: { _id: "$category", avgStudent: { $avg: "$price" } } },
  ]);

  console.log(obj);
  let avgStudent = null;

  if (obj.length > 0) avgStudent = obj[0].avgStudent;

  await this.model("Category").findByIdAndUpdate(catId, {
    averagePrice: avgStudent,
  });

  return obj;
};

stepSchema.post("save", function () {
  this.constructor.computeCategoryAveragePrice(this.category);
});


stepSchema.post("remove", function () {
  this.constructor.computeCategoryAveragePrice(this.category);
});

stepSchema.virtual("zohiogch").get(function () {
  // this.author
  if (!this.author) return "";

  let tokens = this.author.split(" ");
  if (tokens.length === 1) tokens = this.author.split(".");
  if (tokens.length === 2) return tokens[1];

  return tokens[0];
});

module.exports = mongoose.model("Step", stepSchema);
//fuck