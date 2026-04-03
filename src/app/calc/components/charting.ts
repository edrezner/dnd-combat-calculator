import type { ApolloClient } from "@apollo/client";
import type { DprPoint } from "./DprVsAcChart";
import type { DocumentNode } from "graphql";

// type Die = 4 | 6 | 8 | 10 | 12 | 20;

export type AttackProfileInput = {
  attackBonus: number;
  targetAC: number;
  critRange?: number;
  advantage?: boolean;
  disadvantage?: boolean;
  tags?: string[];
  damage: Array<{
    expr: Array<{ count: number; sides: number; plus?: number }>;
    bonus?: number;
    critDoublesDice?: boolean;
  }>;
};

type CalcProfileData = {
  calculateProfile: {
    expectedDamage: number;
  };
};

type CalcProfileVars = {
  profile: AttackProfileInput;
};

export async function generateDprVsAcChartData(args: {
  client: ApolloClient;
  calculateQuery: DocumentNode;
  baseProfile: AttackProfileInput;
}): Promise<DprPoint[]> {
  const { client, calculateQuery, baseProfile } = args;

  let acStart = baseProfile.targetAC;
  if (acStart >= 4) acStart -= 3;

  const acValues = Array.from({ length: 11 }, (_, i) => i + acStart);

  const results = await Promise.all(
    acValues.map(async (ac) => {
      const makeVars = (adv: boolean, dis: boolean): CalcProfileVars => ({
        profile: {
          ...baseProfile,
          targetAC: ac,
          advantage: adv,
          disadvantage: dis,
        },
      });

      const { data: n } = await client.query<CalcProfileData, CalcProfileVars>({
        query: calculateQuery,
        variables: makeVars(false, false),
        fetchPolicy: "no-cache",
      });

      const { data: a } = await client.query<CalcProfileData, CalcProfileVars>({
        query: calculateQuery,
        variables: makeVars(true, false),
        fetchPolicy: "no-cache",
      });

      const { data: d } = await client.query<CalcProfileData, CalcProfileVars>({
        query: calculateQuery,
        variables: makeVars(false, true),
        fetchPolicy: "no-cache",
      });

      if (
        !n?.calculateProfile ||
        !a?.calculateProfile ||
        !d?.calculateProfile
      ) {
        throw new Error("No data returned from calculateProfile");
      }

      return {
        ac,
        dprNormal: n.calculateProfile.expectedDamage,
        dprAdvantage: a.calculateProfile.expectedDamage,
        dprDisadvantage: d.calculateProfile.expectedDamage,
      } satisfies DprPoint;
    })
  );

  return results;
}
