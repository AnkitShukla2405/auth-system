import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required." });
  }

  try {
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "student",
      },
    });

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "An internal server error occurred" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  try {

    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) return res.status(400).json({ error: "User not Found" });

    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(400).json({ error: "Wrong password" });

    const accessToken = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });

    await prisma.refresh_token.create({
      data: {
        user_id: user.id,
        token: refreshToken,
      },
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Logged in successfully",
      accessToken: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
};

export const refresh = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ msg: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    if (!decoded) return res.status(403).json({ msg: "Invalid token" });

    const tokenExists = await prisma.refresh_token.findFirst({
      where: { token },
    });

    if (!tokenExists) {
      return res.status(403).json({ msg: "Token not found" });
    }

    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
    });

    if (!user) return res.status(404).json({ msg: "User not found" });

    const newRefreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });

    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" },
    );

    await prisma.refresh_token.deleteMany({
      where: { token },
    });

    await prisma.refresh_token.create({
      data: {
        user_id: user.id,
        token: newRefreshToken,
      },
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(403).json({ msg: "Invalid or expired token" });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(200).json({ msg: "No token, already logged out" });
    }

    await prisma.refresh_token.deleteMany({
      where: { token },
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    return res.status(200).json({ msg: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ error: err.message });
  }
};
