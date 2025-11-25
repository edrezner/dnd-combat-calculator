export const CalcSDL = `
    type CalcResult {
        hitChance: Float!
        critChance: Float!
        expectedDamage: Float!
    }

    type SimResult {
        mean: Float!
        ciLow: Float!
        ciHigh: Float!
    }

    type DiceTerm {
        count: Int!
        sides: Int!
        plus: Int
    }

    type DamageComponent {
        expr: [DiceTerm!]!
        bonus: Int
        critDoublesDice: Boolean
    }
    
    type AttackProfile {
        attackBonus: Int!
        targetAC: Int!
        critRange: Int
        damage: [DamageComponent!]!
        advantage: Boolean
        disadvantage: Boolean
        tags: [String]
    }
    
    type EffectMeta {
        id: ID!
        label: String!
        tags: [String]
        requiresSimulation: Boolean
    }

    type Kit {
        id: ID!
        label: String!
        availableEffects: [ID!]!
    }

    type BuildFromKitResult {
        result: CalcResult!
    }

    input CalcInput {
        attackBonus: Int!
        targetAC: Int!
        critRange: Int
        avgOnHit: Float!
        avgOnCrit: Float!
        advantage: Boolean
        disadvantage: Boolean
    }
    
    input DiceTermInput {
        count: Int!
        sides: Int!
        plus: Int
    }
    
    input DamageComponentInput {
        expr: [DiceTermInput!]!
        bonus: Int
        critDoublesDice: Boolean
    }

    input AttackProfileInput {
        attackBonus: Int!
        targetAC: Int!
        critRange: Int
        damage: [DamageComponentInput!]!
        advantage: Boolean
        disadvantage: Boolean
        tags: [String]
    }

    input BuildFromKitInput {
        kitId: ID!
        level: Int!
        effectIds: [ID!]!
        targetAC: Int!
    }

    extend type Query {
        calculate(input: CalcInput!): CalcResult!
        simulate(input: CalcInput!, trials: Int!): SimResult!
        calculateProfile(profile: AttackProfileInput!): CalcResult!
        kits: [Kit!]!
        effects: [EffectMeta!]!
        buildFromKit(input: BuildFromKitInput!): BuildFromKitResult!
    }
`;
