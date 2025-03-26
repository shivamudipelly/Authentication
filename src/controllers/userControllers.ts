import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/User";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail";
import jwt from "jsonwebtoken";

// Constants for token expiration and JWT configuration
const TOKEN_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour
const JWT_EXPIRATION = "1d";

// Interface for email options to ensure consistency
interface IEmailOptions {
    subject: string;
    html: string;
}

// Helper: Generate a random token string
const generateToken = (): string => crypto.randomBytes(32).toString("hex");

// Helper: Set token and expiration on the user document and persist it
const setVerificationToken = async (user: IUser): Promise<void> => {
    user.verificationToken = generateToken();
    user.verificationTokenExpires = new Date(Date.now() + TOKEN_EXPIRATION_MS);
    await user.save();
};

// Helper: Send verification email using provided email options
const sendVerificationEmail = async (user: IUser): Promise<void> => {
    await setVerificationToken(user);

    const verificationLink = `${process.env.FRONTEND_URL}/api/users/verify-email?token=${user.verificationToken}`;
    const emailOptions: IEmailOptions = {
        subject: "Verify Your Email",
        html: `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333;">Hello ${user.name},</h2>
            <p style="color: #555;">Thank you for registering! Please click the link below to verify your email address and complete the registration process:</p>
            <a href="${verificationLink}" style="display: inline-block; background-color: #4CAF50; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Verify Your Email</a>
            <p style="color: #555; margin-top: 20px;">If you did not request this, please ignore this email.</p>
            <footer style="margin-top: 30px; font-size: 12px; color: #888;">&copy; 2025 EliteX</footer>
          </div>
        </body>
      </html>
    `,
    };

    await sendEmail(user.email, emailOptions.subject, emailOptions.html);
};

// Register a new user or resend verification email if not verified
export const registerUser = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    const { name, email, password, role } = req.body;

    try {
        let user = await User.findOne({ email });

        if (user) {
            if (user.isVerified) {
                return res.status(400).json({ error: "Email already verified. Please log in." });
            } else {
                await sendVerificationEmail(user);
                return res.status(200).json({ message: "Verification email resent. Please check your inbox." });
            }
        }

        // Create a new user and send verification email
        user = new User({ name, email, password, role, isVerified: false });
        await sendVerificationEmail(user);

        return res.status(201).json({ message: "Verification email sent. Please check your inbox." });
    } catch (err) {
        next(err);
    }
};

// Verify user's email using the provided token
export const verifyEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    const token = req.query.token as string | undefined;
    if (!token) return res.status(400).json({ error: "Verification token is missing." });

    try {
        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired verification token." });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        return res.status(200).json({ message: "Email verified successfully. You can now log in." });
    } catch (err) {
        next(err);
    }
};

// Login user and generate a JWT, set as HTTP-only cookie
export const loginUser = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne<IUser>({ email });

        if (user && !user.isVerified) {
            return res.status(403).json({ error: "Email not verified. Please check your inbox." });
        }

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: JWT_EXPIRATION }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
        });

        return res.status(200).json({ message: "Login successful", token });
    } catch (err) {
        next(err as Error);
    }
};

// Handle forgot password: generate a reset token and send reset email
export const forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    const { email } = req.body;

    try {
        const user = await User.findOne<IUser>({ email });
        if (!user) {
            return res.status(200).json({
                message: "If a user exists with that email, a reset link has been sent.",
            });
        }

        // Reusing verificationToken for password reset (consider separating these in a real-world app)
        user.verificationToken = generateToken();
        user.verificationTokenExpires = new Date(Date.now() + TOKEN_EXPIRATION_MS);
        await user.save();

        const resetLink = `${process.env.FRONTEND_URL}/api/users/reset-password?token=${user.verificationToken}`;
        const emailOptions: IEmailOptions = {
            subject: "Password Reset Request",
            html: `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333;">Hello ${user.name},</h2>
              <p style="color: #555;">We received a request to reset your password. If you did not request this, please ignore this email.</p>
              <p style="color: #555;">To reset your password, click the link below:</p>
              <a href="${resetLink}" style="display: inline-block; background-color: #FF5722; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Reset Password</a>
              <p style="color: #555; margin-top: 20px;">This link will expire in 1 hour.</p>
              <footer style="margin-top: 30px; font-size: 12px; color: #888;">&copy; 2025 EliteX</footer>
            </div>
          </body>
        </html>
      `,
        };

        await sendEmail(user.email, emailOptions.subject, emailOptions.html);
        return res.status(200).json({
            message: "If a user exists with that email, a reset link has been sent.",
        });
    } catch (err) {
        next(err);
    }
};

// Reset password: validate token and update user's password
export const resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    const token = req.query.token as string | undefined;
    if (!token) return res.status(400).json({ error: "Reset token is missing." });

    const { password } = req.body;

    try {
        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired reset token. Please try again." });
        }

        user.password = password;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        return res.status(200).json({ message: "Password reset successfully." });
    } catch (err) {
        next(err);
    }
};
