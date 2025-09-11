import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "../graphql/sdl"
import { resolvers } from "../graphql/resolvers";

export const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
});