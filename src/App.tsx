import { useState } from "react";

// ── Claves de acceso ──────────────────────────────────────────────────────────
const ADMIN_KEY = "2020";   // clave administrador
const USER_KEY  = "1234";   // clave usuario (agente en terreno)

const INTEREST = 0.20;
const PENALTY  = 0.10;

// ── Interfaces ────────────────────────────────────────────────────────────────
interface Payment {
  id: number;
  amount: number;
  penalty: number;
  date: string;
  time: string;
  lateCount: number;
  note?: string;
}

interface Loan {
  id: number;
  client: string;
  phone: string;
  address: string;
  rut: string;
  principal: number;
  total: number;
  daily: number;
  days: number;
  paid: number;
  payments: Payment[];
  createdAt: string;
  createdTime: string;
  agente: string;
}

interface FormState {
  client: string; phone: string; address: string;
  rut: string; principal: string; days: string;
}

type Role = "admin" | "user" | null;

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcLoan(principal: number, days: number) {
  const total = Math.round(principal * (1 + INTEREST));
  const daily = Math.round(total / days);
  return { total, daily };
}
function today() {
  return new Date().toLocaleDateString("es-CL", { day:"2-digit", month:"2-digit", year:"numeric" });
}
function nowTime() {
  return new Date().toLocaleTimeString("es-CL", { hour:"2-digit", minute:"2-digit" });
}
function fmt(n: number) { return Number(n).toLocaleString("es-CL"); }

let _id = 1;
const uid = () => _id++;

// ── Estilos ───────────────────────────────────────────────────────────────────
const DARK_VARS = `:root{--bg:#0d0d0f;--card:#16161a;--card2:#1e1e24;--border:#2a2a35;--accent:#f0c040;--danger:#e04040;--ok:#40c080;--text:#f0eee8;--muted:#888;--radius:14px;--menu-bg:#1e1e24;}`;
const LIGHT_VARS = `:root{--bg:#f4f4f8;--card:#fff;--card2:#f0f0f5;--border:#ddd;--accent:#e6a800;--danger:#e04040;--ok:#28a060;--text:#111;--muted:#666;--radius:14px;--menu-bg:#fff;}`;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;min-height:100vh;transition:background .3s,color .3s}

/* login */
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--bg)}
.login-box{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:36px 32px;width:100%;max-width:400px;text-align:center}
.login-logo{font-size:48px;margin-bottom:12px}
.login-title{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;margin-bottom:4px}
.login-title span{color:var(--accent)}
.login-sub{color:var(--muted);font-size:14px;margin-bottom:28px}
.role-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}
.role-btn{padding:18px 12px;border:2px solid var(--border);background:var(--card2);color:var(--text);border-radius:14px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;transition:.2s;text-align:center}
.role-btn:hover{border-color:var(--accent)}
.role-btn.selected{border-color:var(--accent);background:rgba(240,192,64,.1)}
.role-icon{font-size:28px;display:block;margin-bottom:6px}
.pin-input{width:100%;background:var(--card2);border:2px solid var(--border);color:var(--text);padding:14px;border-radius:12px;font-family:'DM Mono',monospace;font-size:22px;text-align:center;letter-spacing:8px;outline:none;margin-bottom:12px;transition:.2s}
.pin-input:focus{border-color:var(--accent)}
.login-error{color:var(--danger);font-size:13px;margin-bottom:12px;min-height:18px}
.login-hint{color:var(--muted);font-size:11px;margin-top:16px}

/* app */
.app{max-width:900px;margin:0 auto;padding:20px 16px 80px}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}
.header-left{display:flex;align-items:center;gap:12px}
.logo{width:42px;height:42px;background:var(--accent);border-radius:10px;display:grid;place-items:center;font-size:20px}
.brand{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;letter-spacing:-.5px}
.brand span{color:var(--accent)}
.role-badge{font-size:10px;padding:2px 8px;border-radius:20px;font-weight:700;font-family:'DM Mono',monospace;margin-top:2px;display:inline-block}
.role-badge.admin{background:rgba(240,192,64,.2);color:var(--accent);border:1px solid rgba(240,192,64,.4)}
.role-badge.user{background:rgba(64,192,128,.2);color:var(--ok);border:1px solid rgba(64,192,128,.4)}
.header-right{display:flex;gap:8px}
.icon-btn{background:var(--card);border:1px solid var(--border);color:var(--text);width:36px;height:36px;border-radius:9px;display:grid;place-items:center;cursor:pointer;font-size:16px}

/* menú */
.menu-overlay{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.4)}
.menu-panel{position:fixed;top:0;right:0;height:100%;width:260px;background:var(--menu-bg);border-left:1px solid var(--border);z-index:51;padding:20px;display:flex;flex-direction:column;gap:12px}
.menu-close{align-self:flex-end;background:none;border:none;color:var(--text);font-size:22px;cursor:pointer}
.menu-title{font-family:'Syne',sans-serif;font-size:17px;font-weight:800}
.menu-item{display:flex;align-items:center;justify-content:space-between;padding:11px 13px;background:var(--card2);border-radius:10px;border:1px solid var(--border);font-size:13px;font-weight:500;cursor:pointer}
.toggle{width:42px;height:22px;background:var(--border);border-radius:11px;position:relative;cursor:pointer;transition:.2s}
.toggle.on{background:var(--accent)}
.toggle-dot{position:absolute;top:3px;left:3px;width:16px;height:16px;background:#fff;border-radius:50%;transition:.2s}
.toggle.on .toggle-dot{left:23px}

/* tabs */
.tabs{display:flex;gap:6px;margin-bottom:24px;background:var(--card);padding:5px;border-radius:12px;border:1px solid var(--border)}
.tab{flex:1;padding:9px 6px;border:none;background:transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;border-radius:8px;transition:.2s}
.tab.active{background:var(--accent);color:#000;font-weight:700}

/* cards */
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:18px;margin-bottom:14px}
.card-title{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;margin-bottom:14px;color:var(--accent)}
.section-label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin:14px 0 8px;font-weight:700;border-bottom:1px solid var(--border);padding-bottom:5px}
.field{margin-bottom:12px}
.field label{display:block;font-size:11px;font-weight:600;color:var(--muted);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px}
.field input{width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);padding:9px 12px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:.2s}
.field input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(240,192,64,.1)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:520px){.grid2{grid-template-columns:1fr}}
.btn{display:inline-flex;align-items:center;gap:6px;padding:10px 18px;border:none;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:.2s}
.btn-primary{background:var(--accent);color:#000}
.btn-ok{background:var(--ok);color:#fff}
.btn-danger{background:var(--danger);color:#fff}
.btn-ghost{background:transparent;border:1px solid var(--border);color:var(--text)}
.btn-sm{padding:6px 11px;font-size:11px;border-radius:7px}

/* summary */
.summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:18px}
.summary-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center}
.s-num{font-family:'Syne',sans-serif;font-size:20px;font-weight:800}
.s-lbl{font-size:10px;color:var(--muted);margin-top:2px;text-transform:uppercase}

/* loan card */
.loan-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:10px;position:relative;overflow:hidden}
.loan-card::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;background:var(--accent)}
.loan-card.overdue::before{background:var(--danger)}
.loan-header{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap}
.client-name{font-family:'Syne',sans-serif;font-size:17px;font-weight:800}
.badge{font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;font-family:'DM Mono',monospace}
.badge-ok{background:rgba(64,192,128,.15);color:var(--ok);border:1px solid rgba(64,192,128,.3)}
.badge-danger{background:rgba(224,64,64,.15);color:var(--danger);border:1px solid rgba(224,64,64,.3)}
.badge-warn{background:rgba(240,192,64,.15);color:var(--accent);border:1px solid rgba(240,192,64,.3)}
.progress-bar{height:5px;background:var(--border);border-radius:3px;margin:10px 0 4px;overflow:hidden}
.progress-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--ok),var(--accent))}
.stats-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}
.stat{flex:1;min-width:80px}
.stat-label{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px}
.stat-val{font-family:'DM Mono',monospace;font-size:14px;font-weight:500}
.stat-val.red{color:var(--danger)} .stat-val.green{color:var(--ok)} .stat-val.yellow{color:var(--accent)}
.actions-row{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:center}
.pay-row{display:flex;justify-content:space-between;align-items:flex-start;padding:9px 12px;background:var(--card2);border-radius:8px;margin-bottom:5px;font-size:12px;gap:8px}
.pay-date{color:var(--muted);font-family:'DM Mono',monospace;font-size:10px}

/* modal editar pago */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:98;padding:16px}
.modal-box{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px;max-width:360px;width:100%}
.modal-title{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;margin-bottom:16px;color:var(--accent)}

/* voucher */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:99;padding:16px;overflow-y:auto}
.voucher{background:#fff;color:#111;border-radius:16px;max-width:380px;width:100%;overflow:hidden;font-family:'DM Mono',monospace}
.voucher-header{background:#111;color:#f0c040;padding:18px 22px;text-align:center}
.voucher-logo{font-family:'Syne',sans-serif;font-size:19px;font-weight:800}
.voucher-sub{font-size:11px;color:#888;margin-top:2px}
.voucher-body{padding:18px 22px}
.v-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dashed #ddd;font-size:12px}
.v-label{color:#555;font-weight:500} .v-val{font-weight:700;text-align:right;max-width:200px}
.v-total{background:#111;color:#f0c040;margin:14px 0 0;border-radius:10px;padding:13px 16px;display:flex;justify-content:space-between;font-size:14px}
.voucher-footer{background:#f5f5f5;padding:12px 22px;text-align:center;font-size:10px;color:#888;border-top:2px dashed #ddd}
.voucher-btns{display:flex;gap:8px;padding:12px 14px;background:#f5f5f5;border-top:1px solid #e0e0e0}
.vbtn{flex:1;padding:10px 4px;border:none;border-radius:9px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:12px;cursor:pointer}

/* admin panel */
.admin-banner{background:linear-gradient(135deg,rgba(240,192,64,.15),rgba(224,64,64,.1));border:1px solid rgba(240,192,64,.3);border-radius:12px;padding:14px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px}

.no-data{text-align:center;padding:36px;color:var(--muted);font-size:14px}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--ok);color:#fff;padding:9px 20px;border-radius:30px;font-weight:700;font-size:13px;z-index:200;animation:fadeup .3s ease;white-space:nowrap}
@keyframes fadeup{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
`;

// ── Datos compartidos (simula base de datos global) ───────────────────────────
// En producción esto vendrá de Supabase
let globalLoans: Loan[] = [];

// ── Componente principal ──────────────────────────────────────────────────────
export default function App() {
  const [role, setRole]       = useState<Role>(null);
  const [selectedRole, setSelectedRole] = useState<"admin"|"user"|null>(null);
  const [pin, setPin]         = useState("");
  const [pinError, setPinError] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [loans, setLoans]     = useState<Loan[]>([]);
  const [tab, setTab]         = useState("loans");
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm]       = useState<FormState>({ client:"", phone:"", address:"", rut:"", principal:"", days:"30" });
  const [voucher, setVoucher] = useState<{loan:Loan, payment:Payment}|null>(null);
  const [toast, setToast]     = useState<string|null>(null);
  const [payAmt, setPayAmt]   = useState<Record<number,string>>({});
  const [editPayment, setEditPayment] = useState<{loan:Loan, payment:Payment}|null>(null);
  const [editAmt, setEditAmt] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(()=>setToast(null), 2500);
  }

  function handleLogin() {
    if (!selectedRole) { setPinError("Selecciona un rol"); return; }
    const correct = selectedRole === "admin" ? ADMIN_KEY : USER_KEY;
    if (pin === correct) {
      setRole(selectedRole);
      setPinError("");
      globalLoans = loans; // sync
    } else {
      setPinError("Clave incorrecta. Inténtalo de nuevo.");
      setPin("");
    }
  }

  function logout() {
    setRole(null); setSelectedRole(null); setPin(""); setPinError("");
    setMenuOpen(false);
  }

  function syncLoans(updated: Loan[]) {
    setLoans(updated);
    globalLoans = updated;
  }

  function createLoan() {
    const { client, phone, address, rut, principal, days } = form;
    if (!client || !principal || !days) return showToast("Completa nombre, monto y plazo");
    const p = parseInt(principal.replace(/\D/g,""),10);
    const d = parseInt(days,10);
    if (!p || !d) return showToast("Monto y plazo deben ser números");
    const { total, daily } = calcLoan(p, d);
    const loan: Loan = {
      id: uid(), client, phone, address, rut,
      principal: p, total, daily, days: d,
      paid: 0, payments: [],
      createdAt: today(), createdTime: nowTime(),
      agente: role === "admin" ? "Admin" : "Agente",
    };
    syncLoans([loan, ...loans]);
    setForm({ client:"", phone:"", address:"", rut:"", principal:"", days:"30" });
    showToast("Préstamo creado ✓");
    setTab("loans");
  }

  function registerPayment(loan: Loan) {
    const rawAmt = payAmt[loan.id] || "";
    const amt = parseInt(String(rawAmt).replace(/\D/g,""),10);
    if (!amt || amt <= 0) return showToast("Ingresa un monto válido");
    const lateCount = overdueCount(loan);
    const penalty   = lateCount >= 4 ? Math.round(loan.daily * PENALTY) : 0;
    const payment: Payment = { id: uid(), amount: amt, penalty, date: today(), time: nowTime(), lateCount };
    const updated: Loan = { ...loan, paid: Math.min(loan.paid + amt, loan.total), payments: [...loan.payments, payment] };
    syncLoans(loans.map(l => l.id === loan.id ? updated : l));
    setPayAmt(prev => ({ ...prev, [loan.id]: "" }));
    setVoucher({ loan: updated, payment });
  }

  // ── Editar pago ──────────────────────────────────────────────────────────────
  function openEditPayment(loan: Loan, payment: Payment) {
    setEditPayment({ loan, payment });
    setEditAmt(String(payment.amount));
  }

  function saveEditPayment() {
    if (!editPayment) return;
    const newAmt = parseInt(editAmt.replace(/\D/g,""),10);
    if (!newAmt || newAmt <= 0) return showToast("Monto inválido");
    const { loan, payment } = editPayment;
    const oldAmt = payment.amount;
    const diff = newAmt - oldAmt;
    const updatedPayments = loan.payments.map(p =>
      p.id === payment.id ? { ...p, amount: newAmt } : p
    );
    const updated: Loan = {
      ...loan,
      paid: Math.min(Math.max(0, loan.paid + diff), loan.total),
      payments: updatedPayments,
    };
    syncLoans(loans.map(l => l.id === loan.id ? updated : l));
    setEditPayment(null);
    showToast("Pago corregido ✓");
  }

  function deletePayment(loan: Loan, payment: Payment) {
    const updatedPayments = loan.payments.filter(p => p.id !== payment.id);
    const updated: Loan = {
      ...loan,
      paid: Math.max(0, loan.paid - payment.amount),
      payments: updatedPayments,
    };
    syncLoans(loans.map(l => l.id === loan.id ? updated : l));
    showToast("Pago eliminado");
  }

  function overdueCount(loan: Loan) {
    const expectedPaid = loan.payments.length * loan.daily;
    const diff = expectedPaid - loan.paid;
    if (diff <= 0) return 0;
    return Math.floor(diff / loan.daily);
  }

  function loanStatus(loan: Loan) {
    if (loan.paid >= loan.total) return "pagado";
    if (overdueCount(loan) >= 4)  return "mora";
    return "al día";
  }

  const totalPrestado  = loans.reduce((s,l) => s + l.principal, 0);
  const totalPorCobrar = loans.reduce((s,l) => s + (l.total - l.paid), 0);
  const enMora         = loans.filter(l => loanStatus(l) === "mora").length;

  // ── PANTALLA DE LOGIN ────────────────────────────────────────────────────────
  if (!role) {
    return (
      <>
        <style>{(darkMode ? DARK_VARS : LIGHT_VARS) + CSS}</style>
        <div className="login-wrap">
          <div className="login-box">
            <div className="login-logo">💸</div>
            <div className="login-title">Presta<span>Fast</span></div>
            <div className="login-sub">Sistema de préstamos diarios</div>

            <div className="role-grid">
              <button
                className={`role-btn ${selectedRole==="admin"?"selected":""}`}
                onClick={()=>{ setSelectedRole("admin"); setPin(""); setPinError(""); }}
              >
                <span className="role-icon">👑</span>
                Administrador
              </button>
              <button
                className={`role-btn ${selectedRole==="user"?"selected":""}`}
                onClick={()=>{ setSelectedRole("user"); setPin(""); setPinError(""); }}
              >
                <span className="role-icon">📋</span>
                Agente
              </button>
            </div>

            {selectedRole && (
              <>
                <div style={{fontSize:13,color:"var(--muted)",marginBottom:10}}>
                  {selectedRole==="admin" ? "🔐 Clave de administrador" : "🔑 Clave de agente"}
                </div>
                <input
                  className="pin-input"
                  type="password"
                  maxLength={6}
                  placeholder="••••"
                  value={pin}
                  onChange={e=>{ setPin(e.target.value); setPinError(""); }}
                  onKeyDown={e=>e.key==="Enter" && handleLogin()}
                  autoFocus
                />
                <div className="login-error">{pinError}</div>
                <button className="btn btn-primary" style={{width:"100%",justifyContent:"center",padding:"13px"}} onClick={handleLogin}>
                  Ingresar →
                </button>
              </>
            )}

            <div className="login-hint">
              {!selectedRole ? "Selecciona tu rol para continuar" : ""}
            </div>

            <button
              style={{marginTop:16,background:"none",border:"none",color:"var(--muted)",fontSize:12,cursor:"pointer"}}
              onClick={()=>setDarkMode(d=>!d)}
            >
              {darkMode?"☀️ Modo claro":"🌙 Modo oscuro"}
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── APP PRINCIPAL ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{(darkMode ? DARK_VARS : LIGHT_VARS) + CSS}</style>

      {/* Menú lateral */}
      {menuOpen && (
        <>
          <div className="menu-overlay" onClick={()=>setMenuOpen(false)} />
          <div className="menu-panel">
            <button className="menu-close" onClick={()=>setMenuOpen(false)}>✕</button>
            <div className="menu-title">⚙️ Ajustes</div>
            <div className="menu-item">
              <span>{darkMode?"🌙 Oscuro":"☀️ Claro"}</span>
              <div className={`toggle ${darkMode?"on":""}`} onClick={()=>setDarkMode(d=>!d)}>
                <div className="toggle-dot" />
              </div>
            </div>
            <div className="menu-item" style={{cursor:"default"}}>
              <span>👤 Rol activo</span>
              <span style={{fontSize:12,color:role==="admin"?"var(--accent)":"var(--ok)",fontWeight:700}}>
                {role==="admin"?"Administrador":"Agente"}
              </span>
            </div>
            {role === "admin" && (
              <div className="menu-item" style={{cursor:"default",opacity:.6}}>
                <span>👥 Gestión de agentes</span>
                <span style={{fontSize:11,color:"var(--muted)"}}>Próximo</span>
              </div>
            )}
            <button className="btn btn-danger" style={{width:"100%",justifyContent:"center",marginTop:"auto"}} onClick={logout}>
              🚪 Cerrar sesión
            </button>
          </div>
        </>
      )}

      <div className="app">
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <div className="logo">💸</div>
            <div>
              <div className="brand">Presta<span>Fast</span></div>
              <span className={`role-badge ${role}`}>
                {role==="admin"?"👑 Administrador":"📋 Agente"}
              </span>
            </div>
          </div>
          <div className="header-right">
            <button className="icon-btn" onClick={()=>setDarkMode(d=>!d)}>{darkMode?"☀️":"🌙"}</button>
            <button className="icon-btn" onClick={()=>setMenuOpen(true)}>☰</button>
          </div>
        </div>

        {/* Banner admin */}
        {role === "admin" && (
          <div className="admin-banner">
            <span style={{fontSize:22}}>👑</span>
            <div>
              <div style={{fontWeight:700,fontSize:13}}>Panel Administrador</div>
              <div style={{fontSize:11,color:"var(--muted)"}}>Visibilidad total • Puede editar y eliminar pagos</div>
            </div>
          </div>
        )}

        {/* Resumen */}
        <div className="summary-grid">
          <div className="summary-card">
            <div className="s-num" style={{color:"var(--accent)"}}>{loans.length}</div>
            <div className="s-lbl">Préstamos</div>
          </div>
          <div className="summary-card">
            <div className="s-num" style={{color:"var(--ok)"}}>$ {fmt(totalPrestado)}</div>
            <div className="s-lbl">Capital</div>
          </div>
          <div className="summary-card">
            <div className="s-num" style={{color:enMora?"var(--danger)":"var(--ok)"}}>{enMora}</div>
            <div className="s-lbl">En mora</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${tab==="loans"?"active":""}`} onClick={()=>setTab("loans")}>📋 Préstamos</button>
          <button className={`tab ${tab==="new"?"active":""}`}   onClick={()=>setTab("new")}>➕ Nuevo</button>
          {role === "admin" && (
            <button className={`tab ${tab==="admin"?"active":""}`} onClick={()=>setTab("admin")}>👑 Admin</button>
          )}
        </div>

        {/* ── NUEVO PRÉSTAMO ── */}
        {tab === "new" && (
          <div className="card">
            <div className="card-title">Registrar nuevo préstamo</div>
            <div className="section-label">Datos del cliente</div>
            <div className="grid2">
              <div className="field"><label>Nombre *</label>
                <input placeholder="Juan García" value={form.client} onChange={e=>setForm(f=>({...f,client:e.target.value}))} />
              </div>
              <div className="field"><label>RUT / Cédula</label>
                <input placeholder="12.345.678-9" value={form.rut} onChange={e=>setForm(f=>({...f,rut:e.target.value}))} />
              </div>
            </div>
            <div className="grid2">
              <div className="field"><label>Teléfono</label>
                <input placeholder="+56 9 1234 5678" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
              </div>
              <div className="field"><label>Dirección</label>
                <input placeholder="Calle 123" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} />
              </div>
            </div>
            <div className="section-label">Condiciones del préstamo</div>
            <div className="grid2">
              <div className="field"><label>Monto prestado ($) *</label>
                <input placeholder="300000" value={form.principal} onChange={e=>setForm(f=>({...f,principal:e.target.value}))} />
              </div>
              <div className="field"><label>Plazo (días) *</label>
                <input type="number" min="1" value={form.days} onChange={e=>setForm(f=>({...f,days:e.target.value}))} />
              </div>
            </div>
            {form.principal && form.days && (() => {
              const p = parseInt(form.principal.replace(/\D/g,""),10)||0;
              const d = parseInt(form.days,10)||1;
              if (!p) return null;
              const { total, daily } = calcLoan(p,d);
              return (
                <div style={{background:"var(--card2)",borderRadius:9,padding:"12px 14px",marginBottom:14,fontSize:12,display:"flex",flexWrap:"wrap" as const,gap:14}}>
                  <span><span style={{color:"var(--muted)"}}>Total a devolver: </span><strong style={{color:"var(--accent)"}}>$ {fmt(total)}</strong></span>
                  <span><span style={{color:"var(--muted)"}}>Cuota diaria: </span><strong style={{color:"var(--ok)"}}>$ {fmt(daily)}</strong></span>
                  <span><span style={{color:"var(--muted)"}}>Interés: </span><strong>20%</strong></span>
                </div>
              );
            })()}
            <button className="btn btn-primary" onClick={createLoan}>Crear préstamo →</button>
          </div>
        )}

        {/* ── LISTA PRÉSTAMOS ── */}
        {tab === "loans" && (
          <>
            {totalPorCobrar > 0 && (
              <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:12,color:"var(--muted)"}}>Total por cobrar</span>
                <span style={{fontFamily:"DM Mono,monospace",fontWeight:700,color:"var(--danger)",fontSize:15}}>$ {fmt(totalPorCobrar)}</span>
              </div>
            )}
            {loans.length === 0 && <div className="no-data">Sin préstamos.<br/>Crea uno en ➕ Nuevo.</div>}
            {loans.map(loan => {
              const pct    = Math.min(100, Math.round(loan.paid / loan.total * 100));
              const status = loanStatus(loan);
              const late   = overdueCount(loan);
              const penalty = late >= 4 ? Math.round(loan.daily * PENALTY) : 0;
              return (
                <div key={loan.id} className={`loan-card ${status==="mora"?"overdue":""}`}>
                  <div className="loan-header">
                    <div>
                      <div className="client-name">{loan.client}</div>
                      <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>
                        {loan.rut && <span>{loan.rut} • </span>}
                        {loan.phone && <span>{loan.phone} • </span>}
                        {loan.createdAt}
                      </div>
                      {loan.address && <div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>📍 {loan.address}</div>}
                    </div>
                    <span className={`badge ${status==="pagado"?"badge-ok":status==="mora"?"badge-danger":"badge-warn"}`}>
                      {status==="pagado"?"✓ Pagado":status==="mora"?"⚠ Mora":"● Al día"}
                    </span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{width:`${pct}%`}} /></div>
                  <div style={{fontSize:10,color:"var(--muted)",textAlign:"right" as const}}>{pct}% pagado</div>
                  <div className="stats-row">
                    <div className="stat"><div className="stat-label">Prestado</div><div className="stat-val">$ {fmt(loan.principal)}</div></div>
                    <div className="stat"><div className="stat-label">Total</div><div className="stat-val yellow">$ {fmt(loan.total)}</div></div>
                    <div className="stat"><div className="stat-label">Pagado</div><div className="stat-val green">$ {fmt(loan.paid)}</div></div>
                    <div className="stat"><div className="stat-label">Saldo</div><div className="stat-val red">$ {fmt(loan.total - loan.paid)}</div></div>
                    <div className="stat"><div className="stat-label">Cuota/día</div><div className="stat-val">$ {fmt(loan.daily)}</div></div>
                    {late > 0 && <div className="stat"><div className="stat-label">Vencidas</div><div className="stat-val red">{late}</div></div>}
                    {penalty > 0 && <div className="stat"><div className="stat-label">Multa</div><div className="stat-val red">$ {fmt(penalty)}</div></div>}
                  </div>
                  {status !== "pagado" && (
                    <div className="actions-row">
                      <input
                        style={{background:"var(--card2)",border:"1px solid var(--border)",color:"var(--text)",padding:"7px 10px",borderRadius:7,fontFamily:"DM Sans,sans-serif",fontSize:13,width:150}}
                        placeholder="Monto a pagar"
                        value={payAmt[loan.id] || ""}
                        onChange={e=>setPayAmt(p=>({...p,[loan.id]:e.target.value}))}
                      />
                      <button className="btn btn-ok btn-sm" onClick={()=>registerPayment(loan)}>Registrar pago</button>
                    </div>
                  )}
                  {loan.payments.length > 0 && (
                    <div style={{marginTop:12}}>
                      <div style={{fontSize:10,color:"var(--muted)",marginBottom:6,textTransform:"uppercase" as const,letterSpacing:".4px"}}>Historial de pagos</div>
                      {loan.payments.map((p) => (
                        <div key={p.id} className="pay-row">
                          <div style={{flex:1}}>
                            <span style={{fontWeight:600}}>$ {fmt(p.amount)}</span>
                            {p.penalty > 0 && <span style={{color:"var(--danger)",fontSize:10,marginLeft:6}}>+$ {fmt(p.penalty)} multa</span>}
                            <div className="pay-date">{p.date} {p.time}</div>
                          </div>
                          <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap" as const}}>
                            <button className="btn btn-ghost btn-sm" onClick={()=>setVoucher({loan, payment:p})}>🧾</button>
                            {role === "admin" && (
                              <>
                                <button className="btn btn-ghost btn-sm" onClick={()=>openEditPayment(loan, p)} title="Editar pago">✏️</button>
                                <button className="btn btn-ghost btn-sm" style={{color:"var(--danger)"}} onClick={()=>deletePayment(loan, p)} title="Eliminar pago">🗑</button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* ── PANEL ADMIN ── */}
        {tab === "admin" && role === "admin" && (
          <div>
            <div className="card">
              <div className="card-title">📊 Resumen general</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[
                  ["Total préstamos", loans.length, "var(--accent)"],
                  ["Capital entregado", `$ ${fmt(totalPrestado)}`, "var(--ok)"],
                  ["Por cobrar", `$ ${fmt(totalPorCobrar)}`, "var(--danger)"],
                  ["En mora", enMora, enMora>0?"var(--danger)":"var(--ok)"],
                  ["Pagados", loans.filter(l=>loanStatus(l)==="pagado").length, "var(--ok)"],
                  ["Al día", loans.filter(l=>loanStatus(l)==="al día").length, "var(--accent)"],
                ].map(([label, val, color]) => (
                  <div key={String(label)} style={{background:"var(--card2)",borderRadius:10,padding:"12px 14px",border:"1px solid var(--border)"}}>
                    <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase" as const,letterSpacing:".4px",marginBottom:4}}>{label}</div>
                    <div style={{fontFamily:"DM Mono,monospace",fontWeight:700,fontSize:18,color:String(color)}}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-title">👥 Todos los préstamos</div>
              {loans.length === 0 && <div style={{color:"var(--muted)",fontSize:13}}>Sin préstamos registrados.</div>}
              {loans.map(loan => (
                <div key={loan.id} style={{padding:"10px 0",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap" as const}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14}}>{loan.client}</div>
                    <div style={{fontSize:11,color:"var(--muted)"}}>{loan.rut} • {loan.createdAt} • Agente: {loan.agente}</div>
                  </div>
                  <div style={{textAlign:"right" as const}}>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:13,color:"var(--danger)",fontWeight:700}}>$ {fmt(loan.total - loan.paid)}</div>
                    <div style={{fontSize:10,color:"var(--muted)"}}>saldo</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card" style={{opacity:.6}}>
              <div className="card-title">👥 Gestión de agentes</div>
              <div style={{fontSize:13,color:"var(--muted)"}}>Disponible cuando se conecte Supabase con login real. Por ahora la clave de agente es <strong>1234</strong>.</div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL EDITAR PAGO ── */}
      {editPayment && (
        <div className="modal-overlay" onClick={()=>setEditPayment(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">✏️ Corregir pago</div>
            <div style={{fontSize:12,color:"var(--muted)",marginBottom:12}}>
              Cliente: <strong>{editPayment.loan.client}</strong><br/>
              Fecha: {editPayment.payment.date} {editPayment.payment.time}
            </div>
            <div className="field">
              <label>Monto correcto</label>
              <input
                value={editAmt}
                onChange={e=>setEditAmt(e.target.value)}
                placeholder="Nuevo monto"
                autoFocus
              />
            </div>
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <button className="btn btn-ghost btn-sm" style={{flex:1,justifyContent:"center"}} onClick={()=>setEditPayment(null)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" style={{flex:1,justifyContent:"center"}} onClick={saveEditPayment}>Guardar ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* ── VOUCHER ── */}
      {voucher && <VoucherModal data={voucher} onClose={()=>setVoucher(null)} />}

      {/* ── TOAST ── */}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

// ── Voucher Modal ─────────────────────────────────────────────────────────────
function VoucherModal({ data, onClose }: { data:{loan:Loan,payment:Payment}, onClose:()=>void }) {
  const { loan, payment } = data;
  const saldo = loan.total - loan.paid;
  const pct   = Math.min(100, Math.round(loan.paid / loan.total * 100));

  function shareWhatsApp() {
    const msg = encodeURIComponent(
`💸 *PrestaFast - Comprobante de Pago*
━━━━━━━━━━━━━━━━━━━━
🧾 Recibo N° ${String(payment.id).padStart(5,"0")}
📅 ${payment.date} ${payment.time}
━━━━━━━━━━━━━━━━━━━━
👤 ${loan.client}${loan.rut?`\n🪪 RUT: ${loan.rut}`:""}${loan.phone?`\n📱 ${loan.phone}`:""}${loan.address?`\n📍 ${loan.address}`:""}
━━━━━━━━━━━━━━━━━━━━
💰 Capital: $${Number(loan.principal).toLocaleString("es-CL")}
📋 Total a devolver: $${Number(loan.total).toLocaleString("es-CL")}
📆 Cuota diaria: $${Number(loan.daily).toLocaleString("es-CL")}
━━━━━━━━━━━━━━━━━━━━
✅ Pago de hoy: $${Number(payment.amount).toLocaleString("es-CL")}${payment.penalty>0?`\n⚠️ Multa: $${Number(payment.penalty).toLocaleString("es-CL")}`:""}
💵 Total pagado: $${Number(loan.paid).toLocaleString("es-CL")}
🔴 Saldo pendiente: $${Number(saldo).toLocaleString("es-CL")}
━━━━━━━━━━━━━━━━━━━━
Progreso: ${pct}% pagado ✓`
    );
    window.open(`https://wa.me/?text=${msg}`,"_blank");
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div onClick={(e)=>e.stopPropagation()}>
        <div className="voucher">
          <div className="voucher-header">
            <div className="voucher-logo">💸 PrestaFast</div>
            <div className="voucher-sub">Comprobante de pago</div>
          </div>
          <div className="voucher-body">
            <div style={{textAlign:"center" as const,marginBottom:14}}>
              <div style={{fontSize:10,color:"#888"}}>RECIBO N° {String(payment.id).padStart(5,"0")}</div>
              <div style={{fontSize:11,color:"#444",marginTop:2}}>{payment.date} — {payment.time}</div>
            </div>
            <div className="v-row"><span className="v-label">Cliente</span><span className="v-val">{loan.client}</span></div>
            {loan.rut && <div className="v-row"><span className="v-label">RUT</span><span className="v-val">{loan.rut}</span></div>}
            {loan.phone && <div className="v-row"><span className="v-label">Teléfono</span><span className="v-val">{loan.phone}</span></div>}
            {loan.address && <div className="v-row"><span className="v-label">Dirección</span><span className="v-val">{loan.address}</span></div>}
            <div className="v-row"><span className="v-label">Inicio</span><span className="v-val">{loan.createdAt}</span></div>
            <div className="v-row"><span className="v-label">Capital</span><span className="v-val">$ {fmt(loan.principal)}</span></div>
            <div className="v-row"><span className="v-label">Total a devolver</span><span className="v-val">$ {fmt(loan.total)}</span></div>
            <div className="v-row"><span className="v-label">Cuota diaria</span><span className="v-val">$ {fmt(loan.daily)}</span></div>
            {payment.lateCount > 0 && <div className="v-row"><span className="v-label">Cuotas vencidas</span><span className="v-val" style={{color:"#e04040"}}>{payment.lateCount}</span></div>}
            {payment.penalty > 0 && <div className="v-row"><span className="v-label">Multa (10%)</span><span className="v-val" style={{color:"#e04040"}}>$ {fmt(payment.penalty)}</span></div>}
            <div className="v-row"><span className="v-label">Pago registrado</span><span className="v-val" style={{color:"#40c080",fontWeight:800}}>$ {fmt(payment.amount)}</span></div>
            <div className="v-row"><span className="v-label">Total pagado</span><span className="v-val">$ {fmt(loan.paid)}</span></div>
            <div className="v-total"><span>Saldo pendiente</span><span style={{fontWeight:800}}>$ {fmt(saldo)}</span></div>
            <div style={{marginTop:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#888",marginBottom:4}}>
                <span>Progreso</span><span>{pct}%</span>
              </div>
              <div style={{height:7,background:"#eee",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#40c080,#f0c040)",borderRadius:4}} />
              </div>
            </div>
          </div>
          <div className="voucher-footer">
            Comprobante válido como constancia de pago<br/>
            <span style={{display:"block",marginTop:3}}>PrestaFast • {today()}</span>
          </div>
          <div className="voucher-btns">
            <button className="vbtn" onClick={onClose} style={{background:"#222",color:"#fff"}}>← Volver</button>
            <button className="vbtn" onClick={shareWhatsApp} style={{background:"#25D366",color:"#fff"}}>📲 WhatsApp</button>
            <button className="vbtn" onClick={()=>window.print()} style={{background:"#f0c040",color:"#000"}}>🖨 Imprimir</button>
          </div>
        </div>
      </div>
    </div>
  );
}
