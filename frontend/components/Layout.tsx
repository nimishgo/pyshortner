import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "@/lib/api";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ username: string } | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      apiGet("/auth/me")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setUser(data ? { username: data.username } : null))
        .catch(() => setUser(null));
    };

    checkAuth();
    window.addEventListener("auth:changed", checkAuth);
    return () => window.removeEventListener("auth:changed", checkAuth);
  }, []);

  async function handleLogout() {
    await apiPost("/auth/logout", {});
    setUser(null);
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            PyShortner
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-700 hover:text-blue-600">
              Home
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
                  Dashboard
                </Link>
                <span className="text-sm text-gray-500">{user.username}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:underline"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-blue-600">
                  Login
                </Link>
                <Link href="/register" className="text-gray-700 hover:text-blue-600">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">{children}</main>
    </div>
  );
}
