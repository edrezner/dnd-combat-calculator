export const CharacterSDL = `
    type AbilityScores {
        str: Int!
        dex: Int!
        con: Int!
        int: Int!
        wis: Int!
        cha: Int!
    }
    
    input AbilityScoresInput {
        str: Int
        dex: Int
        con: Int
        int: Int
        wis: Int
        cha: Int
    }

    type Character {
        id: ID!
        name: String!
        klass: String!
        level: Int!
        profBonus: Int!
        abilityScores: AbilityScores!
        mod(ability: String!): Int!
        toHit(using: String!, proficient: Boolean = true): Int! 
    }
    

    type Query {
        characters: [Character!]!
        character(id: ID!): Character
    }

    input CreateCharacterInput {
        name: String!
        klass: String!
        level: Int!
        abilityScores: AbilityScoresInput!
    }
    
    input UpdateCharacterInput {
        id: ID!
        name: String
        klass: String
        level: Int
        abilityScores: AbilityScoresInput
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