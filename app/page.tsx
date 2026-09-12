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
    const campaign = new URLSearchParams(window.location.search);
    if (campaign.get("utm_medium") === "qr") {
      window.gtag?.("event", "qr_landing", {
        campaign_name: campaign.get("utm_campaign") ?? "nmdp_registry",
        campaign_source: campaign.get("utm_source") ?? "berkeley_poster",
      });
    }
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [resize]);

  const trackRegistryClick = () => {
    window.gtag?.("event", "registry_click", {
      link_url: "https://www.nmdp.org/get-involved/join-the-registry",
      link_text: "Join in NMDP registry",
    });
  };

  const trackMapClick = () => {
    window.gtag?.("event", "map_click", {
      link_url: "https://maps.app.goo.gl/jtfTYBeFNQ23sQP77",
      link_text: "Open in Google Maps",
      location_name: "Amazon Hub Locker, 2495 Bancroft Way",
    });
  };

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
    if (isComplete) return;
    if (event.pointerType !== "mouse") {
      event.currentTarget.setPointerCapture(event.pointerId);
      pointsRef.current = [];
      addPoint(event);
    }
  };

  const finishPath = () => {
    if (!pointsRef.current.length) return;
    acceptingPointsRef.current = false;
    const canvas = canvasRef.current;
    let points = [...pointsRef.current];

    // A quick gesture should still create a usable journey. Continue the line
    // in the direction of the final part of the gesture until it is long enough
    // for all six questions to have their own space.
    if (canvas && points.length >= 1) {
      const last = points.at(-1)!;
      const anchor = points[Math.max(0, points.length - 4)];
      let dx = last.x - anchor.x;
      let dy = last.y - anchor.y;
      if (Math.hypot(dx, dy) < 2 && points.length > 1) {
        dx = last.x - points[0].x;
        dy = last.y - points[0].y;
      }
      if (Math.hypot(dx, dy) < 2) dy = 1;
      const magnitude = Math.hypot(dx, dy) || 1;
      const stepX = (dx / magnitude) * GRID;
      const stepY = (dy / magnitude) * GRID;
      const minimumLength = Math.min(Math.hypot(canvas.clientWidth, canvas.clientHeight) * 0.72, 720);
      let travelled = points.slice(1).reduce((total, point, index) => total + Math.hypot(point.x - points[index].x, point.y - points[index].y), 0);
      let cursor = last;
      while (travelled < minimumLength && points.length < MAX_POINTS) {
        const next = {
          x: Math.max(8, Math.min(canvas.clientWidth - 8, cursor.x + stepX)),
          y: Math.max(8, Math.min(canvas.clientHeight - 8, cursor.y + stepY)),
        };
        if (Math.hypot(next.x - cursor.x, next.y - cursor.y) < 4) break;
        points.push(next);
        travelled += Math.hypot(next.x - cursor.x, next.y - cursor.y);
        cursor = next;
      }
      cursor = points[0];
      while (travelled < minimumLength && points.length < MAX_POINTS) {
        const next = {
          x: Math.max(8, Math.min(canvas.clientWidth - 8, cursor.x - stepX)),
          y: Math.max(8, Math.min(canvas.clientHeight - 8, cursor.y - stepY)),
        };
        if (Math.hypot(next.x - cursor.x, next.y - cursor.y) < 4) break;
        points.unshift(next);
        travelled += Math.hypot(next.x - cursor.x, next.y - cursor.y);
        cursor = next;
      }
      pointsRef.current = points;
    }
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

  const advanceFromPath = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isComplete) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const click = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    const distanceToSegment = (point: Point, start: Point, end: Point) => {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const lengthSquared = dx * dx + dy * dy;
      const amount = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
      return Math.hypot(point.x - (start.x + amount * dx), point.y - (start.y + amount * dy));
    };
    const path = pointsRef.current;
    const touchedPath = path.slice(1).some((point, index) => distanceToSegment(click, path[index], point) <= 20);
    if (!touchedPath) return;
    const nextQuestion = [1, 2, 3, 4, 5, 6].find((index) => !clickedQuestions.includes(index));
    if (nextQuestion !== undefined) chooseQuestion(nextQuestion);
  };

  const downloadPoster = async () => {
    const source = canvasRef.current;
    if (!source) return;
    const poster = document.createElement("canvas");
    poster.width = 1080;
    const scale = poster.width / source.clientWidth;
    poster.height = Math.round(source.clientHeight * scale);
    const context = poster.getContext("2d");
    if (!context) return;
    await document.fonts.ready;
    context.fillStyle = "#f6f8fb";
    context.fillRect(0, 0, poster.width, poster.height);
    context.fillStyle = "#c9d1dc";
    for (let y = 0; y < poster.height; y += 24 * scale) for (let x = 0; x < poster.width; x += 24 * scale) {
      context.beginPath(); context.arc(x, y, 1.35 * scale, 0, Math.PI * 2); context.fill();
    }
    if (pointsRef.current.length > 1) {
      const path = pointsRef.current.map((point) => ({ x: point.x * scale, y: point.y * scale }));
      context.beginPath(); context.moveTo(path[0].x, path[0].y);
      for (let index = 1; index < path.length - 1; index += 1) {
        const point = path[index], next = path[index + 1];
        context.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
      }
      const last = path[path.length - 1]; context.lineTo(last.x, last.y);
      context.strokeStyle = "#165dff"; context.lineWidth = 2.25 * scale; context.lineCap = "round"; context.lineJoin = "round"; context.stroke();
    }
    const px = (value: number) => value * scale;
    const artwork = document.createElement("canvas");
    artwork.width = poster.width;
    artwork.height = poster.height;
    artwork.getContext("2d")?.drawImage(poster, 0, 0);
    const drawGlassText = (text: string, x: number, y: number, fontSize: number) => {
      const metrics = context.measureText(text);
      const textWidth = metrics.width;
      const startX = context.textAlign === "right" ? x - textWidth : context.textAlign === "center" ? x - textWidth / 2 : x;
      const padX = px(4.5);
      const padY = px(3);
      const top = y - fontSize * .86 - padY;
      const height = fontSize * 1.12 + padY * 2;
      context.save();
      context.beginPath();
      context.roundRect(startX - padX, top, textWidth + padX * 2, height, px(4));
      context.clip();
      context.filter = `blur(${px(7)}px)`;
      context.drawImage(artwork, 0, 0);
      context.filter = "none";
      context.fillStyle = "rgba(246, 248, 251, 0.78)";
      context.fillRect(startX - padX, top, textWidth + padX * 2, height);
      context.restore();
      context.fillText(text, x, y);
    };
    const drawLines = (text: string, x: number, y: number, width: number, lineHeight: number, fontSize: number) => {
      let line = ""; let row = y;
      for (const word of text.split(" ")) {
        const test = line ? `${line} ${word}` : word;
        if (context.measureText(test).width > width && line) { drawGlassText(line, x, row, fontSize); line = word; row += lineHeight; }
        else line = test;
      }
      drawGlassText(line, x, row, fontSize); return row + lineHeight;
    };
    const right = poster.width - px(22), titleTop = px(54);
    context.textAlign = "right"; context.fillStyle = "#cb2e25"; context.font = `500 ${px(38)}px Arial`;
    const titleLines = ["BLOOD", "CANCER &", "PEDIATRIC", "CANCER", "AWARENESS", "MONTH"];
    titleLines.forEach((line, index) => drawGlassText(line, right, titleTop + px(38 + index * 34), px(38)));
    const firstLineWidth = context.measureText(titleLines[0]).width;
    context.textAlign = "left"; context.font = `italic ${px(12)}px Georgia`;
    const septemberWidth = context.measureText("September").width;
    drawGlassText("September", Math.max(px(22), right - firstLineWidth - septemberWidth - px(9)), titleTop + px(38), px(12));
    let y = source.clientHeight * .42 * scale;
    context.fillStyle = "#20242a"; context.font = `500 ${px(20)}px Arial`; drawGlassText("Meet NMDP at UC Berkeley", px(22), y, px(20));
    y += px(33); context.fillStyle = "#165dff"; context.font = `600 ${px(17)}px Arial`; drawGlassText("Monday, September 21", px(22), y, px(17)); drawGlassText("10 AM – 12 PM PT", px(22), y + px(22), px(17));
    y += px(66); context.fillStyle = "#20242a"; context.font = `500 ${px(13)}px Arial`; drawGlassText("Outside the Amazon Hub Locker", px(22), y, px(13)); drawGlassText("2495 Bancroft Way, Berkeley, CA 94720", px(22), y + px(18), px(13));
    y += px(54); context.font = `400 ${px(12)}px Arial`; y = drawLines("Berkeley MDes students will be onsite volunteering and sharing more information about how to join the NMDP Registry.", px(22), y, px(310), px(16), px(12));
    y += px(10); y = drawLines("Approximately every 3–4 minutes, someone in the U.S. is diagnosed with a blood cancer or disorder.", px(22), y, px(310), px(16), px(12));
    y += px(10); y = drawLines("Healthy blood stem cells can help replace damaged cells and restore a patient’s blood and immune systems.", px(22), y, px(310), px(16), px(12));
    y += px(18); context.fillStyle = "#20242a"; context.font = `600 ${px(13)}px Arial`; drawGlassText("Join in NMDP registry", px(22), y, px(13));
    context.save();
    context.translate(px(171), y - px(5));
    context.rotate(-Math.PI / 4);
    context.strokeStyle = "#bdcc2a";
    context.lineWidth = px(2.6);
    context.lineCap = "square";
    context.beginPath();
    context.moveTo(0, 0); context.lineTo(px(17), 0);
    context.moveTo(px(11), px(-6)); context.lineTo(px(17), 0); context.lineTo(px(11), px(6));
    context.stroke();
    context.restore();
    poster.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob); link.download = "pia-build-one-path.png"; link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }, "image/png");
  };

  return (
    <main className={`path-stage${isComplete ? " is-complete" : ""}`}>
      <h1 className={hasPath ? "is-drawing" : ""}>draw 1 path.</h1>
      <canvas
        ref={canvasRef}
        aria-label="Move your pointer across the dot grid to build a blue path"
        onPointerDown={beginPath}
        onPointerMove={addPoint}
        onPointerLeave={(event) => event.pointerType === "mouse" && finishPath()}
        onPointerUp={finishPath}
        onPointerCancel={finishPath}
        onClick={advanceFromPath}
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
              <a href="https://maps.app.goo.gl/jtfTYBeFNQ23sQP77" target="_blank" rel="noreferrer" onClick={trackMapClick}>
                Outside the Amazon Hub Locker<br />2495 Bancroft Way, Berkeley, CA 94720
                <small>Open in Google Maps <i className="map-arrow" aria-hidden="true" /></small>
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
              <a className="registry-link" href="https://www.nmdp.org/get-involved/join-the-registry" target="_blank" rel="noreferrer" onClick={trackRegistryClick}>
                <span>Join in NMDP registry</span><i aria-hidden="true" />
              </a>
            </div>
          )}
        </section>
      )}
      {clickedQuestions.length >= 6 && <button className="share-poster" onClick={downloadPoster}>Share as poster.</button>}
    </main>
  );
}
