/* eslint-disable @typescript-eslint/naming-convention */
// src/app/api/graphql/route.ts
import { createYoga } from "graphql-yoga";
import { schema } from "@/server/graphql/schema";



export const { handleRequest } = createYoga({
  schema,                      
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
});

export { handleRequest as GET, handleRequest as POST, handleRequest as OPTIONS };