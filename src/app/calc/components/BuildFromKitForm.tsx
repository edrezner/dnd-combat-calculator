"use client";

import { useReducer, ChangeEvent, FormEvent, useState, useEffect } from "react";
import { gql } from "@apollo/client";
import { useQuery, useLazyQuery } from "@apollo/client/react";
import { SIMULATE_PROFILE, SimulateProfileData } from "./AttackProfileForm";
import { useApolloClient } from "@apollo/client/react";
import { DprPoint, DprVsAcChart } from "./DprVsAcChart";
import { generateDprVsAcChartData } from "./charting";
import { CALCULATE_PROFILE } from "./AttackProfileForm";

const GET_KITS_AND_EFFECTS = gql`
  query GetKitsAndEffects {
    kits {
      id
      label
      availableEffects
    }
    effects {
      id
      label
      tags
      requiresSimulation
    }
  }
`;

const BUILD_FROM_KIT = gql`
  query BuildFromKit($input: BuildFromKitInput!) {
    buildFromKit(input: $input) {
      result {
        hitChance
        critChance
        expectedDamage
      }
      profile {
        attackBonus
        targetAC
        critRange
        advantage
        disadvantage
        damage {
          expr {
            count
            sides
            plus
          }
          bonus
          critDoublesDice
        }
        tags
      }
    }
  }
`;

type State = {
  kitId: string;
  level: string;
  effectIds: string[];
  targetAC: string;
  formError: string;
  trials: string;
};

type Action =
  | {
      type: "field";
      name: "kitId" | "level" | "targetAC" | "trials";
      value: string;
    }
  | {
      type: "toggleEffect";
      id: string;
    }
  | {
      type: "setFormError";
      message: string;
    }
  | { type: "clearFormError" }
  | { type: "reset" };

const initialState: State = {
  kitId: "",
  level: "5",
  effectIds: [],
  targetAC: "15",
  formError: "",
  trials: "10000",
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "field":
      const next: State = { ...state, [action.name]: action.value };
      if (action.name === "kitId") next.effectIds = [];
      return next;
    case "toggleEffect":
      const exists = state.effectIds.includes(action.id);
      return {
        ...state,
        effectIds: exists
          ? state.effectIds.filter((eid) => eid !== action.id)
          : [...state.effectIds, action.id],
      };
    case "setFormError":
      return { ...state, formError: action.message };
    case "clearFormError":
      return { ...state, formError: "" };
    case "reset":
      return initialState;
    default:
      return state;
  }
}

type GetKitsAndEffectsData = {
  kits: { id: string; label: string; availableEffects: string[] }[];
  effects: {
    id: string;
    label: string;
    tags: string[];
    requiresSimulation: boolean;
  }[];
};

type BuildFromKitData = {
  buildFromKit: {
    result: {
      hitChance: number;
      critChance: number;
      expectedDamage: number;
    };
    profile: {
      attackBonus: number;
      targetAC: number;
      critRange?: number;
      advantage?: boolean;
      disadvantage?: boolean;
      damage: {
        expr: {
          count: number;
          sides: number;
          plus?: number;
        }[];
        bonus?: number;
        critDoublesDice?: boolean;
      }[];
      tags?: string[];
    };
  };
};

type BuildFromKitVars = {
  input: {
    kitId: string;
    level: number;
    effectIds: string[];
    targetAC: number;
  };
};

type SimulateProfileVars = {
  profile: BuildFromKitData["buildFromKit"]["profile"];
  trials: number;
};

export default function BuildFromKitForm() {
  type BuildResult = BuildFromKitData["buildFromKit"]["result"];
  type SimResult = SimulateProfileData["simulateProfile"];

  const client = useApolloClient();
  const [buildResult, setBuildResult] = useState<BuildResult | null>(null);
  // const [builtProfile, setBuiltProfile] = useState<
  //   BuildFromKitData["buildFromKit"]["profile"] | null
  // >(null);

  const [simResult, setSimResult] = useState<SimResult | null>(null);
  const [hasBuild, setHasBuild] = useState(false);
  const [hasSim, setHasSim] = useState(false);

  const [chartData, setChartData] = useState<DprPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  const [state, dispatch] = useReducer(reducer, initialState);

  function clearOutputs() {
    setBuildResult(null);
    // setBuiltProfile(null);
    setSimResult(null);
    setHasBuild(false);
    setHasSim(false);
    setChartData([]);
    setChartLoading(false);
    setChartError(null);
  }

  async function generateChartFromBuiltProfile(
    profile: SimulateProfileVars["profile"],
  ) {
    setChartError(null);
    setChartLoading(true);
    try {
      const points = await generateDprVsAcChartData({
        client,
        calculateQuery: CALCULATE_PROFILE,
        baseProfile: profile,
      });
      setChartData(points);
    } catch (err: unknown) {
      console.error(err);
      setChartError(
        err instanceof Error ? err.message : "Failed to generate chart",
      );
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  }

  const {
    data,
    loading: loadingMeta,
    error: metaError,
  } = useQuery<GetKitsAndEffectsData>(GET_KITS_AND_EFFECTS);

  const [
    runBuild,
    { data: buildData, loading: loadingBuild, error: buildError },
  ] = useLazyQuery<BuildFromKitData, BuildFromKitVars>(BUILD_FROM_KIT);

  const [runSim, { data: simData, loading: simLoading, error: simError }] =
    useLazyQuery<SimulateProfileData, SimulateProfileVars>(SIMULATE_PROFILE);

  const selectedKit = data?.kits.find((k) => k.id === state.kitId);

  const visibleEffects =
    selectedKit && data
      ? data.effects.filter((effect) =>
          selectedKit.availableEffects.includes(effect.id),
        )
      : (data?.effects ?? []);

  useEffect(() => {
    const res = buildData?.buildFromKit?.result;
    const profile = buildData?.buildFromKit?.profile;
    if (!res || !profile) return;
    setBuildResult(res);
    // setBuiltProfile(profile);
    setHasBuild(true);

    const inputProfile = buildProfileInputFromKit(profile);
    void generateChartFromBuiltProfile(inputProfile);
  }, [buildData]);

  useEffect(() => {
    const sim = simData?.simulateProfile;
    if (sim) {
      setSimResult(sim);
      setHasSim(true);
    }
  }, [simData]);

  function onTopFieldChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    clearOutputs();
    const { name, value } = e.target as HTMLInputElement;
    dispatch({
      type: "field",
      name: name as "kitId" | "level" | "targetAC" | "trials",
      value,
    });
  }

  function onEffectToggle(id: string) {
    clearOutputs();
    dispatch({ type: "toggleEffect", id });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();

    setSimResult(null);
    setHasSim(false);

    const level = toInt(state.level);
    const targetAC = toInt(state.targetAC);

    if (!state.kitId) {
      dispatch({
        type: "setFormError",
        message: "Please select a class.",
      });
      return;
    }

    dispatch({ type: "clearFormError" });

    if (level < 1 || level > 20) {
      dispatch({
        type: "setFormError",
        message: "Level must be between 1 and 20.",
      });
      return;
    }

    if (targetAC < 1) {
      dispatch({
        type: "setFormError",
        message: "Target AC must be at least 1.",
      });
      return;
    }

    const input: BuildFromKitVars["input"] = {
      kitId: state.kitId,
      level,
      effectIds: state.effectIds,
      targetAC,
    };

    runBuild({ variables: { input } });
  }

  function buildProfileInputFromKit(
    profile: BuildFromKitData["buildFromKit"]["profile"],
  ): SimulateProfileVars["profile"] {
    // Strip __typename at every level & normalize optional fields
    return {
      attackBonus: profile.attackBonus,
      targetAC: profile.targetAC,
      critRange: profile.critRange ?? 20,
      advantage: profile.advantage ?? false,
      disadvantage: profile.disadvantage ?? false,
      tags: profile.tags ?? [],
      damage: profile.damage.map((dc) => ({
        expr: dc.expr.map((t) => ({
          count: t.count,
          sides: t.sides,
          plus: t.plus ?? 0,
        })),
        bonus: dc.bonus ?? 0,
        critDoublesDice: dc.critDoublesDice ?? true,
      })),
    };
  }
  async function handleSimulate() {
    dispatch({ type: "clearFormError" });

    setBuildResult(null);
    // setBuiltProfile(null);
    setHasBuild(false);

    setSimResult(null);
    setHasSim(false);

    const level = toInt(state.level);
    const targetAC = toInt(state.targetAC);

    if (!state.kitId) {
      dispatch({ type: "setFormError", message: "Please select a class." });
      return;
    }
    if (level < 1 || level > 20) {
      dispatch({
        type: "setFormError",
        message: "Level must be between 1 and 20.",
      });
      return;
    }
    if (targetAC < 1) {
      dispatch({
        type: "setFormError",
        message: "Target AC must be at least 1.",
      });
      return;
    }

    const input: BuildFromKitVars["input"] = {
      kitId: state.kitId,
      level,
      effectIds: state.effectIds,
      targetAC,
    };

    const res = await runBuild({ variables: { input } });

    const builtProfile = res.data?.buildFromKit.profile;
    if (!builtProfile) {
      dispatch({
        type: "setFormError",
        message: "Failed to build profile for simulation.",
      });
      return;
    }

    const inputProfile = buildProfileInputFromKit(builtProfile);

    void generateChartFromBuiltProfile(inputProfile);

    runSim({
      variables: {
        profile: inputProfile,
        trials: toInt(state.trials),
      },
    });
  }

  function toInt(s: string): number {
    const cleaned = s.replace(/[^\d-]/g, "");
    const num = parseInt(cleaned, 10);
    return Number.isFinite(num) ? num : 0;
  }

  function toPercent(x?: number | null): string {
    return x == null ? "-" : `${(x * 100).toFixed(2)}%`;
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Class</span>
          <select
            name="kitId"
            value={state.kitId}
            onChange={onTopFieldChange}
            className="rounded-xl border px-3 py-2"
          >
            <option value="">Select a class</option>
            {data?.kits.map((kit) => (
              <option key={kit.id} value={kit.id}>
                {kit.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Level</span>
          <input
            type="number"
            name="level"
            value={state.level}
            onChange={onTopFieldChange}
            min={1}
            max={20}
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

        <div className="space-y-2">
          <h3 className="font-medium">Effects</h3>
          {metaError && (
            <p className="text-red-600">
              Error loading kits/effects: {metaError.message}
            </p>
          )}
          {selectedKit &&
            visibleEffects.map((effect) => (
              <label
                key={effect.id}
                className="flex items-center gap-2 text-em"
              >
                <input
                  type="checkbox"
                  checked={state.effectIds.includes(effect.id)}
                  onChange={() => onEffectToggle(effect.id)}
                />
                <span>{effect.label}</span>
                {/*TODO: Add description for effects*/}
              </label>
            ))}
        </div>

        <div className="flex gap-3">
          {state.formError && <p className="text-red-600">{state.formError}</p>}
          <button
            type="submit"
            disabled={loadingBuild || loadingMeta}
            className="rounded-2xl px-4 py-2 border shadow-sm disabled:opacity-60"
          >
            {loadingBuild ? "Loading..." : "Calculate"}
          </button>

          <button
            type="button"
            disabled={simLoading || loadingBuild || loadingMeta}
            onClick={handleSimulate}
            className="rounded-2xl px-4 py-2 border shadow-sm disabled:opacity-60"
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
            onClick={() => {
              dispatch({ type: "reset" });
              clearOutputs();
            }}
            className="rounded-2xl px-4 py-2 border"
          >
            Reset
          </button>
        </div>
      </form>

      <section className="rounded-2xl border p-4 mt-4">
        <h2 className="font-medium mb-2">Results</h2>
        {(buildError || simError) && (
          <p className="text-red-600">
            Error: {buildError?.message || simError?.message}
          </p>
        )}
        {!hasBuild && !hasSim && (
          <p className="text-gray-600">
            Enter values and hit Calculate or Simulate.
          </p>
        )}
        {hasBuild && !loadingBuild && !buildError && (
          <>
            <p>
              Hit Chance: <strong>{toPercent(buildResult?.hitChance)}</strong>
            </p>
            <p>
              Crit Chance: <strong>{toPercent(buildResult?.critChance)}</strong>
            </p>
            <p>
              Expected Damage:{" "}
              <strong>{buildResult?.expectedDamage?.toFixed(2)}</strong>
            </p>
          </>
        )}

        {hasSim && !simLoading && !simError && simResult && (
          <p>
            Simulated Damage: <strong>{simResult.mean.toFixed(2)}</strong> (95%
            CI {simResult.ciLow.toFixed(2)}-{simResult.ciHigh.toFixed(2)})
          </p>
        )}
        {loadingBuild && <p>Compiling Build...</p>}
      </section>

      <section className="rounded-2xl border p-4 mt-4">
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
    </>
  );
}
