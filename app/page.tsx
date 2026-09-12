"use client";

import { useEffect, useRef, useState } from "react";

const bubbles = [
  { x: 15, y: 20, s: 86, d: "-1s" }, { x: 72, y: 17, s: 62, d: "-4s" },
  { x: 88, y: 42, s: 105, d: "-2s" }, { x: 13, y: 58, s: 55, d: "-5s" },
  { x: 75, y: 73, s: 78, d: "-3s" }, { x: 31, y: 87, s: 96, d: "-6s" },
];

export default function Home() {
  const [step, setStep] = useState(0);
  const [match, setMatch] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const begin = () => step === 0 && setStep(1);
  const connect = (index: number) => {
    if (step !== 1) return;
    setMatch(index);
    setStep(2);
    timer.current = setTimeout(() => setStep(3), 1200);
  };
  const reset = () => { setMatch(null); setStep(0); };

  return (
    <main className={`portal step-${step}`}>
      <div className="texture" aria-hidden="true" />
      <div className="wash" aria-hidden="true" />

      <header>
        <strong>NMDP</strong>
        <span>A CONNECTION EXPERIMENT</span>
      </header>

      <section className="field" aria-label="A field of potential connections">
        <div className="bridge" aria-hidden="true" />
        <button className="you bubble" onClick={begin} aria-label="Tap you to begin">
          <span>YOU</span><i /><i /><i />
        </button>
        {bubbles.map((bubble, index) => (
          <button
            key={index}
            className={`bubble stranger stranger-${index} ${match === index ? "matched" : ""}`}
            style={{ left: `${bubble.x}%`, top: `${bubble.y}%`, width: bubble.s, height: bubble.s, "--delay": bubble.d } as React.CSSProperties}
            onClick={() => connect(index)}
            aria-label={`Choose stranger ${index + 1}`}
            disabled={step === 0 || step > 1}
          ><i /><i /><i /><b /></button>
        ))}
        <div className="ripples" aria-hidden="true"><i /><i /><i /></div>
      </section>

      <section className="message" key={step} aria-live="polite">
        {step === 0 && <><p>Begin with one person.</p><h1>Tap “YOU”</h1></>}
        {step === 1 && <><p>The system is awake.</p><h1>Choose a stranger.</h1></>}
        {step === 2 && <><p>Connecting...</p><h1>Let them meet.</h1></>}
        {step === 3 && <><p>A match begins here.</p><h1>Strangers<br/>can save lives.</h1></>}
      </section>

      <footer>
        <span className="status"><i /> {step === 0 ? "WAITING" : step === 1 ? "ACTIVE" : step === 2 ? "MATCHING" : "CONNECTED"}</span>
        {step === 3 ? <button onClick={reset}>Again ↺</button> : <span>{step + 1} / 4</span>}
      </footer>
    </main>
  );
}
