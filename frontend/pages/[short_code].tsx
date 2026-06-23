import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export default function RedirectPage() {
  const router = useRouter();
  const { short_code } = router.query;
  const [error, setError] = useState("");

  useEffect(() => {
    if (!short_code || typeof short_code !== "string") return;
    // Navigate directly to the backend redirect endpoint.
    // The backend returns a 301 to the original URL and counts the click.
    window.location.href = `${API_BASE}/${short_code}`;
  }, [short_code]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600 text-lg">Redirecting...</p>
    </div>
  );
}
