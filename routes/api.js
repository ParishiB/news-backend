import { Router } from "express";
import AuthController from "../controllers/AuthController.js";
import ProfileController from "../controllers/ProfileController.js";
import authMiddleware from "../middleware/Authenticate.js";
import NewsController from "../controllers/NewsController.js";
import redisCache from "../DB/redis.config.js";

const router = Router();

router.post("/auth/register", AuthController.register);
router.post("/auth/login", AuthController.login);
router.get("/send-email", AuthController.sendTestEmail);
router.get("/profile", authMiddleware, ProfileController.index); //Private route
router.put("/profile/:id", authMiddleware, ProfileController.update); //Private route

router.get("/news", redisCache.route(), NewsController.index);
router.post("/news", authMiddleware, NewsController.store);
router.get("/news/:id", NewsController.show);
router.put("/news/:id", NewsController.update);
router.delete("/news/:id", NewsController.destroy);
export default router;
