"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./components/Navbar";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          router.push("/login");
          return;
        }

        const res = await axios.get("http://localhost:5001/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });
        

        setData(res.data);
      } catch (err) {
        console.error(err);
        router.push("/login");
      }
    };

    fetchDashboard();
  }, []);

  const handleLogout = async () => {
    console.log("I am clicked")
    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5001/auth/logout",
        {},
        {
          withCredentials: true,
        }
      );

      if (res.status === 200) {
        localStorage.removeItem("accessToken");
        toast.success(res.data.msg);
        router.replace("/login");
window.location.reload();
    } }catch (error) {
      console.error(error);
      toast.error("Logout failed");
    } finally {
      setLoading(false);
    }
  };

  if (!data) return <div className="text-white p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar user={{ name: data.name || "User" }} onLogout={handleLogout} />

      <div className="flex items-center justify-center mt-20">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4">{data.message}</h1>
          <p className="text-gray-400">Role: {data.role}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;