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
    setShowAwareness(false);
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
            const endpointStyle = {
              left: marker.x,
              top: marker.y,
              "--endpoint-x": `${(outwardX / outwardLength) * 30}px`,
              "--endpoint-y": `${(outwardY / outwardLength) * 30}px`,
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
          <small>September</small>
          <p><span>Blood Cancer &amp;</span><span>Pediatric Cancer</span><span>Awareness Month</span></p>
        </section>
      )}
    </main>
  );
}
