import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <section className="flex flex-col items-center py-20 text-center">
        <h1 className="max-w-2xl text-4xl font-bold leading-tight">
          From a damage photo to a safe cash settlement
        </h1>
        <p className="mt-4 max-w-lg text-lg text-[#4A5B6B]">
          Auto-Settle AI handles your motor insurance claim end to end — no
          paperwork, no delays.
        </p>
        <button
          onClick={() => navigate("/verify")}
          className="mt-8 rounded-lg bg-[#0F1F33] px-8 py-3 text-lg font-semibold text-white hover:bg-[#1C3050]"
        >
          Start a claim
        </button>
      </section>

      {/* Steps */}
      <section className="grid w-full max-w-3xl gap-8 sm:grid-cols-3">
        {[
          { step: "1", title: "Verify policy", desc: "Enter your policy number and verify via OTP." },
          { step: "2", title: "Upload photos", desc: "Snap the damaged areas — AI assesses the rest." },
          { step: "3", title: "Get a fair offer", desc: "Negotiate or accept instantly. Money in your account." },
        ].map(({ step, title, desc }) => (
          <div key={step} className="rounded-xl bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#0F1F33] text-lg font-bold text-white">
              {step}
            </div>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-[#4A5B6B]">{desc}</p>
          </div>
        ))}
      </section>

      {/* Adjuster link */}
      <button
        onClick={() => navigate("/adjuster")}
        className="mt-10 text-sm text-[#4A5B6B] underline underline-offset-2 hover:text-[#0F1F33]"
      >
        Adjuster login
      </button>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#D6D0C4] py-6 text-center text-sm text-[#4A5B6B]">
        Every decision is logged and explainable.
      </footer>
    </div>
  );
}