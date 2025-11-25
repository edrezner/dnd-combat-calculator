"use client";

import { useState } from "react";
import QuickCalcForm from "./components/QuickCalcForm";
import AttackProfileForm from "./components/AttackProfileForm";
import BuildFromKitForm from "./components/BuildFromKitForm";

enum Mode {
  QUICK = "quick",
  PROFILE = "profile",
  KIT = "kit",
}

export default function CalcPage() {
  const [mode, setMode] = useState(Mode.QUICK);

  return (
    <main className="mx-auto max-w-xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">DPR Calculator</h1>

      {/* Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode(Mode.QUICK)}
          className={`rounded-2xl px-4 py-2 border ${
            mode === Mode.QUICK ? "bg-blue-600 text-white" : ""
          }`}
          disabled={mode === Mode.QUICK}
        >
          Quick Calc
        </button>
        <button
          onClick={() => setMode(Mode.PROFILE)}
          className={`rounded-2xl px-4 py-2 border ${
            mode === Mode.PROFILE ? "bg-blue-600 text-white" : ""
          } `}
          disabled={mode === Mode.PROFILE}
        >
          Attack Profile (Manual entry of dice/effects)
        </button>
        <button
          onClick={() => setMode(Mode.KIT)}
          className={`rounded-2xl px-4 py-2 border ${
            mode === Mode.KIT ? "bg-blue-600 text-white" : ""
          } `}
          disabled={mode === Mode.KIT}
        >
          Class Kit
        </button>
      </div>
      {/* Forms */}
      {mode === Mode.QUICK ? (
        <QuickCalcForm />
      ) : mode === Mode.PROFILE ? (
        <AttackProfileForm />
      ) : (
        <BuildFromKitForm />
      )}
    </main>
  );
}
