"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
    setIsComplete(true);
    paint();
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
    </main>
  );
}
