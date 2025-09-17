export const CalcSDL = `
    input CalcInput {
        attackBonus: Int!
        targetAC: Int!
        critRange: Int
        avgOnHit: Float!
        avgOnCrit: Float!
        advantage: Boolean
        disadvantage: Boolean
    }

    type CalcResult {
        hitChance: Float!
        critChance: Float!
        expectedDamage: Float!
    }

    extend type Query {
        calculate(input: CalcInput!): CalcResult!
    }
`