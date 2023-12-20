const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");
const zlib = require("zlib");

const {
  createComment,
  updateComment,
  deleteComment,
  getComment,
  getComments,
} = require("../controller/comments");
const { updateCom } = require("../controller/books.js");

//"/api/v1/comments"
router
  .route("/")
  .get(getComments)
  .post(protect, authorize("admin", "operator", "user"), createComment);
// .patch(updateCom);

router
  .route("/:id")
  .get(getComment)
  .patch(protect, authorize("admin", "operator", "user"), updateCom)
  .post(protect, authorize("admin", "operator", "user"), updateCom)
  .delete(protect, authorize("admin", "operator", "user"), deleteComment);

module.exports = router;
