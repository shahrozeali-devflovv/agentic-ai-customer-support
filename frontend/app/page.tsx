"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [backendStatus, setBackendStatus] = useState("Checking...");

  useEffect(() => {
    async function checkBackend() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/health`);

        if (!response.ok) {
          throw new Error("Backend request failed");
        }

        const data = await response.json();
        setBackendStatus(data.status);
      } catch (error) {
        console.error(error);
        setBackendStatus("unavailable");
      }
    }

    checkBackend();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">
          Agentic AI Customer Support
        </h1>

        <p className="mt-4 text-lg">
          Backend status: {backendStatus}
        </p>
      </div>
    </main>
  );
}