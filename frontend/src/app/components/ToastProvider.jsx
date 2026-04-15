"use client";

import { Toaster } from "react-hot-toast";

const ToastProvider = () => {
  return <Toaster position="top-right" toastOptions={
    {
        duration: 3000,
    }
  } />;
};

export default ToastProvider;