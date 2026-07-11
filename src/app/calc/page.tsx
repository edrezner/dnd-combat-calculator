"use client";

import { useState } from "react";
import Header from "../components/Header";
import QuickCalcForm from "./components/QuickCalcForm";
import AttackProfileForm from "./components/AttackProfileForm";
import BuildFromKitForm from "./components/BuildFromKitForm";

enum Mode {
  QUICK = "quick",
  PROFILE = "profile",
  KIT = "kit",
}

const modeOptions = [
  { mode: Mode.QUICK, label: "Quick Calc" },
  { mode: Mode.PROFILE, label: "Attack Profile" },
  { mode: Mode.KIT, label: "Class Kit" },
];

export default function CalcPage() {
  const [mode, setMode] = useState(Mode.QUICK);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-12 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">DPR Calculator</h1>
          <ul className="list-disc space-y-1 pl-5 text-gray-600">
            <li>
              Choose Quick Calc if average damage values on hits and crits are
              known.
            </li>
            <li>Choose Attack Profile to calculate DPR using dice models.</li>
            <li>
              Choose Class Kit to calculate DPR using feats and class features
              (beta).
            </li>
          </ul>
        </div>

        {/* Toggle */}
        <div className="grid gap-2 sm:grid-cols-3">
          {modeOptions.map((button) => {
            return (
              <button
                key={button.mode}
                onClick={() => setMode(button.mode)}
                className={`rounded-lg border px-4 py-2 transition-colors ${
                  mode === button.mode
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100"
                }`}
                disabled={mode === button.mode}
              >
                {button.label}
              </button>
            );
          })}
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
    </>
  );
}
