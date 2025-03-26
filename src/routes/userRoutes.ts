import express from 'express';
import { registerUser, loginUser, verifyEmail, forgotPassword, resetPassword } from '../controllers/userControllers';
import { RequestHandler } from 'express';

const router = express.Router();

router.post('/register', registerUser as RequestHandler);
router.post('/login', loginUser as RequestHandler);
router.get("/verify-email", verifyEmail as RequestHandler);
router.post("/forgot-password", forgotPassword as RequestHandler);
router.post("/reset-password", resetPassword as RequestHandler);


export default router;
