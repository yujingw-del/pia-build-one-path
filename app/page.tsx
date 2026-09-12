"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

type Point = { x: number; y: number };
const GRID = 24;
const MAX_POINTS = 56;

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);
  const frameRef = useRef<number | null>(null);
  const acceptingPointsRef = useRef(true);
  const [hasPath, setHasPath] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [markers, setMarkers] = useState<Point[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [clickedQuestions, setClickedQuestions] = useState<number[]>([]);
  const [showAwareness, setShowAwareness] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    const points = pointsRef.current;
    if (points.length < 1) return;
    context.save();
    context.lineWidth = 2.25;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#165dff";
    context.shadowColor = "rgba(22, 93, 255, 0.18)";
    context.shadowBlur = 8;
    if (points.length > 1) {
      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      for (let index = 1; index < points.length - 1; index += 1) {
        const current = points[index];
        const next = points[index + 1];
        context.quadraticCurveTo(current.x, current.y, (current.x + next.x) / 2, (current.y + next.y) / 2);
      }
      const last = points[points.length - 1];
      context.lineTo(last.x, last.y);
      context.stroke();
    }
    const last = points[points.length - 1];
    context.beginPath();
    context.arc(last.x, last.y, 4, 0, Math.PI * 2);
    context.fillStyle = "#165dff";
    context.fill();
    context.restore();
  }, []);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(bounds.width * scale);
    canvas.height = Math.round(bounds.height * scale);
    canvas.getContext("2d")?.setTransform(scale, 0, 0, scale, 0, 0);
    paint();
  }, [paint]);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [resize]);

  const addPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!acceptingPointsRef.current) return;
    if (event.pointerType === "touch" && event.buttons === 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = {
      x: Math.round((event.clientX - bounds.left) / GRID) * GRID,
      y: Math.round((event.clientY - bounds.top) / GRID) * GRID,
    };
    const previous = pointsRef.current.at(-1);
    if (previous?.x === point.x && previous?.y === point.y) return;
    pointsRef.current = [...pointsRef.current, point].slice(-MAX_POINTS);
    if (!hasPath) setHasPath(true);
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(paint);
  };

  const beginPath = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!acceptingPointsRef.current) {
      acceptingPointsRef.current = true;
      pointsRef.current = [];
      setHasPath(false);
      setIsComplete(false);
      setMarkers([]);
      setActiveQuestion(null);
      setShowLearnMore(false);
      setHasInteracted(false);
      setClickedQuestions([]);
      setShowAwareness(false);
      setShowEventDetails(false);
      paint();
    }
    if (event.pointerType !== "mouse") {
      event.currentTarget.setPointerCapture(event.pointerId);
      pointsRef.current = [];
      addPoint(event);
    }
  };

  const finishPath = () => {
    if (!pointsRef.current.length) return;
    acceptingPointsRef.current = false;
    const points = pointsRef.current;
    setMarkers(Array.from({ length: 8 }, (_, index) => {
      const pointIndex = Math.round((index / 7) * (points.length - 1));
      return points[pointIndex];
    }));
    setIsComplete(true);
    paint();
  };

  const chooseQuestion = (index: number) => {
    if (clickedQuestions.includes(index)) return;
    setHasInteracted(true);
    setClickedQuestions((current) => [...current, index]);
    if (clickedQuestions.length === 0) {
      setActiveQuestion(index);
      setShowLearnMore(true);
      return;
    }
    if (clickedQuestions.length === 1) {
      setActiveQuestion(index);
      setShowLearnMore(false);
      setShowAwareness(true);
      return;
    }
    setActiveQuestion(index);
    setShowEventDetails(true);
  };

  const downloadPoster = async () => {
    const poster = document.createElement("canvas");
    poster.width = 1080;
    poster.height = 1350;
    const context = poster.getContext("2d");
    if (!context) return;
    await document.fonts.ready;
    context.fillStyle = "#f6f8fb";
    context.fillRect(0, 0, poster.width, poster.height);
    context.fillStyle = "#c9d1dc";
    for (let y = 24; y < poster.height; y += 30) for (let x = 24; x < poster.width; x += 30) {
      context.beginPath(); context.arc(x, y, 2, 0, Math.PI * 2); context.fill();
    }
    const source = canvasRef.current;
    if (source && pointsRef.current.length > 1) {
      const sx = poster.width / source.clientWidth;
      const sy = poster.height / source.clientHeight;
      const path = pointsRef.current.map((point) => ({ x: point.x * sx, y: point.y * sy }));
      context.beginPath(); context.moveTo(path[0].x, path[0].y);
      for (let index = 1; index < path.length - 1; index += 1) {
        const point = path[index], next = path[index + 1];
        context.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
      }
      const last = path[path.length - 1]; context.lineTo(last.x, last.y);
      context.strokeStyle = "#165dff"; context.lineWidth = 6; context.lineCap = "round"; context.lineJoin = "round"; context.stroke();
    }
    const drawLines = (text: string, x: number, y: number, width: number, lineHeight: number) => {
      let line = ""; let row = y;
      for (const word of text.split(" ")) {
        const test = line ? `${line} ${word}` : word;
        if (context.measureText(test).width > width && line) { context.fillText(line, x, row); line = word; row += lineHeight; }
        else line = test;
      }
      context.fillText(line, x, row); return row + lineHeight;
    };
    context.textAlign = "right"; context.fillStyle = "#cb2e25"; context.font = "500 78px Arial";
    ["BLOOD CANCER &", "PEDIATRIC CANCER", "AWARENESS MONTH"].forEach((line, index) => context.fillText(line, 1020, 120 + index * 72));
    context.textAlign = "left"; context.fillStyle = "#cb2e25"; context.font = "italic 28px Georgia"; context.fillText("September", 470, 74);
    let y = 540; context.fillStyle = "#20242a"; context.font = "500 42px Arial"; context.fillText("Meet NMDP at UC Berkeley", 64, y);
    y += 60; context.fillStyle = "#165dff"; context.font = "600 34px Arial"; context.fillText("Monday, September 21", 64, y); context.fillText("10 AM – 12 PM PT", 64, y + 42);
    y += 115; context.fillStyle = "#20242a"; context.font = "500 26px Arial"; context.fillText("Outside the Amazon Hub Locker", 64, y); context.fillText("2495 Bancroft Way, Berkeley, CA 94720", 64, y + 34);
    y += 105; context.font = "400 23px Arial"; y = drawLines("Berkeley MDes students will be onsite volunteering and sharing more information about how to join the NMDP Registry.", 64, y, 720, 31);
    y += 22; y = drawLines("Approximately every 3–4 minutes, someone in the U.S. is diagnosed with a blood cancer or disorder.", 64, y, 720, 31);
    y += 22; drawLines("Healthy blood stem cells can help replace damaged cells and restore a patient’s blood and immune systems.", 64, y, 720, 31);
    context.fillStyle = "#bdcc2a"; context.fillRect(64, 1245, 250, 8);
    context.fillStyle = "#20242a"; context.font = "600 24px Arial"; context.fillText("Join the NMDP Registry", 64, 1228);
    poster.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob); link.download = "pia-build-one-path.png"; link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }, "image/png");
  };

  return (
    <main className={`path-stage${isComplete ? " is-complete" : ""}`}>
      <h1 className={hasPath ? "is-drawing" : ""}>build 1 path.</h1>
      <canvas
        ref={canvasRef}
        aria-label="Move your pointer across the dot grid to build a blue path"
        onPointerDown={beginPath}
        onPointerMove={addPoint}
        onPointerLeave={(event) => event.pointerType === "mouse" && finishPath()}
        onPointerUp={finishPath}
        onPointerCancel={finishPath}
      />
      {isComplete && markers.length === 8 && (
        <div className="path-markers" aria-label="Donor to patient path">
          {markers.map((marker, index) => {
            const label = index === 0 ? "DONOR" : index === 7 ? "PATIENT" : "?";
            if (label === "?") {
              const previous = markers[index - 1];
              const next = markers[index + 1];
              const tangentX = next.x - previous.x;
              const tangentY = next.y - previous.y;
              const length = Math.hypot(tangentX, tangentY) || 1;
              let offsetX = (-tangentY / length) * 20;
              let offsetY = (tangentX / length) * 20;
              const width = canvasRef.current?.clientWidth ?? 480;
              const height = canvasRef.current?.clientHeight ?? 800;
              if (marker.x + offsetX < 24 || marker.x + offsetX > width - 24 || marker.y + offsetY < 24 || marker.y + offsetY > height - 24) {
                offsetX *= -1;
                offsetY *= -1;
              }
              const questionStyle = {
                left: marker.x,
                top: marker.y,
                animationDelay: `${(index - 1) * 110}ms`,
                "--question-x": `${offsetX}px`,
                "--question-y": `${offsetY}px`,
                "--question-hop-y": `${offsetY - 8}px`,
              } as CSSProperties;
              return (
                <button
                  className={`path-marker question${clickedQuestions.includes(index) ? " is-visited" : ""}`}
                  key={index}
                  style={questionStyle}
                  aria-label={`Question mark ${index}`}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => chooseQuestion(index)}
                >
                  ?
                </button>
              );
            }
            const neighbor = index === 0 ? markers[1] : markers[6];
            const outwardX = marker.x - neighbor.x;
            const outwardY = marker.y - neighbor.y;
            const outwardLength = Math.hypot(outwardX, outwardY) || 1;
            const canvasWidth = canvasRef.current?.clientWidth ?? 480;
            const canvasHeight = canvasRef.current?.clientHeight ?? 800;
            const desiredX = marker.x + (outwardX / outwardLength) * 30;
            const desiredY = marker.y + (outwardY / outwardLength) * 30;
            const safeX = Math.min(canvasWidth - 42, Math.max(42, desiredX));
            const safeY = Math.min(canvasHeight - 22, Math.max(22, desiredY));
            const endpointStyle = {
              left: marker.x,
              top: marker.y,
              "--endpoint-x": `${safeX - marker.x}px`,
              "--endpoint-y": `${safeY - marker.y}px`,
            } as CSSProperties;
            return (
              <span className="path-marker endpoint" key={label} style={endpointStyle}>
                <span>{label}</span>
              </span>
            );
          })}
        </div>
      )}
      {isComplete && !hasInteracted && (
        <p className="path-prompt"><span>Tap a</span><span>question mark.</span></p>
      )}
      {showLearnMore && (
        <section className="glass-message" aria-live="polite">
          <p>Want to learn more?</p>
        </section>
      )}
      {showAwareness && (
        <section className="awareness-message" aria-live="polite">
          <p><span className="awareness-first"><small>September</small>Blood Cancer &amp;</span><span>Pediatric Cancer</span><span>Awareness Month</span></p>
        </section>
      )}
      {showEventDetails && (
        <section className="event-details" aria-live="polite">
          <h2>Meet NMDP at UC Berkeley</h2>
          <p className="event-time"><span>Monday, September 21</span><span>10 AM – 12 PM PT</span></p>
          {clickedQuestions.length >= 4 && (
            <div className="story-block address-block">
              <a href="https://maps.app.goo.gl/jtfTYBeFNQ23sQP77" target="_blank" rel="noreferrer">
                Outside the Amazon Hub Locker<br />2495 Bancroft Way, Berkeley, CA 94720
                <small>Open in Google Maps ↗</small>
              </a>
            </div>
          )}
          {clickedQuestions.length >= 5 && (
            <div className="story-block volunteer-block">
              <p><span>Berkeley MDes students will be onsite volunteering and sharing more information about how to join the NMDP Registry.</span></p>
            </div>
          )}
          {clickedQuestions.length >= 6 && (
            <div className="story-block facts-block">
              <p><span>Approximately every 3–4 minutes, someone in the U.S. is diagnosed with a blood cancer or disorder.</span></p>
              <p><span>Healthy blood stem cells can help replace damaged cells and restore a patient’s blood and immune systems.</span></p>
              <a className="registry-link" href="https://www.nmdp.org/get-involved/join-the-registry" target="_blank" rel="noreferrer">
                <span>Join in NMDP registry</span><i aria-hidden="true">→</i>
              </a>
            </div>
          )}
        </section>
      )}
      {clickedQuestions.length >= 6 && <button className="share-poster" onClick={downloadPoster}>Share as poster.</button>}
    </main>
  );
}
