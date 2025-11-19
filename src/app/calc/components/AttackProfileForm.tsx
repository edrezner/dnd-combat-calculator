"use client";

import { useReducer, ChangeEvent, FormEvent } from "react";
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

const CALCULATE_PROFILE = gql`
  query CalculateProfile($profile: AttackProfileInput!) {
    calculateProfile(profile: $profile) {
      hitChance
      critChance
      expectedDamage
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

  function onSubmit(e: FormEvent) {
    e.preventDefault();

    // Basic client validation
    const crit = Math.min(20, Math.max(2, toInt(state.critRange)));
    const damage = state.damage
      .map((row) => {
        const count = toInt(row.count);
        const sides = Number(row.sides) as Die;
        const bonus = toInt(row.bonus);

        if (!count || !sides || ![4, 6, 8, 10, 12, 20].includes(sides))
          return null;

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
      return;
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

    runCalc({ variables: { profile } });
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
          >
            {loading ? "Calculating…" : "Calculate"}
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
        {error && <p className="text-red-600">Error: {error.message}</p>}
        {!called && (
          <p className="text-gray-600">Enter values and hit Calculate.</p>
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
        {loading && <p>Crunching...</p>}
      </section>
    </>
  );
}
