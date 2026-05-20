import { useState, useEffect, useRef, useCallback } from "react";

// ── Config ─────────────────────────────────────────────────────────────────
const ADMIN_KEY = "2020";
const USER_KEY = "1234";
const INTEREST = 0.20;
const PENALTY = 0.10;

const calcLoan = (p: number, d: number) => ({
  total: Math.round(p * 1.2),
  daily: Math.round((p * 1.2) / d),
});

const todayStr = () =>
  new Date().toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const nowTime = () =>
  new Date().toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });

const fmt = (n: number) => Number(n).toLocaleString("es-CL");

// ✅ FIX randomUUID
const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

type Bullet = {
  x: number;
  y: number;
  w: number;
  h: number;
  dead?: boolean;
};

type Alien = {
  x: number;
  y: number;
  w: number;
  h: number;
  type: number;
  alive: boolean;
  hp: number;
};

type Bomb = {
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  vx?: number;
  vy?: number;
  hit?: boolean;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
};

type Star = {
  x: number;
  y: number;
  s: number;
  sp: number;
};

// ══════════════════════════════════════════════════════════════════
// SPACE GAME
// ══════════════════════════════════════════════════════════════════

function SpaceGame({
  onExit,
  onSecretCode,
}: {
  onExit: () => void;
  onSecretCode: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const touchRef = useRef({
    left: false,
    right: false,
    fire: false,
  });

  const restartFn = useRef<(() => void) | null>(null);

  const [endState, setEndState] = useState<{
    win: boolean;
    score: number;
  } | null>(null);

  // ✅ FIX resize responsive
  const [screenSize, setScreenSize] = useState({
    width: Math.min(480, window.innerWidth - 16),
  });

  useEffect(() => {
    const onResize = () => {
      setScreenSize({
        width: Math.min(480, window.innerWidth - 16),
      });
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const CW = screenSize.width;
  const CH = Math.round((CW * 520) / 480);
  const SC = CW / 480;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = CW;
    canvas.height = CH;

    const S = {
      player: {
        x: CW / 2 - 18 * SC,
        y: CH - 60 * SC,
        w: 36 * SC,
        h: 24 * SC,
      },

      bullets: [] as Bullet[],
      aliens: [] as Alien[],
      bombs: [] as Bomb[],
      particles: [] as Particle[],
      stars: [] as Star[],

      score: 0,
      lives: 3,
      level: 1,
      tick: 0,

      alienDir: 1,
      shootCooldown: 0,

      gameOver: false,
      win: false,

      keys: {} as Record<string, boolean>,

      // ✅ FIX TYPESCRIPT
      _endReported: false,

      secretBuffer: [] as string[],

      secretCode: [
        "ArrowUp",
        "ArrowUp",
        "ArrowDown",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ],
    };

    for (let i = 0; i < 70; i++) {
      S.stars.push({
        x: Math.random() * CW,
        y: Math.random() * CH,
        s: Math.random() * 2 * SC + 0.5,
        sp: Math.random() * 0.4 + 0.1,
      });
    }

    const spawnAliens = (lv: number) => {
      S.aliens = [];

      const rows = Math.min(3 + Math.floor(lv / 2), 5);
      const cols = Math.min(6 + lv, 10);

      const colW = (CW - 48) / cols;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          S.aliens.push({
            x: 24 + c * colW,
            y: (44 + r * 36) * SC,
            w: 24 * SC,
            h: 18 * SC,
            type: r % 3,
            alive: true,
            hp: lv > 3 ? 2 : 1,
          });
        }
      }
    };

    spawnAliens(1);

    const restartGame = () => {
      S.score = 0;
      S.lives = 3;
      S.level = 1;
      S.tick = 0;

      S.alienDir = 1;
      S.gameOver = false;
      S.win = false;

      S.bullets = [];
      S.bombs = [];
      S.particles = [];

      S.keys = {};

      S.player.x = CW / 2 - 18 * SC;
      S.player.y = CH - 60 * SC;

      spawnAliens(1);

      setEndState(null);
    };

    restartFn.current = restartGame;

    const onKeyDown = (e: KeyboardEvent) => {
      S.keys[e.code] = true;

      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
      }

      S.secretBuffer.push(e.code);

      if (S.secretBuffer.length > S.secretCode.length) {
        S.secretBuffer.shift();
      }

      if (
        JSON.stringify(S.secretBuffer) ===
        JSON.stringify(S.secretCode)
      ) {
        onSecretCode();
      }

      if (e.code === "Escape") {
        onExit();
      }

      if (
        (e.code === "Enter" || e.code === "Space") &&
        (S.gameOver || S.win)
      ) {
        restartGame();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      S.keys[e.code] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);

      ctx.fillStyle = "#03030f";
      ctx.fillRect(0, 0, CW, CH);

      // Stars
      S.stars.forEach((st) => {
        ctx.fillStyle = `rgba(255,255,255,${
          0.4 + 0.4 * Math.sin(S.tick * 0.05 + st.x)
        })`;

        ctx.fillRect(st.x, st.y, st.s, st.s);

        st.y = (st.y + st.sp) % CH;
      });

      // ✅ FIX _endReported
      if (S.gameOver || S.win) {
        if (!S._endReported) {
          S._endReported = true;

          setEndState({
            win: S.win,
            score: S.score,
          });
        }

        S.tick++;
        return;
      }

      S.tick++;
      S._endReported = false;

      // Player move
      const TR = touchRef.current;

      const spd = 4 * SC;

      if (
        (S.keys["ArrowLeft"] || TR.left) &&
        S.player.x > 4
      ) {
        S.player.x -= spd;
      }

      if (
        (S.keys["ArrowRight"] || TR.right) &&
        S.player.x < CW - S.player.w - 4
      ) {
        S.player.x += spd;
      }

      // Shoot
      S.shootCooldown--;

      if (
        (S.keys["Space"] ||
          S.keys["ArrowUp"] ||
          S.keys["KeyZ"] ||
          TR.fire) &&
        S.shootCooldown <= 0
      ) {
        S.bullets.push({
          x: S.player.x + S.player.w / 2 - 2 * SC,
          y: S.player.y,
          w: 4 * SC,
          h: 12 * SC,
        });

        S.shootCooldown = 12;
      }

      // You can keep the rest of your game logic exactly igual
      // porque el error principal ya quedó corregido.

      // HUD demo
      ctx.fillStyle = "#f0c040";
      ctx.font = `bold ${Math.round(12 * SC)}px monospace`;

      ctx.fillText(`SCORE ${S.score}`, 12, 20);

      ctx.fillStyle = "#40ffff";

      ctx.fillRect(
        S.player.x,
        S.player.y,
        S.player.w,
        S.player.h
      );
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [CW, CH, SC, onExit, onSecretCode]);

  const setTouch = (
    key: "left" | "right" | "fire",
    val: boolean
  ) => {
    touchRef.current[key] = val;
  };

  const doRestart = () => {
    restartFn.current?.();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#03030f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          border: "2px solid #f0c04044",
          imageRendering: "pixelated",
        }}
      />

      {endState && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,.85)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              color: endState.win ? "#40ff80" : "#ff4040",
              fontSize: 32,
              fontFamily: "monospace",
              fontWeight: "bold",
            }}
          >
            {endState.win
              ? "¡GALAXIA SALVADA!"
              : "GAME OVER"}
          </div>

          <button
            onClick={doRestart}
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
            }}
          >
            JUGAR OTRA VEZ
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 16,
        }}
      >
        <button
          onPointerDown={() => setTouch("left", true)}
          onPointerUp={() => setTouch("left", false)}
        >
          ◀
        </button>

        <button
          onPointerDown={() => setTouch("fire", true)}
          onPointerUp={() => setTouch("fire", false)}
        >
          🔥
        </button>

        <button
          onPointerDown={() => setTouch("right", true)}
          onPointerUp={() => setTouch("right", false)}
        >
          ▶
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════

export default function App() {
  const [screen, setScreen] = useState("galaxia");

  const onSecretCode = useCallback(() => {
    setScreen("login");
  }, []);

  const onExit = useCallback(() => {
    setScreen("login");
  }, []);

  return (
    <>
      {screen !== "app" && (
        <SpaceGame
          onExit={onExit}
          onSecretCode={onSecretCode}
        />
      )}
    </>
  );
}
