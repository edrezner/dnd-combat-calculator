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
    }

    extend type Query {
        calculate(input: CalcInput!): CalcResult!
        simulate(input: CalcInput!, trials: Int!): SimResult!
        calculateProfile(profile: AttackProfileInput!): CalcResult!
    }
`