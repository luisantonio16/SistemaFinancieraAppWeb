import React, { useState } from 'react';
import { 
  FinancialAppDB, 
  Contract, 
  Payment,
  CashSession
} from '../types';
import { addAuditLog } from '../data';
import { 
  DollarSign, 
  Search, 
  CheckCircle, 
  Printer, 
  Plus, 
  User, 
  Clock, 
  Calculator, 
  AlertTriangle,
  X,
  CreditCard,
  Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const listContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02
    }
  }
};

const listItemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

interface CobrosProps {
  db: FinancialAppDB;
  onUpdateDb: (newDb: FinancialAppDB) => void;
  onSetTab?: (tab: string) => void;
}

export default function Cobros({ db, onUpdateDb, onSetTab }: CobrosProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCollecting, setIsCollecting] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  // Formulario cobro
  const [selectedContractId, setSelectedContractId] = useState('');
  const [tipoPago, setTipoPago] = useState<'Cuota' | 'Abono Extraordinario'>('Cuota');
  const [montoIngresado, setMontoIngresado] = useState(0);
  const [metodoPago, setMetodoPago] = useState<'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Cheque'>('Efectivo');
  const [comentario, setComentario] = useState('');

  // Formateador de Pesos (DOP)
  const formatRD = (value: number) => {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(value);
  };

  const selectedContract = db.contracts.find(c => c.id === selectedContractId);

  // Obtener la siguiente cuota vencida o pendiente del contrato
  const getNextPendingInstallment = (contract: Contract) => {
    return contract.tablaAmortizacion.find(i => i.estado === 'Pendiente' || i.estado === 'Atrasado' || i.estado === 'Parcial');
  };

  // Calcular la mora sugerida (si tiene atrasos)
  const nextInstallment = selectedContract ? getNextPendingInstallment(selectedContract) : null;
  const esAtrasada = nextInstallment 
    ? (nextInstallment.estado === 'Atrasado' || new Date(nextInstallment.fechaVencimiento) < new Date())
    : false;
  const moraCalculadaSugerida = esAtrasada ? 1500 : 0; // recargo fijo RD$1500 si vence antes de hoy

  // Autofill monto ingresado para cuotas
  React.useEffect(() => {
    if (nextInstallment && tipoPago === 'Cuota') {
      const mora = esAtrasada ? 1500 : 0;
      setMontoIngresado(nextInstallment.pendiente + mora);
    } else if (tipoPago === 'Abono Extraordinario') {
      setMontoIngresado(0);
    }
  }, [selectedContractId, tipoPago, nextInstallment, esAtrasada]);

  // Filtrado de Pagos ya realizados en el histórico
  const filteredPayments = db.payments.filter(p => 
    p.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.contratoId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reciboNumero.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Procesar cobro
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractId || montoIngresado <= 0) {
      alert("Por favor seleccione un contrato e introduzca un importe válido.");
      return;
    }

    const contract = db.contracts.find(c => c.id === selectedContractId);
    if (!contract) return;

    // Verificar si hay caja abierta
    const cajaAbierta = db.cashSessions.find(s => s.estado === 'Abierta');
    if (!cajaAbierta) {
      alert("ERROR: La caja está Cerrada. Por favor abra la caja en el módulo 'Caja' antes de registrar cobros.");
      if (onSetTab) onSetTab('caja');
      return;
    }

    // Clasificación de montos recibidos
    let interesPagado = 0;
    let moraPagado = 0;
    let abonoCapital = 0;
    
    // 1. Clonar el contrato para actualizarlo
    const updatedContracts = db.contracts.map(c => {
      if (c.id === contract.id) {
        let saldoRestanteDePago = montoIngresado;
        const nuevaTabla = c.tablaAmortizacion.map(inst => {
          if (saldoRestanteDePago <= 0) return inst;
          
          // Si es cuota pendiente o parcial
          if (inst.estado === 'Pendiente' || inst.estado === 'Atrasado' || inst.estado === 'Parcial') {
            const esMoraAplica = inst.estado === 'Atrasado' || new Date(inst.fechaVencimiento) < new Date();
            const moraDeInst = esMoraAplica ? 1500 : 0;
            
            moraPagado += moraDeInst;
            saldoRestanteDePago = Math.max(0, saldoRestanteDePago - moraDeInst);
            
            const cobroEfectivoInst = Math.min(inst.pendiente, saldoRestanteDePago);
            
            // Repartir en intereses primero, y luego en capital
            const interesPendienteInst = Math.max(0, inst.montoInteres - (inst.montoPagado - inst.montoCapital));
            const interesAbonado = Math.min(interesPendienteInst, cobroEfectivoInst);
            const capitalAbonado = Math.max(0, cobroEfectivoInst - interesAbonado);
            
            interesPagado += interesAbonado;
            abonoCapital += capitalAbonado;
            
            saldoRestanteDePago = Math.max(0, saldoRestanteDePago - cobroEfectivoInst);
            
            const totalPagadoNuevo = inst.montoPagado + cobroEfectivoInst;
            const pendienteNuevo = Math.max(0, inst.pendiente - cobroEfectivoInst);
            const estadoNuevo = pendienteNuevo <= 0 ? 'Pagado' as const : 'Parcial' as const;
            
            return {
              ...inst,
              montoPagado: totalPagadoNuevo,
              pendiente: pendienteNuevo,
              montoMora: esMoraAplica ? moraDeInst : 0,
              estado: estadoNuevo
            };
          }
          return inst;
        });

        // Abono extraordinario que sobra va a capital directo
        if (tipoPago === 'Abono Extraordinario' || saldoRestanteDePago > 0) {
          abonoCapital += saldoRestanteDePago;
        }

        const nuevoSaldo = Math.max(0, c.saldoPendiente - abonoCapital);
        const nuevoEstado = nuevoSaldo <= 0 ? 'Saldado' as const : c.estado;

        return {
          ...c,
          saldoPendiente: nuevoSaldo,
          estado: nuevoEstado,
          tablaAmortizacion: nuevaTabla
        };
      }
      return c;
    });

    // 2. Crear transacción de pago
    const receiptNum = 'RC-2026-' + Math.floor(Math.random() * 9000 + 1000);
    const paymentId = 'PAG-' + Math.floor(Math.random() * 90000 + 10000);
    const newPayment: Payment = {
      id: paymentId,
      contratoId: contract.id,
      clienteNombre: contract.clienteNombre,
      montoPagado: montoIngresado,
      abonoCapital,
      interesPagado,
      moraPagado,
      fecha: new Date().toISOString().split('T')[0],
      tipo: tipoPago === 'Abono Extraordinario' ? 'Abono Extraordinario' : 'Cuota',
      reciboNumero: receiptNum,
      metodoPago,
      usuarioNombre: db.currentUser.name,
      comentario: comentario || `${tipoPago} contrato ${contract.id}`
    };

    // 3. Registrar el cobro en la Caja Abierta
    const updatedCashSessions = db.cashSessions.map(sess => {
      if (sess.id === cajaAbierta.id) {
        const transaccionNueva = {
          id: 'TX-' + Date.now(),
          tipo: 'Ingreso' as const,
          monto: montoIngresado,
          descripcion: `Cobro Recibo ${receiptNum} de ${contract.clienteNombre} (${contract.id})`,
          fecha: new Date().toISOString(),
          usuarioId: db.currentUser.id,
          usuarioNombre: db.currentUser.name
        };
        return {
          ...sess,
          ingresos: sess.ingresos + montoIngresado,
          montoEsperado: sess.montoEsperado + montoIngresado,
          transacciones: [transaccionNueva, ...sess.transacciones]
        };
      }
      return sess;
    });

    let updatedDb = {
      ...db,
      contracts: updatedContracts,
      payments: [newPayment, ...db.payments],
      cashSessions: updatedCashSessions
    };

    updatedDb = addAuditLog(
      updatedDb,
      'Pagos',
      'Cobro Registrado',
      `Se registró recibo ${receiptNum} por RD$ ${montoIngresado.toFixed(2)} del cliente ${contract.clienteNombre}`
    );

    onUpdateDb(updatedDb);
    setIsCollecting(false);
    setSelectedReceipt(newPayment); // Lanzar modal de recibo instantáneamente

    // Resetear
    setSelectedContractId('');
    setComentario('');
  };

  return (
    <div className="space-y-6 animate-fade-in" id="cobros-payments-panel">
      {/* Cabecera Pagos */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cobros y Caja Recaudadora</h1>
          <p className="text-xs text-slate-500">Registro oficial de pagos de cuotas, abonos a capital y penalizaciones por mora.</p>
        </div>
        {!isCollecting && (
          <button 
            onClick={() => setIsCollecting(true)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Registrar Pago</span>
          </button>
        )}
      </div>

      {isCollecting ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-6" id="collecting-payment-panel">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-md font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              Recaudación de Pago
            </h2>
            <button 
              onClick={() => setIsCollecting(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleProcessPayment} className="space-y-6 text-xs">
            {/* Contrato Selección */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Seleccionar Contrato Activo *</label>
                <select 
                  required value={selectedContractId} onChange={e => setSelectedContractId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="">Seleccione un Contrato/Préstamo</option>
                  {db.contracts.filter(c => c.estado === 'Activo' || c.estado === 'En Mora').map(c => (
                    <option key={c.id} value={c.id}>
                      {c.id} - {c.clienteNombre} (Bal: {formatRD(c.saldoPendiente)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tipo de Movimiento Financiero *</label>
                <select 
                  value={tipoPago} onChange={e => setTipoPago(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="Cuota">Pago de Cuota Regular (Aplica Interés + Capital)</option>
                  <option value="Abono Extraordinario">Abono Extraordinario Directo a Capital</option>
                </select>
              </div>
            </div>

            {/* Ficha técnica de la amortización a saldar */}
            {selectedContract && nextInstallment && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4" id="installment-fact-box">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9px] block">Próxima Cuota</span>
                  <p className="font-bold text-slate-800 text-xs mt-1">Cuota #{nextInstallment.numero}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Vence: {nextInstallment.fechaVencimiento}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9px] block">Importe de la Cuota</span>
                  <p className="font-bold text-slate-800 text-xs mt-1">{formatRD(nextInstallment.montoCuota)}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Pendiente: {formatRD(nextInstallment.pendiente)}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9px] block">Mora / Recargos</span>
                  <p className="font-bold text-rose-600 text-xs mt-1 flex items-center gap-1">
                    {moraCalculadaSugerida > 0 ? (
                      <>
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                        <span>{formatRD(moraCalculadaSugerida)} (Vencida)</span>
                      </>
                    ) : (
                      <span>RD$0.00 (Al Día)</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Importe y Método */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Monto de Pago Recibido (RD$)*</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold font-mono text-slate-400">RD$</span>
                  <input 
                    type="number" required value={montoIngresado} onChange={e => setMontoIngresado(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Canal de Pago / Método *</label>
                <select 
                  value={metodoPago} onChange={e => setMetodoPago(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="Efectivo">Efectivo (Entra a Caja Física)</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Tarjeta">Tarjeta Débito/Crédito</option>
                  <option value="Cheque">Cheque Certificado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Comentarios de Transacción</label>
                <input 
                  type="text" value={comentario} onChange={e => setComentario(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  placeholder="Ej. Pago cuota mayo Carlos Tejeda"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
              <button 
                type="button" onClick={() => setIsCollecting(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Procesar e Imprimir Recibo
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Listado de histórico */
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-bold text-slate-900 text-sm">Historial de Cobros Recibidos</h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por recibo o cliente..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-50 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">No. Recibo</th>
                  <th className="p-3">Ref. Contrato</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Fecha Pago</th>
                  <th className="p-3">Monto Cobrado</th>
                  <th className="p-3">Reparto Capital</th>
                  <th className="p-3">Recargo Mora</th>
                  <th className="p-3">Canal</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <motion.tbody 
                variants={listContainerVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-slate-50 font-mono"
              >
                {filteredPayments.map(p => (
                  <motion.tr 
                    key={p.id} 
                    variants={listItemVariants}
                    whileHover={{ backgroundColor: "rgba(248, 250, 252, 0.8)", scale: 1.002 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-3 font-bold text-slate-900">{p.reciboNumero}</td>
                    <td className="p-3 font-bold text-indigo-950">{p.contratoId}</td>
                    <td className="p-3 font-sans text-slate-705 font-semibold text-[11px]">{p.clienteNombre}</td>
                    <td className="p-3 text-slate-500">{p.fecha}</td>
                    <td className="p-3 text-slate-950 font-black">{formatRD(p.montoPagado)}</td>
                    <td className="p-3 text-emerald-600 font-bold">{formatRD(p.abonoCapital)}</td>
                    <td className="p-3 text-rose-500 font-bold">{p.moraPagado > 0 ? formatRD(p.moraPagado) : 'RD$0'}</td>
                    <td className="p-3 font-sans">
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-bold uppercase border border-indigo-100">
                        {p.metodoPago}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => setSelectedReceipt(p)}
                        className="text-[11px] font-sans font-bold text-slate-900 hover:text-indigo-650 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Imprimir</span>
                      </button>
                    </td>
                  </motion.tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center text-slate-400 py-12 italic text-xs">No se han registrado pagos en esta sesión.</td>
                  </tr>
                )}
              </motion.tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL / FACTURA RECIBO IMPRIMIBLE */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative space-y-4 animate-fade-in" id="receipt-modal">
            {/* Botón cerrar */}
            <button 
              onClick={() => setSelectedReceipt(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Recibo Formato Físico */}
            <div className="border border-slate-200 bg-slate-50 rounded-2xl p-5 text-slate-950 text-xs space-y-4 font-mono select-none" id="receipt-print-area">
              <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-1">
                <h3 className="font-bold text-sm uppercase tracking-wide">Recaudadora AutoFinanzas RD</h3>
                <p className="text-[10px] text-slate-500">RNC: 1-31-01934-2 • Santo Domingo, RD</p>
                <p className="text-[9px] text-slate-400">Teléfono: 809-567-2291</p>
              </div>

              <div className="space-y-1 text-[10px] border-b border-dashed border-slate-300 pb-3">
                <p className="flex justify-between"><span><strong>RECIBO DE COBRO:</strong></span> <span className="font-bold">{selectedReceipt.reciboNumero}</span></p>
                <p className="flex justify-between"><span>FECHA EMISIÓN:</span> <span>{selectedReceipt.fecha}</span></p>
                <p className="flex justify-between"><span>REF. CONTRATO:</span> <span>{selectedReceipt.contratoId}</span></p>
                <p className="flex justify-between"><span>CAJERO:</span> <span>{selectedReceipt.usuarioNombre}</span></p>
              </div>

              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 font-sans">
                <span className="text-[8px] uppercase text-slate-450 font-bold font-mono">Cliente del Financiamiento:</span>
                <p className="font-bold text-slate-800 text-[11px] font-sans leading-tight">{selectedReceipt.clienteNombre}</p>
                <p className="text-[10px] font-mono text-slate-500">Método de Cobro: {selectedReceipt.metodoPago}</p>
              </div>

              <div className="space-y-1 font-mono text-[11px] border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between">
                  <span>Abono Capital:</span>
                  <span>{formatRD(selectedReceipt.abonoCapital)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Intereses Cobrados:</span>
                  <span>{formatRD(selectedReceipt.interesPagado)}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Recargos por Mora:</span>
                  <span>{formatRD(selectedReceipt.moraPagado)}</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-xs uppercase pt-1">
                <span>Total Recibido:</span>
                <span className="text-emerald-700">{formatRD(selectedReceipt.montoPagado)}</span>
              </div>

              {selectedReceipt.comentario && (
                <div className="bg-white p-2 border border-slate-200 rounded text-[10px] italic font-sans text-slate-500">
                  Comentario: {selectedReceipt.comentario}
                </div>
              )}

              <div className="text-center pt-3 text-[9px] text-slate-400">
                <p>*** Gracias por su pago puntual ***</p>
                <p>Conserve este recibo como soporte legal.</p>
              </div>
            </div>

            <button 
              onClick={() => {
                window.print();
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold p-2.5 rounded-xl text-xs cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir Copia Física</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
