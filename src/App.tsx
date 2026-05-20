import { useState, useEffect, useRef, useCallback } from "react";

// ── Config ─────────────────────────────────────────────────────────────────
const ADMIN_KEY = "2020";
const USER_KEY  = "1234";
const calcLoan  = (p, d) => ({ total: Math.round(p * 1.2), daily: Math.round(p * 1.2 / d) });
const todayStr  = () => new Date().toLocaleDateString("es-CL",{day:"2-digit",month:"2-digit",year:"numeric"});
const nowTime   = () => new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"});
const fmt       = (n) => Number(n).toLocaleString("es-CL");
const uid       = () => crypto.randomUUID();
const memStore  = { loans: [] };

// ══════════════════════════════════════════════════════════════════
// LEADERBOARD via window.storage (shared)
// ══════════════════════════════════════════════════════════════════
async function getLeaderboard() {
  try {
    const r = await window.storage.get("leaderboard_v2", true);
    return r ? JSON.parse(r.value) : [];
  } catch { return []; }
}
async function saveScore(name, score, ip) {
  try {
    const board = await getLeaderboard();
    // Update or insert entry for this IP
    const idx = board.findIndex(e => e.ip === ip);
    if (idx >= 0) {
      if (score > board[idx].score) { board[idx] = { name, score, ip, date: todayStr() }; }
    } else {
      board.push({ name, score, ip, date: todayStr() });
    }
    board.sort((a,b) => b.score - a.score);
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
function SpaceGame({ onExit, onSecretCode }) {
  const canvasRef   = useRef(null);
  const rafRef      = useRef(null);
  const touchRef    = useRef({ left:false, right:false, fire:false });
  const restartFnRef= useRef(null);
  const onExitRef   = useRef(onExit);
  const onSecCodeRef= useRef(onSecretCode);
  useEffect(()=>{ onExitRef.current=onExit; },[onExit]);
  useEffect(()=>{ onSecCodeRef.current=onSecretCode; },[onSecretCode]);

  const [endState,    setEndState]    = useState(null); // null | {win,score,isBoss}
  const [leaderboard, setLeaderboard] = useState([]);
  const [nameInput,   setNameInput]   = useState("");
  const [scoreSaved,  setScoreSaved]  = useState(false);
  const [myIp,        setMyIp]        = useState("unknown");
  const [showBoard,   setShowBoard]   = useState(false);

  const CW = Math.min(480, window.innerWidth - 16);
  const CH = Math.round(CW * 520/480);
  const SC = CW / 480;

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
    const ctx = canvas.getContext("2d");
    canvas.width  = CW;
    canvas.height = CH;

    // ── STATE ──
    const S = {
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
    const spawnAliens = (lv) => {
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

    const onKeyDown = e => {
      S.keys[e.code]=true;
      if(e.code==="Space"||e.code==="ArrowUp") e.preventDefault();
      S.secretBuffer.push(e.code);
      if(S.secretBuffer.length>S.secretCode.length) S.secretBuffer.shift();
      if(JSON.stringify(S.secretBuffer)===JSON.stringify(S.secretCode))
        onSecCodeRef.current?.();
      if(e.code==="Escape") onExitRef.current?.();
      if((e.code==="Enter"||e.code==="Space")&&(S.gameOver||S.win)) restartGame();
    };
    const onKeyUp = e => { S.keys[e.code]=false; };
    window.addEventListener("keydown",onKeyDown);
    window.addEventListener("keyup",onKeyUp);

    const px = n => Math.round(n);

    // ── DRAW SHIP ──
    const drawShip = (x,y,color) => {
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
    const drawAlien = (ax,ay,type,hp,tick) => {
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
    const drawBoss = (b, tick) => {
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

    const spawnParticles = (x,y,color,n=8) => {
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
      S.stars.forEach(st=>{
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
        S.bullets.forEach(bul=>{
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
        S.bullets=S.bullets.filter(b=>!b.dead);

        // Bombs update
        S.bombs.forEach(bm=>{ bm.x+=bm.vx; bm.y+=bm.vy; });
        S.bombs=S.bombs.filter(bm=>bm.y<CH+20&&bm.x>-20&&bm.x<CW+20);

        // Bomb-player collision
        S.bombs.forEach(bm=>{
          if(bm.hit) return;
          const p=S.player;
          if(bm.x<p.x+p.w&&bm.x+bm.w>p.x&&bm.y<p.y+p.h&&bm.y+bm.h>p.y){
            bm.hit=true; S.lives--;
            spawnParticles(p.x+p.w/2,p.y+p.h/2,"#60c0ff",14);
            S.player.x=CW/2-18*SC;
            if(S.lives<=0) S.gameOver=true;
          }
        });
        S.bombs=S.bombs.filter(bm=>!bm.hit);

        // Particles
        S.particles=S.particles.filter(p=>p.life>0);
        S.particles.forEach(p=>{
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
        S.bullets.forEach(bul=>ctx.fillRect(px(bul.x),px(bul.y),Math.ceil(bul.w),Math.ceil(bul.h)));
        // Draw bombs
        S.bombs.forEach(bm=>{
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
      const alive=S.aliens.filter(a=>a.alive);
      const speed=(0.5+S.level*0.3)*SC;
      let edge=false;
      alive.forEach(a=>{a.x+=speed*S.alienDir; if(a.x>CW-a.w-4||a.x<4) edge=true;});
      if(edge){ S.alienDir*=-1; alive.forEach(a=>{a.y+=12*SC;}); }

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

      S.bullets.forEach(b=>b.y-=9*SC);
      S.bullets=S.bullets.filter(b=>b.y>-20);
      S.bombs.forEach(bm=>{bm.x+=bm.vx; bm.y+=bm.vy;});
      S.bombs=S.bombs.filter(bm=>bm.y<CH+20);

      // Bullet-alien
      S.bullets.forEach(bul=>{
        if(bul.dead) return;
        S.aliens.forEach(a=>{
          if(!a.alive||bul.dead) return;
          if(bul.x<a.x+a.w&&bul.x+bul.w>a.x&&bul.y<a.y+a.h&&bul.y+bul.h>a.y){
            a.hp--; bul.dead=true;
            if(a.hp<=0){ a.alive=false; S.score+=(3-a.type)*10*S.level; spawnParticles(a.x+a.w/2,a.y+a.h/2,["#ff5050","#f0c040","#40ffaa"][a.type],10); }
            else spawnParticles(a.x+a.w/2,a.y+a.h/2,"#ffffff",4);
          }
        });
      });
      S.bullets=S.bullets.filter(b=>!b.dead);

      // Bomb-player
      S.bombs.forEach(bm=>{
        if(bm.hit) return;
        const p=S.player;
        if(bm.x<p.x+p.w&&bm.x+bm.w>p.x&&bm.y<p.y+p.h&&bm.y+bm.h>p.y){
          bm.hit=true; S.lives--;
          spawnParticles(p.x+p.w/2,p.y+p.h/2,"#60c0ff",14);
          S.player.x=CW/2-18*SC;
          if(S.lives<=0) S.gameOver=true;
        }
      });
      S.bombs=S.bombs.filter(bm=>!bm.hit);

      // Aliens reach bottom
      alive.forEach(a=>{ if(a.y+a.h>CH-30*SC) S.gameOver=true; });

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
      S.particles=S.particles.filter(p=>p.life>0);
      S.particles.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.life--;
        ctx.globalAlpha=p.life/p.maxLife;
        ctx.fillStyle=p.color;
        ctx.fillRect(px(p.x),px(p.y),Math.ceil(p.size),Math.ceil(p.size));
      });
      ctx.globalAlpha=1;

      // Draw
      S.aliens.forEach(a=>{ if(a.alive) drawAlien(a.x,a.y,a.type,a.hp,S.tick); });
      ctx.fillStyle="#40ffff";
      S.bullets.forEach(bul=>ctx.fillRect(px(bul.x),px(bul.y),Math.ceil(bul.w),Math.ceil(bul.h)));
      S.bombs.forEach(bm=>{
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
      ctx.fillText("♥".repeat(Math.max(0,S.lives))+"♡".repeat(Math.max(0,3-S.lives)),CW-8*SC,16*SC);

      // Alien bar
      const totalA=S.aliens.length, aliveA=alive.length;
      ctx.fillStyle="#ffffff11"; ctx.fillRect(16*SC,CH-10*SC,CW-32*SC,4*SC);
      ctx.fillStyle="#ff5050";   ctx.fillRect(16*SC,CH-10*SC,(CW-32*SC)*(aliveA/Math.max(totalA,1)),4*SC);
    };

    rafRef.current=requestAnimationFrame(loop);
    return ()=>{
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown",onKeyDown);
      window.removeEventListener("keyup",onKeyUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const setTouch=(key,val)=>{ touchRef.current[key]=val; };
  const doRestart=()=>{ restartFnRef.current?.(); };

  return (
    <div style={{
      position:"fixed",inset:0,background:"#03030f",
      display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",zIndex:9999,userSelect:"none",
    }}>
      <div style={{
        fontFamily:"monospace",fontSize:Math.min(Math.round(18*(CW/480)),18)+"px",
        color:"#f0c040",letterSpacing:3,marginBottom:4,
        textShadow:"0 0 16px #f0c040, 0 0 32px #f0c04066",
      }}>👾 GALAXIA PERDIDA 👾</div>
      <div style={{fontFamily:"monospace",fontSize:9,color:"#333",letterSpacing:2,marginBottom:6}}>
        INSERT COIN — 5 NIVELES + JEFE FINAL
      </div>

      <div style={{position:"relative"}}>
        <canvas ref={canvasRef}
          style={{imageRendering:"pixelated",border:"2px solid #f0c04044",
            boxShadow:"0 0 40px #f0c04018",maxWidth:"100%",display:"block"}}
        />

        {/* End overlay */}
        {endState && (
          <div style={{
            position:"absolute",inset:0,background:"rgba(0,0,0,0.88)",
            display:"flex",flexDirection:"column",
            alignItems:"center",justifyContent:"flex-start",
            gap:0,overflowY:"auto",paddingTop:20,
          }}>
            <div style={{
              fontFamily:"monospace",fontSize:Math.min(Math.round(26*(CW/480)),26)+"px",
              fontWeight:"bold",letterSpacing:2,marginBottom:4,
              color:endState.win?"#40ff80":"#ff4040",
              textShadow:`0 0 20px ${endState.win?"#40ff80":"#ff4040"}`,
            }}>
              {endState.win?(endState.isBoss?"🏆 ¡GALAXIA SALVADA!":"✓ NIVEL COMPLETO"):"💀 GAME OVER"}
            </div>
            <div style={{fontFamily:"monospace",fontSize:15,color:"#f0c040",marginBottom:12}}>
              PUNTAJE: {endState.score.toLocaleString()}
            </div>

            {/* Score save */}
            {!scoreSaved ? (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,marginBottom:12,width:"80%"}}>
                <div style={{fontFamily:"monospace",fontSize:10,color:"#888",letterSpacing:1}}>GUARDAR PUNTAJE</div>
                <input
                  value={nameInput} onChange={e=>setNameInput(e.target.value.slice(0,12).toUpperCase())}
                  placeholder="TU NOMBRE"
                  style={{
                    background:"#111",border:"1.5px solid #f0c040",borderRadius:6,
                    color:"#f0c040",fontFamily:"monospace",fontSize:14,
                    padding:"7px 12px",textAlign:"center",width:"100%",outline:"none",
                    letterSpacing:2,
                  }}
                />
                <button onClick={handleSaveScore} style={{
                  fontFamily:"monospace",fontSize:12,padding:"8px 24px",
                  background:"#f0c040",color:"#000",border:"none",borderRadius:7,
                  cursor:"pointer",fontWeight:"bold",letterSpacing:1,width:"100%",
                }}>GUARDAR →</button>
              </div>
            ) : (
              <div style={{fontFamily:"monospace",fontSize:11,color:"#40ff80",marginBottom:8}}>✓ PUNTAJE GUARDADO</div>
            )}

            {/* Leaderboard toggle */}
            <button onClick={()=>setShowBoard(b=>!b)} style={{
              fontFamily:"monospace",fontSize:10,padding:"5px 14px",
              background:"transparent",color:"#888",border:"1px solid #333",
              borderRadius:6,cursor:"pointer",marginBottom:6,
            }}>
              {showBoard?"▲ OCULTAR":"▼ TABLA DE PUNTAJES"}
            </button>

            {showBoard && (
              <div style={{
                width:"90%",background:"#0a0a0f",border:"1px solid #252530",
                borderRadius:10,padding:"10px",marginBottom:8,
                maxHeight:160,overflowY:"auto",
              }}>
                <div style={{fontFamily:"monospace",fontSize:9,color:"#f0c040",letterSpacing:2,marginBottom:6,textAlign:"center"}}>
                  🏆 TOP JUGADORES
                </div>
                {leaderboard.length===0 && (
                  <div style={{fontFamily:"monospace",fontSize:9,color:"#444",textAlign:"center"}}>Sin registros aún</div>
                )}
                {leaderboard.map((e,i)=>(
                  <div key={i} style={{
                    display:"flex",gap:8,fontFamily:"monospace",fontSize:10,
                    padding:"3px 0",borderBottom:"1px solid #1a1a22",
                    color: i===0?"#f0c040":i===1?"#aaa":i===2?"#cd7f32":"#666",
                  }}>
                    <span style={{minWidth:18}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}.`}</span>
                    <span style={{flex:1}}>{e.name}</span>
                    <span>{e.score.toLocaleString()}</span>
                    <span style={{color:"#333",fontSize:8}}>{e.date}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{display:"flex",gap:10,marginTop:4}}>
              <button onClick={doRestart} style={{
                fontFamily:"monospace",fontSize:13,padding:"10px 24px",
                background:"#f0c040",color:"#000",border:"none",
                borderRadius:8,cursor:"pointer",fontWeight:"bold",
              }}>▶ JUGAR DE NUEVO</button>
              <button onClick={()=>onExitRef.current?.()} style={{
                fontFamily:"monospace",fontSize:11,padding:"10px 16px",
                background:"transparent",color:"#555",border:"1px solid #222",
                borderRadius:8,cursor:"pointer",
              }}>SISTEMA</button>
            </div>
          </div>
        )}
      </div>

      {/* Touch controls */}
      {!endState && (
        <div style={{display:"flex",gap:16,marginTop:10,alignItems:"center"}}>
          <button onPointerDown={()=>setTouch("left",true)} onPointerUp={()=>setTouch("left",false)} onPointerLeave={()=>setTouch("left",false)} style={touchBtnStyle}>◀</button>
          <button onPointerDown={()=>setTouch("fire",true)} onPointerUp={()=>setTouch("fire",false)} onPointerLeave={()=>setTouch("fire",false)}
            style={{...touchBtnStyle,background:"#f0c04033",color:"#f0c040",border:"2px solid #f0c040",width:64,height:64,fontSize:22}}>🔥</button>
          <button onPointerDown={()=>setTouch("right",true)} onPointerUp={()=>setTouch("right",false)} onPointerLeave={()=>setTouch("right",false)} style={touchBtnStyle}>▶</button>
        </div>
      )}

      {!endState && (
        <div style={{display:"flex",gap:16,marginTop:8,alignItems:"center"}}>
          <button onClick={()=>onExitRef.current?.()} style={{
            fontFamily:"monospace",fontSize:10,padding:"4px 12px",
            background:"transparent",border:"1px solid #1a1a1a",color:"#333",
            cursor:"pointer",borderRadius:5,
          }}>ACCESO SISTEMA</button>
          <div style={{fontFamily:"monospace",fontSize:8,color:"#1e1e1e"}}>↑↑↓↓←→ KONAMI</div>
        </div>
      )}
    </div>
  );
}

const touchBtnStyle={
  width:56,height:56,borderRadius:10,border:"2px solid #2a2a2a",
  background:"#ffffff0a",color:"#ffffff55",fontSize:18,
  cursor:"pointer",fontFamily:"monospace",display:"flex",
  alignItems:"center",justifyContent:"center",touchAction:"none",
};

// ══════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════
export default function App() {
  const [screen,  setScreen]  = useState("galaxia");
  const [theme,   setTheme]   = useState("dark");
  const [role,    setRole]    = useState(null);
  const [selRole, setSelRole] = useState(null);
  const [pin,     setPin]     = useState("");
  const [pinErr,  setPinErr]  = useState("");
  const [loans,   setLoans]   = useState(()=>memStore.loans);
  const [tab,     setTab]     = useState("loans");
  const [form,    setForm]    = useState({client:"",phone:"",address:"",rut:"",principal:"",days:"30"});
  const [voucher, setVoucher] = useState(null);
  const [toast,   setToast]   = useState(null);
  const [payAmt,  setPayAmt]  = useState({});
  const [expanded,setExpanded]= useState(null);
  const [search,  setSearch]  = useState("");

  useEffect(()=>{ memStore.loans=loans; },[loans]);

  const showToast=(msg,type="ok")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),2800); };

  const T={
    dark:{bg:"#09090f",card:"#111118",card2:"#18181f",border:"#252530",
      accent:"#f0c040",danger:"#e84040",ok:"#38c878",text:"#f0ede6",muted:"#666",input:"#0e0e16"},
    light:{bg:"#f0eff8",card:"#ffffff",card2:"#f7f6ff",border:"#e0dff0",
      accent:"#c48a00",danger:"#d03030",ok:"#1e9060",text:"#111020",muted:"#666",input:"#f7f6ff"},
    hc:{bg:"#000000",card:"#0a0a0a",card2:"#111",border:"#ffffff",
      accent:"#ffffff",danger:"#ffffff",ok:"#ffffff",text:"#ffffff",muted:"#aaa",input:"#000"},
  }[theme];

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'DM Sans',sans-serif;background:${T.bg};color:${T.text};min-height:100vh;}
    input,button,select{font-family:inherit;}
    ::-webkit-scrollbar{width:4px;}
    ::-webkit-scrollbar-thumb{background:${T.border};border-radius:99px;}
    .app-shell{max-width:520px;margin:0 auto;padding:0 0 80px;min-height:100vh;}
    .login-overlay{position:fixed;inset:0;background:#000000cc;z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px);}
    .login-box{width:100%;max-width:360px;background:${T.card};border:1.5px solid ${T.border};border-radius:20px;padding:32px 28px 28px;box-shadow:0 32px 64px #00000080;position:relative;overflow:hidden;animation:slideUp .3s ease;}
    .login-box::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:${theme==="hc"?"#fff":"linear-gradient(90deg,#f0c040,#e080ff,#40c0ff)"};}
    @keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:none;opacity:1}}
    .login-close{position:absolute;top:14px;right:16px;background:none;border:none;color:${T.muted};font-size:20px;cursor:pointer;line-height:1;}
    .login-title{font-family:'Space Mono',monospace;font-size:20px;font-weight:700;color:${T.text};margin-bottom:4px;}
    .login-title span{color:${T.accent};}
    .login-sub{font-size:12px;color:${T.muted};margin-bottom:20px;}
    .role-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;}
    .role-btn{padding:12px 8px;border-radius:10px;border:1.5px solid ${T.border};background:${T.card2};color:${T.muted};cursor:pointer;font-size:12px;font-weight:500;transition:all .15s;display:flex;flex-direction:column;align-items:center;gap:4px;}
    .role-btn:hover{border-color:${T.accent};color:${T.text};}
    .role-btn.sel{border-color:${T.accent};background:${T.accent}18;color:${T.text};}
    .pin-input{width:100%;padding:13px;border-radius:10px;border:1.5px solid ${T.border};background:${T.input};color:${T.text};font-family:'Space Mono',monospace;font-size:24px;letter-spacing:10px;text-align:center;outline:none;transition:border-color .15s;margin-bottom:6px;}
    .pin-input:focus{border-color:${T.accent};}
    .pin-err{color:${T.danger};font-size:12px;text-align:center;min-height:16px;margin-bottom:10px;}
    .btn{padding:11px 18px;border-radius:10px;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all .15s;display:inline-flex;align-items:center;gap:6px;justify-content:center;}
    .btn-primary{background:${theme==="hc"?"#fff":"linear-gradient(135deg,#f0c040,#e8a020)"};color:${theme==="hc"?"#000":"#1a1000"};box-shadow:${theme==="hc"?"none":"0 4px 16px #f0c04040"};}
    .btn-primary:hover{transform:translateY(-1px);filter:brightness(1.08);}
    .btn-danger{background:${T.danger}22;color:${T.danger};border:1px solid ${T.danger}44;}
    .btn-ghost{background:transparent;color:${T.muted};border:1px solid ${T.border};}
    .btn-ghost:hover{border-color:${T.accent};color:${T.text};}
    .btn-sm{padding:6px 12px;font-size:11px;border-radius:7px;}
    .app-header{position:sticky;top:0;z-index:100;background:${T.card}cc;backdrop-filter:blur(16px);border-bottom:1px solid ${T.border};padding:12px 16px;display:flex;align-items:center;gap:10px;}
    .header-logo{font-family:'Space Mono',monospace;font-size:16px;font-weight:700;}
    .header-logo span{color:${T.accent};}
    .header-right{margin-left:auto;display:flex;align-items:center;gap:8px;}
    .badge-role{padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700;background:${T.accent}22;color:${T.accent};border:1px solid ${T.accent}44;letter-spacing:0.5px;}
    .theme-toggle{display:flex;gap:3px;background:${T.card2};border-radius:8px;padding:3px;border:1px solid ${T.border};}
    .theme-btn{width:26px;height:26px;border:none;border-radius:6px;cursor:pointer;background:transparent;font-size:13px;display:flex;align-items:center;justify-content:center;transition:all .15s;color:${T.muted};}
    .theme-btn.on{background:${T.accent};color:#000;}
    .stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px 12px 0;}
    .stat-card{background:${T.card};border:1px solid ${T.border};border-radius:12px;padding:12px 10px;}
    .stat-lbl{font-size:9px;color:${T.muted};text-transform:uppercase;letter-spacing:0.8px;margin-bottom:3px;}
    .stat-val{font-family:'Space Mono',monospace;font-size:13px;font-weight:700;}
    .c-ok{color:${T.ok};} .c-warn{color:${T.danger};}
    .tab-bar{display:flex;gap:8px;padding:12px 12px 0;}
    .tab-btn{flex:1;padding:9px;border-radius:9px;border:1.5px solid ${T.border};background:transparent;color:${T.muted};cursor:pointer;font-size:12px;font-weight:600;transition:all .15s;}
    .tab-btn.on{background:${T.accent};color:#0a0800;border-color:${T.accent};}
    .search-box{margin:10px 12px 0;display:flex;align-items:center;gap:8px;background:${T.card2};border:1.5px solid ${T.border};border-radius:10px;padding:9px 12px;}
    .search-box input{flex:1;background:transparent;border:none;outline:none;color:${T.text};font-size:13px;}
    .search-box input::placeholder{color:${T.muted};}
    .loans-list{padding:10px 12px;display:flex;flex-direction:column;gap:10px;}
    .loan-card{background:${T.card};border:1.5px solid ${T.border};border-radius:14px;overflow:hidden;transition:border-color .2s;}
    .loan-card:hover{border-color:${T.accent}44;}
    .loan-header{padding:14px 14px 10px;display:flex;align-items:flex-start;gap:10px;cursor:pointer;}
    .loan-avatar{width:38px;height:38px;border-radius:10px;flex-shrink:0;background:${T.accent}18;border:1.5px solid ${T.accent}33;display:flex;align-items:center;justify-content:center;font-size:16px;}
    .loan-name{font-weight:600;font-size:14px;}
    .loan-meta{font-size:11px;color:${T.muted};margin-top:2px;}
    .loan-right{margin-left:auto;text-align:right;}
    .loan-amount{font-family:'Space Mono',monospace;font-size:13px;font-weight:700;}
    .loan-status{display:inline-block;padding:2px 9px;border-radius:20px;font-size:9px;font-weight:700;letter-spacing:0.6px;margin-top:3px;}
    .s-ok{background:${T.ok}22;color:${T.ok};border:1px solid ${T.ok}44;}
    .s-mora{background:${T.danger}22;color:${T.danger};border:1px solid ${T.danger}44;}
    .s-done{background:${T.muted}22;color:${T.muted};border:1px solid ${T.muted}44;}
    .progress-wrap{padding:0 14px 12px;}
    .progress-labels{display:flex;justify-content:space-between;font-size:10px;color:${T.muted};margin-bottom:4px;}
    .progress-track{height:5px;border-radius:99px;background:${T.border};overflow:hidden;}
    .progress-fill{height:100%;border-radius:99px;transition:width .4s;background:${theme==="hc"?"#fff":"linear-gradient(90deg,#f0c040,#40ff80)"};}
    .loan-detail{border-top:1px solid ${T.border};padding:14px;}
    .detail-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid ${T.border}22;}
    .detail-lbl{font-size:11px;color:${T.muted};}
    .detail-val{font-size:12px;font-weight:600;font-family:'Space Mono',monospace;}
    .pay-row{display:flex;gap:8px;margin-top:12px;}
    .pay-input{flex:1;padding:10px 12px;border-radius:9px;border:1.5px solid ${T.border};background:${T.input};color:${T.text};font-size:13px;outline:none;}
    .pay-input:focus{border-color:${T.accent};}
    .pay-history{margin-top:12px;}
    .pay-history-title{font-size:10px;color:${T.muted};text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;}
    .pay-item{display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:7px;background:${T.card2};margin-bottom:4px;font-size:11px;}
    .pay-dot{width:7px;height:7px;border-radius:50%;background:${T.ok};flex-shrink:0;}
    .pay-meta{color:${T.muted};}
    .pay-amount{margin-left:auto;font-family:'Space Mono',monospace;font-weight:700;color:${T.ok};}
    .form-wrap{padding:14px 12px;}
    .form-section{margin-bottom:18px;}
    .form-title{font-family:'Space Mono',monospace;font-size:11px;color:${T.accent};letter-spacing:1.5px;margin-bottom:10px;text-transform:uppercase;}
    .form-grid{display:grid;gap:9px;}
    .field label{display:block;font-size:10px;color:${T.muted};margin-bottom:4px;font-weight:500;letter-spacing:0.3px;}
    .field input,.field select{width:100%;padding:11px 12px;border-radius:9px;border:1.5px solid ${T.border};background:${T.input};color:${T.text};font-size:13px;outline:none;transition:border-color .15s;}
    .field input:focus,.field select:focus{border-color:${T.accent};}
    .field select option{background:${T.card};}
    .form-preview{background:${T.card2};border:1.5px solid ${T.border};border-radius:11px;padding:14px;margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr;gap:8px;}
    .preview-item .lbl{font-size:9px;color:${T.muted};text-transform:uppercase;letter-spacing:0.8px;}
    .preview-item .val{font-family:'Space Mono',monospace;font-size:15px;font-weight:700;color:${T.accent};}
    .modal-bg{position:fixed;inset:0;background:#000000b0;z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);}
    .modal{background:${T.card};border:1.5px solid ${T.border};border-radius:18px;padding:24px;width:100%;max-width:340px;box-shadow:0 32px 64px #00000080;animation:slideUp .25s ease;}
    .voucher-title{font-family:'Space Mono',monospace;font-size:13px;font-weight:700;text-align:center;color:${T.accent};letter-spacing:1px;margin-bottom:14px;}
    .voucher-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed ${T.border};font-size:12px;}
    .voucher-row .lbl{color:${T.muted};}
    .voucher-row .val{font-weight:600;font-family:'Space Mono',monospace;}
    .voucher-total{font-size:18px;color:${T.ok};}
    .toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:${T.card2};border:1px solid ${T.border};border-radius:10px;padding:10px 18px;font-size:12px;font-weight:500;box-shadow:0 8px 24px #00000050;z-index:500;white-space:nowrap;animation:slideUp .2s ease;}
    .empty{text-align:center;padding:48px 20px;color:${T.muted};}
    .empty-icon{font-size:40px;margin-bottom:10px;opacity:0.4;}
  `;

  // ── LOGIC ──
  const handleLogin = () => {
    if(!selRole) return setPinErr("Selecciona un rol");
    const correct = selRole==="admin" ? ADMIN_KEY : USER_KEY;
    if(pin===correct){
      // ✅ PIN CORRECTO → entra a la app
      setRole(selRole); setPinErr(""); setPin(""); setScreen("app");
    } else {
      // ❌ PIN INCORRECTO → cierra modal, inicia juego
      setPin(""); setSelRole(null); setPinErr("");
      setScreen("galaxia");
    }
  };

  const logout=()=>{ setRole(null); setSelRole(null); setPin(""); setScreen("galaxia"); };

  const createLoan=()=>{
    const{client,phone,address,rut,principal,days}=form;
    if(!client||!principal||!days) return showToast("Completa los campos obligatorios","err");
    const p=parseInt((principal||"").replace(/\D/g,""),10), d=parseInt(days,10);
    if(!p||!d) return showToast("Monto y plazo inválidos","err");
    const{total,daily}=calcLoan(p,d);
    setLoans(prev=>[{id:uid(),client,phone,address,rut,principal:p,total,daily,days:d,
      paid:0,payments:[],createdAt:todayStr(),createdTime:nowTime(),
      agente:role==="admin"?"Administrador":"Agente"},...prev]);
    setForm({client:"",phone:"",address:"",rut:"",principal:"",days:"30"});
    setTab("loans"); showToast("Préstamo creado ✓");
  };

  const calcOverdue=(loan)=>{
    try{
      const parts=loan.createdAt.split("/");
      const d=new Date(parseInt(parts[2],10),parseInt(parts[1],10)-1,parseInt(parts[0],10));
      const today=new Date(); today.setHours(0,0,0,0);
      const daysPassed=Math.floor((today-d)/(1000*60*60*24));
      const expected=Math.min(daysPassed,loan.days)*loan.daily;
      const diff=expected-loan.paid;
      return diff>0?Math.floor(diff/loan.daily):0;
    }catch{return 0;}
  };

  const loanStatus=(loan)=>{
    if(loan.paid>=loan.total) return "pagado";
    if(calcOverdue(loan)>=4) return "mora";
    return "al día";
  };

  const registerPayment=(loan)=>{
    const amount=parseInt(((payAmt[loan.id]||"")).replace(/\D/g,""),10);
    if(!amount||amount<=0) return showToast("Monto inválido","err");
    const late=calcOverdue(loan);
    const penalty=late>=4?Math.round(loan.daily*0.10):0;
    const payment={id:uid(),amount,penalty,date:todayStr(),time:nowTime(),lateCount:late};
    const updated={...loan,paid:Math.min(loan.paid+amount,loan.total),payments:[...loan.payments,payment]};
    setLoans(prev=>prev.map(l=>l.id===loan.id?updated:l));
    setPayAmt(p=>({...p,[loan.id]:""}));
    setVoucher({loan:updated,payment});
  };

  const deleteLoan=(id)=>{
    if(!confirm("¿Eliminar este préstamo?")) return;
    setLoans(prev=>prev.filter(l=>l.id!==id));
    showToast("Eliminado");
  };

  const totalPrestado  = loans.reduce((s,l)=>s+l.principal,0);
  const totalPorCobrar = loans.reduce((s,l)=>s+(l.total-l.paid),0);
  const enMora         = loans.filter(l=>loanStatus(l)==="mora").length;
  const filtered       = loans.filter(l=>
    l.client.toLowerCase().includes(search.toLowerCase())||
    (l.phone||"").includes(search)||(l.rut||"").includes(search)
  );

  const previewP=parseInt(((form.principal||"")).replace(/\D/g,""),10)||0;
  const previewD=parseInt(form.days||"30",10)||30;
  const preview=calcLoan(previewP,previewD);

  const onSecretCode=useCallback(()=>{ setScreen("login"); },[]);
  const onExit=useCallback(()=>{ setScreen("login"); },[]);

  return(
    <>
      <style>{css}</style>

      {screen!=="app"&&(
        <SpaceGame onExit={onExit} onSecretCode={onSecretCode}/>
      )}

      {screen==="login"&&(
        <div className="login-overlay" onClick={()=>setScreen("galaxia")}>
          <div className="login-box" onClick={e=>e.stopPropagation()}>
            <button className="login-close" onClick={()=>setScreen("galaxia")}>✕</button>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {[["dark","🌙"],["light","☀️"],["hc","◑"]].map(([t,ic])=>(
                <button key={t} onClick={()=>setTheme(t)} style={{
                  width:30,height:30,borderRadius:7,
                  border:`1.5px solid ${theme===t?T.accent:T.border}`,
                  background:theme===t?T.accent+"33":"transparent",
                  cursor:"pointer",fontSize:14,
                }}>{ic}</button>
              ))}
            </div>
            <div className="login-title">🛸 <span>Galaxia</span> Perdida</div>
            <div className="login-sub">Acceso de operadores</div>
            <div className="role-grid">
              {[["admin","👑","Administrador"],["user","📋","Agente"]].map(([r,ic,lb])=>(
                <button key={r} className={`role-btn ${selRole===r?"sel":""}`}
                  onClick={()=>{setSelRole(r);setPin("");setPinErr("");}}>
                  <span style={{fontSize:20}}>{ic}</span>{lb}
                </button>
              ))}
            </div>
            {selRole&&(
              <>
                <input className="pin-input" type="password" maxLength={4}
                  placeholder="••••" value={pin}
                  onChange={e=>{setPin(e.target.value);setPinErr("");}}
                  onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                  autoFocus
                />
                <div className="pin-err">{pinErr}</div>
                <button className="btn btn-primary" style={{width:"100%",padding:"13px"}} onClick={handleLogin}>
                  Ingresar →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {screen==="app"&&(
        <div className="app-shell">
          <div className="app-header">
            <div className="header-logo">Presta<span>Fast</span></div>
            <div className="header-right">
              <div className="theme-toggle">
                {[["dark","🌙"],["light","☀️"],["hc","◑"]].map(([t,ic])=>(
                  <button key={t} className={`theme-btn ${theme===t?"on":""}`} onClick={()=>setTheme(t)}>{ic}</button>
                ))}
              </div>
              <span className="badge-role">{role==="admin"?"ADMIN":"AGENTE"}</span>
              <button className="btn btn-ghost btn-sm" onClick={logout}>Salir</button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card"><div className="stat-lbl">Prestado</div><div className="stat-val">${fmt(totalPrestado)}</div></div>
            <div className="stat-card"><div className="stat-lbl">Por cobrar</div><div className="stat-val c-ok">${fmt(totalPorCobrar)}</div></div>
            <div className="stat-card"><div className="stat-lbl">En mora</div><div className={`stat-val ${enMora>0?"c-warn":""}`}>{enMora}</div></div>
          </div>

          <div className="tab-bar">
            <button className={`tab-btn ${tab==="loans"?"on":""}`} onClick={()=>setTab("loans")}>📋 Préstamos</button>
            <button className={`tab-btn ${tab==="new"?"on":""}`} onClick={()=>setTab("new")}>＋ Nuevo</button>
          </div>

          {tab==="loans"&&(<>
            <div className="search-box">
              <span style={{color:T.muted}}>🔍</span>
              <input placeholder="Buscar nombre, teléfono, RUT..." value={search} onChange={e=>setSearch(e.target.value)}/>
              {search&&<button style={{background:"none",border:"none",cursor:"pointer",color:T.muted}} onClick={()=>setSearch("")}>✕</button>}
            </div>
            <div className="loans-list">
              {filtered.length===0&&(
                <div className="empty"><div className="empty-icon">💸</div>
                <div>{search?"Sin resultados":"No hay préstamos"}</div></div>
              )}
              {filtered.map(loan=>{
                const st=loanStatus(loan), pct=Math.min(100,Math.round(loan.paid/loan.total*100));
                const open=expanded===loan.id;
                return(
                  <div key={loan.id} className="loan-card">
                    <div className="loan-header" onClick={()=>setExpanded(open?null:loan.id)}>
                      <div className="loan-avatar">👤</div>
                      <div>
                        <div className="loan-name">{loan.client}</div>
                        <div className="loan-meta">{loan.phone} · {loan.createdAt}</div>
                      </div>
                      <div className="loan-right">
                        <div className="loan-amount">${fmt(loan.total)}</div>
                        <div className={`loan-status ${st==="al día"?"s-ok":st==="mora"?"s-mora":"s-done"}`}>
                          {st.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <div className="progress-wrap">
                      <div className="progress-labels"><span>Pagado ${fmt(loan.paid)}</span><span>{pct}%</span></div>
                      <div className="progress-track"><div className="progress-fill" style={{width:`${pct}%`}}/></div>
                    </div>
                    {open&&(
                      <div className="loan-detail">
                        {[["Capital",`$${fmt(loan.principal)}`],["Cuota diaria",`$${fmt(loan.daily)}/día`],
                          ["Plazo",`${loan.days} días`],["Restante",`$${fmt(loan.total-loan.paid)}`],
                          ...(loan.rut?[["RUT",loan.rut]]:[]),
                          ...(loan.address?[["Dirección",loan.address]]:[]),
                          ["Agente",loan.agente]
                        ].map(([l,v])=>(
                          <div key={l} className="detail-row">
                            <span className="detail-lbl">{l}</span>
                            <span className="detail-val" style={l==="Restante"?{color:T.danger}:{}}>{v}</span>
                          </div>
                        ))}
                        {loan.paid<loan.total&&(
                          <div className="pay-row">
                            <input className="pay-input" type="text" placeholder="Monto a pagar..."
                              value={payAmt[loan.id]||""}
                              onChange={e=>setPayAmt(p=>({...p,[loan.id]:e.target.value}))}
                              onKeyDown={e=>e.key==="Enter"&&registerPayment(loan)}/>
                            <button className="btn btn-primary" onClick={()=>registerPayment(loan)}>Pagar</button>
                          </div>
                        )}
                        {loan.payments.length>0&&(
                          <div className="pay-history">
                            <div className="pay-history-title">Historial</div>
                            {loan.payments.map(p=>(
                              <div key={p.id} className="pay-item">
                                <div className="pay-dot"/>
                                <span className="pay-meta">{p.date} {p.time}</span>
                                {p.penalty>0&&<span style={{color:T.danger,fontSize:10}}> +multa</span>}
                                <span className="pay-amount">+${fmt(p.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {role==="admin"&&(
                          <div style={{marginTop:12}}>
                            <button className="btn btn-danger btn-sm" onClick={()=>deleteLoan(loan.id)}>🗑 Eliminar</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>)}

          {tab==="new"&&(
            <div className="form-wrap">
              <div className="form-section">
                <div className="form-title">— Cliente —</div>
                <div className="form-grid">
                  {[["client","Nombre *","text","Juan Pérez"],["phone","Teléfono","tel","+56 9..."],
                    ["rut","RUT","text","12.345.678-9"],["address","Dirección","text","Calle y número"]
                  ].map(([k,lb,tp,ph])=>(
                    <div key={k} className="field">
                      <label>{lb}</label>
                      <input type={tp} placeholder={ph} value={form[k]}
                        onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-section">
                <div className="form-title">— Préstamo —</div>
                <div className="form-grid">
                  <div className="field"><label>Monto *</label>
                    <input type="text" placeholder="100000" value={form.principal}
                      onChange={e=>setForm(f=>({...f,principal:e.target.value}))}/>
                  </div>
                  <div className="field"><label>Plazo *</label>
                    <select value={form.days} onChange={e=>setForm(f=>({...f,days:e.target.value}))}>
                      {[7,10,14,15,20,30,45,60].map(d=><option key={d} value={d}>{d} días</option>)}
                    </select>
                  </div>
                </div>
              </div>
              {previewP>0&&(
                <div className="form-preview">
                  {[["Total a cobrar",`$${fmt(preview.total)}`],["Cuota diaria",`$${fmt(preview.daily)}`],
                    ["Interés 20%",`$${fmt(preview.total-previewP)}`],[`Plazo`,`${previewD}d`]
                  ].map(([l,v])=>(
                    <div key={l} className="preview-item"><div className="lbl">{l}</div><div className="val">{v}</div></div>
                  ))}
                </div>
              )}
              <button className="btn btn-primary" style={{width:"100%",padding:"13px"}} onClick={createLoan}>
                Crear préstamo →
              </button>
            </div>
          )}
        </div>
      )}

      {voucher&&(
        <div className="modal-bg" onClick={()=>setVoucher(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="voucher-title">✓ PAGO REGISTRADO</div>
            {[["Cliente",voucher.loan.client],["Monto",`$${fmt(voucher.payment.amount)}`],
              ["Fecha",`${voucher.payment.date} ${voucher.payment.time}`],
              ["Cuota diaria",`$${fmt(voucher.loan.daily)}`],
              ["Restante",`$${fmt(voucher.loan.total-voucher.loan.paid)}`]
            ].map(([l,v])=>(
              <div key={l} className="voucher-row"><span className="lbl">{l}</span><span className="val">{v}</span></div>
            ))}
            <div className="voucher-row" style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${T.border}`}}>
              <span className="lbl">Total pagado</span>
              <span className="val voucher-total">${fmt(voucher.loan.paid)}</span>
            </div>
            <button className="btn btn-primary" style={{width:"100%",marginTop:16}} onClick={()=>setVoucher(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {toast&&(
        <div className="toast" style={{borderColor:toast.type==="err"?T.danger:T.border}}>
          {toast.type==="err"?"⚠️ ":"✓ "}{toast.msg}
        </div>
      )}
    </>
  );
}
