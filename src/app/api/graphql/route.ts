// src/app/api/graphql/route.ts
import { createYoga } from "graphql-yoga";
import { schema } from "@/server/graphql/schema";

interface NextContext {
  params: Promise<Record<string, string>>;
}

const { handleRequest } = createYoga<NextContext>({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
});

export {
  handleRequest as GET,
  handleRequest as POST,
  handleRequest as OPTIONS,
};
