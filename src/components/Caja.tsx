import React, { useState } from 'react';
import { 
  FinancialAppDB,
  CashSession,
  CashTransaction 
} from '../types';
import { addAuditLog } from '../data';
import { 
  Briefcase, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Lock, 
  Unlock, 
  DollarSign, 
  Calendar, 
  PlusCircle, 
  MinusCircle, 
  Info,
  CheckCircle,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';

interface CajaProps {
  db: FinancialAppDB;
  onUpdateDb: (newDb: FinancialAppDB) => void;
}

export default function Caja({ db, onUpdateDb }: CajaProps) {
  // Session activa
  const activeSession = db.cashSessions.find(s => s.estado === 'Abierta');

  // Formulario Apertura
  const [fondoInicial, setFondoInicial] = useState(50000); // RD$50k base standard

  // Formulario Transacción Manual (Ingreso / Egreso)
  const [tipoTx, setTipoTx] = useState<'Ingreso' | 'Egreso'>('Egreso');
  const [montoTx, setMontoTx] = useState(0);
  const [descTx, setDescTx] = useState('');

  // Formulario Cuadre Cierre
  const [efectivoContado, setEfectivoContado] = useState(0);
  const [notaCierre, setNotaCierre] = useState('');
  const [viewCerrar, setViewCerrar] = useState(false);

  // Formateador DOP
  const formatRD = (value: number) => {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(value);
  };

  // Acción: Abrir Caja
  const handleOpenCash = (e: React.FormEvent) => {
    e.preventDefault();
    if (fondoInicial < 0) return;

    const newSession: CashSession = {
      id: 'CJ-' + new Date().toISOString().split('T')[0] + '-' + Math.floor(Math.random() * 90 + 10),
      fechaApertura: new Date().toISOString(),
      montoInicial: fondoInicial,
      ingresos: 0,
      egresos: 0,
      montoEsperado: fondoInicial,
      estado: 'Abierta',
      usuarioId: db.currentUser.id,
      usuarioNombre: db.currentUser.name,
      transacciones: []
    };

    let updatedDb = {
      ...db,
      cashSessions: [newSession, ...db.cashSessions]
    };

    updatedDb = addAuditLog(
      updatedDb,
      'Caja',
      'Apertura de Caja',
      `Se aperturó la caja con un fondo inicial de ${formatRD(fondoInicial)}`
    );

    onUpdateDb(updatedDb);
  };

  // Acción: Agregar Transacción Manual (Voucher egreso / otro ingreso)
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || montoTx <= 0 || !descTx) return;

    const newTx: CashTransaction = {
      id: 'TX-' + Date.now(),
      tipo: tipoTx,
      monto: montoTx,
      descripcion: descTx,
      fecha: new Date().toISOString(),
      usuarioId: db.currentUser.id,
      usuarioNombre: db.currentUser.name
    };

    const updatedSessions = db.cashSessions.map(sess => {
      if (sess.id === activeSession.id) {
        const nuevosIngresos = tipoTx === 'Ingreso' ? sess.ingresos + montoTx : sess.ingresos;
        const nuevosEgresos = tipoTx === 'Egreso' ? sess.egresos + montoTx : sess.egresos;
        const nuevoEsperado = sess.montoInicial + nuevosIngresos - nuevosEgresos;

        return {
          ...sess,
          ingresos: nuevosIngresos,
          egresos: nuevosEgresos,
          montoEsperado: nuevoEsperado,
          transacciones: [newTx, ...sess.transacciones]
        };
      }
      return sess;
    });

    let updatedDb = {
      ...db,
      cashSessions: updatedSessions
    };

    updatedDb = addAuditLog(
      updatedDb,
      'Caja',
      tipoTx === 'Ingreso' ? 'Otro Ingreso Caja' : 'Egreso Caja de Seguridad',
      `Se registró ${tipoTx.toLowerCase()} de RD$ ${montoTx.toFixed(2)}: ${descTx}`
    );

    onUpdateDb(updatedDb);
    setMontoTx(0);
    setDescTx('');
  };

  // Acción: Cerrar Caja y Ejecutar Cuadre Diario
  const handleCloseCash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    const esperado = activeSession.montoEsperado;
    const diferencia = efectivoContado - esperado;
    let descDiferencia = 'Cuadre perfecto.';
    if (diferencia < 0) {
      descDiferencia = `Faltante de ${formatRD(Math.abs(diferencia))}`;
    } else if (diferencia > 0) {
      descDiferencia = `Sobrante de ${formatRD(diferencia)}`;
    }

    const updatedSessions = db.cashSessions.map(sess => {
      if (sess.id === activeSession.id) {
        return {
          ...sess,
          fechaCierre: new Date().toISOString(),
          montoReal: efectivoContado,
          estado: 'Cerrada' as const,
          comentarios: notaCierre || `Cierre efectuado por ${db.currentUser.name}`
        };
      }
      return sess;
    });

    let updatedDb = {
      ...db,
      cashSessions: updatedSessions
    };

    updatedDb = addAuditLog(
      updatedDb,
      'Caja',
      'Cierre de Caja',
      `Cierre y Arqueo de Caja ID ${activeSession.id}. Esperado: ${formatRD(esperado)} - Contado: ${formatRD(efectivoContado)}. Resultado: ${descDiferencia}`
    );

    onUpdateDb(updatedDb);
    setViewCerrar(false);
    setEfectivoContado(0);
    setNotaCierre('');
  };

  return (
    <div className="space-y-6 animate-fade-in" id="caja-module-container">
      {/* Cabecera Caja */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Caja Chica y Arqueo Diario</h1>
          <p className="text-xs text-slate-500">Apertura de fondos de garantía, gastos fijos de cobrador del día, ingresos locales y conciliaciones de cierre.</p>
        </div>
        <div>
          {activeSession ? (
            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 px-3 py-1.5 rounded-lg">
              <Unlock className="h-4 w-4" />
              <span>CAJA ABIERTA</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 px-3 py-1.5 rounded-lg">
              <Lock className="h-4 w-4" />
              <span>CAJA CERRADA</span>
            </span>
          )}
        </div>
      </div>

      {!activeSession ? (
        /* Caso: Caja Cerrada -> Solicitar Apertura */
        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="max-w-md mx-auto bg-white border border-slate-100 rounded-3xl p-6 shadow-md space-y-6" 
          id="cash-opener-panel"
        >
          <div className="text-center space-y-2">
            <div className="bg-slate-50 text-slate-900 w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border border-slate-100">
              <Briefcase className="h-6 w-6" />
            </div>
            <h2 className="text-md font-bold text-slate-900">Apertura del Fondo de Caja</h2>
            <p className="text-xs text-slate-500">Es necesario constituir el saldo de fondo base del día para realizar operaciones y dar tracción a los cobros corrientes.</p>
          </div>

          <form onSubmit={handleOpenCash} className="space-y-4 text-xs font-sans">
            <div>
              <label className="block text-slate-550 font-bold uppercase tracking-wider mb-2 text-[10px]">Fondo Base Principal (RD$)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">RD$</span>
                <input 
                  type="number" required min="0" value={fondoInicial} onChange={e => setFondoInicial(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 pl-11 pr-3 py-2 text-xs font-mono font-bold text-slate-900 rounded-xl focus:outline-none"
                  placeholder="Ej. RD$ 15,000"
                />
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-gradient-to-r from-slate-900 to-indigo-950 text-white font-bold p-2.5 rounded-xl text-xs cursor-pointer text-center transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <Unlock className="h-4 w-4" />
              <span>Iniciar Operaciones del Día</span>
            </motion.button>
          </form>
        </motion.div>
      ) : (
        /* Caso: Caja Abierta -> Panel Operativo de Caja */
        <motion.div 
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-6" 
          id="active-cash-panel"
        >
          {/* Tarjetas de Saldos */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Fondo Apertura</span>
              <p className="text-md font-extrabold text-slate-900 font-mono mt-2">{formatRD(activeSession.montoInicial)}</p>
              <p className="text-[9px] text-slate-400 mt-1">Cajero: {activeSession.usuarioNombre}</p>
            </div>

            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block flex items-center gap-1">
                <ArrowUpRight className="h-4 w-4" />
                Ingresos Recibidos
              </span>
              <p className="text-md font-extrabold text-emerald-600 font-mono mt-2">+{formatRD(activeSession.ingresos)}</p>
              <p className="text-[9px] text-slate-400 mt-1">Soporte cobranza diaria</p>
            </div>

            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest block flex items-center gap-1">
                <ArrowDownLeft className="h-4 w-4" />
                Egresos de Oficina
              </span>
              <p className="text-md font-extrabold text-rose-600 font-mono mt-2">-{formatRD(activeSession.egresos)}</p>
              <p className="text-[9px] text-slate-400 mt-1">Vales y autorizaciones</p>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-350 uppercase tracking-widest block font-sans">Saldo Contable Esperado</span>
              <p className="text-md font-extrabold text-emerald-400 font-mono mt-2">{formatRD(activeSession.montoEsperado)}</p>
              <p className="text-[9px] text-slate-300 mt-1 font-sans">Efectivo total teórico</p>
            </div>
          </div>

          {/* Dos columnas de trabajo: Transacciones a la izquierda (2 cols), Arqueo/Cierre y Vales a la derecha */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Libro diario de caja izquierda */}
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4" id="ledger-panel">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-3">
                <FileText className="h-4 w-4 text-slate-600" />
                Diario Auxiliar de Caja
              </h3>

              <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto pr-2" id="ledger-scroll">
                {activeSession.transacciones.map(tx => (
                  <div key={tx.id} className="py-3 flex justify-between items-center text-xs hover:bg-slate-50 px-2 rounded-xl">
                    <div className="flex gap-3 items-center">
                      <div className={`p-2 rounded-xl font-bold flex items-center justify-center ${
                        tx.tipo === 'Ingreso' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}>
                        {tx.tipo === 'Ingreso' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{tx.descripcion}</p>
                        <p className="text-[10px] text-slate-400 font-semibold font-mono">
                          {new Date(tx.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Registró: {tx.usuarioNombre}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-bold ${tx.tipo === 'Ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.tipo === 'Ingreso' ? '+' : '-'}{formatRD(tx.monto)}
                      </p>
                    </div>
                  </div>
                ))}
                {activeSession.transacciones.length === 0 && (
                  <div className="text-center py-12 text-xs text-slate-400">
                    Ninguna transacción contable registrada el día de hoy.
                  </div>
                )}
              </div>
            </div>

            {/* Vales manuales y Cierre a la derecha (1 col) */}
            <div className="space-y-6">
              {/* Formulario Vales */}
              <form onSubmit={handleAddTransaction} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Crear Movimiento Directo</h4>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button 
                    type="button" onClick={() => setTipoTx('Ingreso')}
                    className={`p-2 rounded-xl border font-bold text-center ${
                      tipoTx === 'Ingreso' 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Ingreso Extra
                  </button>
                  <button 
                    type="button" onClick={() => setTipoTx('Egreso')}
                    className={`p-2 rounded-xl border font-bold text-center ${
                      tipoTx === 'Egreso' 
                        ? 'border-rose-500 bg-rose-50 text-rose-700' 
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Egreso / Vale
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Monto (RD$)*</label>
                    <input 
                      type="number" required value={montoTx || ''} onChange={e => setMontoTx(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-250 p-2 rounded-xl font-mono"
                      placeholder="RD$0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Concepto / Justificación *</label>
                    <input 
                      type="text" required value={descTx} onChange={e => setDescTx(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-250 p-2 rounded-xl"
                      placeholder="Ej. Pago de mensajero, papelería"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-2 text-xs rounded-xl cursor-pointer"
                  >
                    Ingresar Transacción
                  </button>
                </div>
              </form>

              {/* Botón / Drawer Cierre */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Cierre y Arqueo Físico</h4>
                
                {!viewCerrar ? (
                  <button 
                    onClick={() => {
                      setViewCerrar(true);
                      setEfectivoContado(activeSession.montoEsperado); // prefill with target
                    }}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Lock className="h-4 w-4" />
                    <span>Realizar Cuadre Diario</span>
                  </button>
                ) : (
                  <form onSubmit={handleCloseCash} className="space-y-4 text-xs font-sans">
                    <div className="space-y-3">
                      <div className="bg-rose-50/50 p-3 rounded-xl text-slate-700 text-[11px] leading-relaxed">
                        <p><strong>Compare el saldo real:</strong> Cuente el dinero físico depositado en el cajón de manera precisa antes de comprometer el cuadre.</p>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Efectivo Físico Arqueado (RD$)*</label>
                        <input 
                          type="number" required value={efectivoContado || ''} onChange={e => setEfectivoContado(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl font-mono text-slate-950 font-bold"
                        />
                      </div>

                      {/* Mostrar diferencia en vivo */}
                      {efectivoContado > 0 && (
                        <div className={`p-3 rounded-xl font-bold font-mono text-[11px] flex justify-between ${
                          efectivoContado === activeSession.montoEsperado 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                            : efectivoContado > activeSession.montoEsperado
                            ? 'bg-blue-50 text-blue-800 border border-blue-100'
                            : 'bg-rose-50 text-rose-800 border border-rose-100'
                        }`}>
                          <span>Diferencia de Cuadre:</span>
                          <span>{efectivoContado - activeSession.montoEsperado === 0 ? 'Sin novedad (RD$ 0)' : formatRD(efectivoContado - activeSession.montoEsperado)}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Observaciones del Arqueo</label>
                        <input 
                          type="text" value={notaCierre} onChange={e => setNotaCierre(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl"
                          placeholder="Arqueo ok, fondo resguardado..."
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        type="button" onClick={() => setViewCerrar(false)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold p-2 rounded-lg"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold p-2 rounded-lg transition-colors"
                      >
                        Efectuar Cierre
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
