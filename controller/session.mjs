const path = require("path");
const dotenv = require("dotenv");
const {
  LlamaModel,
  LlamaContext,
  LlamaChatSession,
} = require("node-llama-cpp");
const { fileURLToPath } = require("url");

dotenv.config({ path: "./config/config.env" });
const ss = path.dirname(fileURLToPath(import.meta.url));
const model = new LlamaModel({
  modelPath: path.join(ss, "models", "mistral-7b-instruct-v0.1.Q2_K.gguf"),
});
const context = new LlamaContext({ model });
const session = new LlamaChatSession({ context });
exports.session = session;
