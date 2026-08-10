"use client";
import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

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

  const cargarHistorial = async () => {
    const { data } = await supabase.from('simulations').select('*').order('created_at', { ascending: false });
    if (data) {
      const ranking = data.sort((a, b) => (b.financial_results?.riesgo?.ganancia_promedio_anio || 0) - (a.financial_results?.riesgo?.ganancia_promedio_anio || 0));
      setHistorial(ranking);
    }
  };

  useEffect(() => { if (activeTab === 'ranking') cargarHistorial(); }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // AQUÍ ESTÁ LA CONEXIÓN A TU NUEVO SERVIDOR EN RENDER EN ESTADOS UNIDOS
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
          <p className="text-slate-500 mt-2">Simula, compara y elige la mejor idea para tus S/ 5,000</p>
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
            <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
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
                    <span className={`font-bold px-3 py-1 rounded ${invTotal > 5000 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>Total: S/ {invTotal} / S/ 5,000</span>
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {Object.keys(formData.gastos_fijos).map(key => (
                      <div key={key}><label className="block text-sm font-semibold mb-1 capitalize">{key.replace('_', ' ')}</label><input type="number" value={(formData.gastos_fijos as any)[key]} onChange={e => handleNested('gastos_fijos', key, parseFloat(e.target.value))} className="w-full p-2 border rounded bg-slate-50" /></div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-bold border-b pb-2 mb-4 text-indigo-600">5. Proyección de Ventas (Mensual)</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="block text-sm font-semibold mb-1 text-rose-600">Pesimista</label><input type="number" value={formData.ventas.pesimista} onChange={e => handleNested('ventas', 'pesimista', parseInt(e.target.value))} className="w-full p-2 border border-rose-200 rounded bg-slate-50" /></div>
                    <div><label className="block text-sm font-bold mb-1 text-indigo-600">Base (Realista)</label><input type="number" value={formData.ventas.base} onChange={e => handleNested('ventas', 'base', parseInt(e.target.value))} className="w-full p-2 border-2 border-indigo-300 rounded bg-indigo-50" /></div>
                    <div><label className="block text-sm font-semibold mb-1 text-emerald-600">Optimista</label><input type="number" value={formData.ventas.optimista} onChange={e => handleNested('ventas', 'optimista', parseInt(e.target.value))} className="w-full p-2 border border-emerald-200 rounded bg-slate-50" /></div>
                    <div><label className="block text-sm font-semibold mb-1">Crecimiento Mensual (%)</label><input type="number" value={formData.ventas.crecimiento_mensual} onChange={e => handleNested('ventas', 'crecimiento_mensual', parseFloat(e.target.value))} className="w-full p-2 border rounded bg-slate-50" /></div>
                  </div>
                </section>

                <button type="submit" disabled={loading || invTotal > 5000} className="cursor-pointer w-full py-4 bg-indigo-900 hover:bg-indigo-800 text-white text-lg font-bold rounded-xl transition-all disabled:opacity-50">
                  {loading ? "Simulando 1,000 escenarios..." : invTotal > 5000 ? "Inversión supera límite" : "Ejecutar Simulación Completa 🚀"}
                </button>
              </form>
            </div>

            {/* PANEL DERECHO */}
            <div className="lg:col-span-4 space-y-6">
              {res ? (
                <>
                  <div className={`p-5 border-2 rounded-xl shadow-sm text-center ${promedioMensual >= 0 ? 'bg-emerald-50 border-emerald-400' : 'bg-rose-50 border-rose-400'}`}>
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Resultado Mensual Estimado</h3>
                    <p className={`text-4xl font-black my-2 ${promedioMensual >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {promedioMensual >= 0 ? '+' : '-'} S/ {Math.abs(Math.round(promedioMensual))}
                    </p>
                    <p className="text-xs font-medium text-slate-500">Promedio calculado sobre el primer año.</p>
                  </div>

                  <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <h3 className="font-bold text-indigo-900 text-lg mb-4">Análisis de Riesgo</h3>
                    <div className="mb-4">
                      <p className="text-sm text-slate-600">Probabilidad de fracaso (Caja negativa al Año 1):</p>
                      <p className={`text-4xl font-extrabold ${res.riesgo.probabilidad_perdida > 30 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {res.riesgo.probabilidad_perdida}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Caja Promedio Esperada (Año 1):</p>
                      <p className={`text-2xl font-bold ${res.riesgo.ganancia_promedio_anio >= 0 ? 'text-indigo-700' : 'text-rose-600'}`}>
                        S/ {res.riesgo.ganancia_promedio_anio}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-800 text-white rounded-xl shadow-md">
                    <h3 className="font-bold text-lg mb-2">Proyección Base</h3>
                    <p className="text-slate-300 text-sm mb-4">Mes en el que recuperas toda tu inversión inicial de S/ {res.metricas.inversion_total}:</p>
                    <p className={`text-2xl font-bold ${typeof res.base.mes_recuperacion === 'number' ? 'text-emerald-400' : 'text-emerald-400'}`}>
                      {typeof res.base.mes_recuperacion === 'number' ? `Mes ${res.base.mes_recuperacion}` : res.base.mes_recuperacion}
                    </p>
                  </div>

                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <h3 className="font-bold text-indigo-900 text-sm mb-1">Meta Mensual (Punto Equilibrio)</h3>
                    <p className="text-2xl font-extrabold text-indigo-700">{puntoEquilibrio} ventas</p>
                    <p className="text-xs font-bold text-indigo-900 mt-1">(A partir de la venta {puntoEquilibrio + 1}, recién empiezas a ganar).</p>
                  </div>

                  <div className={`p-4 rounded-xl border ${res.metricas.cubre_fondo ? 'bg-white border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <h3 className="font-bold text-slate-800 text-sm mb-1">Caja de Emergencia (2 meses)</h3>
                    {res.metricas.cubre_fondo ? (
                      <p className="text-sm text-emerald-700 font-medium">✅ Tienes S/ {5000 - res.metricas.inversion_total} libres, suficiente para cubrir los S/ {res.metricas.fondo_maniobra_req} de gastos fijos si no vendes nada.</p>
                    ) : (
                      <p className="text-sm text-amber-700 font-bold">⚠️ OJO: Te faltan S/ {res.metricas.falta_fondo} de reserva para operar tranquilo los primeros meses.</p>
                    )}
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-2 text-sm">Flujo de Caja Mensual</h3>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="mes" tick={{fontSize: 10}} />
                          <YAxis tick={{fontSize: 10}} width={40}/>
                          <Tooltip formatter={(value) => `S/ ${value}`} />
                          <ReferenceLine y={0} stroke="red" strokeDasharray="3 3" />
                          <Line type="monotone" dataKey="caja" stroke="#4f46e5" strokeWidth={3} dot={{r: 3}} activeDot={{r: 6}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <button onClick={() => exportarAExcel(formData.nombre_idea, res)} className="cursor-pointer w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                    <span>📊 Descargar Excel (.csv)</span>
                  </button>
                </>
              ) : (
                <div className="h-full min-h-[400px] flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 rounded-2xl bg-white">
                  <p className="text-center px-6">Ejecuta una simulación para ver los resultados y gráficas.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- PESTAÑA 2: RANKING --- */}
        {activeTab === 'ranking' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Ranking de Rentabilidad</h2>
              <button onClick={cargarHistorial} className="cursor-pointer text-sm font-bold text-indigo-600 hover:underline">↻ Actualizar Datos</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-sm uppercase">
                    <th className="p-4 border-b">Proyecto</th>
                    <th className="p-4 border-b">Inversión</th>
                    <th className="p-4 border-b">Punto Eq.</th>
                    <th className="p-4 border-b">Riesgo</th>
                    <th className="p-4 border-b">Ganancia Año 1</th>
                    <th className="p-4 border-b text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.length > 0 ? (
                    historial.map((item, idx) => {
                      const resBD = item.financial_results;
                      if (!resBD || !resBD.metricas) return null;
                      const ganancia = resBD.riesgo?.ganancia_promedio_anio || 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-50 border-b last:border-0">
                          <td className="p-4 font-bold text-slate-800">{idx === 0 && '🏆 '} {item.project_name}</td>
                          <td className="p-4">S/ {resBD.metricas.inversion_total}</td>
                          <td className="p-4">{Math.ceil(resBD.metricas.gastos_fijos_mes / ((item.inputs.precio_venta - item.inputs.costo_directo) || 1))} v/mes</td>
                          <td className="p-4 font-bold text-slate-600">{resBD.riesgo?.probabilidad_perdida}%</td>
                          <td className={`p-4 font-bold ${ganancia >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>S/ {ganancia}</td>
                          <td className="p-4 text-center">
                            <button onClick={() => exportarAExcel(item.project_name, resBD)} className="cursor-pointer text-emerald-600 font-bold hover:underline text-sm">↓ Excel</button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-500">Aún no hay simulaciones guardadas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}