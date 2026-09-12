"use client";
import { useEffect,useRef,useState } from "react";

const cells=[
 {x:56,y:11,w:78,h:52,r:-18},{x:70,y:17,w:42,h:58,r:28},{x:49,y:23,w:48,h:38,r:-8},
 {x:63,y:28,w:92,h:82,r:13},{x:76,y:36,w:38,h:55,r:-27},{x:54,y:39,w:54,h:43,r:22},
 {x:45,y:46,w:82,h:59,r:-38},{x:58,y:51,w:41,h:67,r:15},{x:38,y:56,w:46,h:37,r:-12},
 {x:47,y:63,w:96,h:70,r:31},{x:31,y:68,w:42,h:57,r:-27},{x:41,y:74,w:50,h:35,r:8},
 {x:26,y:79,w:82,h:61,r:-18},{x:37,y:86,w:37,h:53,r:25},{x:19,y:91,w:53,h:37,r:-30},
];
const reveals=[
 "Most life-saving matches begin between strangers.",
 "NMDP connects patients and potential stem cell donors.",
 "September is Blood Cancer Awareness Month.",
 "Meet NMDP at UC Berkeley.",
];
type Drag={from:number;x:number;y:number;ox:number;oy:number}|null;

export default function Home(){
 const[started,setStarted]=useState(false),[found,setFound]=useState(false),[linked,setLinked]=useState<number[]>([]),[drag,setDrag]=useState<Drag>(null),[flash,setFlash]=useState(false);
 const field=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!drag)return;const move=(e:PointerEvent)=>setDrag(d=>d?{...d,x:e.clientX,y:e.clientY}:null);const up=(e:PointerEvent)=>{const el=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>("[data-cell]");const target=el?Number(el.dataset.cell):-1;if(target>=0&&target!==drag.from&&!linked.includes(target)){setLinked(v=>[...v,target]);setFlash(true);setTimeout(()=>setFlash(false),850)}setDrag(null)};window.addEventListener("pointermove",move);window.addEventListener("pointerup",up);return()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up)}},[drag,linked]);
 const beginDrag=(e:React.PointerEvent,index:number)=>{if(!found||linked.includes(index))return;e.preventDefault();const rect=e.currentTarget.getBoundingClientRect();setDrag({from:index,x:e.clientX,y:e.clientY,ox:rect.left+rect.width/2,oy:rect.top+rect.height/2})};
 const reset=()=>{setStarted(false);setFound(false);setLinked([]);setDrag(null)};
 return <main className={`experience ${started?"started":""} ${found?"found":""} ${flash?"flash":""}`}>
  {!started&&<button className="start" onClick={()=>setStarted(true)}><span>Tap to start</span><i/></button>}
  {started&&<>
   <div className="prompt" key={`${found}-${linked.length}`}>{!found?"Find YOU":linked.length===0?"Drag YOU to a stranger":"Keep connecting"}</div>
   <div className="cell-field" ref={field}>
    {cells.map((c,i)=><button key={i} data-cell={i} aria-label={i===6?"You":`Stranger ${i+1}`} onClick={()=>i===6&&!found&&setFound(true)} onPointerDown={e=>beginDrag(e,i)} className={`cell c${i} ${i===6?"you":""} ${linked.includes(i)?"linked":""}`} style={{left:`${c.x}%`,top:`${c.y}%`,width:c.w,height:c.h,"--r":`${c.r}deg`,"--i":i} as React.CSSProperties}><i/><i/>{i===6&&<b>YOU</b>}</button>)}
    {linked.map((n,i)=><div key={n} className="bond" style={{"--n":n,"--order":i} as React.CSSProperties}/>) }
   </div>
   {drag&&<div className="drag-line" style={{left:drag.ox,top:drag.oy,width:Math.hypot(drag.x-drag.ox,drag.y-drag.oy),rotate:`${Math.atan2(drag.y-drag.oy,drag.x-drag.ox)}rad`}}/>}
   {linked.length>0&&<section className="reveal" key={linked.length}><small>CONNECTION {String(linked.length).padStart(2,"0")}</small><p>{reveals[Math.min(linked.length-1,reveals.length-1)]}</p></section>}
   {linked.length>0&&<button className="reset" onClick={reset}>Start again ↺</button>}
  </>}
 </main>
}
