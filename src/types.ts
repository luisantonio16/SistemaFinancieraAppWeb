export type UserRole = 'Administrador' | 'Cajero' | 'Gestor de cobros' | 'Supervisor';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  email: string;
  avatar: string;
}

export interface PersonalReference {
  nombre: string;
  telefono: string;
  relacion: string;
}

export interface AttachedDocument {
  id: string;
  nombre: string;
  tipo: string; // 'Cédula' | 'Matrícula' | 'Certificación' | 'Ingresos'
  fecha: string;
  tamano: string;
}

export interface Customer {
  id: string;
  nombre: string;
  cedula: string;
  direccion: string;
  telefono: string;
  email: string;
  referencias: PersonalReference[];
  estadoCrediticio: 'Excelente' | 'Normal' | 'En Observación' | 'Con Atrasos' | 'Legal';
  historialCredito: string; // Resumen del buró
  documentos: AttachedDocument[];
  fechaRegistro: string;
}

export interface Vehicle {
  id: string;
  marca: string;
  modelo: string;
  ano: number;
  color: string;
  chasis: string;
  placa: string;
  estado: 'Disponible' | 'Financiado' | 'En Revisión';
  valorVenta: number;
  valorFinanciadoMax: number;
  foto: string;
}

export interface AmortizationInstallment {
  numero: number;
  fechaVencimiento: string;
  montoCuota: number;
  montoCapital: number;
  montoInteres: number;
  montoMora: number;
  montoPagado: number;
  pendiente: number;
  estado: 'Pendiente' | 'Pagado' | 'Atrasado' | 'Parcial';
}

export interface Contract {
  id: string;
  clienteId: string;
  clienteNombre: string;
  vehiculoId: string;
  vehiculoInfo: string; // Marca Modelo Año
  montoVenta: number;
  inicial: number;
  montoFinanciado: number;
  tasaInteresAnual: number; // Porcentaje, ej. 18%
  plazoMeses: number; // Plazo en meses, ej 36
  cuotaMensual: number;
  saldoPendiente: number;
  estado: 'Activo' | 'Saldado' | 'Refinanciado' | 'En Mora';
  fechaInicio: string;
  tablaAmortizacion: AmortizationInstallment[];
  observaciones?: string;
}

export interface Payment {
  id: string;
  contratoId: string;
  clienteNombre: string;
  montoPagado: number;
  abonoCapital: number;
  interesPagado: number;
  moraPagado: number;
  fecha: string;
  tipo: 'Cuota' | 'Abono Extraordinario' | 'Saldar';
  reciboNumero: string;
  metodoPago: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Cheque';
  usuarioNombre: string;
  comentario?: string;
}

export interface CashTransaction {
  id: string;
  tipo: 'Ingreso' | 'Egreso';
  monto: number;
  descripcion: string;
  fecha: string;
  usuarioId: string;
  usuarioNombre: string;
}

export interface CashSession {
  id: string;
  fechaApertura: string;
  fechaCierre?: string;
  montoInicial: number;
  ingresos: number;
  egresos: number;
  montoEsperado: number;
  montoReal?: number;
  estado: 'Abierta' | 'Cerrada';
  usuarioId: string;
  usuarioNombre: string;
  transacciones: CashTransaction[];
}

export interface AuditLog {
  id: string;
  fecha: string;
  usuarioNombre: string;
  rol: UserRole;
  accion: string;
  detalle: string;
  modulo: 'Clientes' | 'Vehículos' | 'Financiamientos' | 'Caja' | 'Pagos' | 'Seguridad';
}

export interface FinancialAppDB {
  customers: Customer[];
  vehicles: Vehicle[];
  contracts: Contract[];
  payments: Payment[];
  cashSessions: CashSession[];
  auditLogs: AuditLog[];
  currentUser: User;
}
