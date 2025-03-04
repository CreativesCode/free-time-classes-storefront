import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

const httpLink = createHttpLink({
  uri: "http://127.0.0.1:8000/graphql/", // Asegúrate de cambiarlo si tu backend está en otro host
  credentials: "include", // Permite el envío de cookies (importante para autenticación)
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export default client;
