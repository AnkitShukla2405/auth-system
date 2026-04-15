import React from "react";

const Navbar = ({ user, onLogout }) => {
  return (
    <div className="flex justify-between items-center px-6 py-3 bg-gray-900 text-white shadow-md">
      
       <div className="text-lg font-semibold">
        {user?.name || "User"}
      </div>
      
      <button
        onClick={onLogout}
        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition"
      >
        Logout
      </button>
    </div>
  );
};

export default Navbar;