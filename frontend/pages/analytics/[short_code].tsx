import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

interface AnalyticsData {
  id: number;
  original_url: string;
  short_code: string;
  clicks: number;
  created_at: string;
}

export default function Analytics() {
  const router = useRouter();
  const { short_code } = router.query;
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!short_code) return;
    apiGet(`/analytics/${short_code}`)
      .then(async (r) => {
        if (!r.ok) {
          setError("URL not found");
          return;
        }
        const json = await r.json();
        setData(json);
      })
      .catch(() => setError("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [short_code]);

  if (loading) return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;
  if (!data) return null;

  const base = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      <div className="p-6 bg-white border rounded-lg shadow-sm space-y-4">
        <div>
          <p className="text-sm text-gray-500">Short URL</p>
          <a
            href={`${base}/${data.short_code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline break-all"
          >
            {base}/{data.short_code}
          </a>
        </div>
        <div>
          <p className="text-sm text-gray-500">Original URL</p>
          <p className="break-all">{data.original_url}</p>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm text-gray-500">Clicks</p>
            <p className="text-2xl font-bold">{data.clicks}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="text-gray-700">
              {new Date(data.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
