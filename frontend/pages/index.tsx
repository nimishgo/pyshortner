import { useState } from "react";
import { apiPost } from "@/lib/api";

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<{
    short_code: string;
    original_url: string;
  } | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    const res = await apiPost("/shorten", { url });
    if (!res.ok) {
      setError("Failed to shorten URL");
      return;
    }
    const data = await res.json();
    setResult(data);
  }

  const base = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Shorten a URL</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          required
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Shorten
        </button>
      </form>

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">Shortened URL:</p>
          <a
            href={`${base}/${result.short_code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline break-all"
          >
            {base}/{result.short_code}
          </a>
          <p className="mt-2 text-sm text-gray-600">
            Original: {result.original_url}
          </p>
          <a
            href={`/analytics/${result.short_code}`}
            className="mt-3 inline-block text-sm text-blue-600 hover:underline"
          >
            View analytics &rarr;
          </a>
        </div>
      )}
    </div>
  );
}
