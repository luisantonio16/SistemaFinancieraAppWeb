import React, { useState } from 'react';
import { 
  FinancialAppDB 
} from '../types';
import { 
  Users, 
  FileText, 
  Clock, 
  DollarSign, 
  Car, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  db: FinancialAppDB;
  onSetTab: (tab: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function Dashboard({ db, onSetTab }: DashboardProps) {
  // Cálculos dinámicos basados en la base de datos de localStorage
  const totalClientes = db.customers.length;
  
  // Préstamos vigentes
  const contratosActivos = db.contracts.filter(c => c.estado === 'Activo' || c.estado === 'En Mora');
  const totalPrestamosVigentes = contratosActivos.length;
  
  // Vehículos financiados
  const vehiculosFinanciados = db.vehicles.filter(v => v.estado === 'Financiado').length;
  
  // Cuotas vencidas
  let totalCuotasVencidas = 0;
  let montoVencidoTotal = 0;
  
  contratosActivos.forEach(c => {
    c.tablaAmortizacion.forEach(cuota => {
      if (cuota.estado === 'Atrasado' || (cuota.estado === 'Pendiente' && new Date(cuota.fechaVencimiento) < new Date())) {
        totalCuotasVencidas++;
        montoVencidoTotal += cuota.pendiente;
      }
    });
  });

  // Pagos recibidos el día de hoy (basado en la fecha actual simulada)
  const hoyStr = '2026-06-04'; // Fecha en los metadatos de la sesión
  const pagosHoy = db.payments.filter(p => p.fecha.startsWith(hoyStr));
  const montoPagosHoy = pagosHoy.reduce((acc, p) => acc + p.montoPagado, 0);

  // Cartera total de financiamiento (Monto financiado original de contratos vigentes)
  const carteraTotal = contratosActivos.reduce((acc, c) => acc + c.saldoPendiente, 0);

  // Capital prestado acumulado
  const capitalOriginalPrestado = contratosActivos.reduce((acc, c) => acc + c.montoFinanciado, 0);

  // Tasa de morosidad (Monto vencido / Cartera total) * 100
  const tasaMorosidad = carteraTotal > 0 ? (montoVencidoTotal / carteraTotal) * 100 : 0;

  // Formateador de moneda en Pesos Dominicanos
  const formatRD = (value: number) => {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(value);
  };

  // Datos para los gráficos simulados basados en el histórico de contratos y cuotas
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  // Ingresos reales cobrados (intereses pagados + mora pagada)
  const ingresosData = [35000, 65000, 95000, 125000, 142000, 185000];
  // Cobranzas reales (capital recibido)
  const cobranzasData = [120000, 240000, 380000, 480000, 520000, 680000];
  // Morosidad acumulada estimada por mes
  const morosidadData = [2.1, 1.8, 2.5, 3.2, 4.5, tasaMorosidad];

  const maxIngreso = Math.max(...ingresosData);
  const maxCobranza = Math.max(...cobranzasData);

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Cabecera del Dashboard */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden"
      >
        <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="z-10">
          <h1 className="text-2xl font-black tracking-tight" id="dashboard-title">Panel de Control Financiero</h1>
          <p className="text-indigo-200 text-xs font-semibold mt-1">Monitoreo de cartera, indicadores clave (KPI) y cobros activos en tiempo real.</p>
        </div>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="z-10 flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2.5 rounded-xl shadow-lg font-mono text-xs font-extrabold cursor-pointer border border-amber-300 transition-colors"
        >
          <Activity className="h-4 w-4 animate-spin text-slate-950" />
          <span>Faja Caja Activa: {formatRD(db.cashSessions.find(s => s.estado === 'Abierta')?.montoEsperado || 0)}</span>
        </motion.div>
      </motion.div>

      {/* Grid de KPIs principales */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" 
        id="kpi-grid"
      >
        {/* KPI 1: Clientes Activos */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -5, scale: 1.02 }}
          onClick={() => onSetTab('clientes')}
          className="bg-gradient-to-br from-white to-blue-50/40 border-l-4 border-blue-600 p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group relative overflow-hidden"
          id="kpi-active-customers"
        >
          <div className="flex justify-between items-start">
            <div className="bg-blue-600/10 p-3 rounded-xl group-hover:bg-blue-600/20 transition-colors">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-blue-500 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-4">Clientes Registrados</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight mt-1">{totalClientes}</p>
          <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-2">
            +2 Registros hoy
          </span>
        </motion.div>

        {/* KPI 2: Préstamos Vigentes */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -5, scale: 1.02 }}
          onClick={() => onSetTab('financiamientos')}
          className="bg-gradient-to-br from-white to-emerald-50/40 border-l-4 border-emerald-500 p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group relative overflow-hidden"
          id="kpi-active-loans"
        >
          <div className="flex justify-between items-start">
            <div className="bg-emerald-600/10 p-3 rounded-xl group-hover:bg-emerald-600/20 transition-colors">
              <FileText className="h-6 w-6 text-emerald-600" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-4">Préstamos Activos</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight mt-1">{totalPrestamosVigentes}</p>
          <span className="bg-indigo-500/10 text-indigo-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-2">
            Amortización Activa
          </span>
        </motion.div>

        {/* KPI 3: Cuotas Vencidas */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -5, scale: 1.02 }}
          onClick={() => onSetTab('cuotas-cobrar')}
          className="bg-gradient-to-br from-white to-rose-50/40 border-l-4 border-rose-500 p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group relative overflow-hidden"
          id="kpi-overdue-installments"
        >
          <div className="flex justify-between items-start">
            <div className="bg-rose-650/10 p-3 rounded-xl group-hover:bg-rose-650/20 transition-colors">
              <Clock className="h-6 w-6 text-rose-600 animate-pulse" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-rose-500 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-4">Cuotas Vencidas</p>
          <p className="text-3xl font-black text-rose-650 tracking-tight mt-1">{totalCuotasVencidas}</p>
          <span className="bg-rose-500/10 text-rose-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full inline-block mt-2">
            {formatRD(montoVencidoTotal)} en atrasos
          </span>
        </motion.div>

        {/* KPI 4: Pagos Recibidos del día */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -5, scale: 1.02 }}
          onClick={() => onSetTab('cobros')}
          className="bg-gradient-to-br from-white to-amber-50/45 border-l-4 border-amber-500 p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group relative overflow-hidden"
          id="kpi-today-payments"
        >
          <div className="flex justify-between items-start">
            <div className="bg-amber-600/10 p-3 rounded-xl group-hover:bg-amber-600/20 transition-colors">
              <DollarSign className="h-6 w-6 text-amber-600" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-amber-500 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-4">Cobraron Hoy</p>
          <p className="text-2xl font-black text-slate-900 tracking-tight mt-1 truncate">{formatRD(montoPagosHoy)}</p>
          <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-2">
            {pagosHoy.length} Transacciones
          </span>
        </motion.div>

        {/* KPI 5: Vehículos Financiados */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -5, scale: 1.02 }}
          onClick={() => onSetTab('vehiculos')}
          className="bg-gradient-to-br from-white to-indigo-50/40 border-l-4 border-indigo-500 p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group relative overflow-hidden"
          id="kpi-financed-vehicles"
        >
          <div className="flex justify-between items-start">
            <div className="bg-indigo-600/10 p-3 rounded-xl group-hover:bg-indigo-600/20 transition-colors">
              <Car className="h-6 w-6 text-indigo-600" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-indigo-500 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-4">Vehículos Financiados</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight mt-1">{vehiculosFinanciados}</p>
          <span className="bg-slate-100 text-slate-500 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-2">
            De {db.vehicles.length} en Inventario
          </span>
        </motion.div>
      </motion.div>

      {/* Grid de Gráficas y Métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="charts-and-metrics-sec">
        {/* Gráfica de Ingresos y Cobranza */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white border border-slate-100 shadow-sm p-6 rounded-3xl lg:col-span-2 space-y-6" 
          id="income-collection-card"
        >
          <div className="flex justify-between items-center bg-slate-50/80 -mx-6 -mt-6 p-5 rounded-t-3xl border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Histórico de Ingresos vs Cobranza (RD$)</h3>
              <p className="text-[11px] font-semibold text-slate-400">Intereses y mora cobrados frente al amortizable recibido mensualmente.</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-indigo-650 rounded-full inline-block"></span>Intereses</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span>Cobrado</span>
            </div>
          </div>

          {/* Gráfico SVG interactivo hecho a mano con barras animadas */}
          <div className="h-64 flex items-end justify-between gap-2 pt-6 relative" id="svg-chart-container">
            {/* Grid background lines */}
            <div className="absolute inset-x-0 top-0 h-full flex flex-col justify-between pointer-events-none text-[10px] text-slate-300 font-mono">
              <div className="border-b border-dashed border-slate-100 w-full pt-2"></div>
              <div className="border-b border-dashed border-slate-100 w-full"></div>
              <div className="border-b border-dashed border-slate-100 w-full"></div>
              <div className="border-b border-dashed border-slate-200/60 w-full"></div>
            </div>

            {meses.map((mes, idx) => {
              // Alturas porcentuales
              const hIngreso = (ingresosData[idx] / maxCobranza) * 100;
              const hCobranza = (cobranzasData[idx] / maxCobranza) * 100;

              return (
                <div key={mes} className="flex-1 flex flex-col items-center justify-end h-full z-10 group relative">
                  <div className="flex items-end justify-center gap-1.5 w-full h-full pb-2">
                    {/* Barra de Ingreso (Interés) */}
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(4, hIngreso)}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.05, ease: "easeOut" }}
                      className="w-1/3 bg-indigo-650 rounded-t-md group-hover:bg-indigo-600 transition-colors relative shadow-sm"
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl z-20 whitespace-nowrap mb-1">
                        Int: {formatRD(ingresosData[idx])}
                      </div>
                    </motion.div>
                    {/* Barra de Cobranza (Capital) */}
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(4, hCobranza)}%` }}
                      transition={{ duration: 1.0, delay: idx * 0.05, ease: "easeOut" }}
                      className="w-1/3 bg-emerald-500 rounded-t-md group-hover:bg-emerald-400 transition-colors relative shadow-sm"
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-emerald-600 border border-emerald-700 text-white text-[10px] font-bold py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl z-20 whitespace-nowrap mb-1">
                        Cap: {formatRD(cobranzasData[idx])}
                      </div>
                    </motion.div>
                  </div>
                  <span className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider mt-2 bg-slate-100 px-2 py-0.5 rounded-full">{mes}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Gráfico de Morosidad & KPI Circular */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white border border-slate-100 shadow-sm p-6 rounded-3xl flex flex-col justify-between" 
          id="morosity-kpi-card"
        >
          <div className="bg-slate-50/80 -mx-6 -mt-6 p-5 rounded-t-3xl border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900">Índice de Morosidad Reciente</h3>
            <p className="text-[11px] font-semibold text-slate-400">Porcentaje de cartera en mora de toda la financiera.</p>
          </div>

          <div className="py-6 flex flex-col sm:flex-row items-center justify-around gap-6" id="donut-overdue-rate">
            <div className="relative w-32 h-32 flex items-center justify-center bg-slate-50 rounded-full p-2 border border-slate-100 shadow-inner">
              {/* Círculo de porcentaje animado */}
              <svg className="w-full h-full -rotate-90">
                <circle 
                  cx="64" cy="64" r="54" 
                  className="stroke-slate-200 fill-none" 
                  strokeWidth="8"
                />
                <motion.circle 
                  cx="64" cy="64" r="54" 
                  className="stroke-rose-500 fill-none transition-all duration-500" 
                  strokeWidth="10"
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - (tasaMorosidad || 3.5) / 100) }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  strokeDasharray={`${2 * Math.PI * 54}`}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-rose-650 tracking-tight">{tasaMorosidad.toFixed(1)}%</span>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Mora Total</span>
              </div>
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 bg-indigo-650 rounded-full shadow"></span>
                <span className="text-slate-500 font-semibold">Cartera Activa:</span>
              </div>
              <p className="text-sm font-extrabold text-slate-800 font-mono pl-5">{formatRD(carteraTotal)}</p>
              
              <div className="flex items-center gap-2 text-xs pt-1">
                <span className="w-3 h-3 bg-rose-550 rounded-full shadow animate-pulse"></span>
                <span className="text-slate-500 font-semibold">En Atraso:</span>
              </div>
              <p className="text-sm font-extrabold text-rose-600 font-mono pl-5">{formatRD(montoVencidoTotal)}</p>
              
              <div className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg py-1 px-2 font-bold inline-block mt-2">
                Zona segura: &lt; 5.0%
              </div>
            </div>
          </div>

          {/* Línea de tendencia mensual en morosidad */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold text-slate-700 mb-2.5">Evolución Trimestral de Atraso:</p>
            <div className="flex justify-between items-center gap-1.5 bg-slate-50 border border-slate-100 p-3 rounded-2xl font-mono text-[11px] text-slate-500">
              {meses.map((m, idx) => (
                <div key={m} className="flex flex-col items-center flex-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{m}</span>
                  <span className={`font-extrabold mt-0.5 ${morosidadData[idx] > 4 ? 'text-rose-500' : 'text-slate-600'}`}>
                    {morosidadData[idx].toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Secciones de Alertas Financieras, Acciones Rápidas y Últimos Movimientos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="bottom-dash-grid">
        {/* Ultimas transacciones de cobros recibidas */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6" 
          id="latest-payments-panel"
        >
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
              Últimos Cobros Registrados
            </h3>
            <button 
              onClick={() => onSetTab('cobros')}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
            >
              Ver todos ({db.payments.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {db.payments.slice(0, 4).map((p) => (
              <div key={p.id} className="py-3 flex justify-between items-center text-xs hover:bg-slate-50 px-2 rounded-xl transition-colors">
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-900">{p.clienteNombre}</p>
                  <div className="flex items-center gap-2 text-slate-400 font-semibold">
                    <span className="font-mono bg-indigo-50 text-indigo-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                      {p.metodoPago}
                    </span>
                    <span>{p.fecha}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-black text-emerald-600">{formatRD(p.montoPagado)}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{p.tipo}</p>
                </div>
              </div>
            ))}
            {db.payments.length === 0 && (
              <p className="text-center text-slate-400 py-6 text-xs font-semibold">Ningún cobro registrado todavía.</p>
            )}
          </div>
        </motion.div>

        {/* Auditoría / Actividad reciente del sistema */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6" 
          id="system-audit-panel"
        >
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-indigo-650" />
              Actividad Reciente del Sistema
            </h3>
            <button 
              onClick={() => onSetTab('seguridad')}
              className="text-xs font-bold text-indigo-750 hover:text-indigo-900 underline cursor-pointer"
            >
              Auditoría Completa
            </button>
          </div>

          <div className="space-y-3.5">
            {db.auditLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="flex gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-indigo-650 mt-1.5 shrink-0 animate-ping"></div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="font-extrabold text-slate-800">{log.accion}</span>
                    <span className="text-[10px] text-slate-400 font-semibold font-mono">
                      {new Date(log.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] font-medium leading-relaxed">{log.detalle}</p>
                  <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{log.usuarioNombre}</span>
                    <span>• {log.rol}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
