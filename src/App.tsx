¡Claro! Aquí tienes el código completo corregido. Solo copia y pega todo en tu archivo App.tsx:

```tsx
import { useState, useEffect, useRef, useCallback } from "react";

// ── DECLARACIÓN DE TIPOS PARA WINDOW.STORAGE ──
declare global {
  interface Window {
    storage: {
      get: (key: string, shared?: boolean) => Promise<{ value: string } | null>;
      set: (key: string, value: string, shared?: boolean) => Promise<void>;
    };
  }
}

// ── Config ─────────────────────────────────────────────────────────────────
const ADMIN_KEY = "2020";
const USER_KEY  = "1234";
const calcLoan  = (p: number, d: number) => ({ total: Math.round(p * 1.2), daily: Math.round(p * 1.2 / d) });
const todayStr  = () => new Date().toLocaleDateString("es-CL",{day:"2-digit",month:"2-digit",year:"numeric"});
const nowTime   = () => new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"});
const fmt       = (n: number) => Number(n).toLocaleString("es-CL");
const uid       = () => crypto.randomUUID();
const memStore  = { loans: [] as any[] };

// ══════════════════════════════════════════════════════════════════
// LEADERBOARD via window.storage (shared)
// ══════════════════════════════════════════════════════════════════
async function getLeaderboard() {
  try {
    const r = await window.storage.get("leaderboard_v2", true);
    return r ? JSON.parse(r.value) : [];
  } catch { return []; }
}
async function saveScore(name: string, score: number, ip: string) {
  try {
    const board = await getLeaderboard();
    // Update or insert entry for this IP
    const idx = board.findIndex((e: any) => e.ip === ip);
    if (idx >= 0) {
      if (score > board[idx].score) { board[idx] = { name, score, ip, date: todayStr() }; }
    } else {
      board.push({ name, score, ip, date: todayStr() });
    }
    board.sort((a: any, b: any) => b.score - a.score);
    const top = board.slice(0, 15);
    await window.storage.set("leaderboard_v2", JSON.stringify(top), true);
    return top;
  } catch { return []; }
}
async function getMyIP() {
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    const j = await r.json();
    return j.ip || "unknown";
  } catch { return "local_" + Math.random().toString(36).slice(2,8); }
}

// ══════════════════════════════════════════════════════════════════
// SPACE GAME — Galaxia Perdida (5 niveles + BOSS)
// ══════════════════════════════════════════════════════════════════
function SpaceGame({ onExit, onSecretCode }: { onExit: () => void; onSecretCode: () => void }) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number>(null!);
  const touchRef    = useRef({ left:false, right:false, fire:false });
  const restartFnRef= useRef<(() => void)>(null!);
  const onExitRef   = useRef(onExit);
  const onSecCodeRef= useRef(onSecretCode);
  useEffect(()=>{ onExitRef.current=onExit; },[onExit]);
  useEffect(()=>{ onSecCodeRef.current=onSecretCode; },[onSecretCode]);

  const [endState,    setEndState]    = useState<any>(null); // null | {win,score,isBoss}
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [nameInput,   setNameInput]   = useState("");
  const [scoreSaved,  setScoreSaved]  = useState(false);
  const [myIp,        setMyIp]        = useState("unknown");
  const [showBoard,   setShowBoard]   = useState(false);

  const CW: number = Math.min(480, window.innerWidth - 16);
  const CH: number = Math.round(CW * 520/480);
  const SC: number = CW / 480;

  // Load leaderboard + IP on mount
  useEffect(()=>{
    getLeaderboard().then(setLeaderboard);
    getMyIP().then(setMyIp);
  },[]);

  const handleSaveScore = async () => {
    const name = nameInput.trim() || "ANÓNIMO";
    const board = await saveScore(name, endState.score, myIp);
    setLeaderboard(board);
    setScoreSaved(true);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width  = CW;
    canvas.height = CH;

    // ── STATE ──
    const S: any = {
      player: { x: CW/2-18*SC, y: CH-60*SC, w:36*SC, h:24*SC },
      bullets:[], aliens:[], bombs:[], particles:[], stars:[], bossLasers:[],
      boss: null,
      score:0, lives:3, level:1, tick:0,
      alienDir:1, shootCooldown:0,
      gameOver:false, win:false, bossPhase:false,
      keys:{}, secretBuffer:[],
      secretCode:["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight"],
      _endReported: false,
    };

    // Stars
    for(let i=0;i<70;i++)
      S.stars.push({ x:Math.random()*CW, y:Math.random()*CH,
        s:Math.random()*2*SC+0.5, sp:Math.random()*0.4+0.1 });

    // ── SPAWN ALIENS (levels 1–5) ──
    const spawnAliens = (lv: number) => {
      S.aliens=[];
      const rows=Math.min(2+lv, 5);
      const cols=Math.min(5+lv, 10);
      const colW=(CW-48)/cols;
      for(let r=0;r<rows;r++)
        for(let c=0;c<cols;c++)
          S.aliens.push({
            x:24+c*colW, y:(44+r*36)*SC, w:24*SC, h:18*SC,
            type:r%3, alive:true, hp: lv>=4?2:1
          });
    };
    spawnAliens(1);

    // ── SPAWN BOSS (level 6) ──
    const spawnBoss = () => {
      S.bossPhase = true;
      S.bullets=[]; S.bombs=[];
      S.boss = {
        x: CW/2 - 60*SC,
        y: 30*SC,
        w: 120*SC, h: 60*SC,
        hp: 80, maxHp: 80,
        dir: 1, speed: 1.2*SC,
        phase: 1, // 1=normal, 2=enraged (<50% hp)
        shootTimer: 0,
        laserTimer: 0,
        laserActive: false,
        laserX: 0,
        laserDuration: 0,
        swoopTimer: 0,
        swoopDir: 0,
        shieldTimer: 0,
        shielded: false,
      };
      S.bossLasers = [];
    };

    const restartGame = () => {
      S.score=0; S.lives=3; S.level=1; S.tick=0;
      S.alienDir=1; S.gameOver=false; S.win=false; S.bossPhase=false;
      S.bullets=[]; S.bombs=[]; S.particles=[]; S.bossLasers=[];
      S.boss=null; S.keys={};
      S.player.x=CW/2-18*SC; S.player.y=CH-60*SC;
      spawnAliens(1);
      setEndState(null);
      setScoreSaved(false);
      setNameInput("");
      setShowBoard(false);
    };
    restartFnRef.current = restartGame;

    const onKeyDown = (e: KeyboardEvent) => {
      S.keys[e.code]=true;
      if(e.code==="Space"||e.code==="ArrowUp") e.preventDefault();
      S.secretBuffer.push(e.code);
      if(S.secretBuffer.length>S.secretCode.length) S.secretBuffer.shift();
      if(JSON.stringify(S.secretBuffer)===JSON.stringify(S.secretCode))
        onSecCodeRef.current?.();
      if(e.code==="Escape") onExitRef.current?.();
      if((e.code==="Enter"||e.code==="Space")&&(S.gameOver||S.win)) restartGame();
    };
    const onKeyUp = (e: KeyboardEvent) => { S.keys[e.code]=false; };
    window.addEventListener("keydown",onKeyDown);
    window.addEventListener("keyup",onKeyUp);

    const px = (n: number) => Math.round(n);

    // ── DRAW SHIP ──
    const drawShip = (x: number, y: number, color: string) => {
      const s=SC;
      ctx.fillStyle=color;
      ctx.fillRect(px(x+14*s),px(y),px(8*s),px(4*s));
      ctx.fillRect(px(x+10*s),px(y+4*s),px(16*s),px(4*s));
      ctx.fillRect(px(x+2*s),px(y+8*s),px(32*s),px(4*s));
      ctx.fillRect(px(x),px(y+12*s),px(36*s),px(8*s));
      ctx.fillStyle="#40ffff";
      ctx.fillRect(px(x+14*s),px(y+4*s),px(8*s),px(4*s));
      ctx.fillStyle=`hsl(${(Date.now()/40)%360},100%,60%)`;
      ctx.fillRect(px(x+4*s),px(y+20*s),px(6*s),px(4*s));
      ctx.fillRect(px(x+26*s),px(y+20*s),px(6*s),px(4*s));
    };

    // ── DRAW ALIEN ──
    const drawAlien = (ax: number, ay: number, type: number, hp: number, tick: number) => {
      const t=Math.floor(tick/16)%2;
      const colors=["#ff5050","#f0c040","#40ffaa"];
      ctx.fillStyle=colors[type]+(hp===1&&type>0?"88":"ff");
      const s=SC;
      if(type===0){
        ctx.fillRect(px(ax+4*s),px(ay),px(20*s),px(4*s));
        ctx.fillRect(px(ax),px(ay+4*s),px(28*s),px(4*s));
        ctx.fillRect(px(ax+4*s),px(ay+8*s),px(20*s),px(8*s));
        ctx.fillRect(px(ax+2*s),px(ay+16*s),px(8*s),px(4*s));
        ctx.fillRect(px(ax+18*s),px(ay+16*s),px(8*s),px(4*s));
        if(t===0){ctx.fillRect(px(ax),px(ay+12*s),px(4*s),px(4*s));ctx.fillRect(px(ax+24*s),px(ay+12*s),px(4*s),px(4*s));}
        else{ctx.fillRect(px(ax-4*s),px(ay+8*s),px(4*s),px(4*s));ctx.fillRect(px(ax+28*s),px(ay+8*s),px(4*s),px(4*s));}
      } else if(type===1){
        ctx.fillRect(px(ax+8*s),px(ay),px(12*s),px(4*s));
        ctx.fillRect(px(ax+4*s),px(ay+4*s),px(20*s),px(4*s));
        ctx.fillRect(px(ax),px(ay+8*s),px(28*s),px(8*s));
        if(t===0){ctx.fillRect(px(ax-4*s),px(ay+4*s),px(4*s),px(4*s));ctx.fillRect(px(ax+28*s),px(ay+4*s),px(4*s),px(4*s));}
        else{ctx.fillRect(px(ax),px(ay+16*s),px(4*s),px(4*s));ctx.fillRect(px(ax+24*s),px(ay+16*s),px(4*s),px(4*s));}
      } else {
        ctx.fillRect(px(ax+10*s),px(ay),px(8*s),px(4*s));
        ctx.fillRect(px(ax+6*s),px(ay+4*s),px(16*s),px(4*s));
        ctx.fillRect(px(ax+2*s),px(ay+8*s),px(24*s),px(8*s));
        ctx.fillRect(px(ax),px(ay+12*s),px(28*s),px(4*s));
        if(t===0){ctx.fillRect(px(ax-4*s),px(ay+8*s),px(4*s),px(4*s));ctx.fillRect(px(ax+28*s),px(ay+8*s),px(4*s),px(4*s));}
        else{ctx.fillRect(px(ax-4*s),px(ay+12*s),px(4*s),px(4*s));ctx.fillRect(px(ax+28*s),px(ay+12*s),px(4*s),px(4*s));}
      }
      ctx.fillStyle="#00000099";
      ctx.fillRect(px(ax+8*s),px(ay+6*s),px(4*s),px(4*s));
      ctx.fillRect(px(ax+16*s),px(ay+6*s),px(4*s),px(4*s));
    };

    // ── DRAW BOSS ──
    const drawBoss = (b: any, tick: number) => {
      const s=SC, enraged=b.hp<b.maxHp*0.5;
      const pulse=0.7+0.3*Math.sin(tick*0.1);
      const bcolor=enraged?"#ff2020":"#e040ff";
      const bcolor2=enraged?"#ff8000":"#8000ff";

      // Shield glow
      if(b.shielded){
        ctx.save();
        ctx.globalAlpha=0.3+0.2*Math.sin(tick*0.2);
        ctx.fillStyle="#40c0ff";
        ctx.beginPath();
        ctx.ellipse(px(b.x+b.w/2),px(b.y+b.h/2),b.w/2+10*s,b.h/2+10*s,0,0,Math.PI*2);
        ctx.fill();
        ctx.globalAlpha=1;
        ctx.restore();
      }

      // Body
      ctx.fillStyle=bcolor;
      ctx.fillRect(px(b.x+20*s),px(b.y),px(80*s),px(12*s));
      ctx.fillRect(px(b.x+10*s),px(b.y+12*s),px(100*s),px(12*s));
      ctx.fillRect(px(b.x),px(b.y+24*s),px(120*s),px(20*s));
      ctx.fillRect(px(b.x+10*s),px(b.y+44*s),px(100*s),px(12*s));
      // Wings
      ctx.fillStyle=bcolor2;
      ctx.fillRect(px(b.x-30*s),px(b.y+20*s),px(40*s),px(10*s));
      ctx.fillRect(px(b.x+110*s),px(b.y+20*s),px(40*s),px(10*s));
      ctx.fillRect(px(b.x-20*s),px(b.y+30*s),px(20*s),px(8*s));
      ctx.fillRect(px(b.x+120*s),px(b.y+30*s),px(20*s),px(8*s));
      // Core
      ctx.fillStyle=enraged?`rgba(255,${Math.floor(100*pulse)},0,1)`:`rgba(${Math.floor(200*pulse)},0,255,1)`;
      ctx.fillRect(px(b.x+50*s),px(b.y+20*s),px(20*s),px(20*s));
      // Eyes
      ctx.fillStyle="#fff";
      ctx.fillRect(px(b.x+30*s),px(b.y+28*s),px(12*s),px(8*s));
      ctx.fillRect(px(b.x+78*s),px(b.y+28*s),px(12*s),px(8*s));
      ctx.fillStyle=enraged?"#ff0":"#f0f";
      ctx.fillRect(px(b.x+34*s),px(b.y+30*s),px(6*s),px(5*s));
      ctx.fillRect(px(b.x+82*s),px(b.y+30*s),px(6*s),px(5*s));
      // Cannons
      ctx.fillStyle="#555";
      ctx.fillRect(px(b.x+18*s),px(b.y+50*s),px(8*s),px(14*s));
      ctx.fillRect(px(b.x+94*s),px(b.y+50*s),px(8*s),px(14*s));
      if(enraged){
        ctx.fillRect(px(b.x+55*s),px(b.y+58*s),px(10*s),px(14*s));
      }

      // HP bar
      const bw=140*s, bx=b.x+(b.w-bw)/2, by=b.y-16*s;
      ctx.fillStyle="#ffffff22"; ctx.fillRect(px(bx),px(by),px(bw),px(7*s));
      const hpPct=b.hp/b.maxHp;
      const hpColor=hpPct>0.5?"#40ff80":hpPct>0.25?"#f0c040":"#ff2020";
      ctx.fillStyle=hpColor; ctx.fillRect(px(bx),px(by),px(bw*hpPct),px(7*s));
      ctx.font=`bold ${Math.round(9*s)}px monospace`;
      ctx.fillStyle="#fff"; ctx.textAlign="center";
      ctx.fillText(`JEFE FINAL  ${b.hp}/${b.maxHp}`,px(b.x+b.w/2),px(by-4*s));

      // Laser beam
      if(b.laserActive){
        const lx=b.laserX;
        ctx.save();
        ctx.globalAlpha=0.9;
        const grad=ctx.createLinearGradient(lx,b.y+b.h,lx,CH);
        grad.addColorStop(0,enraged?"#ff4000":"#ff00ff");
        grad.addColorStop(1,"transparent");
        ctx.fillStyle=grad;
        ctx.fillRect(px(lx-4*s),px(b.y+b.h),px(8*s),CH);
        ctx.globalAlpha=0.4;
        ctx.fillStyle=enraged?"#ff8000":"#cc00ff";
        ctx.fillRect(px(lx-12*s),px(b.y+b.h),px(24*s),CH);
        ctx.globalAlpha=1;
        ctx.restore();
      }
    };

    const spawnParticles = (x: number, y: number, color: string, n: number = 8) => {
      for(let i=0;i<n;i++)
        S.particles.push({
          x,y,color,
          vx:(Math.random()-0.5)*5*SC, vy:(Math.random()-0.5)*5*SC-1,
          life:30+Math.random()*20, maxLife:50, size:(Math.random()*3+2)*SC,
        });
    };

    // ── MAIN LOOP ──
    const loop = () => {
      rafRef.current=requestAnimationFrame(loop);
      ctx.fillStyle="#03030f";
      ctx.fillRect(0,0,CW,CH);

      // Stars
      S.stars.forEach((st: any)=>{
        ctx.fillStyle=`rgba(255,255,255,${0.4+0.4*Math.sin(S.tick*0.05+st.x)})`;
        ctx.fillRect(px(st.x),px(st.y),Math.ceil(st.s),Math.ceil(st.s));
        st.y=(st.y+st.sp)%CH;
      });

      if(S.gameOver||S.win){
        if(!S._endReported){
          S._endReported=true;
          setEndState({ win:S.win, score:S.score, isBoss:S.bossPhase });
        }
        S.tick++;
        return;
      }

      S.tick++;
      S._endReported=false;

      // ── PLAYER CONTROLS ──
      const TR=touchRef.current, spd=4*SC;
      if((S.keys["ArrowLeft"]||TR.left)&&S.player.x>4)              S.player.x-=spd;
      if((S.keys["ArrowRight"]||TR.right)&&S.player.x<CW-S.player.w-4) S.player.x+=spd;
      S.shootCooldown--;
      if((S.keys["Space"]||S.keys["ArrowUp"]||S.keys["KeyZ"]||TR.fire)&&S.shootCooldown<=0){
        S.bullets.push({x:S.player.x+S.player.w/2-2*SC,y:S.player.y,w:4*SC,h:12*SC,fromPlayer:true});
        if(S.level>=4){
          S.bullets.push({x:S.player.x+4*SC,y:S.player.y+8*SC,w:3*SC,h:8*SC,fromPlayer:true});
          S.bullets.push({x:S.player.x+S.player.w-7*SC,y:S.player.y+8*SC,w:3*SC,h:8*SC,fromPlayer:true});
        }
        S.shootCooldown=10;
      }

      // ── BOSS PHASE ──
      if(S.bossPhase && S.boss){
        const b=S.boss;
        const enraged=b.hp<b.maxHp*0.5;

        // Movement
        b.swoopTimer--;
        if(b.swoopTimer<=0){
          b.swoopDir = (Math.random()-0.5)*2;
          b.swoopTimer = 60+Math.random()*80;
        }
        b.x += (b.speed*(1+(enraged?0.5:0)))*b.dir + b.swoopDir*SC*0.5;
        if(b.x<10*SC||b.x>CW-b.w-10*SC) b.dir*=-1;
        b.y = (30 + Math.sin(S.tick*0.015)*12)*SC;

        // Shield toggle (every 300 ticks in enraged)
        if(enraged){
          b.shieldTimer--;
          if(b.shieldTimer<=0){
            b.shielded=!b.shielded;
            b.shieldTimer=b.shielded?80:180;
          }
        }

        // Shoot bombs
        b.shootTimer--;
        if(b.shootTimer<=0){
          const rate = enraged ? 35 : 60;
          b.shootTimer = rate;
          // Triple spread
          const bx=b.x+b.w/2;
          const by=b.y+b.h;
          S.bombs.push({x:bx-2*SC,y:by,w:5*SC,h:10*SC,vx:0,vy:4.5*SC,type:"normal"});
          S.bombs.push({x:bx-2*SC,y:by,w:5*SC,h:10*SC,vx:-2.5*SC,vy:4*SC,type:"spread"});
          S.bombs.push({x:bx-2*SC,y:by,w:5*SC,h:10*SC,vx:2.5*SC,vy:4*SC,type:"spread"});
          if(enraged){
            S.bombs.push({x:b.x+18*SC,y:by,w:5*SC,h:10*SC,vx:-1*SC,vy:5*SC,type:"spread"});
            S.bombs.push({x:b.x+94*SC,y:by,w:5*SC,h:10*SC,vx:1*SC,vy:5*SC,type:"spread"});
          }
          // Homing
          if(S.tick%200===0){
            const dx=S.player.x-bx, dy=S.player.y-by;
            const dist=Math.sqrt(dx*dx+dy*dy)||1;
            S.bombs.push({x:bx,y:by,w:6*SC,h:6*SC,vx:(dx/dist)*3*SC,vy:(dy/dist)*3*SC,type:"homing"});
          }
        }

        // Laser
        b.laserTimer--;
        if(b.laserTimer<=0){
          const cooldown=enraged?120:200;
          if(!b.laserActive){
            b.laserActive=true;
            b.laserX=b.x+b.w/2;
            b.laserDuration=enraged?70:50;
          }
          b.laserTimer=cooldown;
        }
        if(b.laserActive){
          b.laserDuration--;
          // laser drifts toward player
          b.laserX+=(S.player.x+S.player.w/2-b.laserX)*0.04;
          if(b.laserDuration<=0) b.laserActive=false;
          // laser hits player
          const lx=b.laserX, px2=S.player.x, py2=S.player.y;
          if(lx>px2&&lx<px2+S.player.w&&b.laserDuration>0&&b.laserDuration%10===0){
            S.lives--;
            spawnParticles(S.player.x+S.player.w/2,S.player.y+S.player.h/2,"#60c0ff",10);
            if(S.lives<=0) S.gameOver=true;
          }
        }

        // Bullet-boss collision
        S.bullets.forEach((bul: any)=>{
          if(bul.dead||!bul.fromPlayer) return;
          if(b.shielded) return;
          if(bul.x<b.x+b.w&&bul.x+bul.w>b.x&&bul.y<b.y+b.h&&bul.y+bul.h>b.y){
            bul.dead=true; b.hp--;
            spawnParticles(bul.x,bul.y,enraged?"#ff4000":"#cc00ff",4);
            if(b.hp<=0){
              spawnParticles(b.x+b.w/2,b.y+b.h/2,"#f0c040",40);
              spawnParticles(b.x+b.w/4,b.y+b.h/2,"#ff4040",20);
              spawnParticles(b.x+3*b.w/4,b.y+b.h/2,"#40ffff",20);
              S.score+=5000;
              S.win=true;
            }
          }
        });
        S.bullets=S.bullets.filter((b: any)=>!b.dead);

        // Bombs update
        S.bombs.forEach((bm: any)=>{ bm.x+=bm.vx; bm.y+=bm.vy; });
        S.bombs=S.bombs.filter((bm: any)=>bm.y<CH+20&&bm.x>-20&&bm.x<CW+20);

        // Bomb-player collision
        S.bombs.forEach((bm: any)=>{
          if(bm.hit) return;
          const p=S.player;
          if(bm.x<p.x+p.w&&bm.x+bm.w>p.x&&bm.y<p.y+p.h&&bm.y+bm.h>p.y){
            bm.hit=true; S.lives--;
            spawnParticles(p.x+p.w/2,p.y+p.h/2,"#60c0ff",14);
            S.player.x=CW/2-18*SC;
            if(S.lives<=0) S.gameOver=true;
          }
        });
        S.bombs=S.bombs.filter((bm: any)=>!bm.hit);

        // Particles
        S.particles=S.particles.filter((p: any)=>p.life>0);
        S.particles.forEach((p: any)=>{
          p.x+=p.vx; p.y+=p.vy; p.vy+=0.12; p.life--;
          ctx.globalAlpha=p.life/p.maxLife;
          ctx.fillStyle=p.color;
          ctx.fillRect(px(p.x),px(p.y),Math.ceil(p.size),Math.ceil(p.size));
        });
        ctx.globalAlpha=1;

        // Draw boss
        drawBoss(b, S.tick);
        // Draw bullets
        ctx.fillStyle="#40ffff";
        S.bullets.forEach((bul: any)=>ctx.fillRect(px(bul.x),px(bul.y),Math.ceil(bul.w),Math.ceil(bul.h)));
        // Draw bombs
        S.bombs.forEach((bm: any)=>{
          ctx.fillStyle=bm.type==="homing"?"#ff40ff":"#ff8030";
          ctx.fillRect(px(bm.x),px(bm.y),Math.ceil(bm.w),Math.ceil(bm.h));
        });
        drawShip(S.player.x,S.player.y,"#60c0ff");

        // HUD
        ctx.font=`bold ${Math.round(12*SC)}px monospace`;
        ctx.fillStyle="#f0c040"; ctx.textAlign="left";
        ctx.fillText(`SCORE ${S.score}`,8*SC,16*SC);
        ctx.fillStyle=enraged?"#ff4040":"#e040ff";
        ctx.fillText("⚠ JEFE FINAL"+(enraged?" ¡ENRAGED!":""),8*SC,30*SC);
        ctx.textAlign="right"; ctx.fillStyle="#ff6060";
        ctx.fillText("♥".repeat(Math.max(0,S.lives))+"♡".repeat(Math.max(0,3-S.lives)),CW-8*SC,16*SC);
        return;
      }

      // ── NORMAL LEVELS 1–5 ──
      const alive=S.aliens.filter((a: any)=>a.alive);
      const speed=(0.5+S.level*0.3)*SC;
      let edge=false;
      alive.forEach((a: any)=>{a.x+=speed*S.alienDir; if(a.x>CW-a.w-4||a.x<4) edge=true;});
      if(edge){ S.alienDir*=-1; alive.forEach((a: any)=>{a.y+=12*SC;}); }

      const bombRate=Math.max(28-S.level*3,10);
      if(S.tick%bombRate===0&&alive.length>0){
        const a=alive[Math.floor(Math.random()*alive.length)];
        S.bombs.push({x:a.x+a.w/2-2*SC,y:a.y+a.h,w:4*SC,h:10*SC,vx:0,vy:4*SC,type:"normal"});
      }
      if(S.level>=3&&S.tick%(bombRate*3)===0&&alive.length>0){
        const a=alive[Math.floor(Math.random()*alive.length)];
        const dx=S.player.x-a.x,dy=S.player.y-a.y,dist=Math.sqrt(dx*dx+dy*dy)||1;
        S.bombs.push({x:a.x+a.w/2,y:a.y+a.h,w:5*SC,h:5*SC,vx:(dx/dist)*2.5*SC,vy:(dy/dist)*2.5*SC,type:"homing"});
      }

      S.bullets.forEach((b: any)=>b.y-=9*SC);
      S.bullets=S.bullets.filter((b: any)=>b.y>-20);
      S.bombs.forEach((bm: any)=>{bm.x+=bm.vx; bm.y+=bm.vy;});
      S.bombs=S.bombs.filter((bm: any)=>bm.y<CH+20);

      // Bullet-alien
      S.bullets.forEach((bul: any)=>{
        if(bul.dead) return;
        S.aliens.forEach((a: any)=>{
          if(!a.alive||bul.dead) return;
          if(bul.x<a.x+a.w&&bul.x+bul.w>a.x&&bul.y<a.y+a.h&&bul.y+bul.h>a.y){
            a.hp--; bul.dead=true;
            if(a.hp<=0){ a.alive=false; S.score+=(3-a.type)*10*S.level; spawnParticles(a.x+a.w/2,a.y+a.h/2,["#ff5050","#f0c040","#40ffaa"][a.type],10); }
            else spawnParticles(a.x+a.w/2,a.y+a.h/2,"#ffffff",4);
          }
        });
      });
      S.bullets=S.bullets.filter((b: any)=>!b.dead);

      // Bomb-player
      S.bombs.forEach((bm: any)=>{
        if(bm.hit) return;
        const p=S.player;
        if(bm.x<p.x+p.w&&bm.x+bm.w>p.x&&bm.y<p.y+p.h&&bm.y+bm.h>p.y){
          bm.hit=true; S.lives--;
          spawnParticles(p.x+p.w/2,p.y+p.h/2,"#60c0ff",14);
          S.player.x=CW/2-18*SC;
          if(S.lives<=0) S.gameOver=true;
        }
      });
      S.bombs=S.bombs.filter((bm: any)=>!bm.hit);

      // Aliens reach bottom
      alive.forEach((a: any)=>{ if(a.y+a.h>CH-30*SC) S.gameOver=true; });

      // Level clear
      if(alive.length===0){
        S.level++;
        S.bullets=[]; S.bombs=[];
        if(S.level>5){
          // Trigger boss!
          spawnBoss();
        } else {
          spawnAliens(S.level);
        }
      }

      // Particles
      S.particles=S.particles.filter((p: any)=>p.life>0);
      S.particles.forEach((p: any)=>{
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.life--;
        ctx.globalAlpha=p.life/p.maxLife;
        ctx.fillStyle=p.color;
        ctx.fillRect(px(p.x),px(p.y),Math.ceil(p.size),Math.ceil(p.size));
      });
      ctx.globalAlpha=1;

      // Draw
      S.aliens.forEach((a: any)=>{ if(a.alive) drawAlien(a.x,a.y,a.type,a.hp,S.tick); });
      ctx.fillStyle="#40ffff";
      S.bullets.forEach((bul: any)=>ctx.fillRect(px(bul.x),px(bul.y),Math.ceil(bul.w),Math.ceil(bul.h)));
      S.bombs.forEach((bm: any)=>{
        ctx.fillStyle=bm.type==="homing"?"#ff40ff":"#ff8030";
        ctx.fillRect(px(bm.x),px(bm.y),Math.ceil(bm.w),Math.ceil(bm.h));
      });
      drawShip(S.player.x,S.player.y,"#60c0ff");

      // HUD
      ctx.font=`bold ${Math.round(12*SC)}px monospace`;
      ctx.fillStyle="#f0c040"; ctx.textAlign="left";
      ctx.fillText(`SCORE ${S.score}`,8*SC,16*SC);
      ctx.fillText(`LVL ${S.level}/5`,8*SC,30*SC);
      ctx.textAlign="right"; ctx.fillStyle="#ff6060";
      ctx.fillText("♥".repeat(Math.max(0,S.lives))+"♡".repeat(Math.max(0,3
