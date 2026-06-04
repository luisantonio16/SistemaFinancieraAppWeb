import { 
  Customer, 
  Vehicle, 
  Contract, 
  Payment, 
  CashSession, 
  AuditLog, 
  User, 
  AmortizationInstallment,
  FinancialAppDB
} from './types';

// Helper: Generador de tabla de amortización (Método Francés / Saldo Insoluto)
export function generarTablaAmortizacion(
  montoFinanciado: number,
  tasaAnual: number,
  plazoMeses: number,
  fechaInicioStr: string
): AmortizationInstallment[] {
  const tabla: AmortizationInstallment[] = [];
  const tasaMensual = (tasaAnual / 100) / 12;
  
  // Cálculo de cuota nivelada (fórmula de anualidad PMT)
  let montoCuota = 0;
  if (tasaMensual > 0) {
    montoCuota = (montoFinanciado * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -plazoMeses));
  } else {
    montoCuota = montoFinanciado / plazoMeses;
  }
  
  // Redondear a decimal estándar
  montoCuota = Math.round(montoCuota * 100) / 100;
  
  let balancePendiente = montoFinanciado;
  let fechaActual = new Date(fechaInicioStr);
  
  for (let i = 1; i <= plazoMeses; i++) {
    // Siguiente mes de vencimiento
    fechaActual.setMonth(fechaActual.getMonth() + 1);
    const fechaVencimiento = fechaActual.toISOString().split('T')[0];
    
    const interesMes = Math.round((balancePendiente * tasaMensual) * 100) / 100;
    let capitalMes = Math.round((montoCuota - interesMes) * 100) / 100;
    
    if (i === plazoMeses) {
      // Ajuste final para saldar exactamente
      capitalMes = Math.round(balancePendiente * 100) / 100;
      montoCuota = capitalMes + interesMes;
    }
    
    balancePendiente = Math.max(0, Math.round((balancePendiente - capitalMes) * 100) / 100);
    
    tabla.push({
      numero: i,
      fechaVencimiento,
      montoCuota,
      montoCapital: capitalMes,
      montoInteres: interesMes,
      montoMora: 0,
      montoPagado: 0,
      pendiente: montoCuota,
      estado: 'Pendiente'
    });
  }
  
  return tabla;
}

// Usuarios predefinidos (Simulador de roles)
export const PRESET_USERS: User[] = [
  {
    id: 'usr1',
    name: 'Ing. Alejandro Almonte',
    username: 'aalmonte',
    role: 'Administrador',
    email: 'a.almonte@autofinanzas.do',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'usr2',
    name: 'Yudelka Pérez',
    username: 'yperez',
    role: 'Cajero',
    email: 'y.perez@autofinanzas.do',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'usr3',
    name: 'Franklin Ortiz',
    username: 'fortiz',
    role: 'Gestor de cobros',
    email: 'f.ortiz@autofinanzas.do',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'usr4',
    name: 'Lic. Miriam De Castro',
    username: 'mcastro',
    role: 'Supervisor',
    email: 'm.castro@autofinanzas.do',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop'
  }
];

// Clientes Iniciales Dominicos
const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cli-1',
    nombre: 'Juan Ramón Almonte Díaz',
    cedula: '001-1824915-3',
    direccion: 'Av. Winston Churchill #105, Ensanche Piantini, Santo Domingo',
    telefono: '809-567-2291',
    email: 'juan.almonte@gmail.com',
    referencias: [
      { nombre: 'Ing. Pedro Almonte Díaz', telefono: '829-334-1102', relacion: 'Hermano' },
      { nombre: 'Carmen Rodríguez Estévez', telefono: '809-224-8891', relacion: 'Esposa / Fiadora' }
    ],
    estadoCrediticio: 'Excelente',
    historialCredito: 'Puntaje Transunion: 785. Excelente comportamiento de pago en créditos comerciales. Sin atrasos reportados.',
    documentos: [
      { id: 'doc-1_1', nombre: 'Cedula_Anverso_Reverso.pdf', tipo: 'Cédula', fecha: '2026-01-10', tamano: '1.2 MB' },
      { id: 'doc-1_2', nombre: 'Certificacion_Ingresos_BHD.pdf', tipo: 'Ingresos', fecha: '2026-01-10', tamano: '840 KB' }
    ],
    fechaRegistro: '2026-01-10'
  },
  {
    id: 'cli-2',
    nombre: 'María Mercedes Rodríguez Peña',
    cedula: '402-2345671-8',
    direccion: 'Calle El Sol #45, Villa Olga, Santiago de los Caballeros',
    telefono: '829-451-9922',
    email: 'maria.m.rodriguez@hotmail.com',
    referencias: [
      { nombre: 'Clara Peña de Rodríguez', telefono: '849-221-7733', relacion: 'Madre' }
    ],
    estadoCrediticio: 'Normal',
    historialCredito: 'Puntaje Transunion: 690. Buen historial general. Registra un atraso menor de 15 días hace un año, ya solventado.',
    documentos: [
      { id: 'doc-2_1', nombre: 'Cedula_Maria_R.pdf', tipo: 'Cédula', fecha: '2026-02-15', tamano: '950 KB' },
      { id: 'doc-2_2', nombre: 'Matricula_Original_Garantia.pdf', tipo: 'Matrícula', fecha: '2026-02-15', tamano: '2.1 MB' }
    ],
    fechaRegistro: '2026-02-15'
  },
  {
    id: 'cli-3',
    nombre: 'Carlos Manuel Tejeda Santana',
    cedula: '002-0192348-1',
    direccion: 'C/ Primera #12, Res. Amapola, Santo Domingo Este',
    telefono: '849-883-4556',
    email: 'carlos.tejeda@outlook.com',
    referencias: [
      { nombre: 'Carlos Tejeda Padre', telefono: '809-543-9811', relacion: 'Padre' }
    ],
    estadoCrediticio: 'Con Atrasos',
    historialCredito: 'Puntaje Transunion: 540. Alertas activas por atrasos en tarjetas de crédito vigentes. Requiere supervisión rigurosa.',
    documentos: [
      { id: 'doc-3_1', nombre: 'Cedula_C_Tejeda.pdf', tipo: 'Cédula', fecha: '2026-03-01', tamano: '1.1 MB' }
    ],
    fechaRegistro: '2026-03-01'
  },
  {
    id: 'cli-4',
    nombre: 'Yudelka De Los Santos Guerrero',
    cedula: '012-4432109-5',
    direccion: 'Calle Principal #4B, Barrio Lindo, San Pedro de Macorís',
    telefono: '829-715-4433',
    email: 'yudelkasg@gmail.com',
    referencias: [
      { nombre: 'José De Los Santos', telefono: '809-223-9988', relacion: 'Tío' }
    ],
    estadoCrediticio: 'En Observación',
    historialCredito: 'Puntaje Transunion: 610. Capacidad de endeudamiento al límite, bajo seguimiento de nómina formal.',
    documentos: [
      { id: 'doc-4_1', nombre: 'Cedula_Yudelka.pdf', tipo: 'Cédula', fecha: '2026-04-20', tamano: '1.4 MB' },
      { id: 'doc-4_2', nombre: 'Estados_Cuenta_Banreservas.pdf', tipo: 'Ingresos', fecha: '2026-04-20', tamano: '3.5 MB' }
    ],
    fechaRegistro: '2026-04-20'
  }
];

// Vehículos Iniciales
const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'veh-1',
    marca: 'Toyota',
    modelo: 'Hilux Double Cab 4x4',
    ano: 2021,
    color: 'Gris Metálico',
    chasis: 'MROFC12G20078129',
    placa: 'L410892',
    estado: 'Financiado',
    valorVenta: 2450000,
    valorFinanciadoMax: 1960000, // 80%
    foto: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'veh-2',
    marca: 'Honda',
    modelo: 'Civic EX T',
    ano: 2018,
    color: 'Blanco Perla',
    chasis: '1HGFC1F34JA01948',
    placa: 'A792193',
    estado: 'Financiado',
    valorVenta: 1150000,
    valorFinanciadoMax: 920000,
    foto: 'https://images.unsplash.com/photo-1606577924046-27d059e34f59?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'veh-3',
    marca: 'Hyundai',
    modelo: 'Sonata LF',
    ano: 2017,
    color: 'Gris Plateado',
    chasis: '5NPE24AF3HH019482',
    placa: 'A883452',
    estado: 'Disponible',
    valorVenta: 780000,
    valorFinanciadoMax: 624000,
    foto: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'veh-4',
    marca: 'Kia',
    modelo: 'K5 LPI',
    ano: 2016,
    color: 'Negro Brillante',
    chasis: 'KNAGN415BGA019385',
    placa: 'A923841',
    estado: 'Disponible',
    valorVenta: 720000,
    valorFinanciadoMax: 576000,
    foto: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'veh-5',
    marca: 'Toyota',
    modelo: 'Rav4 XLE AWD',
    ano: 2020,
    color: 'Azul Eléctrico',
    chasis: 'JTMDFRFV5LD091238',
    placa: 'G502412',
    estado: 'Disponible',
    valorVenta: 1980000,
    valorFinanciadoMax: 1584000,
    foto: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'veh-6',
    marca: 'Suzuki',
    modelo: 'Grand Vitara GLX',
    ano: 2019,
    color: 'Rojo Vino',
    chasis: 'JS3JTDA4V00194821',
    placa: 'G412093',
    estado: 'Financiado',
    valorVenta: 1250000,
    valorFinanciadoMax: 1000000,
    foto: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=600&auto=format&fit=crop'
  }
];

// Contratos de Financiamientos Iniciales
// Generaremos tablas de amortización calculadas con fecha de inicio real de hace unos meses
const getInitialContracts = (): Contract[] => {
  // Contrato 1: Juan Almonte - Toyota Hilux
  // Fecha inicio: 2026-01-15, Plazo: 24 meses, Tasa 18%, Monto: 1,800,000 (Inicial: 650,000)
  const c1Tabla = generarTablaAmortizacion(1800000, 18, 24, '2026-01-15');
  // Simulamos que ya pagó las cuotas de febrero, marzo, abril y mayo (4 cuotas pagadas)
  for (let i = 0; i < 4; i++) {
    c1Tabla[i].montoPagado = c1Tabla[i].montoCuota;
    c1Tabla[i].pendiente = 0;
    c1Tabla[i].estado = 'Pagado';
  }
  
  // Contrato 2: María Rodríguez - Honda Civic
  // Fecha inicio: 2026-02-20, Plazo: 36 meses, Tasa 16%, Monto: 800,000 (Inicial: 350,000)
  const c2Tabla = generarTablaAmortizacion(800000, 16, 36, '2026-02-20');
  // Pagó febrero, marzo, abril (3 cuotas)
  for (let i = 0; i < 3; i++) {
    c2Tabla[i].montoPagado = c2Tabla[i].montoCuota;
    c2Tabla[i].pendiente = 0;
    c2Tabla[i].estado = 'Pagado';
  }
  
  // Contrato 3: Carlos Tejeda - Suzuki Grand Vitara
  // Fecha inicio: 2026-03-05, Plazo: 12 meses, Tasa 22%, Monto: 900,000 (Inicial: 350,000)
  const c3Tabla = generarTablaAmortizacion(900000, 22, 12, '2026-03-05');
  // Pagó marzo, abril (2 cuotas). Mayo (Vence 2026-06-05) está pendiente o atrasado.
  // Pero la fecha actual es 2026-06-04T18:57:15Z.
  // Oh, la cuota del 2026-05-05 no ha sido saldada: Estado: Atrasado, con recargo de mora.
  c3Tabla[0].montoPagado = c3Tabla[0].montoCuota;
  c3Tabla[0].pendiente = 0;
  c3Tabla[0].estado = 'Pagado';
  
  c3Tabla[1].estado = 'Atrasado';
  c3Tabla[1].montoMora = 1500; // Recargo por mora RD$ 1,500
  c3Tabla[1].pendiente = c3Tabla[1].montoCuota + 1500;
  
  const cont1: Contract = {
    id: 'CON-001',
    clienteId: 'cli-1',
    clienteNombre: 'Juan Ramón Almonte Díaz',
    vehiculoId: 'veh-1',
    vehiculoInfo: 'Toyota Hilux Double Cab 4x4 (2021)',
    montoVenta: 2450000,
    inicial: 650000,
    montoFinanciado: 1800000,
    tasaInteresAnual: 18,
    plazoMeses: 24,
    cuotaMensual: c1Tabla[0].montoCuota,
    saldoPendiente: 1800000 - c1Tabla[0].montoCapital - c1Tabla[1].montoCapital - c1Tabla[2].montoCapital - c1Tabla[3].montoCapital,
    estado: 'Activo',
    fechaInicio: '2026-01-15',
    tablaAmortizacion: c1Tabla,
    observaciones: 'Cliente Preferencial. El vehículo se entrega con GPS instalado por seguridad.'
  };

  const cont2: Contract = {
    id: 'CON-002',
    clienteId: 'cli-2',
    clienteNombre: 'María Mercedes Rodríguez Peña',
    vehiculoId: 'veh-2',
    vehiculoInfo: 'Honda Civic EX T (2018)',
    montoVenta: 1150000,
    inicial: 350000,
    montoFinanciado: 800000,
    tasaInteresAnual: 16,
    plazoMeses: 36,
    cuotaMensual: c2Tabla[0].montoCuota,
    saldoPendiente: 800000 - c2Tabla[0].montoCapital - c2Tabla[1].montoCapital - c2Tabla[2].montoCapital,
    estado: 'Activo',
    fechaInicio: '2026-02-20',
    tablaAmortizacion: c2Tabla
  };

  const cont3: Contract = {
    id: 'CON-003',
    clienteId: 'cli-3',
    clienteNombre: 'Carlos Manuel Tejeda Santana',
    vehiculoId: 'veh-6',
    vehiculoInfo: 'Suzuki Grand Vitara GLX (2019)',
    montoVenta: 1250000,
    inicial: 350000,
    montoFinanciado: 900000,
    tasaInteresAnual: 22,
    plazoMeses: 12,
    cuotaMensual: c3Tabla[0].montoCuota,
    saldoPendiente: 900000 - c3Tabla[0].montoCapital,
    estado: 'En Mora',
    fechaInicio: '2026-03-05',
    tablaAmortizacion: c3Tabla,
    observaciones: 'Requiere seguimiento telefónico prioritario.'
  };

  return [cont1, cont2, cont3];
};

// Historial de Pagos Iniciales
const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'PAG-0001',
    contratoId: 'CON-001',
    clienteNombre: 'Juan Ramón Almonte Díaz',
    montoPagado: 89794.40, // Cuota calculada aprox
    abonoCapital: 62794.40,
    interesPagado: 27000.00,
    moraPagado: 0,
    fecha: '2026-02-14',
    tipo: 'Cuota',
    reciboNumero: 'RC-2026-0001',
    metodoPago: 'Transferencia',
    usuarioNombre: 'Yudelka Pérez',
    comentario: 'Cuota 1/24'
  },
  {
    id: 'PAG-0002',
    contratoId: 'CON-001',
    clienteNombre: 'Juan Ramón Almonte Díaz',
    montoPagado: 89794.40,
    abonoCapital: 63736.31,
    interesPagado: 26058.09,
    moraPagado: 0,
    fecha: '2026-03-15',
    tipo: 'Cuota',
    reciboNumero: 'RC-2026-0002',
    metodoPago: 'Transferencia',
    usuarioNombre: 'Yudelka Pérez',
    comentario: 'Cuota 2/24'
  },
  {
    id: 'PAG-0003',
    contratoId: 'CON-002',
    clienteNombre: 'María Mercedes Rodríguez Peña',
    montoPagado: 28121.75,
    abonoCapital: 17455.08,
    interesPagado: 10666.67,
    moraPagado: 0,
    fecha: '2026-03-20',
    tipo: 'Cuota',
    reciboNumero: 'RC-2026-0003',
    metodoPago: 'Tarjeta',
    usuarioNombre: 'Yudelka Pérez',
    comentario: 'Cuota 1/36'
  },
  {
    id: 'PAG-0004',
    contratoId: 'CON-003',
    clienteNombre: 'Carlos Manuel Tejeda Santana',
    montoPagado: 84313.40,
    abonoCapital: 67813.40,
    interesPagado: 16500.00,
    moraPagado: 0,
    fecha: '2026-04-05',
    tipo: 'Cuota',
    reciboNumero: 'RC-2026-0004',
    metodoPago: 'Efectivo',
    usuarioNombre: 'Yudelka Pérez',
    comentario: 'Cuota 1/12'
  }
];

// Caja Sesion Activa el día de hoy
const INITIAL_CASH_SESSIONS: CashSession[] = [
  {
    id: 'CJ-2026-05',
    fechaApertura: '2026-06-04T07:30:00Z',
    montoInicial: 50000, // Fondo fijo de caja de RD$ 50,000
    ingresos: 84313.40, // Monto de pagos cobrados en el día
    egresos: 12000, // Gasto de mensajería u oficina
    montoEsperado: 122313.40, // 50000 + 84313.40 - 12000
    estado: 'Abierta',
    usuarioId: 'usr2',
    usuarioNombre: 'Yudelka Pérez',
    transacciones: [
      {
        id: 'TX-001',
        tipo: 'Ingreso',
        monto: 84313.40,
        descripcion: 'Pago recibido cuota regular Contrato CON-003 - Carlos Tejeda',
        fecha: '2026-06-04T09:15:00Z',
        usuarioId: 'usr2',
        usuarioNombre: 'Yudelka Pérez'
      },
      {
        id: 'TX-002',
        tipo: 'Egreso',
        monto: 12000,
        descripcion: 'Pago de combustible para cobrador Franklin Ortiz (Supervisor Miriam aprobó)',
        fecha: '2026-06-04T11:00:00Z',
        usuarioId: 'usr2',
        usuarioNombre: 'Yudelka Pérez'
      }
    ]
  }
];

// Bitácora de Auditoría Inicial
const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-001',
    fecha: '2026-06-04T07:30:00Z',
    usuarioNombre: 'Yudelka Pérez',
    rol: 'Cajero',
    accion: 'Apertura de Caja',
    detalle: 'Apertura de caja con fondo inicial de RD$ 50,000.00',
    modulo: 'Caja'
  },
  {
    id: 'LOG-002',
    fecha: '2026-06-04T09:16:00Z',
    usuarioNombre: 'Yudelka Pérez',
    rol: 'Cajero',
    accion: 'Cobro de Cuota',
    detalle: 'Se registró pago de RD$ 84,313.40 correspondiente a la cuota #1 del contrato CON-003',
    modulo: 'Pagos'
  },
  {
    id: 'LOG-003',
    fecha: '2026-06-04T10:45:00Z',
    usuarioNombre: 'Ing. Alejandro Almonte',
    rol: 'Administrador',
    accion: 'Creación de Vehículo',
    detalle: 'Se registró un nuevo vehículo en inventario: Toyota Rav4 XLE 2020',
    modulo: 'Vehículos'
  }
];

// Inicialización de la base de datos local en LocalStorage
const LOCAL_STORAGE_KEY = 'autofinanzas_rd_db';

export function getDatabase(): FinancialAppDB {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error("Error cargando base de datos", e);
    }
  }
  
  // Si no existe, inicializa con defaults
  const db: FinancialAppDB = {
    customers: INITIAL_CUSTOMERS,
    vehicles: INITIAL_VEHICLES,
    contracts: getInitialContracts(),
    payments: INITIAL_PAYMENTS,
    cashSessions: INITIAL_CASH_SESSIONS,
    auditLogs: INITIAL_AUDIT_LOGS,
    currentUser: PRESET_USERS[0], // Admin por defecto
  };
  
  saveDatabase(db);
  return db;
}

export function saveDatabase(db: FinancialAppDB) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
}

// Helper para agregar log
export function addAuditLog(
  db: FinancialAppDB, 
  modulo: AuditLog['modulo'], 
  accion: string, 
  detalle: string
): FinancialAppDB {
  const newLog: AuditLog = {
    id: 'LOG-' + Math.floor(Math.random() * 900000 + 100000),
    fecha: new Date().toISOString(),
    usuarioNombre: db.currentUser.name,
    rol: db.currentUser.role,
    accion,
    detalle,
    modulo
  };
  
  const updated = {
    ...db,
    auditLogs: [newLog, ...db.auditLogs]
  };
  saveDatabase(updated);
  return updated;
}
