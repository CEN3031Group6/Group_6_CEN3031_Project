// src/pages/home.tsx
import { useState } from "react";

export default function HomePage() {
  const [msg, setMsg] = useState("Click to ping backend");

  async function ping() {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/health/");
      const data = await res.json();
      setMsg("Backend says: " + data.status);
    } catch (e) {
      setMsg("❌ Failed to connect");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded-2xl shadow w-80 text-center">
        <h1 className="text-lg font-semibold mb-4">Connection Test</h1>
        <button onClick={ping} className="bg-blue-600 text-white py-2 px-4 rounded">
          Ping Backend
        </button>
        <p className="mt-3 text-gray-700">{msg}</p>
      </div>
    </main>
  );
}
