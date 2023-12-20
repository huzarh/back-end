const express = require("express");
const dotenv = require("dotenv");
var path = require("path");
var rfs = require("rotating-file-stream");
const colors = require("colors");
var morgan = require("morgan");
const logger = require("./middleware/logger");
const fileupload = require("express-fileupload");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const http = require("http");
const bodyParser = require("body-parser");

// Router оруулж ирэх
const usersRoutes = require("./routes/users");
const categoriesRoutes = require("./routes/categories");
const booksRoutes = require("./routes/books");
const stepsRoutes = require("./routes/steps");
const commentsRoutes = require("./routes/comments");
const injectDb = require("./middleware/injectDb");
const errorHandler = require("./middleware/error");
const connectDB = require("./config/db");
const socketIO = require("socket.io");
// Аппын тохиргоог process.env рүү ачаалах
dotenv.config({ path: "./config/config.env" });

// Mysql тэй ажиллах обьект
const db = require("./config/db-mysql");

// Express апп үүсгэх
const app = express();
const server = http.createServer(app);
const io = socketIO(server, { pingTimeout: 60000, cors: { origin: "*" } });

// MongoDB өгөгдлийн сантай холбогдох
connectDB();

// Манай рест апиг дуудах эрхтэй сайтуудын жагсаалт
// var whitelist = [
//   "http://localhost:3000",
//   "http://192.168.0.111:3000",
//   "http://192.168.1.86:3000",
// ];

// // Өөр домэйн дээр байрлах клиент вэб аппуудаас шаардах шаардлагуудыг энд тодорхойлно
// function (origin, callback) {
//   if (origin === undefined || whitelist.indexOf(origin) !== -1) {
//     // Энэ домэйнээс манай рест рүү хандахыг зөвшөөрнө
//     callback(null, true);
//   } else {
//     // Энэ домэйнд хандахыг хориглоно.
//     callback(new Error("Horigloj baina.."));
//   }
// }
var corsOptions = {
  // Ямар ямар домэйнээс манай рест апиг дуудаж болохыг заана
  origin: "*",

  // Клиент талаас эдгээр http header-үүдийг бичиж илгээхийг зөвшөөрнө
  allowedHeaders: "Authorization, Set-Cookie, Content-Type",
  // Клиент талаас эдгээр мэссэжүүдийг илгээхийг зөвөөрнө
  methods: "GET,PUT,POST,DELETE,PATCH,OPTIONS",
  // Клиент тал authorization юмуу cookie мэдээллүүдээ илгээхийг зөвшөөрнө
  credentials: true,
};

// index.html-ийг public хавтас дотроос ол гэсэн тохиргоо
app.use(express.static(path.join(__dirname, "public")));

// Express rate limit : Дуудалтын тоог хязгаарлана
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 100 requests per windowMs
  message: "15 минутанд 3 удаа л хандаж болно! ",
});
app.use(limiter);

// ------ limit MB -----
app.use(bodyParser.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ limit: "500mb", extended: true }));
// http parameter pollution халдлагын эсрэг books?name=aaa&name=bbb  ---> name="bbb"
app.use(hpp());
// Cookie байвал req.cookie рүү оруулж өгнө
app.use(cookieParser());
// Бидний бичсэн логгер
app.use(logger);
// Body дахь өгөгдлийг Json болгож өгнө
app.use(express.json());
// Өөр өөр домэйнтэй вэб аппуудад хандах боломж өгнө
//corsOptions

app.use(cors());
// Клиент вэб аппуудыг мөрдөх ёстой нууцлал хамгаалалтыг http header ашиглан зааж өгнө
app.use(helmet());
// клиент сайтаас ирэх Cross site scripting халдлагаас хамгаална
app.use(xss());
// Клиент сайтаас дамжуулж буй MongoDB өгөгдлүүдийг халдлагаас цэвэрлэнэ
app.use(mongoSanitize());
// Сэрвэр рүү upload хийсэн файлтай ажиллана
app.use(fileupload());
// req.db рүү mysql db болон sequelize моделиудыг оруулна
app.use(injectDb(db));

// Morgan logger-ийн тохиргоо
var accessLogStream = rfs.createStream("access.log", {
  interval: "1d", // rotate daily
  path: path.join(__dirname, "log"),
});
app.use(morgan("combined", { stream: accessLogStream }));

// REST API RESOURSE stepsRoutes
app.use("/api/v1/categories", categoriesRoutes);
app.use("/api/v1/books", booksRoutes);
app.use("/api/v1/steps", stepsRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/comments", commentsRoutes);

app.use("/files", express.static(path.join(__dirname, "files")));

// Define a route to handle the file download
app.get("/download", (req, res) => {
  const filePath = path.join(__dirname, "files", "biturk.apk");
  res.download(filePath, "biturk.apk");
});

// Алдаа үүсэхэд барьж авч алдааны мэдээллийг клиент тал руу автоматаар мэдээлнэ
app.use(errorHandler);

server.listen(
  process.env.PORT || 8000,
  console.log(`Express сэрвэр ${process.env.PORT} порт дээр аслаа... `.rainbow)
);

// Баригдалгүй цацагдсан бүх алдаануудыг энд барьж авна
process.on("HunhandledRejection", (err, promise) => {
  console.log(`Алдаа гарлаа : ${err.message}`.underline.red.bold);
  server.close(() => {
    process.exit(1);
  });
});
