import { createSchema } from "graphql-yoga";

const typeDefs = `
  type Character { id: ID!, name: String!, klass: String!, level: Int! }
  type Query { characters: [Character!]! }
`;

const data = [
  { id: "1", name: "Aeon Solguard", klass: "Paladin", level: 5 },
  { id: "2", name: "Nyra Quickstep", klass: "Rogue", level: 5 },
];

const resolvers = {
  Query: {
    characters: () => data,
  },
};

export const schema = createSchema({ typeDefs, resolvers });