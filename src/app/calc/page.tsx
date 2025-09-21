"use client";

import { useReducer, FormEvent, ChangeEvent } from "react";
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

const CALCULATE = gql`
  query Calculate($input: CalcInput!) {
    calculate(input: $input) {
      hitChance
      critChance
      expectedDamage
    }
  }
`;

type State = {
  attackBonus: string;
  targetAC: string;
  critRange: string;
  avgOnHit: string;
  avgOnCrit: string;
  advantage: boolean;
  disadvantage: boolean;
};

type Action =
  | { type: "field"; name: keyof State; value: string | boolean }
  | { type: "reset" };

type CalculateData = {
  calculate: {
    hitChance: number;
    critChance: number;
    expectedDamage: number;
  };
};

type CalculateVars = {
  input: {
    attackBonus: number;
    targetAC: number;
    critRange?: number;
    avgOnHit: number;
    avgOnCrit: number;
    advantage?: boolean;
    disadvantage?: boolean;
  };
};

const initialState: State = {
  attackBonus: "7",
  targetAC: "15",
  critRange: "20",
  avgOnHit: "10",
  avgOnCrit: "20",
  advantage: false,
  disadvantage: false,
};

function reducer(state: State, action: Action): State {
  if (action.type === "field") {
    return { ...state, [action.name]: action.value as never };
  } else if (action.type === "reset") {
    return initialState;
  } else {
    return state;
  }
};


export default function CalcPage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [runCalc, { data, loading, error, called }] = useLazyQuery<CalculateData, CalculateVars>(CALCULATE);

  function toInt(s: string): number {
    const num = parseInt(s, 10);
    return Number.isFinite(num) ? num : 0;
  };

  function toFloat(s: string): number {
    const num = parseFloat(s);
    return Number.isFinite(num) ? num : 0;
  };

  function toPercent(x?: number | null): string {
    return x == null ? "-" : `${(x * 100).toFixed(2)}%`;
  };

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const { type, name, value, checked } = e.target;
    dispatch({ 
      type: "field", 
      name: name as keyof State, 
      value: type === "checkbox" ? checked: value,
    })
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();

    runCalc({
      variables: {
        input: {
          attackBonus: toInt(state.attackBonus),
          targetAC: toInt(state.targetAC),
          critRange: toInt(state.critRange),
          avgOnHit: toFloat(state.avgOnHit),
          avgOnCrit: toFloat(state.avgOnCrit),
          advantage: state.advantage,
          disadvantage: state.disadvantage,
        }
      }
    });
  }

  return (
    <main className="mx-auto max-w-xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">DPR Calculator</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Attack Bonus:</span>
            <input
              type="number"
              inputMode="numeric"
              name="attackBonus"
              value={state.attackBonus}
              onChange={onChange}
              className="rounded-xl border px-3 py-2"
            />
          </label>
          
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Target AC:</span>
            <input
              type="number"
              inputMode="numeric"
              name="targetAC"
              value={state.targetAC}
              onChange={onChange}
              className="rounded-xl border px-3 py-2"
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Dice Roll You Crit On (default is 20):</span>
            <input
              type="number"
              inputMode="numeric"
              name="critRange"
              min={2}
              max={20}
              required
              value={state.critRange}
              onChange={onChange}
              className="rounded-xl border px-3 py-2"
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Average Damage on Hit:</span>
            <input
              type="number"
              inputMode="numeric"
              name="avgOnHit"
              value={state.avgOnHit}
              onChange={onChange}
              className="rounded-xl border px-3 py-2"
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Average Damage on Crit:</span>
            <input
              type="number"
              inputMode="numeric"
              name="avgOnCrit"
              value={state.avgOnCrit}
              onChange={onChange}
              className="rounded-xl border px-3 py-2"
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Advantage:</span>
            <input
              type="checkbox"
              name="advantage"
              checked={state.advantage}
              onChange={onChange}
              className="rounded-xl border px-3 py-2"
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Disadvantage:</span>
            <input
              type="checkbox"
              name="disadvantage"
              checked={state.disadvantage}
              onChange={onChange}
              className="rounded-xl border px-3 py-2"
            />
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl px-4 py-2 border shadow-sm disabled:opacity-60"
          >
            {loading ? 'Calculating…' : 'Calculate'}
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'reset' })}
            className="rounded-2xl px-4 py-2 border"
          >
            Reset
          </button>
        </div>
      </form>

      <section className="rounded-2xl border p-4">
        <h2 className="font-medium mb-2">Results</h2>
        {error && <p className="text-red-600">Error: {error.message}</p>}
        {!called && <p className="text-gray-600">Enter values and hit Calculate.</p>}
        {called && !loading && !error && (
          <>
            <p>Hit Chance: <strong>{toPercent(data?.calculate?.hitChance)}</strong></p>
            <p>Crit Chance: <strong>{toPercent(data?.calculate?.critChance)}</strong></p>
            <p>Expected Damage: <strong>{data?.calculate?.expectedDamage?.toFixed(2)}</strong></p>
          </>
        )}
      </section>
    </main>
  )
}



