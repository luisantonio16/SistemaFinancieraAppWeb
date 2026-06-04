import React, { useState } from 'react';
import { 
  FinancialAppDB, 
  Contract, 
  Payment, 
  Customer 
} from '../types';
import { 
  BarChart2, 
  Search, 
  FileText, 
  TrendingUp, 
  Clock, 
  Calendar, 
  CheckCircle,
  FileSpreadsheet,
  FileCode,
  Download,
  Activity,
  ArrowRight
} from 'lucide-react';

interface ReportesProps {
  db: FinancialAppDB;
}

export default function Reportes({ db }: ReportesProps) {
  const [selectedReportType, setSelectedReportType] = useState<'estado' | 'ingresos' | 'mora' | 'pagos' | 'financiamientos'>('estado');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(db.customers[0]?.id || '');
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'PDF' | 'Excel' | ''>('');
  const [successExportMessage, setSuccessExportMessage] = useState('');

  const formatRD = (value: number) => {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(value);
  };

  const selectedCustomer = db.customers.find(c => c.id === selectedCustomerId) || db.customers[0];
  const customerContracts = db.contracts.filter(c => c.clienteId === selectedCustomer?.id);

  // Trigger export simulator
  const handleExport = (type: 'PDF' | 'Excel') => {
    setIsExporting(true);
    setExportType(type);
    
    setTimeout(() => {
      setIsExporting(false);
      setExportType('');
      setSuccessExportMessage(`¡Éxito! El Reporte de ${selectedReportType.toUpperCase()} ha sido exportado exitosamente a formato ${type}. Archivo guardado.`);
      setTimeout(() => {
        setSuccessExportMessage('');
      }, 5000);
    }, 2000);
  };

  // Cálculos dinámicos de los reportes
  // 1. Reporte de Ingresos (Interés Pagado + Mora Pagada de todos los pagos)
  const totalInteresesCobrados = db.payments.reduce((acc, p) => acc + p.interesPagado, 0);
  const totalMoraCobrada = db.payments.reduce((acc, p) => acc + p.moraPagado, 0);
  const ingresosTotales = totalInteresesCobrados + totalMoraCobrada;

  // 2. Reporte de Mora (Contratos en Mora y cuotas atrasadas)
  const contratosMora = db.contracts.filter(c => c.estado === 'En Mora');
  let capitalVencidoGlobal = 0;
  contratosMora.forEach(c => {
    c.tablaAmortizacion.forEach(inst => {
      if (inst.estado === 'Atrasado' || (inst.estado === 'Pendiente' && new Date(inst.fechaVencimiento) < new Date())) {
        capitalVencidoGlobal += inst.pendiente;
      }
    });
  });

  return (
    <div className="space-y-6 animate-fade-in text-xs font-sans" id="reports-dashboard">
      
      {/* Toast de Exportación Exitosa */}
      {successExportMessage && (
        <div className="bg-emerald-650 text-white p-3.5 rounded-xl border border-emerald-500 shadow-xl font-bold text-center flex items-center justify-center gap-2 animate-bounce">
          <CheckCircle className="h-5 w-5" />
          <span>{successExportMessage}</span>
        </div>
      )}

      {/* Overlay de carga exportadora */}
      {isExporting && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl flex flex-col items-center space-y-4 max-w-sm text-center shadow-2xl border">
            {exportType === 'Excel' ? (
              <FileSpreadsheet className="h-10 w-10 text-emerald-600 animate-spin" />
            ) : (
              <FileCode className="h-10 w-10 text-rose-600 animate-spin" />
            )}
            <div>
              <p className="font-bold text-slate-900">Sintetizando base de datos...</p>
              <p className="text-[11px] text-slate-500 mt-1">Generando reporte de {selectedReportType} con diseño contable en formato .{exportType.toLowerCase()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Cabecera Reportes */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sistemas de Reportes Gerenciales</h1>
          <p className="text-[11px] text-slate-500">Conciliación de pagos, índices de riesgo crediticio y auditoría de capital de cartera.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleExport('Excel')}
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>
          <button 
            onClick={() => handleExport('PDF')}
            className="flex items-center gap-1.5 bg-slate-905 hover:bg-slate-800 text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer"
          >
            <FileCode className="h-4 w-4 text-rose-500" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Grid General */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Selector de tipo de reporte izquierda */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2 shadow-sm" id="reports-sidebar">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-3">Reportes Financieros</h4>
          
          <button 
            onClick={() => { setSelectedReportType('estado'); }}
            className={`w-full p-2.5 rounded-xl text-left font-bold transition-all flex items-center justify-between ${
              selectedReportType === 'estado' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-800'
            }`}
          >
            <span>Estado de Cuenta Integral</span>
            <FileText className="h-4 w-4 opacity-70" />
          </button>

          <button 
            onClick={() => { setSelectedReportType('ingresos'); }}
            className={`w-full p-2.5 rounded-xl text-left font-bold transition-all flex items-center justify-between ${
              selectedReportType === 'ingresos' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-800'
            }`}
          >
            <span>Reporte de Ingresos Contables</span>
            <TrendingUp className="h-4 w-4 opacity-70" />
          </button>

          <button 
            onClick={() => { setSelectedReportType('mora'); }}
            className={`w-full p-2.5 rounded-xl text-left font-bold transition-all flex items-center justify-between ${
              selectedReportType === 'mora' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-800'
            }`}
          >
            <span>Reporte de Cartera en Mora</span>
            <Clock className="h-4 w-4 opacity-70" />
          </button>

          <button 
            onClick={() => { setSelectedReportType('pagos'); }}
            className={`w-full p-2.5 rounded-xl text-left font-bold transition-all flex items-center justify-between ${
              selectedReportType === 'pagos' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-800'
            }`}
          >
            <span>Reporte Auxiliar de Pagos</span>
            <CheckCircle className="h-4 w-4 opacity-70" />
          </button>

          <button 
            onClick={() => { setSelectedReportType('financiamientos'); }}
            className={`w-full p-2.5 rounded-xl text-left font-bold transition-all flex items-center justify-between ${
              selectedReportType === 'financiamientos' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-800'
            }`}
          >
            <span>Reporte de Préstamos Emitidos</span>
            <Activity className="h-4 w-4 opacity-70" />
          </button>
        </div>

        {/* Círculo generador del reporte seleccionado derecha (3 cols) */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm namespace-reports-sheet">
          
          {selectedReportType === 'estado' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 -mx-6 -mt-6 p-4 rounded-t-2xl border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Estado de Cuenta de Clientes</h3>
                  <p className="text-[11px] text-slate-500">Expediente analítico con desglose de pagos por contrato amortizado.</p>
                </div>
                <div className="w-64">
                  <select 
                    value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-white border border-slate-205 p-1.5 rounded-lg text-xs outline-none"
                  >
                    {db.customers.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dossier info */}
              {selectedCustomer && (
                <div className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-105 p-4 rounded-xl text-xs">
                    <div>
                      <p className="text-slate-450 uppercase text-[9px] font-bold">Cliente</p>
                      <p className="font-bold text-slate-800 text-xs mt-1">{selectedCustomer.nombre}</p>
                      <p className="text-slate-500 mt-0.5">Cédula: {selectedCustomer.cedula}</p>
                    </div>
                    <div>
                      <p className="text-slate-450 uppercase text-[9px] font-bold">Teléfono/Sector</p>
                      <p className="text-slate-700 mt-1">{selectedCustomer.telefono}</p>
                      <p className="text-slate-400 mt-0.5 truncate">{selectedCustomer.direccion}</p>
                    </div>
                    <div>
                      <p className="text-slate-450 uppercase text-[9px] font-bold">Rendimiento Crediticio</p>
                      <span className="inline-block mt-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100">
                        {selectedCustomer.estadoCrediticio}
                      </span>
                    </div>
                  </div>

                  {/* Detalle contratos del cliente */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Historial de Financiamientos Vigentes</h4>
                    {customerContracts.map(con => (
                      <div key={con.id} className="border border-slate-100 rounded-xl overflow-hidden text-[11px] font-sans">
                        <div className="bg-slate-50 p-3 font-bold border-b border-slate-100 flex justify-between items-center text-slate-900">
                          <span>Contrato: {con.id} • {con.vehiculoInfo}</span>
                          <span className="font-mono bg-slate-900 text-white px-2 py-0.5 rounded text-[10px]">
                            Pendiente: {formatRD(con.saldoPendiente)}
                          </span>
                        </div>
                        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                          <div>
                            <span className="text-slate-400 text-[10px] font-sans">Monto Otorgado:</span>
                            <p className="font-bold mt-1 text-slate-800">{formatRD(con.montoFinanciado)}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] font-sans">Tasa Pactada:</span>
                            <p className="font-bold mt-1 text-slate-800">{con.tasaInteresAnual}% Anual</p>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] font-sans">Cuota Mensual:</span>
                            <p className="font-bold mt-1 text-emerald-600">{formatRD(con.cuotaMensual)}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] font-sans">Plazo:</span>
                            <p className="font-bold mt-1 text-slate-800">{con.plazoMeses} Meses</p>
                          </div>
                        </div>

                        {/* Listado resumido de cuotas de este contrato */}
                        <div className="p-3 border-t border-slate-50 text-[10px] font-mono text-slate-500 overflow-x-auto max-h-40 overflow-y-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="text-slate-400 border-b border-slate-50">
                                <th className="pb-1.5">No. Cuota</th>
                                <th className="pb-1.5">Vencimiento</th>
                                <th className="pb-1.5 text-right">Monto</th>
                                <th className="pb-1.5 text-right">Mora Cobrada</th>
                                <th className="pb-1.5 text-right">Pagado</th>
                                <th className="pb-1.5 text-right">Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {con.tablaAmortizacion.map(inst => (
                                <tr key={inst.numero} className="border-b border-slate-50 whitespace-nowrap">
                                  <td className="py-1">Cuota #{inst.numero}</td>
                                  <td className="py-1">{inst.fechaVencimiento}</td>
                                  <td className="py-1 text-right">{formatRD(inst.montoCuota)}</td>
                                  <td className="py-1 text-right text-rose-500">{inst.montoMora > 0 ? formatRD(inst.montoMora) : '-'}</td>
                                  <td className="py-1 text-right text-emerald-600">{formatRD(inst.montoPagado)}</td>
                                  <td className="py-1 text-right">
                                    <span className="font-sans font-bold text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                      {inst.estado}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                    {customerContracts.length === 0 && (
                      <p className="text-slate-400 text-xs italic">El cliente seleccionado no cuenta con contratos aprobados en esta sesión.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedReportType === 'ingresos' && (
            <div className="space-y-6 animate-fade-in text-xs font-sans">
              <div className="bg-slate-50 -mx-6 -mt-6 p-4 rounded-t-2xl border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Reporte Auxiliar de Ingresos y Utilidad</h3>
                <p className="text-[11px] text-slate-500">Conciliación de pagos recaudados en concepto exclusivo de intereses y recargos por mora.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs font-sans">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <span className="font-bold text-slate-450 uppercase text-[9px]">Intereses Cobrados (Neto)</span>
                  <p className="text-sm font-extrabold text-slate-900 font-mono mt-1">{formatRD(totalInteresesCobrados)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <span className="font-bold text-rose-600 uppercase text-[9px]">Recargos Mora Cobrados</span>
                  <p className="text-sm font-extrabold text-rose-600 font-mono mt-1">{formatRD(totalMoraCobrada)}</p>
                </div>
                <div className="bg-slate-900 text-white p-4 rounded-xl">
                  <span className="font-bold text-slate-300 uppercase text-[9px]">Ingresos Operativos Totales</span>
                  <p className="text-sm font-extrabold text-emerald-400 font-mono mt-1">{formatRD(ingresosTotales)}</p>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Flujo de Ingresos Detallado (Conceptos de Interés y Recargos)</h4>
                <div className="overflow-x-auto border border-slate-50 rounded-xl">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b uppercase text-[9px] tracking-wide">
                      <tr>
                        <th className="p-3">Recibo No.</th>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Cliente</th>
                        <th className="p-3 text-right">Intereses</th>
                        <th className="p-3 text-right">Mora</th>
                        <th className="p-3 text-right">Total Cobrado (Inc. Capital)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-mono">
                      {db.payments.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-900">{p.reciboNumero}</td>
                          <td className="p-3 text-slate-550">{p.fecha}</td>
                          <td className="p-3 font-sans text-slate-705 font-bold truncate max-w-[150px]">{p.clienteNombre}</td>
                          <td className="p-3 text-right text-emerald-600">{formatRD(p.interesPagado)}</td>
                          <td className="p-3 text-right text-rose-500">{p.moraPagado > 0 ? formatRD(p.moraPagado) : '-'}</td>
                          <td className="p-3 text-right text-slate-900 font-bold">{formatRD(p.montoPagado)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedReportType === 'mora' && (
            <div className="space-y-6 animate-fade-in text-xs font-sans">
              <div className="bg-slate-50 -mx-6 -mt-6 p-4 rounded-t-2xl border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Reporte de Cartera Vencida y Riesgo Moroso</h3>
                <p className="text-[11px] text-slate-500">Mapeo del saldo insoluto de contratos etiquetados en retraso de pagos.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <span className="font-bold text-slate-450 uppercase text-[9px]">Préstamos en Estado Crítico / Mora</span>
                  <p className="text-sm font-extrabold text-slate-900 mt-1">{contratosMora.length} Contratos</p>
                </div>
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-rose-800">
                  <span className="font-bold uppercase text-[9px] text-rose-600">Monto Atrasado Global de la Cartera</span>
                  <p className="text-sm font-extrabold font-mono mt-1">{formatRD(capitalVencidoGlobal)}</p>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Contratos con Alertas de Pago Activas</h4>
                <div className="overflow-x-auto border border-slate-50 rounded-xl">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-505 font-semibold text-[9px] uppercase tracking-wider border-b">
                      <tr>
                        <th className="p-3">Ref. Contrato</th>
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Garantía</th>
                        <th className="p-3 text-right">Saldo Insoluto</th>
                        <th className="p-3 text-right">Monto Atraso</th>
                        <th className="p-3 text-center">Estado Contrato</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-mono">
                      {contratosMora.map(con => (
                        <tr key={con.id} className="bg-rose-50/20">
                          <td className="p-3 font-bold text-slate-900">{con.id}</td>
                          <td className="p-3 font-sans text-slate-800 font-bold">{con.clienteNombre}</td>
                          <td className="p-3 font-sans text-slate-600 truncate max-w-[120px]">{con.vehiculoInfo}</td>
                          <td className="p-3 text-right text-slate-950 font-bold">{formatRD(con.saldoPendiente)}</td>
                          <td className="p-3 text-right text-rose-600 font-extrabold">
                            {formatRD(con.tablaAmortizacion.filter(d => d.estado === 'Atrasado' || (d.estado === 'Pendiente' && new Date(d.fechaVencimiento) < new Date())).reduce((a, b) => a + b.pendiente, 0))}
                          </td>
                          <td className="p-3 text-center font-sans font-bold">
                            <span className="bg-rose-100 text-rose-850 text-[9px] px-2 py-0.5 rounded-full uppercase">
                              {con.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {contratosMora.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center text-slate-400 py-12 italic">Felicidades. No se reportan carteras en estado de morosidad.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedReportType === 'pagos' && (
            <div className="space-y-6 animate-fade-in text-xs font-sans">
              <div className="bg-slate-50 -mx-6 -mt-6 p-4 rounded-t-2xl border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Reporte Auxiliar de Pagos y Abonos Recibidos</h3>
                <p className="text-[11px] text-slate-505">Libro auxiliar de conciliación diaria de fondos depositados por amortizaciones.</p>
              </div>

              <div className="pt-4 space-y-3">
                <div className="overflow-x-auto border border-slate-50 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[9px] border-b">
                      <tr>
                        <th className="p-3">Recibo Número</th>
                        <th className="p-3">ID Contrato</th>
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Fecha de Cobro</th>
                        <th className="p-3 text-right">Abono Capital</th>
                        <th className="p-3 text-right">Interés Recaudado</th>
                        <th className="p-3 text-right">Mora Recaudada</th>
                        <th className="p-3 text-right">Monto Recibido Neto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-mono">
                      {db.payments.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-bold text-slate-900">{p.reciboNumero}</td>
                          <td className="p-3 font-bold text-indigo-950">{p.contratoId}</td>
                          <td className="p-3 font-sans text-slate-700 font-medium">{p.clienteNombre}</td>
                          <td className="p-3 text-slate-500">{p.fecha}</td>
                          <td className="p-3 text-right text-emerald-600">{formatRD(p.abonoCapital)}</td>
                          <td className="p-3 text-right text-slate-650">{formatRD(p.interesPagado)}</td>
                          <td className="p-3 text-right text-rose-500">{p.moraPagado > 0 ? formatRD(p.moraPagado) : '-'}</td>
                          <td className="p-3 text-right font-extrabold text-slate-950">{formatRD(p.montoPagado)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedReportType === 'financiamientos' && (
            <div className="space-y-6 animate-fade-in text-xs font-sans">
              <div className="bg-slate-50 -mx-6 -mt-6 p-4 rounded-t-2xl border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Reporte General de Cartera y Préstamos Emitidos</h3>
                <p className="text-[11px] text-slate-505">Historico de capital colocado para el financiamiento vehicular de República Dominicana.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs font-sans">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <span className="font-bold text-slate-450 uppercase text-[9px]">Créditos Colocados</span>
                  <p className="text-sm font-extrabold text-slate-900 mt-1">{db.contracts.length} Contratos aprobados</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <span className="font-bold text-slate-450 uppercase text-[9px]">Capital Original Prestado</span>
                  <p className="text-sm font-extrabold text-slate-900 font-mono mt-1">
                    {formatRD(db.contracts.reduce((a, b) => a + b.montoFinanciado, 0))}
                  </p>
                </div>
                <div className="bg-slate-900 text-white p-4 rounded-xl shadow">
                  <span className="font-bold text-emerald-400 uppercase text-[9px]">Saldo Activo por Recuperar</span>
                  <p className="text-sm font-extrabold text-emerald-400 font-mono mt-1">
                    {formatRD(db.contracts.reduce((a, b) => a + b.saldoPendiente, 0))}
                  </p>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Estructurado de Financiamientos Emitidos</h4>
                <div className="overflow-x-auto border border-slate-50 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[9px] border-b">
                      <tr>
                        <th className="p-3">Ref. Contrato</th>
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Garantía Vehicular</th>
                        <th className="p-3 text-right">Precio Venta</th>
                        <th className="p-3 text-right">Inicial Pago</th>
                        <th className="p-3 text-right">Financiado Real</th>
                        <th className="p-3 text-right">Saldo Insoluto</th>
                        <th className="p-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-mono">
                      {db.contracts.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-900">{c.id}</td>
                          <td className="p-3 font-sans text-slate-700 font-medium">{c.clienteNombre}</td>
                          <td className="p-3 font-sans text-slate-500 truncate max-w-[150px]">{c.vehiculoInfo}</td>
                          <td className="p-3 text-right">{formatRD(c.montoVenta)}</td>
                          <td className="p-3 text-right text-slate-600">{formatRD(c.inicial)}</td>
                          <td className="p-3 text-right text-emerald-600 font-bold">{formatRD(c.montoFinanciado)}</td>
                          <td className="p-3 text-right text-indigo-950 font-bold">{formatRD(c.saldoPendiente)}</td>
                          <td className="p-3 text-center">
                            <span className="font-sans font-bold text-[9px] uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {c.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
