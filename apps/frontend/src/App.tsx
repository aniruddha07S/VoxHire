import "styles/globals.css";
import { Form } from "./components/Form";
import { useState, useEffect } from "react";
import { Interview } from "./components/Interview";
import { Result } from "./components/Result";
import { Toaster } from "sonner";
import { BrowserRouter, Routes, Route } from "react-router";

/** Floating particles background component */
function ParticleField() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 1,
    duration: `${Math.random() * 15 + 10}s`,
    delay: `${Math.random() * 10}s`,
    opacity: Math.random() * 0.3 + 0.1,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            bottom: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            // @ts-ignore CSS custom properties
            "--duration": p.duration,
            "--delay": p.delay,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/** Ambient gradient orbs in the background */
function AmbientOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Top-left orb */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full opacity-[0.04]"
        style={{
          background: "radial-gradient(circle, #2dd4bf, transparent 70%)",
          animation: "float-slow 20s ease-in-out infinite",
        }}
      />
      {/* Bottom-right orb */}
      <div
        className="absolute -bottom-[20%] -right-[10%] w-[500px] h-[500px] rounded-full opacity-[0.03]"
        style={{
          background: "radial-gradient(circle, #06b6d4, transparent 70%)",
          animation: "float-slow 25s ease-in-out infinite reverse",
        }}
      />
      {/* Center accent */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-[0.02]"
        style={{
          background: "radial-gradient(ellipse, #10b981, transparent 70%)",
          animation: "pulse-glow 8s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/** Grid overlay for that futuristic feel */
function GridOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(45, 212, 191, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(45, 212, 191, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

export function App() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="futuristic-bg min-h-screen relative">
      {mounted && (
        <>
          <AmbientOrbs />
          <GridOverlay />
          <ParticleField />
        </>
      )}

      <BrowserRouter>
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<Form />} />
            <Route path="/interview/:interviewId" element={<Interview />} />
            <Route path="/result/:interviewId" element={<Result />} />
          </Routes>
        </div>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "rgba(20, 30, 50, 0.9)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(45, 212, 191, 0.15)",
              color: "#e2e8f0",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            },
          }}
        />
      </BrowserRouter>
    </div>
  );
}

export default App;
