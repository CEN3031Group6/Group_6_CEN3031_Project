// src/pages/home.tsx
import { useState } from "react";

import { Button } from "@/components/ui/button";

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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/60">
      <div className="bg-white p-6 rounded-2xl shadow w-80 text-center">
        <h1 className="text-lg font-semibold mb-4">Connection Test</h1>
        <Button onClick={ping} className="w-full">
          Ping Backend
        </Button>
        <p className="mt-3 text-sm text-muted-foreground">{msg}</p>
      </div>
    </main>
  );
}
