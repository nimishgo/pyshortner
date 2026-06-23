import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import Link from "next/link";

interface URLItem {
  id: number;
  original_url: string;
  short_code: string;
  clicks: number;
  created_at: string;
}

export default function Dashboard() {
  const [urls, setUrls] = useState<URLItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("/shorten")
      .then(async (r) => {
        if (!r.ok) {
          setError("Failed to load URLs");
          return;
        }
        const data = await r.json();
        setUrls(Array.isArray(data) ? data : []);
      })
      .catch(() => setError("Failed to load URLs"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;

  const base = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My URLs</h1>
      {urls.length === 0 ? (
        <p className="text-gray-600">No URLs yet.</p>
      ) : (
        <div className="space-y-4">
          {urls.map((url) => (
            <div
              key={url.id}
              className="p-4 bg-white border rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 truncate">
                  {url.original_url}
                </p>
                <a
                  href={`${base}/${url.short_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline break-all"
                >
                  {base}/{url.short_code}
                </a>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Clicks: {url.clicks}
                </span>
                <Link
                  href={`/analytics/${url.short_code}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Analytics
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
