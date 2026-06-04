import React, { useState } from 'react';
import { 
  FinancialAppDB,
  Contract,
  AmortizationInstallment 
} from '../types';
import { addAuditLog } from '../data';
import { 
  AlertTriangle, 
  Search, 
  MessageSquare, 
  PhoneCall, 
  Mail, 
  CheckCircle,
  Clock, 
  Calendar,
  PlusCircle,
  X,
  FileSpreadsheet
} from 'lucide-react';

interface CuentasCobrarProps {
  db: FinancialAppDB;
  onUpdateDb: (newDb: FinancialAppDB) => void;
}

// Interfaz para el registro local de seguimientos
interface FollowupCall {
  id: string;
  contratoId: string;
  clienteNombre: string;
  fecha: string;
  comentario: string;
  gestor: string;
  canal: 'Llamada' | 'WhatsApp' | 'Visita' | 'Email';
}

export default function CuentasCobrar({ db, onUpdateDb }: CuentasCobrarProps) {
  const [activeTab, setActiveTab] = useState<'vencidas' | 'pendientes'>('vencidas');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Alertas / Notificaciones simulation details
  const [selectedAlertInstallment, setSelectedAlertInstallment] = useState<{ contract: Contract, inst: AmortizationInstallment } | null>(null);
  const [alertType, setAlertType] = useState<'WhatsApp' | 'SMS' | 'Email'>('WhatsApp');
  const [toastMessage, setToastMessage] = useState('');

  // Seguimiento de Cobranza form state
  const [selectedContractId, setSelectedContractId] = useState('');
  const [canalFollow, setCanalFollow] = useState<'Llamada' | 'WhatsApp' | 'Visita' | 'Email'>('Llamada');
  const [comentarioFollow, setComentarioFollow] = useState('');

  // Historial interno de seguimiento de Cobranza (guardado en LocalStorage)
  const [followups, setFollowups] = useState<FollowupCall[]>(() => {
    const raw = localStorage.getItem('autofinanzas_rd_followups');
    if (raw) return JSON.parse(raw);
    return [
      {
        id: 'FL-001',
        contratoId: 'CON-003',
        clienteNombre: 'Carlos Manuel Tejeda Santana',
        fecha: '2026-06-03 14:22',
        comentario: 'Se llamó al cliente. Indicó que tuvo inconvenientes con su nómina pero pasará el fin de semana a ponerse al día.',
        gestor: 'Franklin Ortiz',
        canal: 'Llamada'
      }
    ];
  });

  const saveFollowups = (list: FollowupCall[]) => {
    setFollowups(list);
    localStorage.setItem('autofinanzas_rd_followups', JSON.stringify(list));
  };

  const formatRD = (value: number) => {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(value);
  };

  // Recopilar cuotas desglosadas de todos los contratos activos
  const todasLasCuotas: { contract: Contract; inst: AmortizationInstallment; esVencida: boolean }[] = [];

  db.contracts.forEach(c => {
    if (c.estado === 'Activo' || c.estado === 'En Mora') {
      c.tablaAmortizacion.forEach(inst => {
        if (inst.estado === 'Pendiente' || inst.estado === 'Atrasado' || inst.estado === 'Parcial') {
          // Es vencida si el estado es Atrasado o si vence en fecha anterior a hoy
          const esVencida = inst.estado === 'Atrasado' || new Date(inst.fechaVencimiento) < new Date();
          todasLasCuotas.push({
            contract: c,
            inst,
            esVencida
          });
        }
      });
    }
  });

  // Filtrar cuotas según el tab activo
  const filteredCuotas = todasLasCuotas.filter(item => {
    const MatchesTab = activeTab === 'vencidas' ? item.esVencida : !item.esVencida;
    const MatchesSearch = item.contract.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.contract.id.toLowerCase().includes(searchTerm.toLowerCase());
    return MatchesTab && MatchesSearch;
  });

  // Disparar Alerta Simulada
  const handleTriggerMockAlert = () => {
    if (!selectedAlertInstallment) return;
    const { contract, inst } = selectedAlertInstallment;

    // Registrar Alerta en la bitácora de auditoría
    let updatedDb = addAuditLog(
      db,
      'Seguridad',
      'Notificación de Cobros',
      `Alerta de cobro enviada a ${contract.clienteNombre} (${contract.id}) vía ${alertType} por saldo de ${formatRD(inst.pendiente)}`
    );

    // Agregar nota automática al seguimiento de cobranza
    const newFollow: FollowupCall = {
      id: 'FL-' + Date.now(),
      contratoId: contract.id,
      clienteNombre: contract.clienteNombre,
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
      comentario: `ALERTA AUTOMÁTICA ENVIADA (${alertType}): Notificación de recordatorio de pago enviada por la cuota #${inst.numero} con vencimiento del ${inst.fechaVencimiento}.`,
      gestor: db.currentUser.name,
      canal: alertType
    };

    saveFollowups([newFollow, ...followups]);
    onUpdateDb(updatedDb);

    setToastMessage(`¡Felicidades! Notificación de Cobro enviada con éxito a ${contract.clienteNombre} vía ${alertType}.`);
    setSelectedAlertInstallment(null);

    setTimeout(() => {
      setToastMessage('');
    }, 4500);
  };

  // Guardar Seguimiento Manual
  const handleAddFollowup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractId || !comentarioFollow) {
      alert("Por favor seleccione un contrato y registre su nota de cobranza.");
      return;
    }

    const contr = db.contracts.find(c => c.id === selectedContractId);
    if (!contr) return;

    const newFollow: FollowupCall = {
      id: 'FL-' + Date.now(),
      contratoId: contr.id,
      clienteNombre: contr.clienteNombre,
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
      comentario: comentarioFollow,
      gestor: db.currentUser.name,
      canal: canalFollow
    };

    const updatedFollows = [newFollow, ...followups];
    saveFollowups(updatedFollows);

    let updatedDb = addAuditLog(
      db,
      'Clientes',
      'Seguimiento Cobranza',
      `Se registró nota de seguimiento por ${canalFollow} para el cliente ${contr.clienteNombre} (${contr.id})`
    );
    onUpdateDb(updatedDb);

    setComentarioFollow('');
    setSelectedContractId('');
    
    // Toast de confirmación
    setToastMessage("Seguimiento de cobranza guardado correctamente.");
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // Plantilla de SMS / WhatsApp / Email
  const getSimulatedMessageText = () => {
    if (!selectedAlertInstallment) return '';
    const { contract, inst } = selectedAlertInstallment;
    const diasAtraso = Math.floor((new Date().getTime() - new Date(inst.fechaVencimiento).getTime()) / (1000 * 3600 * 24));
    
    if (alertType === 'WhatsApp') {
      return `📱 *AUTOFINANZAS RD* \n\nEstimado(a) *${contract.clienteNombre}*, le recordamos que su cuota #${inst.numero} del contrato *${contract.id}* por el vehículo *${contract.vehiculoInfo}* ya se encuentra vencida hace ${diasAtraso > 0 ? diasAtraso : 0} días.\n\n*Monto de la Cuota:* ${formatRD(inst.montoCuota)}\n*Mora acumulada:* ${inst.montoMora > 0 ? formatRD(inst.montoMora) : 'RD$ 1,500.00'}\n*Importe Pendiente de Pago:* ${formatRD(inst.pendiente + (inst.montoMora || 1500))}\n\nFavor pasar a caja a la menor brevedad o realizar transferencia. Evite reportes desfavorables en el Buró de Crédito Transunion.`;
    } else if (alertType === 'SMS') {
      return `AutoFinanzas RD: Estimado ${contract.clienteNombre}, su cuota #${inst.numero} de ${contract.id} está vencida. Pago requerido de ${formatRD(inst.pendiente + 1500)}. Favor ponerse al día para evitar cargos de mora adicionales.`;
    } else {
      return `Asunto: Recordatorio Urgente de Pago - Contrato ${contract.id} - AutoFinanzas RD\n\nEstimado(a) ${contract.clienteNombre},\n\nLe saluda el departamento de Gestión de Cobros de AutoFinanzas Dominicana.\n\nLe escribimos para informarle que su cuota #${inst.numero} de financiamiento con vencimiento el ${inst.fechaVencimiento}, presenta saldo insoluto vencido.\n\nDetalle de Deuda:\n- Capital vig: ${formatRD(inst.montoCapital)}\n- Interés corriente: ${formatRD(inst.montoInteres)}\n- Seguro/Mora: RD$ 1,500.00\n- Saldo deudor: ${formatRD(inst.pendiente + 1500)}\n\nFavor comunicarse con Franklin Ortiz al 809-567-2291.`;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs font-sans" id="cuentas-por-cobrar-module">
      
      {/* Banner de alertas rápidas toast */}
      {toastMessage && (
        <div className="bg-emerald-650 text-white p-3.5 rounded-xl border border-emerald-500 shadow-xl font-bold text-center flex items-center justify-center gap-2 animate-bounce">
          <CheckCircle className="h-5 w-5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cabecera Cuentas por cobrar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cuentas por Cobrar y Recuperación</h1>
          <p className="text-[11px] text-slate-500">Cartera vencida, gestión de llamadas de cobranza y alertas preventivas vía canales digitales.</p>
        </div>
        <div className="flex gap-1 border border-slate-200 bg-slate-50 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('vencidas')}
            className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase cursor-pointer transition-colors flex items-center gap-1 ${
              activeTab === 'vencidas' 
                ? 'bg-rose-500 text-white' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Mora / Vencidas ({todasLasCuotas.filter(c => c.esVencida).length})</span>
          </button>
          <button 
            onClick={() => setActiveTab('pendientes')}
            className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase cursor-pointer transition-colors flex items-center gap-1 ${
              activeTab === 'pendientes' 
                ? 'bg-slate-900 text-white' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Por Vencer ({todasLasCuotas.filter(c => !c.esVencida).length})</span>
          </button>
        </div>
      </div>

      {/* Grid del listado y de la bitácora */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Listado de cuotas pendientes o vencidas (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              {activeTab === 'vencidas' ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                  <span>Reporte Consolidado de Morosidad Dominicana</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-slate-700" />
                  <span>Próximas Cuentas por Cobrar</span>
                </>
              )}
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por cliente o contrato..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 font-sans focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-50 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="p-3">Ref. Contrato</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Cuota No.</th>
                  <th className="p-3">Vencimiento</th>
                  <th className="p-3">Capital + Interés</th>
                  <th className="p-3 text-rose-600 font-bold">Mora Estimada</th>
                  <th className="p-3">Pendiente Neto</th>
                  <th className="p-3 text-right">Alerta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-mono">
                {filteredCuotas.map(({ contract, inst }) => {
                  const diasAtraso = Math.floor((new Date().getTime() - new Date(inst.fechaVencimiento).getTime()) / (1000 * 3600 * 24));
                  const esAtrasoReal = activeTab === 'vencidas';
                  
                  return (
                    <tr key={`${contract.id}-${inst.numero}`} className={`hover:bg-slate-50/50 transition-colors ${esAtrasoReal ? 'bg-rose-50/15' : ''}`}>
                      <td className="p-3 font-bold text-slate-900">{contract.id}</td>
                      <td className="p-3 font-sans text-slate-700 font-bold truncate max-w-[150px]">{contract.clienteNombre}</td>
                      <td className="p-3 text-center">Cuota {inst.numero}</td>
                      <td className="p-3 text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{inst.fechaVencimiento}</span>
                      </td>
                      <td className="p-3 text-slate-900">{formatRD(inst.montoCuota)}</td>
                      <td className="p-3 text-rose-600 font-bold">
                        {esAtrasoReal ? formatRD(1500) : 'RD$ 0.00'}
                      </td>
                      <td className="p-3 text-slate-950 font-extrabold text-[12px] font-mono">
                        {formatRD(inst.pendiente + (esAtrasoReal ? 1500 : 0))}
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => setSelectedAlertInstallment({ contract, inst })}
                          className={`text-[10px] font-sans font-bold px-2 py-1 rounded-lg cursor-pointer flex items-center gap-1 ml-auto justify-center ${
                            esAtrasoReal 
                              ? 'bg-rose-100 hover:bg-rose-200 text-rose-800' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          }`}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Notificar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredCuotas.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-slate-400 py-12 italic">Felicidades. No se reportan cuentas pendientes en esta agrupación.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel de registro de Seguimiento & Llamadas a la derecha (1 col) */}
        <div className="space-y-6">
          {/* Formulario Seguimiento */}
          <form onSubmit={handleAddFollowup} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <PhoneCall className="h-4 w-4 text-slate-900" />
              Bitácora de Cobranza (Seguimiento)
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Contrato deudor *</label>
                <select 
                  required value={selectedContractId} onChange={e => setSelectedContractId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs"
                >
                  <option value="">Seleccione Contrato</option>
                  {db.contracts.filter(c => c.estado === 'Activo' || c.estado === 'En Mora').map(c => (
                    <option key={c.id} value={c.id}>{c.id} - {c.clienteNombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Canal de Contacto *</label>
                <select 
                  value={canalFollow} onChange={e => setCanalFollow(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs"
                >
                  <option value="Llamada">Llamada Telefónica</option>
                  <option value="WhatsApp">WhatsApp Oficial</option>
                  <option value="Visita">Visita Domiciliaria / Cobrador</option>
                  <option value="Email">Correo Electrónico</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Acuerdos alcanzados / Status *</label>
                <textarea 
                  required rows={3} value={comentarioFollow} onChange={e => setComentarioFollow(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 px-3 rounded-xl text-xs focus:outline-none"
                  placeholder="Ej: Cliente informa que pasará el viernes 10 de junio a depositar RD$ 25,000 en ventanilla..."
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Guardar Seguimiento</span>
              </button>
            </div>
          </form>

          {/* Listado de Seguimiento Histórico */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Historial de Intervención de Mora</h4>
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {followups.map(f => (
                <div key={f.id} className="p-3 border border-slate-105 rounded-xl bg-slate-50 space-y-1">
                  <div className="flex justify-between font-bold text-[10px]">
                    <span className="text-slate-900">{f.clienteNombre} ({f.contratoId})</span>
                    <span className="text-slate-400 font-mono">{f.fecha}</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-600">{f.comentario}</p>
                  <div className="flex justify-between text-[9px] text-slate-400 font-semibold pt-1">
                    <span>Vía: {f.canal}</span>
                    <span>Gestor: {f.gestor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CONFIG DE ALERTA AUTOMÁTICA */}
      {selectedAlertInstallment && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4 animate-fade-in" id="alert-trigger-box">
            <button 
              onClick={() => setSelectedAlertInstallment(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MessageSquare className="h-4 top-1 text-slate-900" />
                Disparador de Alerta de Cobro Automática
              </h3>
              <p className="text-slate-505 text-[11px]">Personalice el canal y la plantilla de notificación redactada de manera inteligente para presionar el cobro.</p>
            </div>

            {/* Selector de canal */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button 
                onClick={() => setAlertType('WhatsApp')}
                className={`p-2 rounded-xl border font-bold text-center ${alertType === 'WhatsApp' ? 'border-emerald-500 bg-emerald-50 text-emerald-850' : 'border-slate-100'}`}
              >
                WhatsApp
              </button>
              <button 
                onClick={() => setAlertType('SMS')}
                className={`p-2 rounded-xl border font-bold text-center ${alertType === 'SMS' ? 'border-slate-900 bg-slate-50 text-slate-950' : 'border-slate-100'}`}
              >
                SMS Movil
              </button>
              <button 
                onClick={() => setAlertType('Email')}
                className={`p-2 rounded-xl border font-bold text-center ${alertType === 'Email' ? 'border-indigo-500 bg-indigo-50 text-indigo-850' : 'border-slate-100'}`}
              >
                Email Formal
              </button>
            </div>

            {/* Vista previa de texto redactado */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Vista Previa redactada en vivo:</span>
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-[10px] font-mono leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                {getSimulatedMessageText()}
              </pre>
            </div>

            {/* Botón enviar */}
            <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
              <button 
                onClick={() => setSelectedAlertInstallment(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-850 px-4 py-2 rounded-xl font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={handleTriggerMockAlert}
                className="bg-slate-950 hover:bg-slate-800 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span>Despachar Notificación</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
