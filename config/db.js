<<<<<<< HEAD
const mongoose = require("mongoose");

const connectDB = async () => {
  return 0;
  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    keepAlive: true,
    maxIdleTimeMS: 30000,
    connectTimeoutMS: 30000,
  });
  console.log(
    `MongoDB холбогдлоо : ${conn.connection.host}`.cyan.underline.bold
  );
};

module.exports = connectDB;
=======
const mongoose = require("mongoose");


const connectDB = async () => {
  
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    keepAlive: true,
    maxIdleTimeMS: 30000,
    connectTimeoutMS: 30000, 
  });
  console.log(
    `MongoDB холбогдлоо : ${conn.connection.host}`.cyan.underline.bold
  );

  
};

module.exports = connectDB;
>>>>>>> 94a3ccd41cee7fce5fc5bafab9cd91c98bd08413
