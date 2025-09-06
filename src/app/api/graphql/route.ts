import { createYoga } from "graphql-yoga";
// import { NextRequest } from "next/server";
import { schema } from "@/graphql/schema";

export const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
});

export { handleRequest as GET, handleRequest as POST };