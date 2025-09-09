type CharacterData = {
    id: string;
    name: string;
    klass: string;
    level: number;
};

type CreateCharacterInput = {
    name: string;
    klass: string;
    level: number;
};

type UpdateCharacterInput = {
    id: string;
    name?: string;
    klass?: string;
    level?: number;
}

const data: CharacterData[] = [
  { id: "1", name: "Aeon Solguard", klass: "Paladin", level: 5 }, 
  { id: "2", name: "Nyra Quickstep", klass: "Rogue", level: 5 },
];

let nextId = 3;

function checkCharacterLevel(level: number) {
    if (level > 20 || level < 1) {
        throw new Error("Character level must be between 1 and 20");
    };
}

export const characterResolvers = {
    Query: {
        characters: () => data,
        character: (_: unknown, { id }: { id: string }) => 
           data.find(character => character.id === id) ?? null,
    },
    
    Mutation: {
        createCharacter: (_: unknown, { input }: { input: CreateCharacterInput }) => {
            const { level } = input;
            
            checkCharacterLevel(level);

            const newCharacter = { id: String(nextId++), ...input };
            data.push(newCharacter);
            return newCharacter;
        }, 
        updateCharacter: (_: unknown, { input } : { input: UpdateCharacterInput }) => {
            const { id, name, klass, level } = input;
            
            const character = data.find((c) => c.id === id);

            if (!character) throw new Error(`"Character not found: ${id}`);
            

            if (typeof name === "string") character.name = name;
            if (typeof klass === "string") character.klass = klass;
            if (typeof level === "number") {
            checkCharacterLevel(level);
            character.level = level;
            }

            return character;
        },
        deleteCharacter: (_: unknown, { id }: { id: string }) => {
            const index = data.findIndex((c) => c.id === id);

            if (index !== -1) {  
                data.splice(index, 1);
                return {
                    success: true,
                    message: `Character ${id} deleted successfully`,
                    deletedCharacterId: id
                } 
            }

             return {   
                success: true,
                message: `Character ${id} not found`,
                deletedCharacterId: id   
            }
        },
    },
    
    Character: {
        profBonus: (character: { level: number }) => Math.ceil(character.level * 0.25 + 1),
    },
}