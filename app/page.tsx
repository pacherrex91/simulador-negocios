"use client";
import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [activeTab, setActiveTab] = useState('simulador');
  const [historial, setHistorial] = useState<any[]>([]);

  // --- ESTADOS DEL SIMULADOR ---
  const [formData, setFormData] = useState({
    nombre_idea: "Cocina Oculta / Delivery",
    sector: "Alimentos",
    descripcion: "Venta de hamburguesas artesanales por delivery los fines de semana.",
    capital_disponible: 10000,
    inversion: { insumos: 500, equipos: 2000, empaques: 300, permisos: 150, otros: 200 },
    precio_venta: 18,
    costo_directo: 11,
    gastos_fijos: { marketing: 200, logistica: 150, sueldo_emprendedor: 1000, impuestos: 50, otros: 100 },
    ventas: { pesimista: 60, base: 120, optimista: 200, crecimiento_mensual: 5 }
  });

  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // --- ESTADOS DE LA IA Y COMPARACIÓN ---
  const [consejoIA, setConsejoIA] = useState("");
  const [cargandoIA, setCargandoIA] = useState(false);
  const [activeRol, setActiveRol] = useState("");
  const [selectedToCompare, setSelectedToCompare] = useState<any[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'fecha', direction: 'desc' }); // Por defecto ordenamos por fecha más reciente

  // --- ESTADOS DEL MÓDULO "WHAT IF" ---
  const [whatIf, setWhatIf] = useState({ variacionPrecio: 0, variacionCostos: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCompareModal) setShowCompareModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCompareModal]);

  const pedirConsejo = async (rol: string) => {
    setActiveRol(rol);
    setCargandoIA(true);
    setConsejoIA("El consejero está analizando tus métricas avanzadas...");
    try {
      const response = await fetch('https://simulador-backend-ytbv.onrender.com/consejero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol, idea: formData.nombre_idea, sector: formData.sector, metricas: res.metricas })
      });
      const data = await response.json();
      setConsejoIA(data.consejo);
    } catch (error) {
      setConsejoIA("Hubo un error al contactar al consejero.");
    }
    setCargandoIA(false);
  };

  const cargarHistorial = async () => {
    const { data } = await supabase.from('simulations').select('*').order('created_at', { ascending: false });
    if (data) setHistorial(data);
  };

  // --- FUNCIONES DE SELECCIÓN Y ELIMINACIÓN ---
  const eliminarSimulacion = async (id: string) => {
    if(!window.confirm("¿Estás seguro de que deseas eliminar esta simulación?")) return;
    await supabase.from('simulations').delete().eq('id', id);
    setSelectedToCompare(prev => prev.filter(s => s.id !== id));
    cargarHistorial();
  };

  const toggleCompare = (item: any) => {
    if (selectedToCompare.some(s => s.id === item.id)) {
      setSelectedToCompare(selectedToCompare.filter(s => s.id !== item.id));
    } else {
      setSelectedToCompare([...selectedToCompare, item]);
    }
  };

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Ahora selecciona TODO el historial visible, ya que quitamos la agrupación
      setSelectedToCompare([...historial]);
    } else {
      setSelectedToCompare([]);
    }
  };

  const deseleccionarTodos = () => {
    setSelectedToCompare([]);
  };

  const eliminarSeleccionados = async () => {
    if (!window.confirm(`¿Estás seguro de eliminar las ${selectedToCompare.length} simulaciones seleccionadas permanentemente?`)) return;
    const ids = selectedToCompare.map(item => item.id);
    await supabase.from('simulations').delete().in('id', ids);
    setSelectedToCompare([]);
    cargarHistorial();
  };

  const requestSort = (key: string) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  // --- LÓGICA DE ORDENAMIENTO (SIN AGRUPAR) ---
  const getSortedHistorial = () => {
    const sortedData = [...historial];
    sortedData.sort((a, b) => {
      if (!a.financial_results || !b.financial_results) return 0;
      const resA = a.financial_results;
      const resB = b.financial_results;
      let aValue: any = 0; let bValue: any = 0;

      switch(sortConfig.key) {
        case 'fecha':
          aValue = new Date(a.created_at || 0).getTime(); bValue = new Date(b.created_at || 0).getTime(); break;
        case 'proyecto':
          aValue = a.project_name; bValue = b.project_name;
          return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        case 'sector':
          aValue = a.inputs?.sector || ""; bValue = b.inputs?.sector || "";
          return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        case 'score':
          aValue = resA.metricas?.score || 0; bValue = resB.metricas?.score || 0; break;
        case 'inversion':
          aValue = resA.metricas?.inversion_total || 0; bValue = resB.metricas?.inversion_total || 0; break;
        case 'punto_eq':
          aValue = resA.metricas?.punto_equilibrio || 0; bValue = resB.metricas?.punto_equilibrio || 0; break;
        case 'riesgo':
          aValue = resA.riesgo?.probabilidad_perdida || 0; bValue = resB.riesgo?.probabilidad_perdida || 0; break;
        case 'ganancia':
          aValue = resA.riesgo?.ganancia_promedio_anio || 0; bValue = resB.riesgo?.ganancia_promedio_anio || 0; break;
        default: return 0;
      }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortedData;
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <span className="text-slate-300 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">↕</span>;
    return <span className="ml-1 text-indigo-500">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
  };

  useEffect(() => { if (activeTab === 'ranking') cargarHistorial(); }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setConsejoIA(""); setActiveRol(""); setWhatIf({ variacionPrecio: 0, variacionCostos: 0 });
    try {
      const peticion = await fetch("https://simulador-backend-ytbv.onrender.com/simular", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData)
      });
      const data = await peticion.json();
      setRes(data);
      await supabase.from('simulations').insert([{ project_name: formData.nombre_idea, inputs: formData, financial_results: data, status: 'completed' }]);
    } catch (error) {
      alert("Error conectando al motor Python. Revisa tu conexión o el servidor.");
    }
    setLoading(false);
  };

  const exportarAExcel = (nombre: string, resultados: any) => {
    if (!resultados || !resultados.base) return;
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    
    csvContent += `REPORTE DE DECISIÓN DE INVERSIÓN: ${nombre.toUpperCase()}\n\n`;
    csvContent += `1. VEREDICTO FINAL\n`;
    csvContent += `Score de Inversión,${resultados.metricas?.score || 'N/A'} / 100\n`;
    csvContent += `Recomendación,${resultados.metricas?.recomendacion?.estado || 'N/A'} - ${resultados.metricas?.recomendacion?.msg || ''}\n\n`;

    csvContent += `2. MÉTRICAS CLAVE\n`;
    csvContent += `Inversión Total,S/ ${resultados.metricas.inversion_total}\n`;
    csvContent += `Ganancia Año 1 (Promedio),S/ ${resultados.riesgo.ganancia_promedio_anio}\n`;
    csvContent += `Retorno de Inversión (ROI),${resultados.metricas?.roi || 'N/A'}%\n`;
    csvContent += `Margen Neto (Base),${resultados.base?.margen_neto || 'N/A'}%\n`;
    csvContent += `Punto de Equilibrio,${resultados.metricas.punto_equilibrio} ventas/mes\n`;
    csvContent += `Probabilidad de Pérdida,${resultados.riesgo.probabilidad_perdida}%\n`;
    csvContent += `Recuperación del Capital (Payback),Mes ${resultados.base.mes_recuperacion}\n\n`;

    csvContent += `3. PROYECCIÓN MENSUAL (ESCENARIO BASE)\n`;
    csvContent += "Mes,Flujo de Caja Acumulado (S/)\n";
    resultados.base.caja_mes_a_mes.forEach((monto: number, index: number) => {
      csvContent += `Mes ${index + 1},${monto}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Analisis_Inversion_${nombre.replace(/ /g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNested = (category: string, field: string, value: number) => {
    setFormData(prev => ({ ...prev, [category]: { ...(prev as any)[category], [field]: value || 0 } }));
  };
  const handleSimple = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const invTotal = Object.values(formData.inversion).reduce((a, b) => a + b, 0);
  const chartData = res?.base?.caja_mes_a_mes?.map((caja: number, i: number) => ({ mes: `Mes ${i + 1}`, caja })) || [];

  const wiPrecio = formData.precio_venta * (1 + (whatIf.variacionPrecio / 100));
  const wiCosto = formData.costo_directo * (1 + (whatIf.variacionCostos / 100));
  const wiMargen = wiPrecio - wiCosto;
  const wiGastos = Object.values(formData.gastos_fijos).reduce((a, b) => a + b, 0);
  const wiPuntoEq = wiMargen > 0 ? Math.ceil(wiGastos / wiMargen) : 9999;
  const wiUtilidadAnualEst = wiMargen > 0 ? ((wiMargen * formData.ventas.base) - wiGastos) * 12 : 0;

  // Función para formatear fechas de forma amigable
  const formatFecha = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 text-center">
          <h1 className="text-4xl font-extrabold text-indigo-700 tracking-tight">Decisiones de Inversión IA</h1>
          <p className="text-slate-500 mt-2">Simula, sensibiliza y toma decisiones financieras basadas en datos empíricos.</p>
        </header>

        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-sm p-1 inline-flex border border-slate-200">
            <button onClick={() => setActiveTab('simulador')} className={`cursor-pointer px-6 py-2 font-bold rounded-md transition-colors ${activeTab === 'simulador' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-indigo-600'}`}>Nueva Simulación</button>
            <button onClick={() => setActiveTab('ranking')} className={`cursor-pointer px-6 py-2 font-bold rounded-md transition-colors ${activeTab === 'ranking' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-indigo-600'}`}>Mis Ideas (Ranking)</button>
          </div>
        </div>

        {activeTab === 'simulador' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
              <form onSubmit={handleSubmit} className="space-y-8">
                <section>
                  <h2 className="text-xl font-bold border-b pb-2 mb-4 text-indigo-600">1. Datos y Capital</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-2"><label className="block text-sm font-semibold mb-1">Nombre del Proyecto</label><input type="text" value={formData.nombre_idea} onChange={e => handleSimple('nombre_idea', e.target.value)} className="w-full p-2 border rounded bg-slate-50 focus:ring-2 ring-indigo-200 outline-none" /></div>
                    <div><label className="block text-sm font-bold mb-1 text-emerald-700">Mi Capital Total (S/)</label><input type="number" value={formData.capital_disponible} onChange={e => handleSimple('capital_disponible', parseFloat(e.target.value))} className="w-full p-2 border-2 border-emerald-300 rounded bg-emerald-50 font-bold outline-none" /></div>
                  </div>
                  <div><label className="block text-sm font-semibold mb-1">Sector Comercial</label><input type="text" value={formData.sector} onChange={e => handleSimple('sector', e.target.value)} className="w-full p-2 border rounded bg-slate-50 focus:ring-2 ring-indigo-200 outline-none" /></div>
                </section>
                
                <section>
                  <div className="flex justify-between items-end border-b pb-2 mb-4">
                    <h2 className="text-xl font-bold text-indigo-600">2. Inversión Requerida</h2>
                    <span className={`font-bold px-3 py-1 rounded text-sm ${invTotal > formData.capital_disponible ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>S/ {invTotal} / S/ {formData.capital_disponible}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.keys(formData.inversion).map(key => (
                      <div key={key}><label className="block text-sm font-semibold mb-1 capitalize">{key}</label><input type="number" value={(formData.inversion as any)[key]} onChange={e => handleNested('inversion', key, parseFloat(e.target.value))} className="w-full p-2 border rounded bg-slate-50 outline-none" /></div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-bold border-b pb-2 mb-4 text-indigo-600">3. Unitarios (Por Venta)</h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div><label className="block text-sm font-semibold mb-1">Precio de Venta (S/)</label><input type="number" value={formData.precio_venta} onChange={e => handleSimple('precio_venta', parseFloat(e.target.value))} className="w-full p-2 border rounded bg-slate-50 outline-none" /></div>
                    <div><label className="block text-sm font-semibold mb-1">Costo Directo (S/)</label><input type="number" value={formData.costo_directo} onChange={e => handleSimple('costo_directo', parseFloat(e.target.value))} className="w-full p-2 border rounded bg-slate-50 outline-none" /></div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-bold border-b pb-2 mb-4 text-indigo-600">4. Gastos Mensuales Fijos (S/)</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.keys(formData.gastos_fijos).map(key => (
                      <div key={key}><label className="block text-sm font-semibold mb-1 capitalize">{key.replace('_', ' ')}</label><input type="number" value={(formData.gastos_fijos as any)[key]} onChange={e => handleNested('gastos_fijos', key, parseFloat(e.target.value))} className="w-full p-2 border rounded bg-slate-50 outline-none" /></div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-bold border-b pb-2 mb-4 text-indigo-600">5. Ventas Mensuales Estimadas</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="block text-sm font-bold mb-1 text-rose-600">Pesimista</label><input type="number" value={formData.ventas.pesimista} onChange={e => handleNested('ventas', 'pesimista', parseInt(e.target.value))} className="w-full p-2 border border-rose-200 rounded bg-slate-50 outline-none" /></div>
                    <div><label className="block text-sm font-bold mb-1 text-indigo-600">Base (Realista)</label><input type="number" value={formData.ventas.base} onChange={e => handleNested('ventas', 'base', parseInt(e.target.value))} className="w-full p-2 border border-indigo-300 rounded bg-indigo-50 outline-none" /></div>
                    <div><label className="block text-sm font-bold mb-1 text-emerald-600">Optimista</label><input type="number" value={formData.ventas.optimista} onChange={e => handleNested('ventas', 'optimista', parseInt(e.target.value))} className="w-full p-2 border border-emerald-200 rounded bg-slate-50 outline-none" /></div>
                    <div><label className="block text-sm font-semibold mb-1">Crecimiento Mensual (%)</label><input type="number" value={formData.ventas.crecimiento_mensual} onChange={e => handleNested('ventas', 'crecimiento_mensual', parseFloat(e.target.value))} className="w-full p-2 border rounded bg-slate-50 outline-none" /></div>
                  </div>
                </section>

                <button type="submit" disabled={loading} className="cursor-pointer w-full py-4 bg-slate-900 hover:bg-black text-white text-lg font-bold rounded-xl transition-all shadow-lg">
                  {loading ? "Ejecutando algoritmo decisional..." : "Generar Dictamen de Inversión 🚀"}
                </button>
              </form>
            </div>

            <div className="lg:col-span-5 space-y-6">
              {res ? (
                <>
                  {/* DICTAMEN PRINCIPAL */}
                  <div className={`p-6 border-2 rounded-2xl shadow-md text-center ${res.metricas.recomendacion.estado.includes("INVERTIR") && !res.metricas.recomendacion.estado.includes("NO") ? 'bg-emerald-50 border-emerald-400' : res.metricas.recomendacion.estado.includes("NO") ? 'bg-rose-50 border-rose-400' : 'bg-amber-50 border-amber-400'}`}>
                    <h3 className="font-extrabold text-slate-800 text-lg uppercase tracking-wide mb-2">Dictamen de Inversión</h3>
                    <div className="text-3xl font-black mb-1">{res.metricas.recomendacion.estado}</div>
                    <p className="text-sm font-medium text-slate-700">{res.metricas.recomendacion.msg}</p>
                    <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-around">
                       <div>
                         <p className="text-xs text-slate-500 uppercase font-bold">Score Algorítmico</p>
                         <p className="text-xl font-black text-slate-800">{res.metricas.score}<span className="text-sm text-slate-500">/100</span></p>
                       </div>
                       <div>
                         <p className="text-xs text-slate-500 uppercase font-bold">ROI Estimado</p>
                         <p className="text-xl font-black text-slate-800">{res.metricas.roi}%</p>
                       </div>
                    </div>
                  </div>

                  {/* GESTIÓN DEL CAPITAL */}
                  <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <h3 className="font-bold text-slate-800 text-sm mb-3 ml-2">Gestión de tu Capital (S/ {formData.capital_disponible})</h3>
                    <div className="ml-2 space-y-2">
                       <p className="text-sm text-slate-600 flex justify-between">
                         <span>1. Reserva Intocable (3 meses)</span>
                         <span className="font-bold text-slate-800">S/ {res.metricas.reserva_emergencia}</span>
                       </p>
                       <p className="text-sm text-slate-600 flex justify-between">
                         <span>2. Capital Seguro para Invertir</span>
                         <span className="font-bold text-emerald-600">S/ {res.metricas.capital_invertible}</span>
                       </p>
                       <p className={`text-sm flex justify-between pt-2 border-t mt-2 ${invTotal > res.metricas.capital_invertible ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                         <span>3. Tu Inversión Actual</span>
                         <span>S/ {invTotal}</span>
                       </p>
                       {invTotal > res.metricas.capital_invertible && (
                         <p className="text-xs text-rose-600 mt-1 bg-rose-50 p-2 rounded">⚠️ Estás invirtiendo dinero que debería ser reserva de emergencia. Alto riesgo financiero.</p>
                       )}
                    </div>
                  </div>

                  {/* INDICADORES FINANCIEROS */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
                       <div className="flex justify-between items-center mb-1">
                         <p className="text-sm font-bold text-slate-600">Riesgo (Pérdida)</p>
                         <span className="text-xs bg-slate-200 text-slate-500 rounded-full w-4 h-4 flex items-center justify-center cursor-help">?</span>
                       </div>
                       <p className={`text-2xl font-extrabold ${res.riesgo.probabilidad_perdida > 30 ? 'text-rose-600' : 'text-emerald-600'}`}>
                         {res.riesgo.probabilidad_perdida}%
                       </p>
                       <div className="absolute top-full left-0 mt-2 hidden group-hover:block w-48 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-20">
                          Probabilidad de que tu proyecto cierre el **primer año completo** con saldo negativo.
                       </div>
                     </div>
                     <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
                       <div className="flex justify-between items-center mb-1">
                         <p className="text-sm font-bold text-slate-600">Payback</p>
                         <span className="text-xs bg-slate-200 text-slate-500 rounded-full w-4 h-4 flex items-center justify-center cursor-help">?</span>
                       </div>
                       <p className="text-2xl font-extrabold text-indigo-700">{typeof res.base.mes_recuperacion === 'number' ? `Mes ${res.base.mes_recuperacion}` : '+1 Año'}</p>
                       <div className="absolute top-full right-0 mt-2 hidden group-hover:block w-48 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-20">
                          Tiempo estimado para recuperar el 100% de tu inversión inicial operando en el escenario base.
                       </div>
                     </div>
                     <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                       <p className="text-sm font-bold text-slate-600 mb-1">Margen Neto</p>
                       <p className="text-2xl font-extrabold text-slate-800">{res.base.margen_neto}%</p>
                     </div>
                     <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
                       <div className="flex justify-between items-center mb-1">
                         <p className="text-sm font-bold text-slate-600">Margen Seguridad</p>
                         <span className="text-xs bg-slate-200 text-slate-500 rounded-full w-4 h-4 flex items-center justify-center cursor-help">?</span>
                       </div>
                       <p className="text-2xl font-extrabold text-slate-800">{res.metricas.margen_seguridad}%</p>
                       <div className="absolute top-full right-0 mt-2 hidden group-hover:block w-48 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-20">
                          Cuánto pueden caer tus ventas esperadas antes de llegar al punto de equilibrio. Menos de 15% es muy riesgoso.
                       </div>
                     </div>
                  </div>

                  {/* MÓDULO QUÉ PASA SI */}
                  <div className="p-5 bg-indigo-900 text-white rounded-xl shadow-md">
                    <h3 className="font-bold text-indigo-100 mb-4 text-sm flex items-center gap-2">
                       <span>🧪 Sensibilidad: ¿Qué pasa si...?</span>
                    </h3>
                    <div className="space-y-4">
                       <div>
                          <div className="flex justify-between text-xs font-medium mb-1">
                             <span className="text-indigo-200">Si modifico mis precios un</span>
                             <span className="text-white font-bold">{whatIf.variacionPrecio > 0 ? '+' : ''}{whatIf.variacionPrecio}% (S/ {wiPrecio.toFixed(1)})</span>
                          </div>
                          <input type="range" min="-50" max="50" step="5" value={whatIf.variacionPrecio} onChange={(e) => setWhatIf({...whatIf, variacionPrecio: parseInt(e.target.value)})} className="w-full accent-emerald-400 cursor-pointer h-1 bg-indigo-700 rounded-lg appearance-none" />
                       </div>
                       <div>
                          <div className="flex justify-between text-xs font-medium mb-1">
                             <span className="text-indigo-200">Y mis costos suben/bajan un</span>
                             <span className="text-white font-bold">{whatIf.variacionCostos > 0 ? '+' : ''}{whatIf.variacionCostos}% (S/ {wiCosto.toFixed(1)})</span>
                          </div>
                          <input type="range" min="-50" max="50" step="5" value={whatIf.variacionCostos} onChange={(e) => setWhatIf({...whatIf, variacionCostos: parseInt(e.target.value)})} className="w-full accent-rose-400 cursor-pointer h-1 bg-indigo-700 rounded-lg appearance-none" />
                       </div>
                       <div className="pt-3 border-t border-indigo-700 flex justify-between items-center">
                          <span className="text-xs text-indigo-200">Nuevo Punto Equilibrio:</span>
                          <span className="font-bold text-lg">{wiPuntoEq} v/mes</span>
                       </div>
                    </div>
                  </div>

                  {/* EL GRÁFICO */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-2 text-sm">Crecimiento de Caja (Escenario Base)</h3>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="mes" tick={{fontSize: 10}} />
                          <YAxis tick={{fontSize: 10}} width={40}/>
                          <Tooltip formatter={(value: any) => `S/ ${value}`} />
                          <ReferenceLine y={0} stroke="red" strokeDasharray="3 3" />
                          <Line type="monotone" dataKey="caja" stroke="#10b981" strokeWidth={3} dot={{r: 3}} activeDot={{r: 6}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* --- PANEL DEL CONSEJERO IA --- */}
                  <div className="p-5 bg-slate-800 text-slate-100 rounded-xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🤖</div>
                    <h3 className="font-bold text-white mb-3 text-lg relative z-10">Auditoría Estratégica (Gemini IA)</h3>
                    
                    <div className="flex gap-2 mb-4 flex-wrap relative z-10">
                      <button onClick={() => pedirConsejo('auditor')} className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-bold transition-all ${activeRol === 'auditor' ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>🧐 Riesgo & Costos</button>
                      <button onClick={() => pedirConsejo('marketing')} className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-bold transition-all ${activeRol === 'marketing' ? 'bg-purple-500 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>🚀 Crecimiento</button>
                      <button onClick={() => pedirConsejo('operaciones')} className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-bold transition-all ${activeRol === 'operaciones' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>⚙️ Operaciones</button>
                    </div>

                    {consejoIA && (
                      <div className="p-5 bg-slate-900/50 rounded-lg border border-slate-700 shadow-inner text-sm text-slate-300 max-h-[400px] overflow-y-auto relative z-10">
                        {cargandoIA ? (
                          <div className="animate-pulse flex space-x-3 items-center">
                             <div className="h-4 w-4 bg-indigo-500 rounded-full"></div>
                             <p className="text-indigo-300 font-medium tracking-wide">La IA está procesando el dictamen...</p>
                          </div>
                        ) : (
                          <ReactMarkdown
                            components={{
                              h3: ({node, ...props}) => <h3 className="text-xl font-bold text-white mt-4 mb-2 border-b border-slate-700 pb-1" {...props} />,
                              h4: ({node, ...props}) => <h4 className="text-lg font-bold text-indigo-300 mt-3 mb-1" {...props} />,
                              p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-bold text-white bg-slate-800 px-1 rounded" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1 text-slate-400" {...props} />,
                              li: ({node, ...props}) => <li {...props} />
                            }}
                          >
                            {consejoIA}
                          </ReactMarkdown>
                        )}
                      </div>
                    )}
                  </div>

                  <button onClick={() => exportarAExcel(formData.nombre_idea, res)} className="cursor-pointer w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors">
                    <span>📊 Descargar Reporte Final (.csv)</span>
                  </button>
                </>
              ) : (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 rounded-2xl bg-white p-8">
                  <div className="text-6xl mb-4 opacity-50">📈</div>
                  <h3 className="text-xl font-bold text-slate-600 mb-2">Plataforma de Decisión</h3>
                  <p className="text-center text-sm">Ejecuta la simulación para obtener el Score de Inversión, el análisis de riesgo y el dictamen de viabilidad.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- PESTAÑA 2: RANKING Y COMPARACIÓN --- */}
        {activeTab === 'ranking' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[80vh]">
            <div className="p-4 md:p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800">Ranking de Mis Ideas</h2>
              <div className="flex flex-wrap items-center gap-2 md:gap-4">
                {selectedToCompare.length > 0 && (
                  <>
                    <button onClick={deseleccionarTodos} className="cursor-pointer px-3 md:px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold text-xs md:text-sm shadow-md hover:bg-slate-300 transition-colors">Deseleccionar</button>
                    <button onClick={eliminarSeleccionados} className="cursor-pointer px-3 md:px-4 py-2 bg-rose-600 text-white rounded-lg font-bold text-xs md:text-sm shadow-md hover:bg-rose-700 transition-colors">Eliminar ({selectedToCompare.length})</button>
                    <button onClick={() => setShowCompareModal(true)} className="cursor-pointer px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs md:text-sm shadow-md hover:bg-indigo-700 transition-colors">Comparar ({selectedToCompare.length})</button>
                  </>
                )}
                <button onClick={cargarHistorial} className="cursor-pointer text-sm font-bold text-indigo-600 hover:underline">↻ Actualizar</button>
              </div>
            </div>
            
            <div className="overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse relative select-none">
                <thead className="bg-slate-100 text-slate-600 text-xs md:text-sm uppercase sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-3 md:p-4 border-b text-center">
                      <input type="checkbox" className="w-4 h-4 text-indigo-600 cursor-pointer" onChange={toggleAll} checked={historial.length > 0 && selectedToCompare.length === historial.length} />
                    </th>
                    <th className="p-3 md:p-4 border-b cursor-pointer hover:bg-slate-200 group transition-colors" onClick={() => requestSort('fecha')}>Fecha/Hora <SortIcon columnKey="fecha" /></th>
                    <th className="p-3 md:p-4 border-b cursor-pointer hover:bg-slate-200 group transition-colors" onClick={() => requestSort('proyecto')}>Proyecto <SortIcon columnKey="proyecto" /></th>
                    <th className="p-3 md:p-4 border-b cursor-pointer hover:bg-slate-200 group transition-colors" onClick={() => requestSort('sector')}>Sector <SortIcon columnKey="sector" /></th>
                    <th className="p-3 md:p-4 border-b cursor-pointer hover:bg-slate-200 group transition-colors" onClick={() => requestSort('score')}>Score <SortIcon columnKey="score" /></th>
                    <th className="p-3 md:p-4 border-b cursor-pointer hover:bg-slate-200 group transition-colors" onClick={() => requestSort('inversion')}>Inversión <SortIcon columnKey="inversion" /></th>
                    <th className="p-3 md:p-4 border-b cursor-pointer hover:bg-slate-200 group transition-colors" onClick={() => requestSort('riesgo')}>Riesgo <SortIcon columnKey="riesgo" /></th>
                    <th className="p-3 md:p-4 border-b text-center">Exportar</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedHistorial().length > 0 ? (
                    getSortedHistorial().map((item, idx) => {
                      const resBD = item.financial_results;
                      if (!resBD || !resBD.metricas) return null;
                      const score = resBD.metricas.score || 0;
                      
                      return (
                        <tr key={item.id || idx} className={`hover:bg-slate-50 border-b last:border-0 ${selectedToCompare.some(s => s.id === item.id) ? 'bg-indigo-50/50' : ''}`}>
                          <td className="p-3 md:p-4 text-center">
                            <input type="checkbox" className="w-4 h-4 text-indigo-600 cursor-pointer" checked={selectedToCompare.some(s => s.id === item.id)} onChange={() => toggleCompare(item)} />
                          </td>
                          <td className="p-3 md:p-4 text-xs font-medium text-slate-500 whitespace-nowrap">{formatFecha(item.created_at)}</td>
                          <td className="p-3 md:p-4 font-bold text-slate-800">{item.project_name}</td>
                          <td className="p-3 md:p-4 text-sm text-slate-600">{item.inputs?.sector || "N/A"}</td>
                          <td className="p-3 md:p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${score >= 75 ? 'bg-emerald-100 text-emerald-700' : score >= 45 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                              {score}/100
                            </span>
                          </td>
                          <td className="p-3 md:p-4 text-sm font-medium">S/ {resBD.metricas.inversion_total}</td>
                          <td className={`p-3 md:p-4 text-sm font-bold ${resBD.riesgo?.probabilidad_perdida > 30 ? 'text-rose-600' : 'text-slate-600'}`}>{resBD.riesgo?.probabilidad_perdida}%</td>
                          <td className="p-3 md:p-4 text-center">
                             <button onClick={() => exportarAExcel(item.project_name, resBD)} className="cursor-pointer text-emerald-600 font-bold hover:underline text-xs bg-emerald-50 px-3 py-1 rounded-md">↓ Excel</button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={8} className="p-8 text-center text-slate-500">Aún no hay proyectos guardados en tu portafolio.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- MODAL DE COMPARACIÓN --- */}
        {showCompareModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCompareModal(false); }}
          >
            <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h2 className="text-2xl font-black text-indigo-900">Comparativa Decisional</h2>
                <button onClick={() => setShowCompareModal(false)} className="cursor-pointer px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors">✕ Cerrar (ESC)</button>
              </div>
              
              <div className="p-6 overflow-x-auto flex-1 bg-slate-100/50">
                <div className="flex gap-6 min-w-max">
                  {selectedToCompare.map(item => {
                    const r = item.financial_results;
                    const ganancia = r.riesgo?.ganancia_promedio_anio || 0;
                    const score = r.metricas?.score || 0;
                    const roi = r.metricas?.roi || 'N/A';
                    const payback = typeof r.base?.mes_recuperacion === 'number' ? `Mes ${r.base.mes_recuperacion}` : '+1 Año';

                    return (
                      <div key={item.id} className="w-80 bg-white border border-slate-200 rounded-2xl p-6 shadow-md flex flex-col relative hover:shadow-xl transition-shadow">
                         <button onClick={() => toggleCompare(item)} className="cursor-pointer absolute top-4 right-4 text-slate-400 hover:text-rose-500 bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
                         <h3 className="font-bold text-xl text-slate-800 mb-1 pr-8 leading-tight">{item.project_name}</h3>
                         <p className="text-xs text-slate-500 mb-3">{formatFecha(item.created_at)}</p>
                         
                         <div className={`mb-5 inline-block px-3 py-1 rounded-full text-xs font-bold border ${score >= 75 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : score >= 45 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                           Score: {score}/100
                         </div>
                         
                         <div className="space-y-4 flex-1 text-sm">
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                               <span className="text-slate-500">Inversión Requerida:</span>
                               <span className="font-black text-slate-800">S/ {r.metricas.inversion_total}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                               <span className="text-slate-500">Rentabilidad (ROI):</span>
                               <span className="font-black text-indigo-600">{roi}%</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                               <span className="text-slate-500">Payback (Recuperación):</span>
                               <span className="font-bold text-slate-800">{payback}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                               <span className="text-slate-500">Punto de Equilibrio:</span>
                               <span className="font-bold text-slate-800">{r.metricas.punto_equilibrio} v/mes</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                               <span className="text-slate-500">Riesgo (Pérdida):</span>
                               <span className={`font-black ${r.riesgo.probabilidad_perdida > 30 ? 'text-rose-600' : 'text-emerald-600'}`}>{r.riesgo.probabilidad_perdida}%</span>
                            </div>
                            <div className="flex justify-between pt-1">
                               <span className="text-slate-500 font-medium">Ganancia Año 1:</span>
                               <span className={`font-black text-lg ${ganancia >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>S/ {ganancia}</span>
                            </div>
                         </div>
                         
                         <div className="mt-6 pt-4 border-t border-slate-100">
                           <p className="text-xs font-bold text-center text-slate-400 uppercase tracking-widest mb-1">Veredicto</p>
                           <p className={`text-center font-bold text-sm ${r.metricas?.recomendacion?.estado.includes("INVERTIR") && !r.metricas?.recomendacion?.estado.includes("NO") ? 'text-emerald-600' : r.metricas?.recomendacion?.estado.includes("NO") ? 'text-rose-600' : 'text-amber-600'}`}>
                             {r.metricas?.recomendacion?.estado || 'Analizar'}
                           </p>
                         </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
