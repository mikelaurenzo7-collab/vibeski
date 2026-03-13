import type { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { storage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "production"
  ? (() => { throw new Error("JWT_SECRET must be set in production"); })()
  : "field-of-dreams-dev-secret") as string;
const TOKEN_EXPIRY = "7d";

export interface AuthRequest extends Request {
  userId?: string;
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const authMiddleware: RequestHandler = (req: AuthRequest, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      req.userId = decoded.userId;
    } catch (err) {
      console.error("JWT verification failed:", err instanceof Error ? err.message : err);
    }
  }
  next();
};

export const requireAuth: RequestHandler = (req: AuthRequest, res, next) => {
  if (!req.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
};
