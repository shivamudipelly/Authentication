import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

// Extend the IUser interface to include comparePassword method
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: "USER" | "ADMIN" | "DRIVER";
    isVerified: boolean;
    verificationToken?: string;
    verificationTokenExpires?: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, unique: true, required: true },
        password: { type: String, required: true },
        role: { type: String, enum: ["USER", "ADMIN", "DRIVER"], default: "USER" },
        isVerified: { type: Boolean, default: false },
        verificationToken: { type: String },
        verificationTokenExpires: { type: Date },
    },
    { timestamps: true }
);

// Pre-save hook to hash the password if it's modified or new
UserSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(this.password, salt);
        this.password = hash;
        next();
    } catch (error: unknown) {
        next(error as Error); // Cast the error to Error before passing to next()
    }
});


// Instance method to compare candidate password with hashed password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);
