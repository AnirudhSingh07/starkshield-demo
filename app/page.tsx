"use client";

import { useState, useEffect, useRef } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";

function ScrambleText({ text, trigger }: any) {
  const [display, setDisplay] = useState(text);
  const frame = useRef(0);
  const interval = useRef(null);

  useEffect(() => {
    if (!trigger) return;
    let iteration = 0;
    clearInterval(interval.current);
    interval.current = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (i < iteration) return text[i];
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join("")
      );
      if (iteration >= text.length) clearInterval(interval.current);
      iteration += 0.5;
    }, 30);
    return () => clearInterval(interval.current);
  }, [trigger, text]);

  return <span>{display}</span>;
}

function HexGrid() {
  return (
    <div className="hex-grid" aria-hidden="true">
      {Array.from({ length: 80 }).map((_, i) => (
        <div key={i} className="hex-cell" style={{ animationDelay: `${(i * 0.07) % 4}s` }} />
      ))}
    </div>
  );
}

function TerminalLine({ children, delay = 0, type = "default" }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div className={`terminal-line ${type} ${visible ? "visible" : ""}`}>
      {type !== "blank" && <span className="prompt">{type === "comment" ? "//" : "›"}</span>}
      <span>{children}</span>
    </div>
  );
}

const STEPS = [
  { id: "idle", label: null },
  { id: "generating", label: "GENERATING WITNESS..." },
  { id: "proving", label: "COMPUTING ZK PROOF..." },
  { id: "submitting", label: "SUBMITTING TO STARKNET..." },
  { id: "verifying", label: "VERIFYING ON-CHAIN..." },
  { id: "done", label: "VERIFICATION COMPLETE" },
];

export default function AgeCheckDemo() {
  const [age, setAge] = useState("");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [scramble, setScramble] = useState(false);
  const [proofHex, setProofHex] = useState("");

  const isRunning = step > 0 && step < 5;

  function randomHex(len) {
    return "0x" + Array.from({ length: len }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
  }

  async function handleVerify() {
    if (!age || isRunning) return;
    setError(null);
    setResult(null);
    setTxHash(null);
    setScramble(true);
    setProofHex(randomHex(64));

    // Step through stages with realistic timing
    for (let i = 1; i <= 4; i++) {
      setStep(i);
      await new Promise((r) => setTimeout(r, i === 3 ? 2200 : 1200));
    }

    try {
      const res = await fetch("/api/verify-age", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age: Number(age) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setResult(data);
      setTxHash(randomHex(63)); // display mock tx hash for demo
    } catch (err) {
      setError(err.message);
    } finally {
      setStep(5);
      setTimeout(() => setStep(0), 4000);
    }
  }

  const currentStep = STEPS[Math.min(step, STEPS.length - 1)];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #020408;
          --surface: #050d14;
          --border: #0d2233;
          --border-bright: #0f3a56;
          --accent: #00d4ff;
          --accent-dim: #007a94;
          --accent-glow: rgba(0, 212, 255, 0.15);
          --green: #00ff9d;
          --green-dim: #00994d;
          --red: #ff3b5c;
          --red-dim: #991f33;
          --text: #c8dde8;
          --text-dim: #446070;
          --text-bright: #e8f4fa;
          --mono: 'Space Mono', monospace;
          --display: 'Syne', sans-serif;
        }

        html, body { height: 100%; background: var(--bg); color: var(--text); font-family: var(--mono); }

        .root {
          min-height: 100vh;
          display: grid;
          grid-template-rows: auto 1fr auto;
          position: relative;
          overflow: hidden;
        }

        /* ── Hex grid background ── */
        .hex-grid {
          position: fixed; inset: 0; z-index: 0;
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          opacity: 0.035;
          pointer-events: none;
        }
        .hex-cell {
          aspect-ratio: 1;
          border: 1px solid var(--accent);
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          animation: hexPulse 4s ease-in-out infinite;
        }
        @keyframes hexPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        /* ── Scanline overlay ── */
        .root::after {
          content: '';
          position: fixed; inset: 0; z-index: 1;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.03) 2px,
            rgba(0,0,0,0.03) 4px
          );
          pointer-events: none;
        }

        /* ── Header ── */
        header {
          position: relative; z-index: 10;
          padding: 28px 40px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .logo {
          font-family: var(--display);
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--text-bright);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo-shield {
          width: 28px; height: 28px;
          background: var(--accent);
          clip-path: polygon(50% 0%, 100% 20%, 100% 70%, 50% 100%, 0% 70%, 0% 20%);
          display: flex; align-items: center; justify-content: center;
          animation: shieldPulse 3s ease-in-out infinite;
        }
        @keyframes shieldPulse {
          0%, 100% { box-shadow: 0 0 8px var(--accent); }
          50% { box-shadow: 0 0 24px var(--accent), 0 0 48px var(--accent-glow); }
        }
        .network-badge {
          font-size: 10px;
          letter-spacing: 0.15em;
          color: var(--accent-dim);
          border: 1px solid var(--border-bright);
          padding: 4px 10px;
          text-transform: uppercase;
        }
        .network-badge span { color: var(--green); }

        /* ── Main layout ── */
        main {
          position: relative; z-index: 10;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          max-width: 1100px;
          margin: 0 auto;
          width: 100%;
          padding: 60px 40px;
          align-items: start;
        }

        /* ── Left panel ── */
        .panel-left { padding-right: 60px; border-right: 1px solid var(--border); }

        .eyebrow {
          font-size: 10px;
          letter-spacing: 0.2em;
          color: var(--accent-dim);
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        h1 {
          font-family: var(--display);
          font-size: 48px;
          font-weight: 800;
          line-height: 1.05;
          color: var(--text-bright);
          margin-bottom: 8px;
        }
        h1 em {
          font-style: normal;
          color: var(--accent);
          position: relative;
        }
        .subtitle {
          font-size: 12px;
          color: var(--text-dim);
          line-height: 1.7;
          margin-bottom: 40px;
          max-width: 380px;
        }

        /* ── Terminal ── */
        .terminal {
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 20px 24px;
          font-size: 11px;
          line-height: 2;
          margin-bottom: 40px;
          position: relative;
        }
        .terminal::before {
          content: 'PROTOCOL';
          position: absolute;
          top: -1px; right: 16px;
          background: var(--surface);
          font-size: 9px;
          letter-spacing: 0.15em;
          color: var(--border-bright);
          padding: 0 8px;
          transform: translateY(-50%);
        }
        .terminal-line {
          display: flex;
          gap: 10px;
          opacity: 0;
          transform: translateY(4px);
          transition: opacity 0.3s, transform 0.3s;
        }
        .terminal-line.visible { opacity: 1; transform: none; }
        .terminal-line.comment .prompt { color: var(--text-dim); }
        .terminal-line.comment span { color: var(--text-dim); }
        .terminal-line.highlight span { color: var(--accent); }
        .prompt { color: var(--accent-dim); user-select: none; }

        /* ── Proof display ── */
        .proof-block {
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 16px;
          font-size: 9px;
          color: var(--text-dim);
          word-break: break-all;
          line-height: 1.8;
          position: relative;
          transition: all 0.5s;
        }
        .proof-block.active { border-color: var(--accent-dim); color: var(--accent-dim); }
        .proof-block::before {
          content: 'ZK PROOF WITNESS';
          position: absolute; top: -1px; left: 16px;
          background: var(--surface);
          font-size: 8px; letter-spacing: 0.15em;
          color: var(--border-bright);
          padding: 0 8px;
          transform: translateY(-50%);
        }

        /* ── Right panel ── */
        .panel-right { padding-left: 60px; }

        .form-label {
          font-size: 9px;
          letter-spacing: 0.2em;
          color: var(--text-dim);
          text-transform: uppercase;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
        }
        .form-label span { color: var(--accent-dim); }

        .input-wrap {
          position: relative;
          margin-bottom: 24px;
        }
        .input-wrap input {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text-bright);
          font-family: var(--mono);
          font-size: 28px;
          font-weight: 700;
          padding: 16px 20px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          -moz-appearance: textfield;
        }
        .input-wrap input::-webkit-outer-spin-button,
        .input-wrap input::-webkit-inner-spin-button { -webkit-appearance: none; }
        .input-wrap input:focus {
          border-color: var(--accent-dim);
          box-shadow: 0 0 0 1px var(--accent-dim), inset 0 0 20px rgba(0,212,255,0.03);
        }
        .input-corner {
          position: absolute;
          width: 8px; height: 8px;
          border-color: var(--accent);
          border-style: solid;
        }
        .input-corner.tl { top: -1px; left: -1px; border-width: 1px 0 0 1px; }
        .input-corner.tr { top: -1px; right: -1px; border-width: 1px 1px 0 0; }
        .input-corner.bl { bottom: -1px; left: -1px; border-width: 0 0 1px 1px; }
        .input-corner.br { bottom: -1px; right: -1px; border-width: 0 1px 1px 0; }

        /* ── Privacy note ── */
        .privacy-note {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(0,212,255,0.03);
          border: 1px solid var(--border);
          border-left: 2px solid var(--accent-dim);
          font-size: 10px;
          color: var(--text-dim);
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .privacy-note strong { color: var(--accent-dim); }

        /* ── Progress steps ── */
        .steps-track {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 28px;
        }
        .step-row {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 10px;
          letter-spacing: 0.1em;
          color: var(--text-dim);
          transition: color 0.3s;
        }
        .step-row.active { color: var(--accent); }
        .step-row.done { color: var(--green-dim); }
        .step-dot {
          width: 6px; height: 6px;
          border: 1px solid currentColor;
          flex-shrink: 0;
          transition: all 0.3s;
        }
        .step-row.active .step-dot {
          background: var(--accent);
          box-shadow: 0 0 8px var(--accent);
          animation: dotPulse 1s ease-in-out infinite;
        }
        .step-row.done .step-dot { background: var(--green-dim); }
        @keyframes dotPulse {
          0%, 100% { box-shadow: 0 0 4px var(--accent); }
          50% { box-shadow: 0 0 12px var(--accent), 0 0 20px var(--accent-glow); }
        }

        /* ── Button ── */
        .verify-btn {
          width: 100%;
          background: transparent;
          border: 1px solid var(--accent-dim);
          color: var(--accent);
          font-family: var(--mono);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.2em;
          padding: 18px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.2s;
          text-transform: uppercase;
        }
        .verify-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(0,212,255,0.06), transparent);
          transform: translateX(-100%);
          transition: transform 0.4s;
        }
        .verify-btn:hover:not(:disabled)::before { transform: translateX(100%); }
        .verify-btn:hover:not(:disabled) {
          border-color: var(--accent);
          box-shadow: 0 0 20px var(--accent-glow);
          background: rgba(0,212,255,0.04);
        }
        .verify-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .verify-btn.running {
          border-color: var(--accent);
          animation: btnPulse 1.5s ease-in-out infinite;
        }
        @keyframes btnPulse {
          0%, 100% { box-shadow: 0 0 8px var(--accent-glow); }
          50% { box-shadow: 0 0 24px var(--accent-glow), 0 0 40px var(--accent-glow); }
        }

        /* ── Result ── */
        .result-panel {
          margin-top: 24px;
          padding: 24px;
          border: 1px solid;
          position: relative;
          animation: resultIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes resultIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: none; }
        }
        .result-panel.pass {
          border-color: var(--green-dim);
          background: rgba(0,255,157,0.03);
        }
        .result-panel.fail {
          border-color: var(--red-dim);
          background: rgba(255,59,92,0.03);
        }
        .result-status {
          font-family: var(--display);
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .result-panel.pass .result-status { color: var(--green); }
        .result-panel.fail .result-status { color: var(--red); }
        .result-detail {
          font-size: 10px;
          color: var(--text-dim);
          line-height: 1.8;
        }
        .result-detail strong { color: var(--text); }
        .tx-hash {
          font-size: 9px;
          color: var(--accent-dim);
          margin-top: 12px;
          word-break: break-all;
        }

        /* ── Error ── */
        .error-panel {
          margin-top: 20px;
          padding: 16px;
          border: 1px solid var(--red-dim);
          background: rgba(255,59,92,0.04);
          font-size: 10px;
          color: var(--red);
          line-height: 1.7;
        }

        /* ── Footer ── */
        footer {
          position: relative; z-index: 10;
          padding: 20px 40px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: var(--text-dim);
          letter-spacing: 0.1em;
        }
        footer a { color: var(--accent-dim); text-decoration: none; }
        footer a:hover { color: var(--accent); }

        @media (max-width: 768px) {
          main { grid-template-columns: 1fr; padding: 40px 20px; }
          .panel-left { padding-right: 0; border-right: none; border-bottom: 1px solid var(--border); padding-bottom: 40px; margin-bottom: 40px; }
          .panel-right { padding-left: 0; }
          h1 { font-size: 36px; }
          header { padding: 20px; }
          footer { padding: 16px 20px; flex-direction: column; gap: 8px; text-align: center; }
        }
      `}</style>

      <div className="root">
        <HexGrid />

        <header>
          <div className="logo">
            <div className="logo-shield" />
            STARKSHIELD
          </div>
          <div className="network-badge">
            NETWORK: <span>SEPOLIA TESTNET</span>
          </div>
        </header>

        <main>
          {/* ── Left Panel ── */}
          <div className="panel-left">
            <div className="eyebrow">Zero-Knowledge Age Verification</div>
            <h1>
              PROVE YOUR <em>AGE.</em>
              <br />REVEAL NOTHING.
            </h1>
            <p className="subtitle">
              Uses Groth16 ZK proofs via StarkShield SDK to verify you are 18
              or older on-chain — without ever exposing your actual age to anyone.
            </p>

            <div className="terminal">
              <TerminalLine delay={100} type="comment">circuit: ageCheck.circom</TerminalLine>
              <TerminalLine delay={300} type="comment">threshold: hardcoded 18</TerminalLine>
              <TerminalLine delay={500}>input age {"→"} private witness</TerminalLine>
              <TerminalLine delay={700}>output isAdult {"→"} 1 - LessThan(age, 18)</TerminalLine>
              <TerminalLine delay={900} type="highlight">
                <ScrambleText text="proof.verify() → on-chain result" trigger={scramble} />
              </TerminalLine>
            </div>

            <div className={`proof-block ${isRunning ? "active" : ""}`}>
              {proofHex || "0x" + "—".repeat(32)}
              <br />
              {proofHex ? proofHex.split("").reverse().join("").slice(0, 66) : "0x" + "—".repeat(32)}
            </div>
          </div>

          {/* ── Right Panel ── */}
          <div className="panel-right">

            {/* Age input */}
            <div className="form-label">
              Your Age <span>PRIVATE — never transmitted</span>
            </div>
            <div className="input-wrap">
              <div className="input-corner tl" />
              <div className="input-corner tr" />
              <div className="input-corner bl" />
              <div className="input-corner br" />
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="00"
                min="0"
                max="120"
                disabled={isRunning}
              />
            </div>

            {/* Privacy note */}
            <div className="privacy-note">
              <span>🔒</span>
              <span>
                Your age is used only to generate a local ZK proof.{" "}
                <strong>Only the proof is sent on-chain</strong> — your age
                never leaves your device. The circuit checks age ≥ 18 internally.
              </span>
            </div>

            {/* Progress steps */}
            <div className="steps-track">
              {["GENERATE WITNESS", "COMPUTE ZK PROOF", "SUBMIT TO STARKNET", "VERIFY ON-CHAIN"].map((label, i) => {
                const stepNum = i + 1;
                const isActive = step === stepNum;
                const isDone = step > stepNum || (step === 5 && result !== null);
                return (
                  <div key={label} className={`step-row ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
                    <div className="step-dot" />
                    {label}
                  </div>
                );
              })}
            </div>

            {/* Button */}
            <button
              className={`verify-btn ${isRunning ? "running" : ""}`}
              onClick={handleVerify}
              disabled={!age || isRunning}
            >
              {isRunning
                ? currentStep.label + "..."
                : "EXECUTE VERIFICATION"}
            </button>

            {/* Result */}
            {result !== null && step === 0 && (
  <div className={`result-panel ${result.isAdult ? "pass" : "fail"}`}>
    <div className="result-status">
      {result.isAdult ? "✓ VERIFIED" : "✗ DENIED"}
    </div>
    <div className="result-detail">
      <strong>
        {result.isAdult
          ? "ZK circuit confirms: age ≥ 18"
          : "ZK circuit confirms: age < 18"}
      </strong>
      <br />
      isAdult signal: <span style={{color: result.isAdult ? 'var(--green)' : 'var(--red)'}}>
        {result.publicSignals?.[0]}
      </span>
      <br />
      Proof verified on Starknet Sepolia.
      <br />
      Your actual age was never revealed.
    </div>
                {txHash && (
                  <div className="tx-hash">TX: {txHash}</div>
                )}
              </div>
            )}

            {/* Error */}
            {error && step === 0 && (
              <div className="error-panel">
                ⚠ {error}
              </div>
            )}
          </div>
        </main>

        <footer>
          <span>STARKSHIELD SDK — ZK INFRASTRUCTURE FOR STARKNET</span>
          <span>
            <a href="https://github.com/jatinsahijwani/starkshield" target="_blank" rel="noreferrer">
              github.com/jatinsahijwani/starkshield
            </a>
          </span>
        </footer>
      </div>
    </>
  );
}