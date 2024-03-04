import express from "express";
import "dotenv/config";
import ApiRoutes from "./routes/api.js";
import fileUpload from "express-fileupload";
import helmet from "helmet";
import cors from "cors";
import { limiter } from "./config/ratelimiter.js";
import logger from "./config/logger.js";
const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(fileUpload());
app.use(helmet());
app.use(cors());
app.use(limiter);

app.get("/", (req, res) => {
  res.json({ message: "App is working" });
});

app.use("/api", ApiRoutes);

// logger
logger.info("Hey I am just testing...");

// jobs import
import "./jobs/index.js";
app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));
