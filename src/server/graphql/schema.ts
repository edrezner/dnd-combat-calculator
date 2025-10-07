import { makeExecutableSchema } from "@graphql-tools/schema";
import  { typeDefs } from "./sdl"
import  { resolvers } from "./resolvers";

export const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
});