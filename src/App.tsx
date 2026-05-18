import { useState } from "react";

const INTEREST = 0.20;
const PENALTY  = 0.10;

interface Payment {
  id: number;
  amount: number;
  penalty: number;
  date: string;
  time: string;
  lateCount: number;
}

interface Loan {
  id: number;
  client: string;
  phone: string;
  principal: number;
  total: number;
  daily: number;
  days: number;
  paid: number;
  payments: Payment[];
  createdAt: string;
  createdTime: string;
}

interface FormState {
  client: string;
  phone: string;
  principal: string;
  days: string;
}

function calcLoan(principal: number, days: number) {
  const total = Math.round(principal * (1 + INTEREST));
  const daily = Math.round(total / days);
  return { total, daily };
}

function today() {
  return new Date().toLocaleDateString("es-CO", { day:"2-digit", month:"2-digit", year:"numeric" });
}
function nowTime() {
  return new Date().toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit" });
}
function fmt(n: number) {
  return Number(n).toLocaleString("es-CO");
}

let _id = 1;
const uid = () => _id++;

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0d0d0f;--card:#16161a;--card2:#1e1e24;--border:#2a2a35;--accent:#f0c040;--accent2:#e07b30;--danger:#e04040;--ok:#40c080;--text:#f0eee8;--muted:#888;--radius:14px;}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;min-height:100vh}
.app{max-width:900px;margin:0 auto;padding:24px 16px 80px}
.header{display:flex;align-items:center;gap:14px;margin-bottom:32px}
.logo{width:44px;height:44px;background:var(--accent);border-radius:10px;display:grid;place-items:center;font-size:22px}
.brand{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-.5px}
.brand span{color:var(--accent)}
.tabs{display:flex;gap:6px;margin-bottom:28px;background:var(--card);padding:6px;border-radius:12px}
.tab{flex:1;padding:10px;border:none;background:transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;border-radius:8px;transition:.2s}
.tab.active{background:var(--accent);color:#000;font-weight:700}
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:16px}
.card-title{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;margin-bottom:16px;color:var(--accent)}
.field{margin-bottom:14px}
.field label{display:block;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px}
.field input,.field select{width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);padding:10px 14px;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:15px;outline:none;transition:.2s}
.field input:focus,.field select:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(240,192,64,.12)}
.btn{display:inline-flex;align-items:center;gap:7px;padding:11px 20px;border:none;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:.2s}
.btn-primary{background:var(--accent);color:#000}
.btn-ok{background:var(--ok);color:#000}
.btn-ghost{background:transparent;border:1px solid var(--border);color:var(--text)}
.btn-sm{padding:7px 13px;font-size:12px;border-radius:7px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:540px){.grid2{grid-template-columns:1fr}}
.loan-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:18px;margin-bottom:12px;position:relative;overflow:hidden}
.loan-card::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;background:var(--accent)}
.loan-card.overdue::before{background:var(--danger)}
.loan-header{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap}
.client-name{font-family:'Syne',sans-serif;font-size:18px;font-weight:800}
.badge{font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;font-family:'DM Mono',monospace}
.badge-ok{background:rgba(64,192,128,.15);color:var(--ok);border:1px solid rgba(64,192,128,.3)}
.badge-danger{background:rgba(224,64,64,.15);color:var(--danger);border:1px solid rgba(224,64,64,.3)}
.badge-warn{background:rgba(240,192,64,.15);color:var(--accent);border:1px solid rgba(240,192,64,.3)}
.progress-bar{height:6px;background:var(--border);border-radius:3px;margin:12px 0 6px;overflow:hidden}
.progress-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--ok),var(--accent))}
.stats-row{display:flex;gap:14px;flex-wrap:wrap;margin-top:12px}
.stat{flex:1;min-width:90px}
.stat-label{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
.stat-val{font-family:'DM Mono',monospace;font-size:15px;font-weight:500}
.stat-val.red{color:var(--danger)}
.stat-val.green{color:var(--ok)}
.stat-val.yellow{color:var(--accent)}
.actions-row{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;align-items:center}
.pay-row{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--card2);border-radius:9px;margin-bottom:6px;font-size:13px}
.pay-row .pay-date{color:var(--muted);font-family:'DM Mono',monospace;font-size:11px}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:99;padding:16px;overflow-y:auto}
.voucher{background:#fff;color:#111;border-radius:16px;max-width:380px;width:100%;overflow:hidden;font-family:'DM Mono',monospace}
.voucher-header{background:#111;color:var(--accent);padding:20px 24px;text-align:center}
.voucher-logo{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;letter-spacing:-.5px}
.voucher-sub{font-size:11px;color:#888;margin-top:2px}
.voucher-body{padding:20px 24px}
.v-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #ddd;font-size:13px}
.v-row:last-child{border-bottom:none}
.v-label{color:#555;font-weight:500}
.v-val{font-weight:700;text-align:right}
.v-total{background:#111;color:var(--accent);margin:16px 0 0;border-radius:10px;padding:14px 18px;display:flex;justify-content:space-between;font-size:15px}
.voucher-footer{background:#f5f5f5;padding:14px 24px;text-align:center;font-size:11px;color:#888;border-top:2px dashed #ddd}
.no-data{text-align:center;padding:40px;color:var(--muted);font-size:14px}
.summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px}
@media(max-width:480px){.summary-grid{grid-template-columns:1fr 1fr}}
.summary-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px;text-align:center}
.summary-card .s-num{font-family:'Syne',sans-serif;font-size:22px;font-weight:800}
.summary-card .s-lbl{font-size:11px;color:var(--muted);margin-top:2px;text-transform:uppercase}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--ok);color:#000;padding:10px 22px;border-radius:30px;font-weight:700;font-size:14px;z-index:200;animation:fadeup .3s ease}
@keyframes fadeup{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
`;

export default function App() {
  const [tab, setTab]     = useState("loans");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [form, setForm]   = useState<FormState>({ client:"", phone:"", principal:"", days:"30" });
  const [voucher, setVoucher] = useState<{loan:Loan, payment:Payment}|null>(null);
  const [toast, setToast] = useState<string|null>(null);
  const [payAmt, setPayAmt] = useState<Record<number,string>>({});

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function createLoan() {
    const { client, phone, principal, days } = form;
    if (!client || !principal || !days) return showToast("Completa todos los campos");
    const p = parseInt(principal.replace(/\D/g,""),10);
    const d = parseInt(days,10);
    if (!p || !d) return showToast("Monto y plazo deben ser números");
    const { total, daily } = calcLoan(p, d);
    const loan: Loan = {
      id: uid(), client, phone,
      principal: p, total, daily, days: d,
      paid: 0, payments: [],
      createdAt: today(), createdTime: nowTime(),
    };
    setLoans(prev => [loan, ...prev]);
    setForm({ client:"", phone:"", principal:"", days:"30" });
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
    setLoans(prev => prev.map(l => l.id === loan.id ? updated : l));
    setPayAmt(prev => ({ ...prev, [loan.id]: "" }));
    setVoucher({ loan: updated, payment });
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

  const totalPrestado = loans.reduce((s,l) => s + l.principal, 0);
  const enMora        = loans.filter(l => loanStatus(l) === "mora").length;

  return (
    <>
      <style>{STYLE}</style>
      <div className="app">
        <div className="header">
          <div className="logo">💸</div>
          <div>
            <div className="brand">Presta<span>Fast</span></div>
            <div style={{fontSize:12,color:"var(--muted)"}}>Sistema de préstamos diarios</div>
          </div>
        </div>
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
            <div className="s-num" style={{color: enMora ? "var(--danger)" : "var(--ok)"}}>{enMora}</div>
            <div className="s-lbl">En mora</div>
          </div>
        </div>
        <div className="tabs">
          <button className={`tab ${tab==="loans"?"active":""}`} onClick={()=>setTab("loans")}>📋 Préstamos</button>
          <button className={`tab ${tab==="new"?"active":""}`}   onClick={()=>setTab("new")}>➕ Nuevo</button>
        </div>
        {tab === "new" && (
          <div className="card">
            <div className="card-title">Registrar nuevo préstamo</div>
            <div className="grid2">
              <div className="field">
                <label>Nombre del cliente</label>
                <input placeholder="Ej. Juan García" value={form.client}
                  onChange={e=>setForm(f=>({...f,client:e.target.value}))} />
              </div>
              <div className="field">
                <label>Teléfono</label>
                <input placeholder="300 000 0000" value={form.phone}
                  onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
              </div>
            </div>
            <div className="grid2">
              <div className="field">
                <label>Monto prestado ($)</label>
                <input placeholder="300000" value={form.principal}
                  onChange={e=>setForm(f=>({...f,principal:e.target.value}))} />
              </div>
              <div className="field">
                <label>Plazo (días)</label>
                <input type="number" min="1" value={form.days}
                  onChange={e=>setForm(f=>({...f,days:e.target.value}))} />
              </div>
            </div>
            {form.principal && form.days && (() => {
              const p = parseInt(form.principal.replace(/\D/g,""),10)||0;
              const d = parseInt(form.days,10)||1;
              if (!p) return null;
              const { total, daily } = calcLoan(p,d);
              return (
                <div style={{background:"var(--card2)",borderRadius:10,padding:"12px 16px",marginBottom:16,fontSize:13}}>
                  <span style={{color:"var(--muted)"}}>Devolución total: </span>
                  <strong style={{color:"var(--accent)"}}>$ {fmt(total)}</strong>
                  <span style={{color:"var(--muted)",marginLeft:16}}>Cuota diaria: </span>
                  <strong style={{color:"var(--ok)"}}>$ {fmt(daily)}</strong>
                </div>
              );
            })()}
            <button className="btn btn-primary" onClick={createLoan}>Crear préstamo →</button>
          </div>
        )}
        {tab === "loans" && (
          <>
            {loans.length === 0 && (
              <div className="no-data">Sin préstamos registrados.<br/>Crea uno en la pestaña ➕ Nuevo.</div>
            )}
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
                      <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{loan.phone} • Desde {loan.createdAt}</div>
                    </div>
                    <span className={`badge ${status==="pagado"?"badge-ok":status==="mora"?"badge-danger":"badge-warn"}`}>
                      {status==="pagado"?"✓ Pagado":status==="mora"?"⚠ Mora":"● Al día"}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width:`${pct}%`}} />
                  </div>
                  <div style={{fontSize:11,color:"var(--muted)",textAlign:"right"}}>{pct}% pagado</div>
                  <div className="stats-row">
                    <div className="stat"><div className="stat-label">Prestado</div><div className="stat-val">$ {fmt(loan.principal)}</div></div>
                    <div className="stat"><div className="stat-label">Total a pagar</div><div className="stat-val yellow">$ {fmt(loan.total)}</div></div>
                    <div className="stat"><div className="stat-label">Pagado</div><div className="stat-val green">$ {fmt(loan.paid)}</div></div>
                    <div className="stat"><div className="stat-label">Saldo</div><div className="stat-val red">$ {fmt(loan.total - loan.paid)}</div></div>
                    <div className="stat"><div className="stat-label">Cuota diaria</div><div className="stat-val">$ {fmt(loan.daily)}</div></div>
                    {late > 0 && <div className="stat"><div className="stat-label">Cuotas vencidas</div><div className="stat-val red">{late}</div></div>}
                    {penalty > 0 && <div className="stat"><div className="stat-label">Multa (10%)</div><div className="stat-val red">$ {fmt(penalty)}</div></div>}
                  </div>
                  {status !== "pagado" && (
                    <div className="actions-row">
                      <input
                        style={{background:"var(--card2)",border:"1px solid var(--border)",color:"var(--text)",padding:"8px 12px",borderRadius:8,fontFamily:"DM Sans,sans-serif",fontSize:14,width:160}}
                        placeholder="Monto a pagar"
                        value={payAmt[loan.id] || ""}
                        onChange={e=>setPayAmt(p=>({...p,[loan.id]:e.target.value}))}
                      />
                      <button className="btn btn-ok btn-sm" onClick={()=>registerPayment(loan)}>Registrar pago</button>
                    </div>
                  )}
                  {loan.payments.length > 0 && (
                    <div style={{marginTop:14}}>
                      <div style={{fontSize:11,color:"var(--muted)",marginBottom:7,textTransform:"uppercase",letterSpacing:".5px"}}>Historial de pagos</div>
                      {loan.payments.map((p) => (
                        <div key={p.id} className="pay-row">
                          <div>
                            <span style={{fontWeight:600}}>$ {fmt(p.amount)}</span>
                            {p.penalty > 0 && <span style={{color:"var(--danger)",fontSize:11,marginLeft:8}}>+$ {fmt(p.penalty)} multa</span>}
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div>{p.date}</div>
                            <div className="pay-date">{p.time}</div>
                            <button className="btn btn-ghost btn-sm" style={{marginTop:4,fontSize:11}} onClick={()=>setVoucher({loan, payment:p})}>
                              🧾 Ver voucher
                            </button>
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
      </div>
      {voucher && <VoucherModal data={voucher} onClose={()=>setVoucher(null)} />}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

function VoucherModal({ data, onClose }: { data: {loan:Loan, payment:Payment}, onClose: ()=>void }) {
  const { loan, payment } = data;
  const saldo = loan.total - loan.paid;
  const pct   = Math.min(100, Math.round(loan.paid / loan.total * 100));
  return (
    <div className="overlay" onClick={onClose}>
      <div onClick={(e)=>e.stopPropagation()}>
        <div className="voucher">
          <div className="voucher-header">
            <div className="voucher-logo">💸 PrestaFast</div>
            <div className="voucher-sub">Comprobante de pago</div>
          </div>
          <div className="voucher-body">
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:11,color:"#888"}}>RECIBO N° {String(payment.id).padStart(5,"0")}</div>
              <div style={{fontSize:12,color:"#444",marginTop:2}}>{payment.date} — {payment.time}</div>
            </div>
            <div className="v-row"><span className="v-label">Cliente</span><span className="v-val">{loan.client}</span></div>
            <div className="v-row"><span className="v-label">Teléfono</span><span className="v-val">{loan.phone || "—"}</span></div>
            <div className="v-row"><span className="v-label">Fecha inicio</span><span className="v-val">{loan.createdAt}</span></div>
            <div className="v-row"><span className="v-label">Capital prestado</span><span className="v-val">$ {fmt(loan.principal)}</span></div>
            <div className="v-row"><span className="v-label">Total a devolver</span><span className="v-val">$ {fmt(loan.total)}</span></div>
            <div className="v-row"><span className="v-label">Cuota diaria</span><span className="v-val">$ {fmt(loan.daily)}</span></div>
            <div className="v-row"><span className="v-label">Cuotas vencidas</span>
              <span className="v-val" style={{color: payment.lateCount>=4?"#e04040":"#111"}}>{payment.lateCount}</span>
            </div>
            {payment.penalty > 0 && (
              <div className="v-row"><span className="v-label">Multa (10%)</span><span className="v-val" style={{color:"#e04040"}}>$ {fmt(payment.penalty)}</span></div>
            )}
            <div className="v-row"><span className="v-label">Pago registrado</span><span className="v-val" style={{color:"#40c080",fontWeight:800}}>$ {fmt(payment.amount)}</span></div>
            <div className="v-row"><span className="v-label">Total pagado</span><span className="v-val">$ {fmt(loan.paid)}</span></div>
            <div className="v-total">
              <span>Saldo pendiente</span>
              <span style={{fontWeight:800}}>$ {fmt(saldo)}</span>
            </div>
            <div style={{marginTop:14}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#888",marginBottom:5}}>
                <span>Progreso del préstamo</span><span>{pct}%</span>
              </div>
              <div style={{height:8,background:"#eee",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#40c080,#f0c040)",borderRadius:4}} />
              </div>
            </div>
          </div>
          <div className="voucher-footer">
            <div>Este comprobante es válido como constancia de pago.</div>
            <div style={{marginTop:4}}>PrestaFast • {today()}</div>
          </div>
          <div style={{display:"flex",gap:10,padding:"14px 20px",background:"#f5f5f5",borderTop:"1px solid #e0e0e0"}}>
            <button onClick={onClose}
              style={{flex:1,padding:"12px",background:"#222",color:"#fff",border:"none",borderRadius:10,fontFamily:"DM Sans,sans-serif",fontWeight:700,fontSize:15,cursor:"pointer"}}>
              ← Volver
            </button>
            <button onClick={()=>window.print()}
              style={{flex:1,padding:"12px",background:"#f0c040",color:"#000",border:"none",borderRadius:10,fontFamily:"DM Sans,sans-serif",fontWeight:700,fontSize:15,cursor:"pointer"}}>
              🖨 Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
