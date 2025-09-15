export function hitChance({
    attackBonus,
    targetAC,
    advantage = false,
    disadvantage = false,
} : {
    attackBonus: number;
    targetAC: number;
    advantage?: boolean;
    disadvantage?: boolean;
}): number {
    let hits = 0;

    for (let roll = 1; roll <= 20; roll++) {
        if (roll === 20) {
            hits++;
        } else if (roll === 1) {
            continue;
        } else if (roll + attackBonus >= targetAC) {
            hits++;
        } else {
            continue;
        }
    }
    
    const p = hits / 20;
    const pAdv = 1 - (1 - p) ** 2;
    const pDisadv = p ** 2;

    if (advantage && disadvantage) {
        return p;
    } else if (advantage) {
        return pAdv;
    } else if (disadvantage) {
        return pDisadv;
    } else {
        return p;
    }
   
};

export function critChance({ 
    critRange = 20, 
    advantage = false, 
    disadvantage = false 
}: { 
    critRange?: number, 
    advantage?: boolean, 
    disadvantage?: boolean 
}) : number {
    const cr = Math.min(Math.max(critRange, 2), 20);
    const p = (21 - cr) / 20;
    const pAdv = 1 - (1 - p) ** 2;
    const pDisadv = p ** 2;

    if (advantage && disadvantage) {
        return p;
    } else if (advantage) {
        return pAdv;
    } else if (disadvantage) {
        return pDisadv;
    } else {
        return p;
    }
}

export function expectedDamage({ 
    hitChance, 
    critChance,
    avgOnHit,
    avgOnCrit 
} : {
    hitChance: number;
    critChance: number;
    avgOnHit: number;
    avgOnCrit: number;
}) : number {
    const nonCritChance = Math.max(0, hitChance - critChance);
    return nonCritChance * avgOnHit + avgOnCrit * critChance;
}