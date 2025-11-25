"use client";

import { useReducer, ChangeEvent, FormEvent } from "react";
import { gql } from "@apollo/client";
import { useQuery, useLazyQuery } from "@apollo/client/react";

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
    }
  }
`;

type State = {
  kitId: string;
  level: string;
  effectIds: string[];
  targetAC: string;
  formError: string;
};

type Action =
  | {
      type: "field";
      name: "kitId" | "level" | "targetAC";
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

export default function BuildFromKitForm() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const {
    data,
    loading: loadingMeta,
    error: metaError,
  } = useQuery<GetKitsAndEffectsData>(GET_KITS_AND_EFFECTS);

  const [
    runBuild,
    { data: buildData, loading: loadingBuild, error: buildError, called },
  ] = useLazyQuery<BuildFromKitData, BuildFromKitVars>(BUILD_FROM_KIT);

  const selectedKit = data?.kits.find((k) => k.id === state.kitId);

  const visibleEffects =
    selectedKit && data
      ? data.effects.filter((effect) =>
          selectedKit.availableEffects.includes(effect.id)
        )
      : data?.effects ?? [];

  function onTopFieldChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target as HTMLInputElement;
    dispatch({
      type: "field",
      name: name as "kitId" | "level" | "targetAC",
      value,
    });
  }

  function onEffectToggle(id: string) {
    dispatch({ type: "toggleEffect", id });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();

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
            onClick={() => dispatch({ type: "reset" })}
            className="rounded-2xl px-4 py-2 border"
          >
            Reset
          </button>
        </div>
      </form>

      <section className="rounded-2xl border p-4 mt-4">
        <h2 className="font-medium mb-2">Results</h2>
        {buildError && (
          <p className="text-red-600">Error: {buildError.message}</p>
        )}
        {!called && (
          <p className="text-gray-600">Enter values and hit Calculate.</p>
        )}
        {called && !loadingBuild && !buildError && (
          <>
            <p>
              Hit Chance:{" "}
              <strong>
                {toPercent(buildData?.buildFromKit.result.hitChance)}
              </strong>
            </p>
            <p>
              Crit Chance:{" "}
              <strong>
                {toPercent(buildData?.buildFromKit.result.critChance)}
              </strong>
            </p>
            <p>
              Expected Damage:{" "}
              <strong>
                {buildData?.buildFromKit.result.expectedDamage?.toFixed(2)}
              </strong>
            </p>
          </>
        )}
        {loadingBuild && <p>Compiling Build...</p>}
      </section>
    </>
  );
}
