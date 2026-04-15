"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const Signup = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const res = await api.post("/register", data);

      if (res.status === 201) {
        toast.success(res.data.message);
        router.push("/login");
      }
    } catch (error) {
      toast.error(error?.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md ${
          loading ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>

        {/* Name */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Full name"
            className="w-full p-3 rounded bg-gray-700 outline-none"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && (
            <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="mb-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded bg-gray-700 outline-none"
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="mb-4">
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded bg-gray-700 outline-none"
            {...register("password", {
              required: "Password is required",
              message: {
                minLength: {
                  value: 6,
                  message: "Min 6 characters",
                },
              },
            })}
          />
          {errors.password && (
            <p className="text-red-400 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Role */}
        <div className="mb-6">
          <select
            className="w-full p-3 rounded bg-gray-700 outline-none"
            {...register("role")}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-semibold"
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        {/* Signup link */}
        <p className="text-center text-gray-400 mt-4">
          If you a already registered?{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-blue-400 cursor-pointer hover:underline"
          >
            login
          </span>
        </p>
      </form>
    </div>
  );
};

export default Signup;
