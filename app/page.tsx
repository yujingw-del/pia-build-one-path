"use client";

import { useEffect, useRef, useState } from "react";

type NodePoint = { x: number; y: number; size: number; color: string; label?: string };

const nodes: NodePoint[] = [
  { x: 50, y: 52, size: 74, color: "#f25d72", label: "YOU" },
  { x: 17, y: 19, size: 51, color: "#6da67f" }, { x: 37, y: 27, size: 42, color: "#5fa9d1" },
  { x: 69, y: 18, size: 46, color: "#8e78ba" }, { x: 83, y: 35, size: 53, color: "#ec9950" },
  { x: 18, y: 53, size: 44, color: "#765252" }, { x: 78, y: 65, size: 48, color: "#4c8ec5" },
  { x: 28, y: 76, size: 58, color: "#c84e53" }, { x: 58, y: 82, size: 46, color: "#e8c74f" },
  { x: 90, y: 84, size: 42, color: "#6c9d6e" },
];
const connections = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,2],[1,5],[2,3],[2,5],[3,4],[3,6],[4,6],[5,7],[5,8],[6,8],[6,9],[7,8],[8,9]];

function Network({ stage, selected, onNode }: { stage: number; selected: number | null; onNode: (index: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let frame = 0, raf = 0;
    const draw = () => {
      const rect = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2);
      canvas.width = rect.width * dpr; canvas.height = rect.height * dpr; ctx.scale(dpr, dpr); ctx.clearRect(0, 0, rect.width, rect.height);
      const px = (n: NodePoint) => n.x / 100 * rect.width, py = (n: NodePoint) => n.y / 100 * rect.height;
      connections.forEach(([a,b], i) => {
        const n1 = nodes[a], n2 = nodes[b], focus = selected !== null && ((a === 0 && b === selected) || (b === 0 && a === selected));
        ctx.beginPath(); ctx.moveTo(px(n1), py(n1)); const bend = ((i % 3) - 1) * 24;
        ctx.quadraticCurveTo((px(n1)+px(n2))/2 + bend, (py(n1)+py(n2))/2 - bend, px(n2), py(n2));
        ctx.strokeStyle = focus ? "rgba(35,33,29,.82)" : stage >= 2 ? "rgba(35,33,29,.12)" : "rgba(35,33,29,.22)"; ctx.lineWidth = focus ? 1.8 : .75; ctx.stroke();
        if (focus) { const t = (frame % 120) / 120; const x = (1-t)*(1-t)*px(n1)+2*(1-t)*t*((px(n1)+px(n2))/2+bend)+t*t*px(n2); const y = (1-t)*(1-t)*py(n1)+2*(1-t)*t*((py(n1)+py(n2))/2-bend)+t*t*py(n2); ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.shadowBlur=10; ctx.shadowColor="#fff"; ctx.fill(); ctx.shadowBlur=0; }
      }); frame++; raf = requestAnimationFrame(draw);
    }; draw(); return () => cancelAnimationFrame(raf);
  }, [stage, selected]);
  return <div className={`network stage-${stage}`}><canvas ref={canvasRef}/>{nodes.map((node, index) => {
    const active = index === 0 ? stage >= 1 : index === selected;
    return <button key={index} className={`node ${active ? "active" : ""} ${index === 0 ? "you" : "stranger"}`} style={{left:`${node.x}%`,top:`${node.y}%`,width:node.size,height:node.size,"--node-color":node.color} as React.CSSProperties} aria-label={index === 0 ? "You — begin" : `Connect with stranger ${index}`} onClick={() => onNode(index)}><span className="ring r1"/><span className="ring r2"/><span className="core"/>{node.label && <span className="node-label">{node.label}</span>}</button>;
  })}</div>;
}

export default function Home() {
  const [stage,setStage] = useState(0); const [selected,setSelected] = useState<number|null>(null);
  const chooseNode = (index:number) => { if(index===0 && stage===0) setStage(1); if(index>0 && stage===1){setSelected(index);setStage(2);window.setTimeout(()=>setStage(3),2300);} };
  const reveal = () => setStage(v=>Math.min(5,v+1));
  const restart = () => {setStage(0);setSelected(null);window.scrollTo({top:0,behavior:"smooth"});};
  const saveEvent = () => { const text="NMDP @ UC Berkeley\nMonday, September 21 · 10 AM–12 PM PT\nOutside the Amazon Hub Locker\n2495 Bancroft Way, Berkeley, CA 94720"; const file=new Blob([text],{type:"text/plain"});const href=URL.createObjectURL(file);const a=document.createElement("a");a.href=href;a.download="nmdp-uc-berkeley-event.txt";a.click();URL.revokeObjectURL(href); };
  return <main className={`experience stage-${stage}`}>
    <header className="masthead"><span className="mark">NMDP</span><span className="chapter">A registry of human connections</span></header>
    <section className="hero" aria-live="polite"><Network stage={stage} selected={selected} onNode={chooseNode}/><div className="copy"><p className="eyebrow">An invitation to connect</p><h1>{stage<2?"Find Your\nConnection":"A connection\ncan save a life."}</h1><p className="subhead">{stage===0?"Someone you’ve never met could be your match.":stage===1?"Now choose someone you’ve never met.":"Most life-saving matches begin between strangers."}</p>{stage===0&&<button className="begin" onClick={()=>setStage(1)}>Tap “YOU” to begin <span>↘</span></button>}{stage===1&&<p className="hint">Choose any colored node</p>}{stage===3&&<div className="meaning"><span>THE MEANING</span><p>NMDP connects patients with potential stem cell donors through its registry.</p><button onClick={reveal}>Discover why it matters ↓</button></div>}</div><div className="progress" aria-label={`Step ${stage+1} of 6`}><span style={{width:`${(stage+1)/6*100}%`}}/></div></section>
    {stage>=4&&<section className="story"><p className="section-no">01 / AWARENESS</p><h2>September is Blood Cancer and Pediatric Cancer Awareness Month.</h2><div className="fact-grid"><article className="big-fact"><span>Every</span><strong>3–4</strong><span>minutes</span><p>someone in the U.S. is diagnosed with a blood cancer or disorder.</p></article><article className="explain"><p>Blood stem cells live in bone marrow and blood.</p><p>When donated, healthy stem cells can help replace damaged cells and restore blood and immune systems.</p></article></div>{stage===4&&<button className="next" onClick={reveal}>See the invitation <span>↓</span></button>}</section>}
    {stage>=5&&<section className="invitation"><div className="event-card"><div className="event-top"><span>NMDP × UC Berkeley</span><span>SEP<br/><b>21</b></span></div><div className="mini-network"><i/><i/><i/><i/><i/></div><h2>Come meet the<br/>registry of strangers.</h2><div className="event-details"><p><small>WHEN</small>Monday, September 21<br/>10:00 AM–12:00 PM PT</p><p><small>WHERE</small>Outside the Amazon Hub Locker<br/>2495 Bancroft Way, Berkeley</p></div><p className="volunteer">Berkeley MDes students will be onsite to share how a small action can become a life-saving connection.</p></div><div className="actions"><button onClick={saveEvent}>Save the Event <span>↓</span></button><a href="https://www.nmdp.org/get-involved/join-the-registry" target="_blank" rel="noreferrer">Visit NMDP <span>↗</span></a></div><button className="restart" onClick={restart}>↺ Experience again</button></section>}
    <footer><span>NMDP @ UC Berkeley</span><span>Made to connect strangers.</span></footer>
  </main>;
}
