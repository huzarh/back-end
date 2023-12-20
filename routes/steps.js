const express = require("express");
const { protect, authorize } = require("../middleware/protect");

const {
  getSteps,
  getStep,
  createStep,
  deleteStep,
  updateStep,
  uploadStepPhoto,
  aiChat,
} = require("../controller/step");

const { getBookComments } = require("../controller/comments");

const router = express.Router();

//"/api/v1/steps"
router
  .route("/")
  .get(getSteps)
  .post(createStep);

router.post("/aichat", aiChat);

router
  .route("/:id")
  .get(getStep)
  .delete(protect, authorize("admin", "operator"), deleteStep)
  .put(protect, authorize("admin", "operator"), updateStep);

router
  .route("/:id/upload-photo")
  .put(protect, authorize("admin", "operator"), uploadStepPhoto);

router.route("/:id/comments").get(getBookComments);

module.exports = router;
