import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import { db } from "./config/db.js";
import cors from "cors";
import dashboardRouter from "./routes/protectedRoutes.js";

dotenv.config();

const app = express();


const connectWithRetry = async () => {
  let retries = 0;

  while (retries < 5) {
    try {
      const connection = await db.getConnection();
      console.log("MySQL Connected ✅");
      connection.release();
      return true;
    } catch (error) {
      retries++;
      console.log(`Retrying DB connection... (${retries})`);
      await new Promise((res) => setTimeout(res, 5000));
    }
  }

  console.log("Max retries reached ❌");
  return false;
};

const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

app.use("/auth", authRoutes);
app.use("/", dashboardRouter);

const startServer = async () => {
  const connected = await connectWithRetry();

  if(!connected) {
    process.exit(1)
  }

  app.listen(5001, () => {
    console.log("Server running on port 5001");
  });
}

startServer()