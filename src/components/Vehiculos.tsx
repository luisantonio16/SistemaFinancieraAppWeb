import React, { useState } from 'react';
import { 
  Vehicle, 
  FinancialAppDB 
} from '../types';
import { addAuditLog } from '../data';
import { 
  Car, 
  Search, 
  DollarSign, 
  Tag, 
  Hash, 
  Key, 
  Calendar, 
  Palette, 
  CheckCircle,
  Plus,
  X,
  PlusCircle,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';

interface VehiculosProps {
  db: FinancialAppDB;
  onUpdateDb: (newDb: FinancialAppDB) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 90, damping: 14 } }
};

export default function Vehiculos({ db, onUpdateDb }: VehiculosProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Formulario nuevo vehículo
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState(new Date().getFullYear());
  const [color, setColor] = useState('');
  const [chasis, setChasis] = useState('');
  const [placa, setPlaca] = useState('');
  const [valorVenta, setValorVenta] = useState(0);
  const [fotoUrl, setFotoUrl] = useState('');

  // Marcas únicas para filtros
  const marcasDisponibles = Array.from(new Set(db.vehicles.map(v => v.marca)));

  // Filtrado de vehículos
  const filteredVehicles = db.vehicles.filter(v => {
    const matchesSearch = v.marca.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.chasis.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || v.estado === statusFilter;
    const matchesBrand = brandFilter === '' || v.marca === brandFilter;

    return matchesSearch && matchesStatus && matchesBrand;
  });

  // Guardar nuevo vehículo en el inventario
  const handleSubmitNewVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!marca || !modelo || !ano || !chasis || !placa || valorVenta <= 0) {
      alert("Por favor complete todos los datos obligatorios con valores correctos.");
      return;
    }

    const finalFoto = fotoUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=600&auto=format&fit=crop';

    const newVehicle: Vehicle = {
      id: 'veh-' + Date.now(),
      marca,
      modelo,
      ano: Number(ano),
      color,
      chasis: chasis.toUpperCase(),
      placa: placa.toUpperCase(),
      estado: 'Disponible',
      valorVenta: Number(valorVenta),
      valorFinanciadoMax: Math.round(Number(valorVenta) * 0.8), // 80% financiable por defecto
      foto: finalFoto
    };

    let updatedDb = {
      ...db,
      vehicles: [newVehicle, ...db.vehicles]
    };

    updatedDb = addAuditLog(
      updatedDb,
      'Vehículos',
      'Ingreso al Inventario',
      `Se registró al inventario: ${marca} ${modelo} (${ano}) Placa ${newVehicle.placa}`
    );

    onUpdateDb(updatedDb);
    setIsAddingNew(false);

    // Reset fields
    setMarca('');
    setModelo('');
    setAno(2022);
    setColor('');
    setChasis('');
    setPlaca('');
    setValorVenta(0);
    setFotoUrl('');
  };

  const getStatusBadgeClass = (estado: Vehicle['estado']) => {
    switch(estado) {
      case 'Disponible': return 'bg-emerald-500 text-white';
      case 'Financiado': return 'bg-indigo-600 text-white';
      case 'En Revisión': return 'bg-amber-500 text-white';
    }
  };

  // Formateador de República Dominicana (DOP)
  const formatRD = (value: number) => {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-6" id="vehiculos-inventory-container">
      {/* Cabecera del inventario */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inventario de Vehículos</h1>
          <p className="text-xs text-slate-500 font-medium">Gestión de activos, control de chasis, placas y límites del 80% financiable.</p>
        </div>
        {!isAddingNew && (
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 via-indigo-650 to-violet-605 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Añadir Vehículo</span>
          </motion.button>
        )}
      </div>

      {isAddingNew ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm" id="add-vehicle-form-container">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-md font-bold text-slate-900 flex items-center gap-2">
              <Car className="h-5 w-5 text-indigo-600" />
              Nuevo Vehículo en Inventario
            </h2>
            <button 
              onClick={() => setIsAddingNew(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmitNewVehicle} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Marca del Vehículo *</label>
                <input 
                  type="text" required value={marca} onChange={e => setMarca(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-shadow font-semibold"
                  placeholder="Ej. Toyota, Honda, Kia"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Modelo *</label>
                <input 
                  type="text" required value={modelo} onChange={e => setModelo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-shadow font-semibold"
                  placeholder="Ej. Rav4, Civic, Sonata"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5 font-mono">Año de Fabricación *</label>
                <input 
                  type="number" required value={ano} onChange={e => setAno(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-shadow font-bold"
                  placeholder="Ej. 2020"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Color Exterior</label>
                <input 
                  type="text" value={color} onChange={e => setColor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-shadow font-semibold"
                  placeholder="Ej. Gris Metálico, Blanco"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Número de Chasis (VIN) *</label>
                <input 
                  type="text" required value={chasis} onChange={e => setChasis(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-shadow font-bold uppercase"
                  placeholder="17 caracteres alfanuméricos"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Placa Dominicana *</label>
                <input 
                  type="text" required value={placa} onChange={e => setPlaca(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-shadow font-bold uppercase"
                  placeholder="Ej. A883419 o G441112"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Valor de Venta Neto (RD$) *</label>
                <input 
                  type="number" required value={valorVenta} onChange={e => setValorVenta(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-shadow font-bold"
                  placeholder="RD$ Valor comercial"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Enlace a Fotografía (URL)</label>
                <input 
                  type="url" value={fotoUrl} onChange={e => setFotoUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold"
                  placeholder="https://direct-link-to-photo.jpg"
                />
              </div>
            </div>

            <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded-xl">
              <h4 className="text-xs font-extrabold text-indigo-950 flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                Regla de Financiamiento del 80% de Seguridad
              </h4>
              <p className="text-[11px] text-indigo-800 font-medium mt-1">
                El sistema asignará automáticamente un valor financiable de seguridad de <strong className="font-bold">{formatRD(Math.round(valorVenta * 0.8))}</strong> DOP (80% del valor de venta) para evitar sobre-exposición de la cartera de crédito.
              </p>
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
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all shadow-md active:scale-95"
              >
                Ingresar Vehículo
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filtros de Inventario */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por marca, modelo, VIN o placa..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
              />
            </div>

            <div>
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer"
              >
                <option value="">Todos los Estados</option>
                <option value="Disponible">Disponible para Crédito</option>
                <option value="Financiado">Ya Financiado</option>
                <option value="En Revisión font-bold">En Taller / Mantenimiento</option>
              </select>
            </div>

            <div>
              <select 
                value={brandFilter} 
                onChange={e => setBrandFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer"
              >
                <option value="">Todas las Marcas</option>
                {marcasDisponibles.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end text-xs font-bold text-slate-500 font-mono">
              Modelos Registrados: {filteredVehicles.length}
            </div>
          </div>

          {/* Grilla de Automóviles with stagger animation */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
            id="vehicles-bento-grid"
          >
            {filteredVehicles.map((vehicle) => {
              return (
                <motion.div 
                  key={vehicle.id} 
                  variants={cardVariants}
                  whileHover={{ y: -6, scale: 1.01 }}
                  className="bg-white border border-slate-100 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group relative shadow-sm"
                >
                  {/* Foto con tag de disponibilidad */}
                  <div className="h-44 bg-slate-100 relative group overflow-hidden">
                    <img 
                      src={vehicle.foto} 
                      alt={`${vehicle.marca} ${vehicle.modelo}`} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none"></div>
                    
                    {/* Tag de estado flote */}
                    <span className={`absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-xl uppercase shadow-lg border border-white/20 backdrop-blur-md ${getStatusBadgeClass(vehicle.estado)}`}>
                      {vehicle.estado}
                    </span>

                    {/* Placa Dominicana y Año */}
                    <div className="absolute bottom-3 left-3 text-white">
                      <span className="text-[10px] uppercase font-mono bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-white/10 font-bold">
                        Placa: {vehicle.placa}
                      </span>
                    </div>
                  </div>

                  {/* Detalles técnicos */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                          {vehicle.marca} {vehicle.modelo}
                        </h3>
                        <span className="text-xs text-indigo-700 font-extrabold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-mono">{vehicle.ano}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-bold font-mono mt-1.5 flex items-center gap-1">
                        <Hash className="h-3 w-3 text-indigo-600" />
                        VIN: {vehicle.chasis}
                      </p>
                      
                      {/* Color */}
                      <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-605 font-medium">
                        <Palette className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Color: {vehicle.color || 'No especificado'}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center bg-slate-50 -mx-5 -mb-5 p-4 rounded-b-[24px]">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valor Venta</span>
                        <p className="text-sm font-black text-slate-900 font-mono mt-0.5">{formatRD(vehicle.valorVenta)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">80% Financiable</span>
                        <p className="text-sm font-black text-emerald-600 font-mono mt-0.5">{formatRD(vehicle.valorFinanciadoMax)}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {filteredVehicles.length === 0 && (
              <div className="col-span-full bg-white p-12 text-center border border-dashed rounded-2xl text-slate-400 text-xs font-semibold">
                Ningún vehículo coincide con los filtros establecidos en el inventario.
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
