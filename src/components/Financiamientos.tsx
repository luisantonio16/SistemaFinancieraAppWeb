import React, { useState, useEffect } from 'react';
import { 
  Contract, 
  Vehicle, 
  Customer, 
  FinancialAppDB,
  AmortizationInstallment
} from '../types';
import { addAuditLog, generarTablaAmortizacion } from '../data';
import { 
  FileText, 
  Calculator, 
  DollarSign, 
  Calendar, 
  Percent, 
  ShieldAlert, 
  BookOpen, 
  CheckCircle,
  Plus,
  RefreshCw,
  Search,
  User,
  Car,
  ChevronDown,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

interface FinanciamientosProps {
  db: FinancialAppDB;
  onUpdateDb: (newDb: FinancialAppDB) => void;
  onSetTab?: (tab: string) => void;
}

const listContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03
    }
  }
};

const listItemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function Financiamientos({ db, onUpdateDb, onSetTab }: FinanciamientosProps) {
  const [activeSubtab, setActiveSubtab] = useState<'contratos' | 'nueva'>('contratos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContractId, setSelectedContractId] = useState<string>(db.contracts[0]?.id || '');

  // Parámetros de la simulación
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [montoVenta, setMontoVenta] = useState(0);
  const [inicial, setInicial] = useState(0);
  const [tasaAnual, setTasaAnual] = useState(18); // Default 18% anual
  const [plazo, setPlazo] = useState(24); // Default 24 meses
  const [observaciones, setObservaciones] = useState('');

  // Refinanciamiento variables auxiliares
  const [isRefinancing, setIsRefinancing] = useState(false);
  const [refinanceOriginalContractId, setRefinanceOriginalContractId] = useState('');

  // Filtrar vehículos disponibles para nuevos contratos
  const vehiculosDisponibles = db.vehicles.filter(v => v.estado === 'Disponible');
  const todosLosVehiculos = db.vehicles; // para historial

  const formatRD = (value: number) => {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(value);
  };

  // Sincronizar precio de venta cuando cambia de vehículo en simulación
  useEffect(() => {
    const veh = db.vehicles.find(v => v.id === selectedVehicleId);
    if (veh) {
      setMontoVenta(veh.valorVenta);
      // Inicial recomendado del 20%
      setInicial(Math.round(veh.valorVenta * 0.2));
    }
  }, [selectedVehicleId, db.vehicles]);

  const capitalFinanciar = Math.max(0, montoVenta - inicial);

  // Generar tabla de amortización preliminar para la vista previa
  const provTabla: AmortizationInstallment[] = capitalFinanciar > 0 
    ? generarTablaAmortizacion(capitalFinanciar, tasaAnual, plazo, new Date().toISOString().split('T')[0])
    : [];

  const cuotaEstimada = provTabla[0]?.montoCuota || 0;

  // Filtrar Contratos
  const filteredContracts = db.contracts.filter(c => 
    c.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.vehiculoInfo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedContract = db.contracts.find(c => c.id === selectedContractId) || db.contracts[0];

  // Acción: Crear contrato y marcar vehículo
  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedVehicleId || capitalFinanciar <= 0) {
      alert("Por favor complete toda la información de cliente, vehículo e inicial válidos.");
      return;
    }

    const cliente = db.customers.find(c => c.id === selectedClientId);
    const vehiculo = db.vehicles.find(v => v.id === selectedVehicleId);

    if (!cliente || !vehiculo) return;

    // 1. Crear nuevo contrato
    const contractId = 'CON-' + Math.floor(Math.random() * 900 + 100);
    const newContract: Contract = {
      id: contractId,
      clienteId: cliente.id,
      clienteNombre: cliente.nombre,
      vehiculoId: vehiculo.id,
      vehiculoInfo: `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.ano})`,
      montoVenta,
      inicial,
      montoFinanciado: capitalFinanciar,
      tasaInteresAnual: tasaAnual,
      plazoMeses: plazo,
      cuotaMensual: cuotaEstimada,
      saldoPendiente: capitalFinanciar,
      estado: 'Activo',
      fechaInicio: new Date().toISOString().split('T')[0],
      tablaAmortizacion: provTabla,
      observaciones: observaciones || (isRefinancing ? `Contrato refinanciado del original ${refinanceOriginalContractId}` : '')
    };

    // 2. Si estamos refinanciando, marcar el anterior como 'Refinanciado'
    let updatedContracts = [...db.contracts];
    if (isRefinancing) {
      updatedContracts = updatedContracts.map(c => {
        if (c.id === refinanceOriginalContractId) {
          return {
            ...c,
            estado: 'Refinanciado' as const,
            saldoPendiente: 0
          };
        }
        return c;
      });
    }

    updatedContracts = [newContract, ...updatedContracts];

    // 3. Actualizar estado del vehículo (poner en 'Financiado')
    const updatedVehicles = db.vehicles.map(v => {
      // El vehículo nuevo se pone Financiado
      if (v.id === vehiculo.id) {
        return { ...v, estado: 'Financiado' as const };
      }
      // Si refinanciamos el mismo vehículo, sigue Financiado. Si es otro, liberamos el viejo?
      // Usualmente refinanciamos sobre el mismo vehículo, así que se queda igual
      return v;
    });

    let updatedDb = {
      ...db,
      contracts: updatedContracts,
      vehicles: updatedVehicles
    };

    const logDetalle = isRefinancing 
      ? `Refinanciamiento aprobado: Nuevo contrato ${contractId} sustituyendo a ${refinanceOriginalContractId}`
      : `Contrato de financiamiento aprobado: ${contractId} para ${cliente.nombre} por ${formatRD(capitalFinanciar)}`;

    updatedDb = addAuditLog(updatedDb, 'Financiamientos', isRefinancing ? 'Refinanciamiento' : 'Creación de Contrato', logDetalle);

    onUpdateDb(updatedDb);
    setSelectedContractId(newContract.id);
    setIsRefinancing(false);
    setRefinanceOriginalContractId('');
    setActiveSubtab('contratos');
    
    // reset variables
    setSelectedClientId('');
    setSelectedVehicleId('');
    setObservaciones('');
  };

  // Iniciar flujo de Refinanciamiento
  const handleInitiateRefinance = (contract: Contract) => {
    // Para refinanciar cargamos el saldo pendiente como capital y permitimos cambiar plazo/tasas
    setIsRefinancing(true);
    setRefinanceOriginalContractId(contract.id);
    
    // Cargar parámetros del anterior contrato
    setSelectedClientId(contract.clienteId);
    setSelectedVehicleId(contract.vehiculoId);
    setMontoVenta(contract.saldoPendiente); // El saldo pendiente es el nuevo capital a financiar
    setInicial(0); // Puede amortizar inicial extraordinario si quiere
    setTasaAnual(contract.tasaInteresAnual);
    setPlazo(contract.plazoMeses);
    setObservaciones(`Refinanciamiento del saldo de ${formatRD(contract.saldoPendiente)} del contrato anterior ${contract.id}`);
    
    setActiveSubtab('nueva');
  };

  const getContractStatusBadge = (estado: Contract['estado']) => {
    switch(estado) {
      case 'Activo': return 'bg-emerald-500 text-white font-bold tracking-wide border border-emerald-600 rounded-lg shadow-sm';
      case 'Saldado': return 'bg-slate-500 text-white font-medium border border-slate-600 rounded-lg';
      case 'En Mora': return 'bg-rose-500 text-white font-black tracking-wider border border-rose-600 rounded-lg animate-pulse';
      case 'Refinanciado': return 'bg-indigo-600 text-white font-bold border border-indigo-750 rounded-lg';
    }
  };

  return (
    <div className="space-y-6" id="financiamientos-workspace">
      {/* Selector de subpestañas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          <button 
            onClick={() => { setActiveSubtab('contratos'); setIsRefinancing(false); }}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              activeSubtab === 'contratos' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Contratos Vigentes
          </button>
          <button 
            onClick={() => setActiveSubtab('nueva')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              activeSubtab === 'nueva' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calculator className="h-3.5 w-3.5" />
            <span>{isRefinancing ? 'Registrar Refinanciamiento' : 'Simulador / Crear Préstamo'}</span>
          </button>
        </div>
        
        {isRefinancing && (
          <div className="bg-amber-500/10 border border-amber-350 text-amber-900 px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 animate-pulse">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refinanciando Contrato: {refinanceOriginalContractId}</span>
          </div>
        )}
      </div>

      {activeSubtab === 'contratos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="contracts-grid">
          {/* Listado de contratos izquierda */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 flex flex-col space-y-4 shadow-sm" id="contracts-sidebar">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por cliente, id o vehículo..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-shadow font-semibold"
              />
            </div>

            <motion.div 
              variants={listContainerVariants}
              initial="hidden"
              animate="show"
              className="divide-y divide-slate-50 overflow-y-auto max-h-[500px]" 
              id="contracts-scroll"
            >
              {filteredContracts.map(c => (
                <motion.div 
                  key={c.id}
                  variants={listItemVariants}
                  whileHover={{ scale: 1.01, x: 2 }}
                  onClick={() => setSelectedContractId(c.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all flex flex-col space-y-1 ${
                    selectedContract?.id === c.id 
                    ? 'bg-gradient-to-r from-indigo-950 to-slate-900 text-white shadow-md' 
                    : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <p className="font-bold text-xs truncate">{c.clienteNombre}</p>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-lg border uppercase ${
                      selectedContract?.id === c.id 
                        ? 'bg-slate-800 text-white border-slate-700' 
                        : getContractStatusBadge(c.estado)
                    }`}>
                      {c.estado}
                    </span>
                  </div>
                  <span className="text-[10px] opacity-75 leading-relaxed truncate">{c.vehiculoInfo}</span>
                  <div className="flex justify-between text-[10px] opacity-70 font-mono mt-0.5">
                    <span>ID: {c.id}</span>
                    <span className={selectedContract?.id === c.id ? "font-black text-amber-300" : "font-extrabold text-indigo-600"}>Bal: {formatRD(c.saldoPendiente)}</span>
                  </div>
                </motion.div>
              ))}
              {filteredContracts.length === 0 && (
                <p className="text-center text-slate-400 py-6 text-xs font-semibold">No se encontraron contratos.</p>
              )}
            </motion.div>
          </div>

          {/* Ficha técnica y Tabla de Amortización derecha */}
          {selectedContract ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.99, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6" 
              id="contracts-detail-panel"
            >
              {/* Encabezado Ficha */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-indigo-50/70 to-slate-50/20 -m-6 p-6 rounded-t-3xl border-b border-indigo-100/50">
                <div className="space-y-1">
                  <span className={`inline-block text-[10px] font-black px-2.5 py-1 uppercase rounded-lg shadow-sm ${getContractStatusBadge(selectedContract.estado)}`}>
                    Contrato {selectedContract.estado}
                  </span>
                  <h2 className="text-sm font-extrabold text-slate-900">{selectedContract.clienteNombre}</h2>
                  <p className="text-xs text-slate-505 font-bold font-mono">Contrato ID: {selectedContract.id} | Inscripción: {selectedContract.fechaInicio}</p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedContract.estado !== 'Saldado' && selectedContract.estado !== 'Refinanciado' && (
                    <motion.button 
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleInitiateRefinance(selectedContract)}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-xl text-xs font-extrabold hover:opacity-95 shadow-md hover:shadow-lg cursor-pointer transition-all"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Refinanciar Saldo</span>
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Parámetros Generales */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-4">
                <div className="bg-slate-50/75 p-3.5 rounded-2xl border border-slate-100 shadow-inner">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Valor Vehículo</span>
                  <p className="font-extrabold text-slate-900 font-mono mt-1 text-sm">{formatRD(selectedContract.montoVenta)}</p>
                </div>
                <div className="bg-slate-50/75 p-3.5 rounded-2xl border border-slate-100 shadow-inner">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Inicial (Pronto Pago)</span>
                  <p className="font-extrabold text-slate-900 font-mono mt-1 text-sm">{formatRD(selectedContract.inicial)}</p>
                </div>
                <div className="bg-indigo-50/40 p-3.5 rounded-2xl border border-indigo-100/40">
                  <span className="text-indigo-600 font-black uppercase text-[9px] tracking-wider block">Monto Financiado</span>
                  <p className="font-black text-indigo-950 font-mono mt-1 text-sm">{formatRD(selectedContract.montoFinanciado)}</p>
                </div>
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-3.5 rounded-2xl text-white shadow-md">
                  <span className="text-slate-300 font-bold uppercase text-[9px] tracking-wider block">Saldo Residual Actual</span>
                  <p className="font-black font-mono mt-1 text-emerald-400 text-sm">{formatRD(selectedContract.saldoPendiente)}</p>
                </div>
              </div>

              {/* Datos de Tasa y Plazo */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-wrap gap-6 text-xs text-slate-700">
                <div className="flex items-center gap-1.5">
                  <Car className="h-4 w-4 text-slate-500" />
                  <span><strong>Garantía:</strong> {selectedContract.vehiculoInfo}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Percent className="h-4 w-4 text-slate-500" />
                  <span><strong>Tasa Interés:</strong> {selectedContract.tasaInteresAnual}% Anual ({ (selectedContract.tasaInteresAnual / 12).toFixed(2) }% Mensual)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <span><strong>Plazo:</strong> {selectedContract.plazoMeses} Meses</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span><strong>Cuota de Pago Regular:</strong> <strong className="text-slate-900 font-mono">{formatRD(selectedContract.cuotaMensual)}</strong> / mes</span>
                </div>
              </div>

              {/* Observaciones extra */}
              {selectedContract.observaciones && (
                <div className="flex gap-2 text-xs bg-amber-50 border border-amber-100 p-3.5 rounded-xl text-amber-800">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed"><strong>Notas de Crédito:</strong> {selectedContract.observaciones}</p>
                </div>
              )}

              {/* Tabla de amortización detallada */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tabla de Amortización de Pagos</h3>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-[10px] border-b border-slate-100">
                      <tr>
                        <th className="p-3"># Cuota</th>
                        <th className="p-3">Vencimiento</th>
                        <th className="p-3">Cuota Sugerida</th>
                        <th className="p-3">Capital</th>
                        <th className="p-3">Interés</th>
                        <th className="p-3 font-semibold text-rose-600">Mora</th>
                        <th className="p-3">Cobrado</th>
                        <th className="p-3 text-right">Pendiente</th>
                        <th className="p-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-mono">
                      {selectedContract.tablaAmortizacion.map(( installment ) => {
                        const esAtrasada = installment.estado === 'Atrasado' || (installment.estado === 'Pendiente' && new Date(installment.fechaVencimiento) < new Date());
                        
                        return (
                          <tr key={installment.numero} className={`hover:bg-slate-50 transition-colors ${esAtrasada ? 'bg-rose-50/20' : ''}`}>
                            <td className="p-3 text-slate-900 font-bold font-sans">Cuota {installment.numero}</td>
                            <td className="p-3 text-slate-500">{installment.fechaVencimiento}</td>
                            <td className="p-3 text-slate-900 font-bold">{formatRD(installment.montoCuota)}</td>
                            <td className="p-3 text-slate-600">{formatRD(installment.montoCapital)}</td>
                            <td className="p-3 text-slate-600">{formatRD(installment.montoInteres)}</td>
                            <td className="p-3 text-rose-600 font-bold">{installment.montoMora > 0 ? formatRD(installment.montoMora) : 'RD$0'}</td>
                            <td className="p-3 text-emerald-600 font-bold">{formatRD(installment.montoPagado)}</td>
                            <td className={`p-3 text-right font-bold ${installment.pendiente > 0 ? 'text-slate-950' : 'text-slate-300'}`}>
                              {formatRD(installment.pendiente)}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold font-sans ${
                                installment.estado === 'Pagado' ? 'bg-emerald-100 text-emerald-800' :
                                esAtrasada ? 'bg-rose-100 text-rose-800 animate-pulse' :
                                installment.estado === 'Parcial' ? 'bg-amber-100 text-amber-800' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {esAtrasada ? 'Atrasada' : installment.estado}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ) : (
            <p className="lg:col-span-2 text-slate-400 text-center py-12 text-xs">Seleccione un contrato para ver su bitácora.</p>
          )}
        </div>
      ) : (
        /* Nueva Solicitud o Refinanciamiento */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="credit-simulation-setup">
          {/* Parámetros simulador (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <Calculator className="h-4 w-4" />
              {isRefinancing ? 'Estructurar Refinanciamiento de Deuda' : 'Estructuración Financiera de Préstamo'}
            </h3>

            <form onSubmit={handleCreateContract} className="space-y-6 text-xs">
              {/* Clientes y Vehículo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Asociar Cliente *</label>
                  {isRefinancing ? (
                    <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 text-slate-700 font-bold">
                      {db.customers.find(c => c.id === selectedClientId)?.nombre}
                    </div>
                  ) : (
                    <select 
                      required value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                    >
                      <option value="">Seleccione Cliente</option>
                      {db.customers.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre} (Ced: {c.cedula})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Asociar Garantía (Vehículo) *</label>
                  {isRefinancing ? (
                    <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 text-slate-700 font-bold">
                      {todosLosVehiculos.find(v => v.id === selectedVehicleId)?.marca} {todosLosVehiculos.find(v => v.id === selectedVehicleId)?.modelo}
                    </div>
                  ) : (
                    <select 
                      required value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                    >
                      <option value="">Seleccione Auto disponible</option>
                      {vehiculosDisponibles.map(v => (
                        <option key={v.id} value={v.id}>{v.marca} {v.modelo} {v.ano} ({formatRD(v.valorVenta)})</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Importes */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Monto de Venta (RD$)</label>
                  <input 
                    type="number" required value={montoVenta} readOnly={!isRefinancing && selectedVehicleId !== ''} onChange={e => setMontoVenta(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Inicial / Pronto Pago *</label>
                  <input 
                    type="number" value={inicial} onChange={e => setInicial(Number(e.target.value))}
                    disabled={isRefinancing}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Monto Neto Financiar</label>
                  <div className="py-1.5 font-bold font-mono text-slate-900 border-none bg-transparent">
                    {formatRD(capitalFinanciar)}
                  </div>
                </div>
                {/* Alerta de exepción si supera el 80% */}
                {!isRefinancing && selectedVehicleId && inicial < montoVenta * 0.15 && (
                  <span className="sm:col-span-4 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-lg flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>Se recomienda un Inicial mínimo del 15% al 20% para vehículos de este tipo.</span>
                  </span>
                )}
              </div>

              {/* Tasa y Plazo interactivo sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white p-4 rounded-xl border border-slate-100">
                <div className="space-y-2">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span className="uppercase tracking-wider">Tasa Interés Anual Ajustable (%)</span>
                    <span className="font-mono text-slate-900">{tasaAnual}%</span>
                  </div>
                  <input 
                    type="range" min="10" max="36" step="0.5" value={tasaAnual} onChange={e => setTasaAnual(Number(e.target.value))}
                    className="w-full accent-slate-900 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>10% Preferencial</span>
                    <span>36% Máximo Legal</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span className="uppercase tracking-wider">Plazo de Pago (Meses)</span>
                    <span className="font-mono text-slate-900">{plazo} Meses</span>
                  </div>
                  <input 
                    type="range" min="6" max="72" step="1" value={plazo} onChange={e => setPlazo(Number(e.target.value))}
                    className="w-full accent-slate-900 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>6 Meses (Corto)</span>
                    <span>72 Meses (Largo)</span>
                  </div>
                </div>
              </div>

              {/* Observaciones extra */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Cláusulas del Contrato / Notas Internas</label>
                <textarea 
                  rows={2} value={observaciones} onChange={e => setObservaciones(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                  placeholder="Garantía de rastreo GPS del activo, prenda sin desplazamiento, etc."
                />
              </div>

              {/* Botonera guardar */}
              <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setActiveSubtab('contratos'); setIsRefinancing(false); }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  {isRefinancing ? 'Validar y Refinanciar' : 'Aprobar y Emitir Contrato'}
                </button>
              </div>
            </form>
          </div>

          {/* Resumen Calculadora (Right Side, 1 Col) */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between" id="calculator-sidebar">
            <div className="space-y-6">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5 border-b border-slate-800 pb-3 font-sans">
                <BookOpen className="h-4 w-4 text-emerald-400" />
                Deducción de Cuota Proyectada
              </h3>

              <div className="text-center py-6 bg-slate-800/50 rounded-2xl border border-slate-850">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Cuota Mensual Proyectada *</span>
                <p className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">{formatRD(cuotaEstimada)}</p>
                <p className="text-[10px] text-slate-400 mt-1">Sujeta al { (tasaAnual / 12).toFixed(2) }% interés mensual</p>
              </div>

              {/* Tabla de amortización simulada mini */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cuotas Proyectadas (Primeras 4)</h4>
                <div className="space-y-1.5 text-xs">
                  {provTabla.slice(0, 4).map(p => (
                    <div key={p.numero} className="flex justify-between items-center text-[11px] font-mono hover:bg-slate-800 p-1.5 rounded transition-colors text-slate-300">
                      <span>Cuota #{p.numero}</span>
                      <span>Cap: {formatRD(p.montoCapital)}</span>
                      <span>Int: {formatRD(p.montoInteres)}</span>
                    </div>
                  ))}
                  {provTabla.length > 4 && (
                    <p className="text-center text-[10px] text-slate-500 italic font-mono">+ {provTabla.length - 4} cuotas en la tabla completa...</p>
                  )}
                  {provTabla.length === 0 && (
                    <p className="text-center text-[11px] text-slate-500 italic">Asocie un vehículo para estimar cuotas.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border-l-4 border-emerald-500 p-4 rounded-r-xl mt-6">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                El cálculo matemático utiliza el **SISTEMA FRANCÉS DE AMORTIZACIÓN** con saldo insoluto decreciente. Cada abono extra o pago parcial reducirá automáticamente el saldo sobre el cual se calcula el interés del mes siguiente.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
