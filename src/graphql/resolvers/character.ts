const data = [
  { id: "1", name: "Aeon Solguard", klass: "Paladin", level: 5 },
  { id: "2", name: "Nyra Quickstep", klass: "Rogue", level: 5 },
];

let nextId = 3;

export const characterResolvers = {
    Query: {
        characters: () => data,
        character: (_: unknown, { id }: { id: string }) => 
           data.find(character => character.id === id) ?? null,
    },
    Mutation: {
        createCharacter: (_: unknown, { input }: { input: { name: string, klass: string, level: number }}) => {
            const newCharacter = { id: String(nextId++), ...input};
            data.push(newCharacter);
            return newCharacter;
        }
    }
}