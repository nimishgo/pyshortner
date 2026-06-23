import { useState } from "react";
import { useRouter } from "next/router";
import { apiPost } from "@/lib/api";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await apiPost("/auth/register", { username, password });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.detail || "Registration failed");
      return;
    }
    setSuccess(true);
    window.dispatchEvent(new Event("auth:changed"));
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Register
        </button>
      </form>
      {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
      {success && (
        <p className="mt-4 text-green-600 text-center">
          Registered successfully! Redirecting...
        </p>
      )}
    </div>
  );
}
