"use client";
import { gql, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const LOGIN_MUTATION = gql`
  mutation TokenAuth($username: String!, $password: String!) {
    tokenAuth(username: $username, password: $password) {
      token
    }
  }
`;

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [login, { loading, error }] = useMutation(LOGIN_MUTATION);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await login({ variables: { username, password } });

    if (data?.tokenAuth?.token) {
      localStorage.setItem("token", data.tokenAuth.token);
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center mb-4 text-red-500">
          Login
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
          <button
            type="submit"
            className="w-full bg-primary-600 text-white py-2 rounded"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        {error && <p className="text-red-500 text-center mt-2">Login failed</p>}
      </div>
    </div>
  );
}
