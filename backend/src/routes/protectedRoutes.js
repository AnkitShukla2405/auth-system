import express from "express"
import { verifyToken } from "../middleware/authMiddleware.js";

const dashboardRouter = express.Router();

dashboardRouter.get("/dashboard", verifyToken, (req, res) => {
  const role = req.user.role;
  const name = req.user.name



  let message = "";

  if (role === "super_admin") {
    message = "Welcome Super Admin 👑 - Full system control";
  } else if (role === "admin") {
    message = "Welcome Admin ⚙️ - Manage platform";
  } else if (role === "teacher") {
    message = "Welcome Teacher 📚 - Manage courses";
  } else if (role === "student") {
    message = "Welcome Student 🎓 - Access learning";
  } else {
    message = "Unknown role";
  }

  res.json({
    name,
    role,
    message,
  });
});

export default dashboardRouter;