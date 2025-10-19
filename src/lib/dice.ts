type Die = 4 | 6 | 8 | 10 | 12 | 20;

type DiceTerm = {
    count: number;
    sides: Die;
    plus?: number;  
}

type DiceExpr = DiceTerm [];

// function parseDice(dicePlusMods: string): DiceExpr {
//     const regex = /(\d*)d(\d+)([+-]\d+)?/;
//     const match = dicePlusMods.match(regex);

//     if (!match) throw new Error("Dice format must be xdy + z.")

//     const count = match[1] ? parseInt(match[1]) : 1; 
//     const sides = parseInt(match[2]);
//     const plus = match[3] ? parseInt(match[3]) : 0;

    // if (
    //     sides !== 4 ||
    //     sides !== 6 ||
    //     sides !== 8 ||
    //     sides !== 10 ||
    //     sides !== 12 ||
    //     sides !== 20
    // ) {
    //     throw new Error("Dice sides must equal 4, 6, 8, 10, 12, or 20.")
    // }

//   return [{ count, sides, plus }];

    
// }

// function avg(expr: DiceExpr): number {

// }