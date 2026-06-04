import React, { useState } from 'react';
import { 
  FinancialAppDB, 
  User 
} from '../types';
import { 
  PRESET_USERS, 
  addAuditLog 
} from '../data';
import { 
  Shield, 
  UserCheck, 
  Lock, 
  Activity, 
  Search, 
  ListOrdered, 
  RefreshCw, 
  CheckCircle,
  Eye,
  Settings
} from 'lucide-react';

interface SeguridadProps {
  db: FinancialAppDB;
  onUpdateDb: (newDb: FinancialAppDB) => void;
}

export default function Seguridad({ db, onUpdateDb }: SeguridadProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Cambiar usuario / rol activo
  const handleSwapUser = (user: User) => {
    // 1. Log previous user exit
    let updatedDb = addAuditLog(
      db,
      'Seguridad',
      'Cierre de Sesión',
      `El usuario ${db.currentUser.name} (${db.currentUser.role}) cerró su sesión contable.`
    );

    // 2. Swapper user
    updatedDb = {
      ...updatedDb,
      currentUser: user
    };

    // 3. Log new user entrance
    updatedDb = addAuditLog(
      updatedDb,
      'Seguridad',
      'Inicio de Sesión',
      `Sesión iniciada con éxito por ${user.name} como ${user.role} en el sistema financiero.`
    );

    onUpdateDb(updatedDb);

    setSuccessMsg(`Sesión simulada iniciada exitosamente: Bienvenido ${user.name} (${user.role})`);
    setTimeout(() => {
      setSuccessMsg('');
    }, 4500);
  };

  // Filtrar logs de auditoría
  const filteredLogs = db.auditLogs.filter(log => {
    const matchesSearch = log.usuarioNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.detalle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === '' || log.modulo === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const getRoleBadgeClass = (rol: User['role']) => {
    switch(rol) {
      case 'Administrador': return 'bg-slate-900 text-white border-slate-900';
      case 'Supervisor': return 'bg-blue-500 text-white border-blue-550';
      case 'Cajero': return 'bg-emerald-500 text-white border-emerald-550';
      case 'Gestor de cobros': return 'bg-amber-500 text-white border-amber-550';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs font-sans" id="seguridad-workspace">
      {/* Toast de Éxito al cambiar cuenta */}
      {successMsg && (
        <div className="bg-emerald-650 text-white p-3.5 rounded-xl border border-emerald-500 shadow-xl font-bold text-center flex items-center justify-center gap-2 animate-bounce">
          <CheckCircle className="h-5 w-5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Cabecera Seguridad */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Usuarios, Seguridad y Roles</h1>
          <p className="text-[11px] text-slate-500">Asignación de privilegios contables, simulador de credenciales y bitácora integral de auditoría gubernamental.</p>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 flex items-center gap-1.5 font-bold text-slate-700">
          <Shield className="h-4 w-4 text-slate-900" />
          <span>Acceso Protegido</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulador de Ingreso Seguro de Usuarios (1 col) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4" id="simulador-login-panel">
          <div className="border-b border-slate-50 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-slate-700" />
              Simulador de Roles Financieros
            </h3>
            <p className="text-[11px] text-slate-450 mt-1">Intercambie perfiles para probar los diferentes niveles de auditoría y restricciones operativas.</p>
          </div>

          <div className="space-y-3">
            {PRESET_USERS.map((user) => {
              const worksCurrent = db.currentUser.id === user.id;
              return (
                <div 
                  key={user.id}
                  onClick={() => handleSwapUser(user)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 relative ${
                    worksCurrent 
                      ? 'border-slate-900 bg-slate-50 shadow-sm' 
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate text-[11px]">{user.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-semibold font-mono">{user.email}</p>
                    
                    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded mt-1.5 ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </div>

                  {worksCurrent && (
                    <span className="absolute top-3 right-3 bg-slate-900 text-emerald-400 text-[9px] p-1.5 rounded-lg font-bold font-mono uppercase tracking-wider scale-95 flex items-center gap-1">
                      <Settings className="h-3.5 w-3.5 animate-spin" />
                      <span>Activo</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Permisos segun rol explicados */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 leading-relaxed">
            <h4 className="font-bold text-slate-900 text-[10px] uppercase tracking-wider">Permisos según Rol Seleccionado:</h4>
            <ul className="space-y-1 text-[10px] text-slate-600 list-disc list-inside">
              <li><strong>Administrador:</strong> Acceso ilimitado, creación de contratos, cuadre de caja total y reportes.</li>
              <li><strong>Cajero:</strong> Cobro de cuotas, generación de recibos, aperturas y cierres de caja.</li>
              <li><strong>Gestor de cobros:</strong> Llamadas de cobranza, bitácora de morosidad y envío de alertas automáticas.</li>
              <li><strong>Supervisor:</strong> Modificación de tasas, refinanciamientos de contratos y supervisión.</li>
            </ul>
          </div>
        </div>

        {/* Bitácora de Auditoría Completa (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4" id="bitacora-auditoria-panel">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-slate-950 animate-pulse" />
              Bitácora Histórica de Auditoría de Acciones
            </h3>

            {/* Filtros de la bitácora */}
            <div className="flex gap-2 w-full sm:w-auto">
              <select 
                value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 p-1.5 rounded-xl text-[10px] outline-none"
              >
                <option value="">Todos los Módulos</option>
                <option value="Clientes">Clientes</option>
                <option value="Vehículos">Vehículos</option>
                <option value="Financiamientos">Financiamientos</option>
                <option value="Caja">Caja</option>
                <option value="Pagos">Pagos</option>
                <option value="Seguridad">Seguridad</option>
              </select>

              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar audit logs..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-slate-50 border border-slate-205 pl-7 pr-3 py-1 text-[10px] rounded-xl focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Listado de auditoría tabla */}
          <div className="overflow-x-auto border border-slate-50 rounded-xl">
            <table className="w-full text-[11px] text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-widest text-[9px]">
                <tr>
                  <th className="p-3">Audit ID</th>
                  <th className="p-3">Marca Temporal</th>
                  <th className="p-3">Módulo</th>
                  <th className="p-3">Funcionario / Actor</th>
                  <th className="p-3">Acción Fiscalizada</th>
                  <th className="p-3">Evidencia / Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-mono">
                {filteredLogs.map(log => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-900">{log.id}</td>
                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.fecha).toLocaleString('es-DO', { 
                          year: 'numeric', 
                          month: 'numeric', 
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                          second: 'numeric'
                        })}
                      </td>
                      <td className="p-3 font-sans font-bold">
                        <span className="bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded uppercase text-[9px]">
                          {log.modulo}
                        </span>
                      </td>
                      <td className="p-3 font-sans font-semibold text-slate-705">
                        <p>{log.usuarioNombre}</p>
                        <span className="text-[9px] text-slate-400 font-normal">({log.rol})</span>
                      </td>
                      <td className="p-3 font-sans font-bold text-indigo-950">{log.accion}</td>
                      <td className="p-3 font-sans text-slate-600 leading-relaxed text-[11px]">{log.detalle}</td>
                    </tr>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 italic">No se registran bitácoras de auditoría para los filtros declarados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
