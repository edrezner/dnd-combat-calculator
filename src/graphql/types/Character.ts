export const CharacterSDL = `
    type Character {
        id: ID!
        name: String!
        klass: String!
        level: Int!
        profBonus: Int!
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
    
    input UpdateCharacterInput {
        id: ID!
        name: String
        klass: String
        level: Int
    }

    type DeleteResponse {
        success: Boolean!
        message: String
        deletedCharacterId: ID
    }

    type Mutation {
        createCharacter(input: CreateCharacterInput!): Character!
        updateCharacter(input: UpdateCharacterInput!): Character!
        deleteCharacter(id: ID!): DeleteResponse!
    }
`;