"use client";

import {
  useState,
  useReducer,
  ChangeEvent,
  FormEvent,
  SyntheticEvent,
} from "react";
import { gql } from "@apollo/client";
import { useLazyQuery, useApolloClient } from "@apollo/client/react";
import { DprPoint, DprVsAcChart } from "./DprVsAcChart";

const CALCULATE_PROFILE = gql`
  query CalculateProfile($profile: AttackProfileInput!) {
    calculateProfile(profile: $profile) {
      hitChance
      critChance
      expectedDamage
    }
  }
`;

const SIMULATE_PROFILE = gql`
  query SimulateProfile($profile: AttackProfileInput!, $trials: Int!) {
    simulateProfile(profile: $profile, trials: $trials) {
      mean
      ciLow
      ciHigh
    }
  }
`;

type Die = 4 | 6 | 8 | 10 | 12 | 20;

type DamageRow = {
  count: string;
  sides: Die | "";
  bonus: string;
  critDoublesDice: boolean;
};

type State = {
  attackBonus: string;
  targetAC: string;
  critRange: string;
  advantage: boolean;
  disadvantage: boolean;
  damage: DamageRow[];
  formError: string;
  trials: string;
};

type Action =
  | {
      type: "field";
      name: keyof Omit<State, "damage">;
      value: string | boolean;
    }
  | { type: "addRow" }
  | { type: "removeRow"; index: number }
  | {
      type: "rowField";
      index: number;
      name: keyof DamageRow;
      value: string | boolean;
    }
  | { type: "reset" }
  | { type: "setFormError"; message: string }
  | { type: "clearFormError" };

type CalcProfileData = {
  calculateProfile: {
    hitChance: number;
    critChance: number;
    expectedDamage: number;
  };
};

type CalcProfileVars = {
  profile: {
    attackBonus: number;
    targetAC: number;
    critRange: number;
    advantage?: boolean;
    disadvantage?: boolean;
    damage: Array<{
      expr: Array<{ count: number; sides: Die; plus?: number }>;
      bonus?: number;
      critDoublesDice?: boolean;
    }>;
  };
};

type SimulateProfileData = {
  simulateProfile: {
    mean: number;
    ciLow: number;
    ciHigh: number;
  };
};

type SimulateProfileVars = CalcProfileVars & {
  trials: number;
};

const initialRow: DamageRow = {
  count: "1",
  sides: 8,
  bonus: "0",
  critDoublesDice: true,
};

const initialState: State = {
  attackBonus: "6",
  targetAC: "15",
  critRange: "20",
  advantage: false,
  disadvantage: false,
  damage: [initialRow],
  formError: "",
  trials: "10000",
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "field":
      return { ...state, [action.name]: action.value as never };
    case "addRow":
      return { ...state, damage: [...state.damage, { ...initialRow }] };
    case "removeRow":
      return {
        ...state,
        damage: state.damage.filter((_, i) => i !== action.index),
      };
    case "rowField": {
      const next = state.damage.slice();
      next[action.index] = {
        ...next[action.index],
        [action.name]: action.value as never,
      };
      return { ...state, damage: next };
    }
    case "setFormError": {
      return { ...state, formError: action.message };
    }
    case "clearFormError": {
      return { ...state, formError: "" };
    }
    case "reset":
      return initialState;
    default:
      return state;
  }
}

export default function AttackProfileForm() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const [runCalc, { data, loading, error, called }] = useLazyQuery<
    CalcProfileData,
    CalcProfileVars
  >(CALCULATE_PROFILE);
  const [
    runSim,
    { data: simData, loading: simLoading, error: simError, called: simCalled },
  ] = useLazyQuery<SimulateProfileData, SimulateProfileVars>(SIMULATE_PROFILE);

  const client = useApolloClient();

  const [chartData, setChartData] = useState<DprPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  function toInt(s: string): number {
    const cleaned = s.replace(/[^\d-]/g, "");
    const num = parseInt(cleaned, 10);
    return Number.isFinite(num) ? num : 0;
  }

  function onTopFieldChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { type, name } = e.target as HTMLInputElement;
    const value =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
    dispatch({
      type: "field",
      name: name as keyof Omit<State, "damage">,
      value,
    });
  }

  function onRowChange(
    index: number,
    name: keyof DamageRow,
    value: string | boolean
  ) {
    dispatch({ type: "rowField", index, name, value });
  }

  function addRow() {
    dispatch({ type: "addRow" });
  }

  function removeRow(index: number) {
    dispatch({ type: "removeRow", index });
  }

  const buildProfileFromState = (): CalcProfileVars["profile"] | null => {
    const crit = Math.min(20, Math.max(2, toInt(state.critRange)));

    const damage = state.damage
      .map((row) => {
        const count = toInt(row.count);
        const sides = Number(row.sides) as Die;
        const bonus = toInt(row.bonus);

        if (!count || !sides || ![4, 6, 8, 10, 12, 20].includes(sides)) {
          return null;
        }

        return {
          expr: [{ count, sides }],
          bonus,
          critDoublesDice: !!row.critDoublesDice,
        };
      })
      .filter(Boolean) as CalcProfileVars["profile"]["damage"];

    if (damage.length === 0) {
      dispatch({
        type: "setFormError",
        message:
          "Please add at least one valid damage expression (e.g. 1d8 + 0).",
      });
      return null;
    }

    dispatch({ type: "clearFormError" });

    const profile: CalcProfileVars["profile"] = {
      attackBonus: toInt(state.attackBonus),
      targetAC: toInt(state.targetAC),
      critRange: crit,
      advantage: state.advantage,
      disadvantage: state.disadvantage,
      damage,
    };

    return profile;
  };

  const generateChartFromProfile = async (
    baseProfile: CalcProfileVars["profile"]
  ) => {
    setChartError(null);
    setChartLoading(true);

    try {
      let acStartIndex = baseProfile.targetAC;

      if (acStartIndex >= 4) acStartIndex -= 3;

      const acValues = Array.from({ length: 11 }, (_, i) => i + acStartIndex);

      const results = await Promise.all(
        acValues.map(async (ac) => {
          const varsNormal: CalcProfileVars = {
            profile: {
              ...baseProfile,
              targetAC: ac,
              advantage: false,
              disadvantage: false,
            },
          };

          const varsAdvantage: CalcProfileVars = {
            profile: {
              ...baseProfile,
              targetAC: ac,
              advantage: true,
              disadvantage: false,
            },
          };

          const varsDisadvantage: CalcProfileVars = {
            profile: {
              ...baseProfile,
              targetAC: ac,
              advantage: false,
              disadvantage: true,
            },
          };

          // Currently running 3 queries for each AC value (normal/adv/dis).
          // Look into batched/multi-mode GraphQL Resolver or client side math for scalability
          const { data: dataNormal } = await client.query<
            CalcProfileData,
            CalcProfileVars
          >({
            query: CALCULATE_PROFILE,
            variables: varsNormal,
            fetchPolicy: "no-cache",
          });

          const { data: dataAdv } = await client.query<
            CalcProfileData,
            CalcProfileVars
          >({
            query: CALCULATE_PROFILE,
            variables: varsAdvantage,
            fetchPolicy: "no-cache",
          });

          const { data: dataDisadv } = await client.query<
            CalcProfileData,
            CalcProfileVars
          >({
            query: CALCULATE_PROFILE,
            variables: varsDisadvantage,
            fetchPolicy: "no-cache",
          });

          if (
            !dataNormal ||
            !dataNormal.calculateProfile ||
            !dataAdv ||
            !dataAdv.calculateProfile ||
            !dataDisadv ||
            !dataDisadv.calculateProfile
          ) {
            throw new Error("No data returned from calculateProfile");
          }

          return {
            ac,
            dprNormal: dataNormal.calculateProfile.expectedDamage,
            dprAdvantage: dataAdv.calculateProfile.expectedDamage,
            dprDisadvantage: dataDisadv.calculateProfile.expectedDamage,
          } satisfies DprPoint;
        })
      );

      setChartData(results);
    } catch (err: any) {
      console.error(err);
      setChartError(err.message ?? "Failed to generate chart");
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  };

  function onSubmit(e: SyntheticEvent) {
    e.preventDefault();
    dispatch({ type: "clearFormError" });

    const eventSubmitter = (e.nativeEvent as SubmitEvent).submitter?.id;

    const profile = buildProfileFromState();
    if (!profile) return;

    if (eventSubmitter === "Calculate") runCalc({ variables: { profile } });
    if (eventSubmitter === "Simulate")
      runSim({ variables: { profile, trials: toInt(state.trials) } });

    void generateChartFromProfile(profile);
  }

  function toPercent(x?: number | null): string {
    return x == null ? "-" : `${(x * 100).toFixed(2)}%`;
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">To-Hit (attack bonus)</span>
            <input
              type="number"
              name="attackBonus"
              value={state.attackBonus}
              onChange={onTopFieldChange}
              className="rounded-xl border px-3 py-2"
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Target AC</span>
            <input
              type="number"
              name="targetAC"
              value={state.targetAC}
              onChange={onTopFieldChange}
              className="rounded-xl border px-3 py-2"
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Crit on (2-20)</span>
            <input
              type="number"
              name="critRange"
              min={2}
              max={20}
              value={state.critRange}
              onChange={onTopFieldChange}
              className="rounded-xl border px-3 py-2"
            />
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="advantage"
              checked={state.advantage}
              onChange={onTopFieldChange}
            />
            <span className="text-sm text-gray-600">Advantage</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="disadvantage"
              checked={state.disadvantage}
              onChange={onTopFieldChange}
            />
            <span className="text-sm text-gray-600">Disadvantage</span>
          </label>
          {state.advantage && state.disadvantage && (
            <p className="text-sm text-gray-600">
              Advantage and Disadvantage cancel out to a normal roll
            </p>
          )}
        </div>

        {/* Damage rows */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Damage Components</h3>
            <button
              type="button"
              onClick={addRow}
              className="rounded-2xl px-3 py-1 border"
            >
              + Add row
            </button>
          </div>

          {state.damage.map((row, i) => (
            <div key={i} className="grid grid-cols-5 gap-3 items-end">
              <label className="flex flex-col">
                <span className="text-sm text-gray-600">Count</span>
                <input
                  type="number"
                  min={1}
                  value={row.count}
                  onChange={(e) => onRowChange(i, "count", e.target.value)}
                  className="rounded-xl border px-3 py-2"
                />
              </label>

              <label className="flex flex-col">
                <span className="text-sm text-gray-600">Sides</span>
                <select
                  value={row.sides}
                  onChange={(e) =>
                    onRowChange(
                      i,
                      "sides",
                      Number(e.target.value) as unknown as string
                    )
                  }
                  className="rounded-xl border px-3 py-2"
                >
                  <option value="">—</option>
                  {[4, 6, 8, 10, 12, 20].map((s) => (
                    <option key={s} value={s}>{`d${s}`}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col">
                <span className="text-sm text-gray-600">Flat bonus</span>
                <input
                  type="number"
                  value={row.bonus}
                  onChange={(e) => onRowChange(i, "bonus", e.target.value)}
                  className="rounded-xl border px-3 py-2"
                />
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={row.critDoublesDice}
                  onChange={(e) =>
                    onRowChange(i, "critDoublesDice", e.target.checked)
                  }
                />
                <span className="text-sm text-gray-600">
                  Double dice on crit
                </span>
              </label>

              <button
                type="button"
                onClick={() => removeRow(i)}
                disabled={state.damage.length === 1}
                className={`
                  rounded-2xl px-3 py-2 border text-sm font-medium
                  transition-colors

                  ${
                    state.damage.length === 1
                      ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
                      : "border-red-400 text-red-600 bg-red-50 hover:bg-red-100"
                  }
                  `}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          {state.formError && <p className="text-red-600">{state.formError}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl px-4 py-2 border shadow-sm disabled:opacity-60"
            id="Calculate"
          >
            {loading ? "Calculating..." : "Calculate"}
          </button>
          <button
            type="submit"
            disabled={simLoading}
            className="rounded-2xl px-4 py-2 border shadow-sm disabled:opacity-60"
            id="Simulate"
          >
            {simLoading ? "Simulating..." : "Simulate"}
          </button>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Trials</span>
            <input
              type="number"
              name="trials"
              min={1000}
              max={200000}
              step={1000}
              value={state.trials}
              onChange={onTopFieldChange}
              placeholder="10000"
              className="rounded-xl border px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={() => dispatch({ type: "reset" })}
            className="rounded-2xl px-4 py-2 border"
          >
            Reset
          </button>
        </div>
      </form>

      <section className="mt-6">
        <p className="text-sm text-gray-600 mb-2">
          Chart: analytic expected DPR vs AC (normal / advantage /
          disadvantage).
        </p>
        {chartLoading && (
          <p className="text-sm text-gray-600 mb-2">
            Generating DPR vs AC chart...
          </p>
        )}
        {chartError && (
          <p className="text-sm text-red-600 mb-2">{chartError}</p>
        )}
        <DprVsAcChart data={chartData} />
      </section>

      <section className="rounded-2xl border p-4 mt-4">
        <h2 className="font-medium mb-2">Results</h2>
        {(error || simError) && (
          <p className="text-red-600">
            Error: {error?.message || simError?.message}
          </p>
        )}
        {!called && !simCalled && (
          <p className="text-gray-600">
            Enter values and hit Calculate or Simulate.
          </p>
        )}
        {called && !loading && !error && (
          <>
            <p>
              Hit Chance:{" "}
              <strong>{toPercent(data?.calculateProfile?.hitChance)}</strong>
            </p>
            <p>
              Crit Chance:{" "}
              <strong>{toPercent(data?.calculateProfile?.critChance)}</strong>
            </p>
            <p>
              Expected Damage:{" "}
              <strong>
                {data?.calculateProfile?.expectedDamage?.toFixed(2)}
              </strong>
            </p>
          </>
        )}
        {simCalled && !simLoading && !simError && (
          <>
            <p>
              Simulated Damage:{" "}
              <strong>{simData?.simulateProfile?.mean.toFixed(2)}</strong> (95%
              CI {simData?.simulateProfile?.ciLow.toFixed(2)}-
              {simData?.simulateProfile?.ciHigh.toFixed(2)})
            </p>
          </>
        )}
        {(loading || simLoading) && <p>Crunching...</p>}
      </section>
    </>
  );
}
