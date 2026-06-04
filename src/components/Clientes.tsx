import React, { useState } from 'react';
import { 
  Customer, 
  PersonalReference, 
  FinancialAppDB, 
  Contract,
  AttachedDocument
} from '../types';
import { addAuditLog } from '../data';
import { 
  Search, 
  UserPlus, 
  User, 
  Phone, 
  MapPin, 
  Mail, 
  FileText, 
  History, 
  CheckCircle,
  Paperclip,
  Trash2,
  AlertCircle,
  ArrowLeft,
  X,
  CreditCard,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';

interface ClientesProps {
  db: FinancialAppDB;
  onUpdateDb: (newDb: FinancialAppDB) => void;
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

export default function Clientes({ db, onUpdateDb }: ClientesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(db.customers[0]?.id || '');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState('Ingresos');

  // Formulario nuevo cliente
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [historialCredito, setHistorialCredito] = useState('Puntaje aproximado: 700. Excelente pagador.');
  const [estadoCrediticio, setEstadoCrediticio] = useState<Customer['estadoCrediticio']>('Excelente');
  
  // Referencias para el nuevo cliente (mínimo 2)
  const [ref1Nombre, setRef1Nombre] = useState('');
  const [ref1Tel, setRef1Tel] = useState('');
  const [ref1Rel, setRef1Rel] = useState('');

  const [ref2Nombre, setRef2Nombre] = useState('');
  const [ref2Tel, setRef2Tel] = useState('');
  const [ref2Rel, setRef2Rel] = useState('');

  // Filtrado de clientes
  const filteredCustomers = db.customers.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cedula.includes(searchTerm)
  );

  const selectedCustomer = db.customers.find(c => c.id === selectedCustomerId) || db.customers[0];

  // Historial de financiamientos del cliente seleccionado
  const clientContracts = db.contracts.filter(c => c.clienteId === (selectedCustomer?.id || ''));

  // Manejar creación de cliente
  const handleSubmitNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !cedula || !telefono || !direccion) {
      alert("Por favor complete los campos obligatorios.");
      return;
    }

    const referencias: PersonalReference[] = [];
    if (ref1Nombre && ref1Tel) {
      referencias.push({ nombre: ref1Nombre, telefono: ref1Tel, relacion: ref1Rel || 'Familiar' });
    }
    if (ref2Nombre && ref2Tel) {
      referencias.push({ nombre: ref2Nombre, telefono: ref2Tel, relacion: ref2Rel || 'Referencia' });
    }

    const newCustomer: Customer = {
      id: 'cli-' + Date.now(),
      nombre,
      cedula,
      direccion,
      telefono,
      email: email || `${nombre.toLowerCase().replace(/\s+/g, '')}@correo.com`,
      referencias,
      estadoCrediticio,
      historialCredito,
      documentos: [
        { id: 'doc-' + Date.now() + '-1', nombre: 'Cedula_Identidad.pdf', tipo: 'Cédula', fecha: new Date().toISOString().split('T')[0], tamano: '1.1 MB' }
      ],
      fechaRegistro: new Date().toISOString().split('T')[0]
    };

    let updatedDb = {
      ...db,
      customers: [...db.customers, newCustomer]
    };

    updatedDb = addAuditLog(
      updatedDb,
      'Clientes',
      'Registro de Cliente',
      `Se registró al nuevo cliente ${nombre} cédula ${cedula}`
    );

    onUpdateDb(updatedDb);
    setSelectedCustomerId(newCustomer.id);
    setIsAddingNew(false);

    // Reset fields
    setNombre('');
    setCedula('');
    setDireccion('');
    setTelefono('');
    setEmail('');
    setRef1Nombre('');
    setRef1Tel('');
    setRef1Rel('');
    setRef2Nombre('');
    setRef2Tel('');
    setRef2Rel('');
  };

  // Agregar documento simulado
  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName) return;

    const newDoc: AttachedDocument = {
      id: 'doc-' + Date.now(),
      nombre: newDocName.endsWith('.pdf') ? newDocName : `${newDocName}.pdf`,
      tipo: newDocType,
      fecha: new Date().toISOString().split('T')[0],
      tamano: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`
    };

    const updatedCustomers = db.customers.map(c => {
      if (c.id === selectedCustomer.id) {
        return {
          ...c,
          documentos: [...c.documentos, newDoc]
        };
      }
      return c;
    });

    let updatedDb = {
      ...db,
      customers: updatedCustomers
    };

    updatedDb = addAuditLog(
      updatedDb,
      'Clientes',
      'Documento Adjunto',
      `Se adjuntó el documento ${newDoc.nombre} al cliente ${selectedCustomer.nombre}`
    );

    onUpdateDb(updatedDb);
    setNewDocName('');
  };

  // Eliminar documento
  const handleDeleteDocument = (docId: string) => {
    const updatedCustomers = db.customers.map(c => {
      if (c.id === selectedCustomer.id) {
        return {
          ...c,
          documentos: c.documentos.filter(d => d.id !== docId)
        };
      }
      return c;
    });

    let updatedDb = {
      ...db,
      customers: updatedCustomers
    };

    updatedDb = addAuditLog(
      updatedDb,
      'Clientes',
      'Documento Eliminado',
      `Se eliminó un documento adjunto del cliente ${selectedCustomer.nombre}`
    );

    onUpdateDb(updatedDb);
  };

  // Helper de coloreado de estado (vivid and robust)
  const getBadgeColors = (estado: Customer['estadoCrediticio']) => {
    switch(estado) {
      case 'Excelente': return 'bg-emerald-500/10 text-emerald-700 border-emerald-350 font-bold';
      case 'Normal': return 'bg-sky-500/10 text-sky-700 border-sky-350 font-bold';
      case 'En Observación': return 'bg-amber-500/10 text-amber-700 border-amber-350 font-bold';
      case 'Con Atrasos': return 'bg-rose-500/10 text-rose-700 border-rose-350 font-bold';
      case 'Legal': return 'bg-rose-600 text-white border-rose-600 font-extrabold';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 font-semibold';
    }
  };

  const getContractBadge = (estado: Contract['estado']) => {
    switch(estado) {
      case 'Activo': return 'bg-emerald-500/10 text-emerald-700 border border-emerald-300 font-bold';
      case 'Saldado': return 'bg-slate-100 text-slate-700 border border-slate-200 font-medium';
      case 'Refinanciado': return 'bg-blue-500/10 text-blue-700 border border-blue-300 font-bold';
      case 'En Mora': return 'bg-rose-500/10 text-rose-700 border border-rose-320 font-black';
    }
  };

  return (
    <div className="h-full space-y-6" id="clientes-container">
      {/* Cabecera Clientes */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Expediente de Clientes</h1>
          <p className="text-xs text-slate-500 font-medium">Registro de filiación, buró técnico de riesgo crediticio y control de expedientes físicos.</p>
        </div>
        {!isAddingNew && (
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 via-indigo-650 to-violet-605 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md hover:shadow-lg"
          >
            <UserPlus className="h-4 w-4" />
            <span>Registrar Cliente</span>
          </motion.button>
        )}
      </div>

      {isAddingNew ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm" id="new-customer-form-container">
          {/* Formulario nuevo */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-md font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-indigo-600" />
              Nuevo Expediente de Cliente
            </h2>
            <button 
              onClick={() => setIsAddingNew(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 bg-slate-50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmitNewCustomer} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nombre Completo *</label>
                <input 
                  type="text" required value={nombre} onChange={e => setNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-shadow font-semibold"
                  placeholder="Ej. Manuel de Jesús Santana"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Cédula de Identidad *</label>
                <input 
                  type="text" required value={cedula} onChange={e => setCedula(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-shadow font-bold"
                  placeholder="Formato 001-0000000-0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Teléfono Principal *</label>
                <input 
                  type="text" required value={telefono} onChange={e => setTelefono(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-shadow font-bold"
                  placeholder="Ej. 809-555-1234"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Dirección de Residencia *</label>
                <input 
                  type="text" required value={direccion} onChange={e => setDireccion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-shadow font-semibold"
                  placeholder="Av, Calle, Edificio, Apartamento, Sector, Provincia"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
                <input 
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-shadow font-semibold"
                  placeholder="nombre@ejemplo.com"
                />
              </div>
            </div>

            {/* Clasificación Crediticia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Evaluación Crediticia Inicial</label>
                <select 
                  value={estadoCrediticio} onChange={e => setEstadoCrediticio(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-505 font-bold cursor-pointer"
                >
                  <option value="Excelente">Excelente (Score &gt; 730)</option>
                  <option value="Normal">Normal (Score 650 - 729)</option>
                  <option value="En Observación">En Observación (Score 600 - 649)</option>
                  <option value="Con Atrasos">Con Atrasos (Historial inestable)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">Apuntes del Buró de Crédito</label>
                <input 
                  type="text" value={historialCredito} onChange={e => setHistorialCredito(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-505 font-semibold"
                  placeholder="Detalles sobre deudas vigentes, comportamiento de pago, etc."
                />
              </div>
            </div>

            {/* Referencias Personales (Mínimo 2 según checklist) */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Referencias del Cliente y Fiadores solidarios</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Referencia 1 */}
                <div className="p-4 border border-indigo-100/60 bg-indigo-50/20 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-md uppercase tracking-wide">Referencia Familiar #1</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input 
                      type="text" placeholder="Nombre completo" value={ref1Nombre} onChange={e => setRef1Nombre(e.target.value)}
                      className="sm:col-span-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold"
                    />
                    <input 
                      type="text" placeholder="Teléfono" value={ref1Tel} onChange={e => setRef1Tel(e.target.value)}
                      className="sm:col-span-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                    <input 
                      type="text" placeholder="Parentesco" value={ref1Rel} onChange={e => setRef1Rel(e.target.value)}
                      className="sm:col-span-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold"
                    />
                  </div>
                </div>

                {/* Referencia 2 */}
                <div className="p-4 border border-violet-100/60 bg-violet-50/20 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black text-violet-700 bg-violet-100 px-2.5 py-0.5 rounded-md uppercase tracking-wide">Referencia Personal / Fiador #2</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input 
                      type="text" placeholder="Nombre completo" value={ref2Nombre} onChange={e => setRef2Nombre(e.target.value)}
                      className="sm:col-span-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold"
                    />
                    <input 
                      type="text" placeholder="Teléfono" value={ref2Tel} onChange={e => setRef2Tel(e.target.value)}
                      className="sm:col-span-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                    <input 
                      type="text" placeholder="Vínculo" value={ref2Rel} onChange={e => setRef2Rel(e.target.value)}
                      className="sm:col-span-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 justify-end border-t border-slate-100 pt-5">
              <button 
                type="button" onClick={() => setIsAddingNew(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-650 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer hover:shadow-md transition-all active:scale-95"
              >
                Crear Expediente
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="clients-workarea">
          {/* Selector de Clientes (Left Col) */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 flex flex-col space-y-4 shadow-sm" id="clients-list-container">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por nombre o cédula..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold transition-shadow"
              />
            </div>

            <motion.div 
              variants={listContainerVariants}
              initial="hidden"
              animate="show"
              className="space-y-2 overflow-y-auto max-h-[520px] pr-1" 
              id="clients-scroll"
            >
              {filteredCustomers.map(c => (
                <motion.div 
                  key={c.id}
                  variants={listItemVariants}
                  whileHover={{ scale: 1.01, x: 2 }}
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all flex flex-col space-y-1.5 border ${
                    selectedCustomer?.id === c.id 
                    ? 'bg-gradient-to-r from-indigo-950 to-blue-900 border-indigo-950 text-white shadow-md' 
                    : 'hover:bg-slate-50 text-slate-800 border-slate-100 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <p className="font-extrabold text-xs truncate">{c.nombre}</p>
                    <span className={`text-[9px] px-2 py-0.5 rounded-lg border uppercase ${
                      selectedCustomer?.id === c.id 
                        ? 'bg-indigo-900 text-amber-300 border-indigo-805 font-bold' 
                        : getBadgeColors(c.estadoCrediticio)
                    }`}>
                      {c.estadoCrediticio}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold opacity-80 font-mono">
                    <span>Céd: {c.cedula}</span>
                    <span>{c.telefono}</span>
                  </div>
                </motion.div>
              ))}
              {filteredCustomers.length === 0 && (
                <p className="text-center text-slate-400 py-8 text-xs font-semibold">No se encontraron clientes coincidiendo.</p>
              )}
            </motion.div>
          </div>

          {/* Expediente del Cliente Seleccionado (Right Panel, 2 Cols) */}
          {selectedCustomer ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.99, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6" 
              id="client-dossier"
            >
              {/* Información General Banner */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-indigo-50/75 to-blue-50/20 -m-6 p-6 rounded-t-3xl border-b border-indigo-100/50">
                <div className="flex gap-3.5 items-center">
                  <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-md">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">{selectedCustomer.nombre}</h2>
                    <p className="text-xs font-bold font-mono text-slate-500 mt-0.5">ID: {selectedCustomer.id} | Cédula: {selectedCustomer.cedula}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[11px] font-black px-3 py-1 rounded-xl border uppercase tracking-wide ${getBadgeColors(selectedCustomer.estadoCrediticio)}`}>
                    Score: {selectedCustomer.estadoCrediticio}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">Inscrito: {selectedCustomer.fechaRegistro}</span>
                </div>
              </div>

              {/* Contenido Modular del Expediente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {/* Contacto & Referencias */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-indigo-600" />
                    Datos de Contacto y Residencia
                  </h3>
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-3 text-xs border border-slate-100 shadow-inner">
                    <div className="flex gap-2.5">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-slate-700 font-medium leading-normal"><strong>Dirección:</strong> {selectedCustomer.direccion}</p>
                    </div>
                    <div className="flex gap-2.5">
                      <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                      <p className="text-slate-700 font-bold"><strong>Teléfono:</strong> {selectedCustomer.telefono}</p>
                    </div>
                    <div className="flex gap-2.5">
                      <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                      <p className="text-slate-700 font-medium truncate"><strong>Email:</strong> {selectedCustomer.email}</p>
                    </div>
                  </div>

                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 pt-2 flex items-center gap-1.5">
                    <UserPlus className="h-4 w-4 text-indigo-600" />
                    Referencias Personales / Fiadores
                  </h3>
                  <div className="space-y-2">
                    {selectedCustomer.referencias.map((ref, idx) => (
                      <div key={idx} className="border border-slate-100 p-3.5 rounded-2xl flex justify-between items-center text-xs bg-white hover:border-indigo-100 transition-colors">
                        <div>
                          <p className="font-extrabold text-slate-800">{ref.nombre}</p>
                          <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block">
                            {ref.relacion}
                          </span>
                        </div>
                        <span className="font-mono text-slate-900 font-bold">{ref.telefono}</span>
                      </div>
                    ))}
                    {selectedCustomer.referencias.length === 0 && (
                      <p className="text-slate-400 text-xs italic">Ninguna referencia registrada en este expediente.</p>
                    )}
                  </div>
                </div>

                {/* Historial Técnico / Buró Transunion */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <History className="h-4 w-4 text-indigo-600" />
                    Historial de Financiamientos Activos
                  </h3>
                  
                  <div className="space-y-2">
                    {clientContracts.map(con => (
                      <div key={con.id} className="p-3.5 border border-slate-100 rounded-2xl space-y-2 text-xs bg-slate-50 hover:border-indigo-100 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-black text-indigo-600">{con.id}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg ${getContractBadge(con.estado)}`}>
                            {con.estado}
                          </span>
                        </div>
                        <p className="font-extrabold text-slate-700 truncate">{con.vehiculoInfo}</p>
                        <div className="grid grid-cols-2 gap-1 bg-white p-2 rounded-xl text-[10px] text-slate-500 font-mono">
                          <div>
                            <span className="text-[8px] text-slate-400 block font-bold uppercase">Financiado</span>
                            <span className="font-extrabold text-indigo-900">{new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 0 }).format(con.montoFinanciado)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] text-slate-400 block font-bold uppercase">Cuota Mensual</span>
                            <span className="font-extrabold text-slate-900">{new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 0 }).format(con.cuotaMensual)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {clientContracts.length === 0 && (
                      <div className="text-center p-5 border border-dashed border-slate-205 rounded-2xl">
                        <p className="text-slate-400 text-xs font-semibold">Sin contratos ni financiamientos en curso.</p>
                      </div>
                    )}
                  </div>

                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 pt-2 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-indigo-600" />
                    Evaluación de Crédito (Buró)
                  </h3>
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-xs space-y-1.5 text-slate-750">
                    <div className="flex gap-1.5 items-center">
                      <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0" />
                      <strong className="text-amber-900 font-extrabold">Buró de Crédito Dominicano</strong>
                    </div>
                    <p className="leading-relaxed text-[11px] text-slate-600 font-semibold">{selectedCustomer.historialCredito}</p>
                  </div>
                </div>
              </div>

              {/* Sección de Documentos Adjuntos */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Paperclip className="h-4.5 w-4.5 text-indigo-600" />
                  Expediente Digital con Firma (Documentos Adjuntos)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lista de documentos */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
                    {selectedCustomer.documentos.map(doc => (
                      <div key={doc.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs hover:border-slate-300 hover:bg-white transition-all">
                        <div className="flex gap-2.5 items-center truncate">
                          <FileText className="h-5 w-5 text-indigo-500 shrink-0" />
                          <div className="truncate">
                            <p className="font-extrabold text-slate-700 truncate">{doc.nombre}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">{doc.tipo} • {doc.tamano} • {doc.fecha}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-rose-500 hover:text-white p-1.5 rounded-xl hover:bg-rose-500 cursor-pointer transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {selectedCustomer.documentos.length === 0 && (
                      <p className="text-slate-400 text-xs italic">No hay documentos cargados en el expediente.</p>
                    )}
                  </div>

                  {/* Formulario de adjuntado */}
                  <form onSubmit={handleAddDocument} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5">
                    <p className="text-xs font-extrabold text-slate-800">Digitalizar Documento Adjunto</p>
                    <div className="grid grid-cols-2 gap-2">
                      <select 
                        value={newDocType} onChange={e => setNewDocType(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl p-2 text-[11px] font-bold outline-none cursor-pointer"
                      >
                        <option value="Cédula">Cédula Identidad</option>
                        <option value="Matrícula">Matrícula Vehicular</option>
                        <option value="Certificación">Certificación de Ingresos</option>
                        <option value="Ingresos">Estados de Cuenta</option>
                      </select>
                      <input 
                        type="text" required placeholder="Nombre: ej. Cedula_Frente" value={newDocName} onChange={e => setNewDocName(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl p-2 text-[11px] font-semibold outline-none"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white p-2.5 rounded-xl text-xs font-black cursor-pointer flex items-center justify-center gap-1 shadow-sm transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Adjuntar PDF al Expediente</span>
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          ) : (
            <p className="lg:col-span-2 text-slate-405 text-center py-12 text-xs font-semibold">Seleccione un cliente para ver su expediente completo.</p>
          )}
        </div>
      )}
    </div>
  );
}
