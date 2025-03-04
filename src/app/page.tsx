"use client";
import { gql, useQuery } from "@apollo/client";

const GET_USER = gql`
  query {
    me {
      id
      username
      email
    }
  }
`;

export default function Home() {
  const { data, loading, error } = useQuery(GET_USER);

  if (loading) return <p className="text-center text-gray-500">Loading...</p>;
  if (error)
    return <p className="text-center text-red-500">Error: {error.message}</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-gray-800">
        Welcome, {data.me.username}!
      </h1>
      <p className="text-gray-600">Email: {data.me.email}</p>
    </div>
  );
}
