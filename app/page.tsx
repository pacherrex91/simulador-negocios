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
    inversion: { insumos: 500, equipos: 2000, empaques: 300, permisos: 150, otros: 200 },
    precio_venta: 18,
    costo_directo: 11,
    gastos_fijos: { marketing: 200, logistica: 150, sueldo_emprendedor: 1000, impuestos: 50, otros: 100 },
    ventas: { pesimista: 60, base: 120, optimista: 200, crecimiento_mensual: 5 }
  });

  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // --- ESTADOS DE LA INTELIGENCIA ARTIFICIAL ---
  const [consejoIA, setConsejoIA] = useState("");
  const [cargandoIA, setCargandoIA] = useState(false);
  const [activeRol, setActiveRol] = useState("");

  // --- ESTADOS PARA COMPARAR PROYECTOS ---
  const [selectedToCompare, setSelectedToCompare] = useState<any[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // --- FUNCIÓN PARA PEDIR CONSEJO A GEMINI ---
  const pedirConsejo = async (rol: string) => {
    setActiveRol(rol);
    setCargandoIA(true);
    setConsejoIA("El consejero está analizando tus números...");
    try {
      const response = await fetch('https://simulador-backend-ytbv.onrender.com/consejero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rol: rol,
          idea: formData.nombre_idea,
          sector: formData.sector,
          metricas: res.metricas
        })
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
    if (data) {
      const ranking = data.sort((a, b) => (b.financial_results?.riesgo?.ganancia_promedio_anio || 0) - (a.financial_results?.riesgo?.ganancia_promedio_anio || 0));
      setHistorial(ranking);
    }
  };

  const eliminarSimulacion = async (id: string) => {
    if(!window.confirm("¿Estás seguro de que deseas eliminar esta simulación?")) return;
    await supabase.from('simulations').delete().eq('id', id);
    cargarHistorial();
  };

  const toggleCompare = (item: any) => {
    if (selectedToCompare.some(s => s.id === item.id)) {
      setSelectedToCompare(selectedToCompare.filter(s => s.id !== item.id));
    } else {
      setSelectedToCompare([...selectedToCompare, item]);
    }
  };

  useEffect(() => { if (activeTab === 'ranking') cargarHistorial(); }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setConsejoIA(""); 
    setActiveRol("");
    try {
      const peticion = await fetch("https://simulador-backend-ytbv.onrender.com/simular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await peticion.json();
      setRes(data);

      await supabase.from('simulations').insert([{
        project_name: formData.nombre_idea,
        inputs: formData,
        financial_results: data,
        status: 'completed'
      }]);
    } catch (error) {
      alert("Error conectando al motor Python en Render. Revisa que el servicio esté activo.");
    }
    setLoading(false);
  };

  const exportarAExcel = (nombre: string, resultados: any) => {
    if (!resultados || !resultados.base || !resultados.base.caja_mes_a_mes) return;
    let csvContent = "Mes,Flujo de Caja Acumulado (S/)\n";
    resultados.base.caja_mes_a_mes.forEach((monto: number, index: number) => {
      csvContent += `Mes ${index + 1},${monto}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Proyeccion_${nombre.replace(/ /g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNested = (category: string, field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [category]: { ...(prev as any)[category], [field]: value || 0 }
    }));
  };

  const handleSimple = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const invTotal = Object.values(formData.inversion).reduce((a, b) => a + b, 0);
  const margenUnitario = formData.precio_venta - formData.costo_directo;
  const gastosFijosTotales = Object.values(formData.gastos_fijos).reduce((a, b) => a + b, 0);
  const puntoEquilibrio = res ? Math.ceil(res.metricas.gastos_fijos_mes / (margenUnitario || 1)) : 0;
  const promedioMensual = res ? res.riesgo.ganancia_promedio_anio / 12 : 0;

  const chartData = res?.base?.caja_mes_a_mes?.map((caja: number, i: number) => ({
    mes: `Mes ${i + 1}`, caja: caja
  })) || [];

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-6 text-center">
          <h1 className="text-4xl font-extrabold text-indigo-700">Centro de Mando de Inversiones</h1>
          <p className="text-slate-500 mt-2">Simula, compara y elige la mejor idea para tus S/ 10,000</p>
        </header>

        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-sm p-1 inline-flex border border-slate-200">
            <button onClick={() => setActiveTab('simulador')} className={`cursor-pointer px-6 py-2 font-bold rounded-md transition-colors ${activeTab === 'simulador' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-indigo-600'}`}>Nueva Simulación</button>
            <button onClick={() => setActiveTab('ranking')} className={`cursor-pointer px-6 py-2 font-bold rounded-md transition-colors ${activeTab === 'ranking' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-indigo-600'}`}>Mis Ideas (Ranking)</button>
          </div>
        </div>

        {activeTab === 'simulador' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* PANEL IZQUIERDO */}
            <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
              <form onSubmit={handleSubmit} className="space-y-8">
                
                <section>
                  <h2 className="text-xl font-bold border-b pb-2 mb-4 text-indigo-600">1. Datos Generales</h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div><label className="block text-sm font-semibold mb-1">¿Qué idea es?</label><input type="text" value={formData.nombre_idea} onChange={e => handleSimple('nombre_idea', e.target.value)} className="w-full p-2 border rounded bg-slate-50" /></div>
                    <div><label className="block text-sm font-semibold mb-1">Sector</label><input type="text" value={formData.sector} onChange={e => handleSimple('sector', e.target.value)} className="w-full p-2 border rounded bg-slate-50" /></div>
                  </div>
                </section>
                
                <section>
                  <div className="flex justify-between items-end border-b pb-2 mb-4">
                    <h2 className="text-xl font-bold text-indigo-600">2. Desglose de Inversión Inicial</h2>
                    <span className={`font-bold px-3 py-1 rounded ${invTotal > 10000 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>Total: S/ {invTotal} / S/ 10,000</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.keys(formData.inversion).map(key => (
                      <div key={key}><label className="block text-sm font-semibold mb-1 capitalize">{key}</label><input type="number" value={(formData.inversion as any)[key]} onChange={e => handleNested('inversion', key, parseFloat(e.target.value))} className="w-full p-2 border rounded bg-slate-50" /></div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-bold border-b pb-2 mb-4 text-indigo-600">3. Unitarios (Por cada venta)</h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div><label className="block text-sm font-semibold mb-1">Precio Venta Unitario (S/)</label><input type="number" value={formData.precio_venta} onChange={e => handleSimple('precio_venta', parseFloat(e.target.value))} className="w-full p-2 border rounded bg-slate-50" /></div>
                    <div><label className="block text-sm font-semibold mb-1">Costo Directo Unitario (S/)</label><input type="number" value={formData.costo_directo} onChange={e => handleSimple('costo_directo', parseFloat(e.target.value))} className="w-full p-2 border rounded bg-slate-50" /></div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-bold border-b pb-2 mb-4 text-indigo-600">4. Gastos Mensuales Fijos (S/)</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.keys(formData.gastos_fijos).map(key => (
                      <div key={key}><label className="block text-sm font-semibold mb-1 capitalize">{key.replace('_', ' ')}</label><input type="number" value={(formData.gastos_fijos as any)[key]} onChange={e => handleNested('gastos_fijos', key, parseFloat(e.target.value))} className="w-full p-2 border rounded bg-slate-50" /></div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-bold border-b pb-2 mb-4 text-indigo-600">5. Proyección de Ventas (Mensual)</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="block text-sm font-bold mb-1 text-rose-600">Pesimista</label><input type="number" value={formData.ventas.pesimista} onChange={e => handleNested('ventas', 'pesimista', parseInt(e.target.value))} className="w-full p-2 border border-rose-200 rounded bg-slate-50" /></div>
                    <div><label className="block text-sm font-bold mb-1 text-indigo-600">Base (Realista)</label><input type="number" value={formData.ventas.base} onChange={e => handleNested('ventas', 'base', parseInt(e.target.value))} className="w-full p-2 border border-indigo-300 rounded bg-indigo-50" /></div>
                    <div><label className="block text-sm font-bold mb-1 text-emerald-600">Optimista</label><input type="number" value={formData.ventas.optimista} onChange={e => handleNested('ventas', 'optimista', parseInt(e.target.value))} className="w-full p-2 border border-emerald-200 rounded bg-slate-50" /></div>
                    <div><label className="block text-sm font-semibold mb-1">Crecimiento Mensual (%)</label><input type="number" value={formData.ventas.crecimiento_mensual} onChange={e => handleNested('ventas', 'crecimiento_mensual', parseFloat(e.target.value))} className="w-full p-2 border rounded bg-slate-50" /></div>
                  </div>
                </section>

                <button type="submit" disabled={loading || invTotal > 10000} className="cursor-pointer w-full py-4 bg-indigo-900 hover:bg-indigo-800 text-white text-lg font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg hover:shadow-xl">
                  {loading ? "Simulando 1,000 escenarios..." : invTotal > 10000 ? "Inversión supera límite" : "Ejecutar Simulación Completa 🚀"}
                </button>
              </form>
            </div>

            {/* PANEL DERECHO */}
            <div className="lg:col-span-5 space-y-6">
              {res ? (
                <>
                  <div className={`p-5 border-2 rounded-xl shadow-sm text-center ${promedioMensual >= 0 ? 'bg-emerald-50 border-emerald-400' : 'bg-rose-50 border-rose-400'}`}>
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Resultado Mensual Estimado</h3>
                    <p className={`text-4xl font-black my-2 ${promedioMensual >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {promedioMensual >= 0 ? '+ ' : '- '}S/ {Math.abs(Math.round(promedioMensual))}
                    </p>
                    <p className="text-xs font-medium text-slate-500">Promedio calculado sobre el primer año.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                       <p className="text-sm text-slate-600 mb-1">Riesgo (Pérdida al Año 1):</p>
                       <p className={`text-2xl font-extrabold ${res.riesgo.probabilidad_perdida > 30 ? 'text-rose-600' : 'text-emerald-600'}`}>
                         {res.riesgo.probabilidad_perdida}%
                       </p>
                     </div>
                     <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                       <p className="text-sm text-slate-600 mb-1">Punto Equilibrio (Ventas):</p>
                       <p className="text-2xl font-extrabold text-indigo-700">{puntoEquilibrio}</p>
                     </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${res.metricas.cubre_fondo ? 'bg-white border-emerald-200 shadow-sm' : 'bg-amber-50 border-amber-200'}`}>
                    <h3 className="font-bold text-slate-800 text-sm mb-1">Caja de Emergencia (2 meses fijos)</h3>
                    {res.metricas.cubre_fondo ? (
                      <p className="text-sm text-emerald-700 font-medium">✅ S/ {10000 - res.metricas.inversion_total} libres, cubre S/ {res.metricas.fondo_maniobra_req} sin vender.</p>
                    ) : (
                      <p className="text-sm text-amber-700 font-bold">⚠️ OJO: Faltan S/ {res.metricas.falta_fondo} de reserva.</p>
                    )}
                  </div>

                  {/* EL GRÁFICO */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-2 text-sm">Flujo de Caja Mensual (Proyección Base)</h3>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="mes" tick={{fontSize: 10}} />
                          <YAxis tick={{fontSize: 10}} width={40}/>
                          <Tooltip formatter={(value: any) => `S/ ${value}`} />
                          <ReferenceLine y={0} stroke="red" strokeDasharray="3 3" />
                          <Line type="monotone" dataKey="caja" stroke="#4f46e5" strokeWidth={3} dot={{r: 3}} activeDot={{r: 6}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* --- PANEL DEL CONSEJERO IA --- */}
                  <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <h3 className="font-bold text-indigo-900 mb-3 text-lg">🤖 Consejero de IA (Gemini)</h3>
                    
                    <div className="flex gap-2 mb-4 flex-wrap">
                      <button onClick={() => pedirConsejo('auditor')} className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeRol === 'auditor' ? 'bg-slate-900 text-white ring-2 ring-offset-2 ring-slate-900' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>🧐 Auditor</button>
                      <button onClick={() => pedirConsejo('marketing')} className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeRol === 'marketing' ? 'bg-purple-800 text-white ring-2 ring-offset-2 ring-purple-800' : 'bg-purple-600 text-white hover:bg-purple-500'}`}>🚀 Marketing</button>
                      <button onClick={() => pedirConsejo('operaciones')} className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeRol === 'operaciones' ? 'bg-blue-800 text-white ring-2 ring-offset-2 ring-blue-800' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>⚙️ Operaciones</button>
                    </div>

                    {consejoIA && (
                      <div className="p-5 bg-white rounded-lg border border-indigo-100 shadow-inner text-sm text-slate-700 max-h-[400px] overflow-y-auto">
                        {cargandoIA ? (
                          <div className="animate-pulse flex space-x-2 items-center">
                             <div className="h-4 w-4 bg-indigo-400 rounded-full"></div>
                             <p className="text-indigo-600 font-medium">Procesando el análisis...</p>
                          </div>
                        ) : (
                          <ReactMarkdown
                            components={{
                              h3: ({node, ...props}) => <h3 className="text-xl font-bold text-indigo-900 mt-4 mb-2 border-b pb-1" {...props} />,
                              h4: ({node, ...props}) => <h4 className="text-lg font-bold text-indigo-700 mt-3 mb-1" {...props} />,
                              p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-bold text-slate-900 bg-indigo-50 px-1 rounded" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                              li: ({node, ...props}) => <li className="text-slate-700" {...props} />
                            }}
                          >
                            {consejoIA}
                          </ReactMarkdown>
                        )}
                      </div>
                    )}
                  </div>
                  {/* --- FIN PANEL IA --- */}

                  <button onClick={() => exportarAExcel(formData.nombre_idea, res)} className="cursor-pointer w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                    <span>📊 Descargar Excel (.csv)</span>
                  </button>
                </>
              ) : (
                <div className="h-full min-h-[400px] flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 rounded-2xl bg-white">
                  <p className="text-center px-6">Ejecuta una simulación para ver los resultados, gráficas y la Inteligencia Artificial.</p>
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
              <div className="flex items-center gap-4">
                {selectedToCompare.length > 0 && (
                  <button onClick={() => setShowCompareModal(true)} className="cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-md hover:bg-indigo-700 transition-colors">
                    Comparar ({selectedToCompare.length})
                  </button>
                )}
                <button onClick={cargarHistorial} className="cursor-pointer text-sm font-bold text-indigo-600 hover:underline">↻ Actualizar Datos</button>
              </div>
            </div>
            
            <div className="overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse relative">
                <thead className="bg-slate-100 text-slate-600 text-xs md:text-sm uppercase sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-3 md:p-4 border-b text-center">✓</th>
                    <th className="p-3 md:p-4 border-b">Proyecto</th>
                    <th className="p-3 md:p-4 border-b">Inversión</th>
                    <th className="p-3 md:p-4 border-b">Punto Eq.</th>
                    <th className="p-3 md:p-4 border-b">Riesgo</th>
                    <th className="p-3 md:p-4 border-b">Ganancia Año 1</th>
                    <th className="p-3 md:p-4 border-b text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.length > 0 ? (
                    historial.map((item, idx) => {
                      const resBD = item.financial_results;
                      if (!resBD || !resBD.metricas) return null;
                      const ganancia = resBD.riesgo?.ganancia_promedio_anio || 0;
                      return (
                        <tr key={item.id || idx} className={`hover:bg-slate-50 border-b last:border-0 ${selectedToCompare.some(s => s.id === item.id) ? 'bg-indigo-50/50' : ''}`}>
                          <td className="p-3 md:p-4 text-center">
                            <input type="checkbox" className="w-4 h-4 text-indigo-600 cursor-pointer" checked={selectedToCompare.some(s => s.id === item.id)} onChange={() => toggleCompare(item)} />
                          </td>
                          <td className="p-3 md:p-4 font-bold text-slate-800">{idx === 0 && '🏆 '} {item.project_name}</td>
                          <td className="p-3 md:p-4 text-sm">S/ {resBD.metricas.inversion_total}</td>
                          <td className="p-3 md:p-4 text-sm">{Math.ceil(resBD.metricas.gastos_fijos_mes / ((item.inputs.precio_venta - item.inputs.costo_directo) || 1))} v/mes</td>
                          <td className={`p-3 md:p-4 text-sm font-bold ${resBD.riesgo?.probabilidad_perdida > 30 ? 'text-rose-600' : 'text-slate-600'}`}>{resBD.riesgo?.probabilidad_perdida}%</td>
                          <td className={`p-3 md:p-4 text-sm font-bold ${ganancia >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>S/ {ganancia}</td>
                          <td className="p-3 md:p-4">
                            <div className="flex flex-col md:flex-row justify-center items-center gap-2">
                               <button onClick={() => exportarAExcel(item.project_name, resBD)} className="cursor-pointer text-emerald-600 font-bold hover:underline text-xs bg-emerald-50 px-2 py-1 rounded">↓ Excel</button>
                               <button onClick={() => eliminarSimulacion(item.id)} className="cursor-pointer text-rose-600 font-bold hover:underline text-xs bg-rose-50 px-2 py-1 rounded">Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={7} className="p-8 text-center text-slate-500">Aún no hay simulaciones guardadas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- MODAL DE COMPARACIÓN --- */}
        {showCompareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h2 className="text-2xl font-black text-indigo-900">Comparativa de Proyectos</h2>
                <button onClick={() => setShowCompareModal(false)} className="cursor-pointer px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors">✕ Cerrar</button>
              </div>
              
              <div className="p-6 overflow-x-auto flex-1">
                <div className="flex gap-4 min-w-max">
                  {selectedToCompare.map(item => {
                    const r = item.financial_results;
                    const ganancia = r.riesgo?.ganancia_promedio_anio || 0;
                    
                    // Cálculo de respaldo por si es una simulación vieja que no guardó el margen unitario
                    const margenUnitarioCalculado = (item.inputs?.precio_venta || 0) - (item.inputs?.costo_directo || 0);

                    return (
                      <div key={item.id} className="w-72 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col relative">
                         <button onClick={() => toggleCompare(item)} className="cursor-pointer absolute top-3 right-3 text-slate-400 hover:text-rose-500">✕</button>
                         <h3 className="font-bold text-lg text-slate-800 mb-4 border-b pb-2 pr-4">{item.project_name}</h3>
                         
                         <div className="space-y-3 flex-1 text-sm">
                            <div className="flex justify-between border-b border-slate-100 pb-1">
                               <span className="text-slate-500">Inversión:</span>
                               <span className="font-bold text-slate-800">S/ {r.metricas.inversion_total}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-1">
                               <span className="text-slate-500">Punto Eq.:</span>
                               <span className="font-bold text-indigo-600">{Math.ceil(r.metricas.gastos_fijos_mes / ((item.inputs.precio_venta - item.inputs.costo_directo) || 1))} v/mes</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-1">
                               <span className="text-slate-500">Riesgo (Pérdida):</span>
                               <span className={`font-bold ${r.riesgo.probabilidad_perdida > 30 ? 'text-rose-600' : 'text-emerald-600'}`}>{r.riesgo.probabilidad_perdida}%</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-1">
                               <span className="text-slate-500">Ganancia Año 1:</span>
                               <span className={`font-bold ${ganancia >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>S/ {ganancia}</span>
                            </div>
                            <div className="flex justify-between pt-2">
                               <span className="text-slate-500">Margen Unitario:</span>
                               <span className="font-bold text-slate-800">S/ {r.metricas?.margen_unitario || margenUnitarioCalculado}</span>
                            </div>
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
