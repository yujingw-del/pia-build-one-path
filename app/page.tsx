"use client";

import { useEffect, useRef, useState } from "react";

const bubbles = [
  {x:92,y:5,s:35,d:".1s"},{x:78,y:10,s:58,d:".25s"},{x:91,y:20,s:26,d:".4s"},
  {x:68,y:23,s:42,d:".55s"},{x:82,y:31,s:72,d:".7s"},{x:57,y:35,s:30,d:".85s"},
  {x:68,y:44,s:54,d:"1s"},{x:48,y:49,s:37,d:"1.15s"},{x:58,y:58,s:76,d:"1.3s"},
  {x:38,y:62,s:49,d:"1.45s"},{x:46,y:71,s:28,d:"1.6s"},{x:27,y:75,s:67,d:"1.75s"},
  {x:35,y:84,s:38,d:"1.9s"},{x:15,y:89,s:56,d:"2.05s"},{x:23,y:97,s:25,d:"2.2s"},
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
      <div className="wash" aria-hidden="true" />

      <header>
        <strong>NMDP</strong>
        <span>A CONNECTION EXPERIMENT</span>
      </header>

      <section className="field" aria-label="A field of potential connections">
        <div className="bridge" aria-hidden="true" />
        <button className="you bubble" onClick={begin} aria-label="Tap you to begin">
          <span>YOU</span><i /><i /><i /><em>Tap YOU</em>
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

      {step > 0 && <section className="message" key={step} aria-live="polite">
        {step === 1 && <h1>Choose a stranger.</h1>}
        {step === 2 && <h1>Connecting...</h1>}
        {step === 3 && <><p>Most life-saving matches</p><h1>begin between strangers.</h1><button onClick={reset}>Again ↺</button></>}
      </section>}
    </main>
  );
}
