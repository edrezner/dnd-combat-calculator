export const CharacterSDL = `
    type Character {
        id: ID!
        name: String!
        klass: String!
        level: Int!
    }

    type Query {
        characters: [Character!]!
        character(id: ID!): Character
    }

    input CreateCharacterInput {
        name: String!
        klass: String!
        level: Int!
    }

    type Mutation {
        createCharacter(input: CreateCharacterInput!): Character!
    }
`;