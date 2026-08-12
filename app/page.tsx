"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import ReactMarkdown from 'react-markdown';

// --- 1. PLANTILLAS PREDEFINIDAS ---
const TEMPLATES = {
  vacio: {
    nombre_idea: "", sector: "", moneda: "S/", capital_disponible: 10000,
    inversion: { insumos: 0, equipos: 0, empaques: 0, permisos: 0, otros: 0 },
    precio_venta: 0, costo_directo: 0,
    gastos_fijos: { marketing: 0, logistica: 0, sueldo_emprendedor: 0, otros: 0 },
    ventas: { pesimista: 0, base: 0, optimista: 0, crecimiento_mensual: 0 },
    regimen_tributario: "NRUS", inflacion_anual: 3.0,
    solicitar_prestamo: false, tea: 15.0, plazo_meses: 12
  },
  cafeteria: {
    nombre_idea: "Cafetería de Especialidad", sector: "Gastronomía", moneda: "S/", capital_disponible: 25000,
    inversion: { insumos: 2000, equipos: 15000, empaques: 1000, permisos: 800, otros: 1200 },
    precio_venta: 12, costo_directo: 4,
    gastos_fijos: { marketing: 500, logistica: 200, sueldo_emprendedor: 1500, otros: 2000 },
    ventas: { pesimista: 400, base: 800, optimista: 1200, crecimiento_mensual: 3 },
    regimen_tributario: "MYPE", inflacion_anual: 4.0,
    solicitar_prestamo: true, tea: 18.0, plazo_meses: 24
  },
  ecommerce: {
    nombre_idea: "E-commerce Ropa Urbana", sector: "Retail / Moda", moneda: "USD", capital_disponible: 5000,
    inversion: { insumos: 3000, equipos: 500, empaques: 200, permisos: 100, otros: 500 },
    precio_venta: 45, costo_directo: 20,
    gastos_fijos: { marketing: 800, logistica: 400, sueldo_emprendedor: 1000, otros: 200 },
    ventas: { pesimista: 50, base: 150, optimista: 300, crecimiento_mensual: 10 },
    regimen_tributario: "RER", inflacion_anual: 2.5,
    solicitar_prestamo: false, tea: 15.0, plazo_meses: 12
  },
  agencia: {
    nombre_idea: "Agencia de Marketing Digital", sector: "Servicios B2B", moneda: "USD", capital_disponible: 3000,
    inversion: { insumos: 0, equipos: 2000, empaques: 0, permisos: 200, otros: 300 },
    precio_venta: 800, costo_directo: 50,
    gastos_fijos: { marketing: 300, logistica: 50, sueldo_emprendedor: 2000, otros: 500 },
    ventas: { pesimista: 3, base: 8, optimista: 15, crecimiento_mensual: 5 },
    regimen_tributario: "MYPE", inflacion_anual: 3.0,
    solicitar_prestamo: false, tea: 15.0, plazo_meses: 12
  }
};

export default function Home() {
  const [activeTab, setActiveTab] = useState('simulador');
  const [historial, setHistorial] = useState<any[]>([]);
  
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState({ name: "Invitado Local", isLogged: false });

  const [formData, setFormData] = useState(TEMPLATES.cafeteria);
  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [guardandoNube, setGuardandoNube] = useState(false);
  
  const [tourStep, setTourStep] = useState(0); 
  
  const [consejoIA, setConsejoIA] = useState("");
  const [cargandoIA, setCargandoIA] = useState(false);
  const [activeRol, setActiveRol] = useState("");
  const [cacheIA, setCacheIA] = useState<any>({}); 
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [cargandoChat, setCargandoChat] = useState(false);

  const [selectedToCompare, setSelectedToCompare] = useState<any[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'fecha', direction: 'desc' });

  useEffect(() => {
    const savedData = localStorage.getItem('simuladorDraft');
    const savedTheme = localStorage.getItem('theme');
    if (savedData) setFormData(JSON.parse(savedData));
    if (savedTheme === 'dark') setDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('simuladorDraft', JSON.stringify(formData));
    
    const timeoutId = setTimeout(async () => {
      if (formData.nombre_idea.trim() !== "") {
         setGuardandoNube(true);
         try {
           await supabase.from('simulations').upsert([{ 
             project_name: formData.nombre_idea + " (Borrador)", 
             inputs: formData, 
             status: 'draft' 
           }]);
         } catch (e) {}
         setTimeout(() => setGuardandoNube(false), 1000);
      }
    }, 3000);
    return () => clearTimeout(timeoutId);
  }, [formData]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Se añade el control de la tecla ESC para el Tour
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') {
        if (showCompareModal) setShowCompareModal(false);
        if (tourStep > 0) setTourStep(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown); 
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCompareModal, tourStep]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setLogoPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const pedirConsejo = async (rol: string) => {
    setActiveRol(rol); 
    if (cacheIA[rol]) { setConsejoIA(cacheIA[rol]); return; }
    setCargandoIA(true); setConsejoIA("La IA está analizando la viabilidad...");
    try {
      const response = await fetch('https://simulador-backend-ytbv.onrender.com/consejero', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol, idea: formData.nombre_idea, sector: formData.sector, metricas: res?.metricas })
      });
      const data = await response.json();
      setConsejoIA(data.consejo);
      setCacheIA((prev: any) => ({ ...prev, [rol]: data.consejo }));
    } catch (error) { setConsejoIA("Hubo un error al contactar al consejero."); }
    setCargandoIA(false);
  };

  const enviarMensajeChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const nuevoMensaje = { role: "user", content: chatInput };
    setChatHistory([...chatHistory, nuevoMensaje]);
    setChatInput(""); setCargandoChat(true);
    
    try {
      const response = await fetch('https://simulador-backend-ytbv.onrender.com/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: chatHistory, question: chatInput, idea: formData.nombre_idea, sector: formData.sector, metricas: res?.metricas })
      });
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: "model", content: data.respuesta }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: "model", content: "Error de conexión. Intenta de nuevo." }]);
    }
    setCargandoChat(false);
  };

  const cargarHistorial = async () => {
    const { data } = await supabase.from('simulations').select('*').order('created_at', { ascending: false });
    if (data) setHistorial(data.filter(item => item.status !== 'draft'));
  };

  const eliminarSimulacion = async (id: string) => {
    if(!window.confirm("¿Seguro que deseas eliminar esta simulación?")) return;
    await supabase.from('simulations').delete().eq('id', id);
    setSelectedToCompare(prev => prev.filter(s => s.id !== id));
    cargarHistorial();
  };

  const editarSimulacion = (item: any) => {
    setFormData(item.inputs);
    setActiveTab('simulador');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cargarPlantilla = (key: keyof typeof TEMPLATES) => {
    if(window.confirm(`¿Cargar la plantilla de ${TEMPLATES[key].nombre_idea || "Proyecto Vacío"}? Se sobrescribirán tus datos actuales.`)) {
      setFormData(TEMPLATES[key]);
      setRes(null);
      setConsejoIA("");
      setChatHistory([]);
    }
  };

  const toggleCompare = (item: any) => {
    if (selectedToCompare.some(s => s.id === item.id)) setSelectedToCompare(selectedToCompare.filter(s => s.id !== item.id));
    else setSelectedToCompare([...selectedToCompare, item]);
  };
  
  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedToCompare([...historial]); else setSelectedToCompare([]);
  };

  const deseleccionarTodos = () => { setSelectedToCompare([]); };

  const eliminarSeleccionados = async () => {
    if (!window.confirm(`¿Eliminar los ${selectedToCompare.length} proyectos seleccionados permanentemente?`)) return;
    const ids = selectedToCompare.map(item => item.id);
    await supabase.from('simulations').delete().in('id', ids);
    setSelectedToCompare([]); cargarHistorial();
  };

  const requestSort = (key: string) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  const getSortedHistorial = () => {
    const sortedData = [...historial];
    sortedData.sort((a, b) => {
      if (!a.financial_results || !b.financial_results) return 0;
      const resA = a.financial_results; const resB = b.financial_results;
      let aValue: any = 0; let bValue: any = 0;
      switch(sortConfig.key) {
        case 'fecha': aValue = new Date(a.created_at || 0).getTime(); bValue = new Date(b.created_at || 0).getTime(); break;
        case 'proyecto': aValue = a.project_name; bValue = b.project_name; return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        case 'sector': aValue = a.inputs?.sector || ""; bValue = b.inputs?.sector || ""; return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        case 'score': aValue = resA.metricas?.score || 0; bValue = resB.metricas?.score || 0; break;
        case 'inversion': aValue = resA.metricas?.inversion_total || 0; bValue = resB.metricas?.inversion_total || 0; break;
        case 'punto_eq': aValue = resA.metricas?.punto_equilibrio || 0; bValue = resB.metricas?.punto_equilibrio || 0; break;
        case 'riesgo': aValue = resA.riesgo?.probabilidad_perdida || 0; bValue = resB.riesgo?.probabilidad_perdida || 0; break;
        case 'ganancia': aValue = resA.riesgo?.ganancia_promedio_anio || 0; bValue = resB.riesgo?.ganancia_promedio_anio || 0; break;
        default: return 0;
      }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortedData;
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <span className="text-slate-400 dark:text-slate-500 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">↕</span>;
    return <span className="ml-1 text-indigo-500 dark:text-indigo-400">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
  };

  useEffect(() => { if (activeTab === 'ranking') cargarHistorial(); }, [activeTab]);

  const ejecutarSimulacion = async () => {
    setLoading(true);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConsejoIA(""); setActiveRol(""); setChatHistory([]); setCacheIA({}); 
    ejecutarSimulacion();
    if(tourStep === 1) setTourStep(2); 
  };

  const exportarPDF = () => { window.print(); };

  const exportarAExcel = (nombre: string, resultados: any) => {
    if (!resultados || !resultados.base) return;
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += `REPORTE DE DECISIÓN DE INVERSIÓN: ${nombre.toUpperCase()}\n\n`;
    csvContent += `1. VEREDICTO FINAL\n`;
    csvContent += `Score de Inversión,${resultados.metricas?.score || 'N/A'} / 100\n`;
    csvContent += `Recomendación,${resultados.metricas?.recomendacion?.estado || 'N/A'} - ${resultados.metricas?.recomendacion?.msg || ''}\n\n`;
    csvContent += `2. MÉTRICAS CLAVE\n`;
    csvContent += `Inversión Total,${formData.moneda} ${resultados.metricas.inversion_total}\n`;
    csvContent += `Ganancia Año 1 (Promedio),${formData.moneda} ${resultados.riesgo.ganancia_promedio_anio}\n`;
    csvContent += `Retorno de Inversión (ROI),${resultados.metricas?.roi || 'N/A'}%\n`;
    csvContent += `Punto de Equilibrio,${resultados.metricas.punto_equilibrio} ventas/mes\n`;
    csvContent += `Probabilidad de Pérdida,${resultados.riesgo.probabilidad_perdida}%\n`;
    csvContent += `Recuperación del Capital (Payback),Mes ${resultados.base.mes_recuperacion}\n\n`;
    csvContent += `3. PROYECCIÓN MENSUAL (ESCENARIO BASE)\n`;
    csvContent += `Mes,Flujo de Caja Acumulado (${formData.moneda})\n`;
    resultados.base.caja_mes_a_mes.forEach((monto: number, index: number) => {
      csvContent += `Mes ${index + 1},${monto}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Analisis_Inversion_${nombre.replace(/ /g, "_")}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleNested = (category: string, field: string, value: number) => {
    setFormData(prev => ({ ...prev, [category]: { ...(prev as any)[category], [field]: value || 0 } }));
  };
  const handleSimple = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const invTotal = Object.values(formData.inversion).reduce((a, b) => a + b, 0);
  const chartData = [];
  if (res) {
    for(let i=0; i<12; i++) {
        chartData.push({ mes: `Mes ${i+1}`, base: res.base.caja_mes_a_mes[i], pesimista: res.pesimista.caja_mes_a_mes[i], optimista: res.optimista.caja_mes_a_mes[i] });
    }
  }

  const formatFecha = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString); const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000); const diffHours = Math.floor(diffMins / 60);
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300 print:bg-white print:p-0 print:m-0">
      
      {/* -------------------- ESTILOS EXCLUSIVOS PARA EL REPORTE PDF (IMPRESIÓN) -------------------- */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; color: black !important; }
          .print-header { border-bottom: 4px solid #4f46e5; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .print-title { font-size: 28px; font-weight: 900; color: #1e1b4b; text-transform: uppercase; letter-spacing: 1px; }
          .print-subtitle { font-size: 14px; color: #64748b; font-weight: bold; }
          .print-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
          .print-card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center; }
          .print-card-title { font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
          .print-card-value { font-size: 20px; font-weight: 900; color: #0f172a; }
          .print-veredicto { border: 2px solid #10b981; background-color: #ecfdf5 !important; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px; }
          .print-veredicto h3 { font-size: 14px; color: #065f46; font-weight: bold; text-transform: uppercase; }
          .print-veredicto h2 { font-size: 32px; font-weight: 900; color: #047857; margin: 5px 0; }
          .print-chart-container { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; height: 350px; }
          .print-ai-report { border: 1px solid #cbd5e1; background-color: #f8fafc !important; padding: 20px; border-radius: 8px; }
          .print-ai-title { font-size: 16px; font-weight: bold; color: #334155; border-bottom: 2px solid #cbd5e1; padding-bottom: 10px; margin-bottom: 15px; }
          .print-footer { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        }
      `}} />

      {/* OVERLAY DEL TOUR INTERACTIVO */}
      {tourStep > 0 && (
         <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center print:hidden" onClick={(e) => { if (e.target === e.currentTarget) setTourStep(0); }}>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-indigo-200 dark:border-indigo-900 text-center animate-in fade-in zoom-in">
               <div className="text-6xl mb-4">{tourStep === 1 ? '📝' : tourStep === 2 ? '🎛️' : '🤖'}</div>
               <h3 className="text-2xl font-black text-indigo-700 dark:text-indigo-400 mb-2">
                 {tourStep === 1 ? 'Paso 1: Tus Datos' : tourStep === 2 ? 'Paso 2: Sensibilidad' : 'Paso 3: El Consejero'}
               </h3>
               <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                 {tourStep === 1 ? 'Completa el formulario de la izquierda con los costos de tu idea. Si no sabes por dónde empezar, ¡usa una de nuestras plantillas rápidas arriba!' : 
                  tourStep === 2 ? 'Una vez generado el dictamen, usa los sliders de la derecha para simular qué pasaría si bajas tus precios o suben tus costos. El gráfico se actualizará al instante.' : 
                  'Por último, interactúa con la Inteligencia Artificial. Hazle preguntas específicas sobre tu rubro en el chat integrado para obtener estrategias reales.'}
               </p>
               <div className="flex justify-between items-center mt-6">
                 <button onClick={() => setTourStep(0)} className="cursor-pointer text-slate-400 font-bold hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Saltar Tour</button>
                 <button onClick={() => setTourStep(tourStep === 3 ? 0 : tourStep + 1)} className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold transition-colors">
                   {tourStep === 3 ? '¡Empezar!' : 'Siguiente'}
                 </button>
               </div>
            </div>
         </div>
      )}

      {/* DISEÑO DEL REPORTE PDF (Solo visible al imprimir) */}
      <div className="hidden print:block">
         <div className="print-header">
            <div>
               {logoPreview ? (
                 <img src={logoPreview} alt="Logo" style={{ maxHeight: '60px', marginBottom: '10px' }} />
               ) : (
                 <div className="print-title">Decisiones de Inversión IA</div>
               )}
               <div className="print-subtitle">Reporte Confidencial Generado el {new Date().toLocaleDateString('es-PE')}</div>
            </div>
            <div className="text-right">
               <div className="font-bold text-slate-800 text-xl">{formData.nombre_idea}</div>
               <div className="text-slate-500">Sector: {formData.sector}</div>
            </div>
         </div>

         {res && (
            <div className="print-results-wrapper">
              <div className="print-veredicto">
                 <h3>Dictamen del Algoritmo Financiero</h3>
                 <h2>{res.metricas.recomendacion.estado}</h2>
                 <p className="font-medium text-emerald-800">{res.metricas.recomendacion.msg}</p>
              </div>

              <div className="print-grid">
                 <div className="print-card">
                    <div className="print-card-title">Score de Inversión</div>
                    <div className="print-card-value text-indigo-700">{res.metricas.score}/100</div>
                 </div>
                 <div className="print-card">
                    <div className="print-card-title">Inversión Total</div>
                    <div className="print-card-value">{formData.moneda} {res.metricas.inversion_total}</div>
                 </div>
                 <div className="print-card">
                    <div className="print-card-title">Punto Equilibrio</div>
                    <div className="print-card-value text-indigo-700">{res.metricas.punto_equilibrio} v/m</div>
                 </div>
                 <div className="print-card">
                    <div className="print-card-title">Riesgo (Pérdida)</div>
                    <div className="print-card-value text-rose-600">{res.riesgo.probabilidad_perdida}%</div>
                 </div>
                 <div className="print-card">
                    <div className="print-card-title">Recuperación (Payback)</div>
                    <div className="print-card-value">{typeof res.base.mes_recuperacion === 'number' ? `Mes ${res.base.mes_recuperacion}` : '+1 Año'}</div>
                 </div>
                 <div className="print-card">
                    <div className="print-card-title">Ganancia Prom. Año 1</div>
                    <div className="print-card-value text-emerald-600">{formData.moneda} {res.riesgo.ganancia_promedio_anio}</div>
                 </div>
                 <div className="print-card">
                    <div className="print-card-title">Margen Neto</div>
                    <div className="print-card-value">{res.base.margen_neto}%</div>
                 </div>
                 <div className="print-card">
                    <div className="print-card-title">Margen de Seguridad</div>
                    <div className="print-card-value">{res.metricas.margen_seguridad}%</div>
                 </div>
              </div>

              <div className="print-chart-container">
                <h3 className="font-bold text-slate-800 mb-2 text-sm">Flujo de Caja Acumulado (Multiescenario)</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="mes" tick={{fontSize: 10, fill: '#64748b'}} />
                    <YAxis tick={{fontSize: 10, fill: '#64748b'}} width={45}/>
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <ReferenceLine y={0} stroke="#000" strokeWidth={1} />
                    {typeof res.metricas.mes_alcanza_equilibrio === 'number' && (
                      <ReferenceLine x={`Mes ${res.metricas.mes_alcanza_equilibrio}`} stroke="#8b5cf6" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: 'ALCANZA EQUILIBRIO', fill: '#8b5cf6', fontSize: 10, fontWeight: 'bold' }} />
                    )}
                    <Line type="monotone" dataKey="pesimista" stroke="#e11d48" strokeWidth={2} name="Pesimista" dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="base" stroke="#4f46e5" strokeWidth={3} name="Base" dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="optimista" stroke="#10b981" strokeWidth={2} name="Optimista" dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {consejoIA && (
                <div className="print-ai-report" style={{ pageBreakInside: 'avoid' }}>
                   <div className="print-ai-title">🤖 Auditoría Estratégica (Inteligencia Artificial)</div>
                   <div className="text-sm text-slate-800 leading-relaxed">
                      <ReactMarkdown components={{
                        h3: ({node, ...props}) => <h3 className="text-lg font-bold text-slate-900 mt-3 mb-1" {...props} />,
                        h4: ({node, ...props}) => <h4 className="font-bold text-slate-800 mt-2" {...props} />,
                        p: ({node, ...props}) => <p className="mb-2" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2" {...props} />,
                        li: ({node, ...props}) => <li {...props} />
                      }}>
                        {consejoIA}
                      </ReactMarkdown>
                   </div>
                </div>
              )}

              <div className="print-footer">
                 Documento generado automáticamente por Decisiones de Inversión IA. Los resultados son estimaciones basadas en los datos proporcionados y no constituyen asesoría financiera garantizada.
              </div>
            </div>
         )}
      </div>

      <div className="max-w-7xl mx-auto print:hidden">
        
        <div className="flex flex-wrap justify-between items-center mb-8 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                 {user.name.charAt(0)}
              </div>
              <div>
                 <p className="text-sm font-bold dark:text-white">{user.name}</p>
                 <p className="text-xs text-slate-500 dark:text-slate-400">{guardandoNube ? '☁️ Guardando borrador...' : '✅ Sincronizado localmente'}</p>
              </div>
           </div>
           
           <div className="flex items-center gap-3 mt-4 md:mt-0">
              <button onClick={() => setTourStep(1)} className="cursor-pointer text-sm font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
                💡 Ayuda / Tour
              </button>
              <button onClick={() => setDarkMode(!darkMode)} className="cursor-pointer text-xl p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}>
                {darkMode ? '☀️' : '🌙'}
              </button>
           </div>
        </div>

        <header className="mb-6 text-center">
          <h1 className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-400 tracking-tight">Decisiones de Inversión IA</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Simula, sensibiliza y toma decisiones financieras basadas en datos empíricos.</p>
        </header>

        <div className="flex justify-center gap-2 mb-6 flex-wrap">
           <span className="py-2 text-sm font-bold text-slate-400 dark:text-slate-500">Plantillas Rápidas:</span>
           <button onClick={() => cargarPlantilla('cafeteria')} className="cursor-pointer px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">☕ Cafetería</button>
           <button onClick={() => cargarPlantilla('ecommerce')} className="cursor-pointer px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">🛍️ E-Commerce</button>
           <button onClick={() => cargarPlantilla('agencia')} className="cursor-pointer px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">💻 Agencia Digital</button>
           <button onClick={() => cargarPlantilla('vacio')} className="cursor-pointer px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors">🗑️ Limpiar Todo</button>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-1 inline-flex border border-slate-200 dark:border-slate-700">
            <button onClick={() => setActiveTab('simulador')} className={`cursor-pointer px-6 py-2 font-bold rounded-md transition-colors ${activeTab === 'simulador' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>Simulador</button>
            <button onClick={() => setActiveTab('ranking')} className={`cursor-pointer px-6 py-2 font-bold rounded-md transition-colors ${activeTab === 'ranking' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>Mis Proyectos ({historial.length})</button>
          </div>
        </div>

        {activeTab === 'simulador' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <form onSubmit={handleSubmit} className="space-y-8">
                <section>
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
                     <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">1. Datos y Capital</h2>
                     <select value={formData.moneda} onChange={e => handleSimple('moneda', e.target.value)} className="p-1 border dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer">
                        <option value="S/">Soles (S/)</option>
                        <option value="USD">Dólares (USD)</option>
                        <option value="EUR">Euros (€)</option>
                        <option value="MXN">Pesos (MXN)</option>
                     </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-2"><label className="block text-sm font-semibold mb-1">Nombre del Proyecto</label><input type="text" value={formData.nombre_idea} onChange={e => handleSimple('nombre_idea', e.target.value)} className="w-full p-2 border dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none" /></div>
                    <div><label className="block text-sm font-bold mb-1 text-emerald-700 dark:text-emerald-400">Mi Capital ({formData.moneda})</label><input type="number" value={formData.capital_disponible} onChange={e => handleSimple('capital_disponible', parseFloat(e.target.value))} className="w-full p-2 border-2 border-emerald-300 dark:border-emerald-600 rounded bg-emerald-50 dark:bg-emerald-900/20 font-bold outline-none" /></div>
                  </div>
                  <div><label className="block text-sm font-semibold mb-1">Sector Comercial</label><input type="text" value={formData.sector} onChange={e => handleSimple('sector', e.target.value)} className="w-full p-2 border dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none" /></div>
                </section>
                
                <section>
                  <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
                    <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">2. Inversión Requerida</h2>
                    <span className={`font-bold px-3 py-1 rounded text-sm ${invTotal > formData.capital_disponible ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>Total: {formData.moneda} {invTotal}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {Object.keys(formData.inversion).map(key => (
                      <div key={key}><label className="block text-sm font-semibold mb-1 capitalize">{key}</label><input type="number" value={(formData.inversion as any)[key]} onChange={e => handleNested('inversion', key, parseFloat(e.target.value))} className="w-full p-2 border dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none" /></div>
                    ))}
                  </div>

                  {invTotal > formData.capital_disponible && (
                    <div className="mt-4 p-4 border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/10 rounded-xl">
                       <div className="flex items-center gap-2 mb-3">
                          <input type="checkbox" id="prestamo" checked={formData.solicitar_prestamo} onChange={e => handleSimple('solicitar_prestamo', e.target.checked)} className="w-4 h-4 accent-rose-600 cursor-pointer" />
                          <label htmlFor="prestamo" className="font-bold text-rose-800 dark:text-rose-400 text-sm cursor-pointer">Solicitar Préstamo por el capital faltante ({formData.moneda} {invTotal - formData.capital_disponible})</label>
                       </div>
                       {formData.solicitar_prestamo && (
                         <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1">Tasa Efectiva Anual (TEA %)</label><input type="number" step="0.1" value={formData.tea} onChange={e => handleSimple('tea', parseFloat(e.target.value))} className="w-full p-2 border dark:border-slate-600 rounded bg-white dark:bg-slate-800 outline-none text-sm" /></div>
                            <div><label className="block text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1">Plazo (Meses)</label><input type="number" value={formData.plazo_meses} onChange={e => handleSimple('plazo_meses', parseInt(e.target.value))} className="w-full p-2 border dark:border-slate-600 rounded bg-white dark:bg-slate-800 outline-none text-sm" /></div>
                         </div>
                       )}
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="text-xl font-bold border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 text-indigo-600 dark:text-indigo-400">3. Unitarios (Por Venta)</h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div><label className="block text-sm font-semibold mb-1">Precio de Venta ({formData.moneda})</label><input type="number" value={formData.precio_venta} onChange={e => handleSimple('precio_venta', parseFloat(e.target.value))} className="w-full p-2 border dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none" /></div>
                    <div><label className="block text-sm font-semibold mb-1">Costo Directo ({formData.moneda})</label><input type="number" value={formData.costo_directo} onChange={e => handleSimple('costo_directo', parseFloat(e.target.value))} className="w-full p-2 border dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none" /></div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-bold border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 text-indigo-600 dark:text-indigo-400">4. Gastos e Impuestos Fijos</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {Object.keys(formData.gastos_fijos).map(key => (
                      <div key={key}><label className="block text-sm font-semibold mb-1 capitalize truncate" title={key.replace('_', ' ')}>{key.replace('_', ' ')}</label><input type="number" value={(formData.gastos_fijos as any)[key]} onChange={e => handleNested('gastos_fijos', key, parseFloat(e.target.value))} className="w-full p-2 border dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none" /></div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Régimen Tributario</label>
                      <select value={formData.regimen_tributario} onChange={e => handleSimple('regimen_tributario', e.target.value)} className="w-full p-2 border dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none text-sm cursor-pointer">
                        <option value="NRUS">Nuevo RUS (Cuota Fija)</option>
                        <option value="RER">RER (1.5% Ingresos)</option>
                        <option value="MYPE">Régimen General (1% cuenta)</option>
                      </select>
                    </div>
                    <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Inflación Anual Esperada (%)</label><input type="number" step="0.1" value={formData.inflacion_anual} onChange={e => handleSimple('inflacion_anual', parseFloat(e.target.value))} className="w-full p-2 border dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none" /></div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-bold border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 text-indigo-600 dark:text-indigo-400">5. Ventas Mensuales Estimadas</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="block text-sm font-bold mb-1 text-rose-600 dark:text-rose-400">Pesimista</label><input type="number" value={formData.ventas.pesimista} onChange={e => handleNested('ventas', 'pesimista', parseInt(e.target.value))} className="w-full p-2 border border-rose-200 dark:border-rose-800 rounded bg-slate-50 dark:bg-slate-700 outline-none" /></div>
                    <div><label className="block text-sm font-bold mb-1 text-indigo-600 dark:text-indigo-400">Base (Realista)</label><input type="number" value={formData.ventas.base} onChange={e => handleNested('ventas', 'base', parseInt(e.target.value))} className="w-full p-2 border border-indigo-300 dark:border-indigo-700 rounded bg-indigo-50 dark:bg-indigo-900/20 outline-none" /></div>
                    <div><label className="block text-sm font-bold mb-1 text-emerald-600 dark:text-emerald-400">Optimista</label><input type="number" value={formData.ventas.optimista} onChange={e => handleNested('ventas', 'optimista', parseInt(e.target.value))} className="w-full p-2 border border-emerald-200 dark:border-emerald-800 rounded bg-slate-50 dark:bg-slate-700 outline-none" /></div>
                    <div><label className="block text-sm font-semibold mb-1">Crecim. Mensual (%)</label><input type="number" step="0.1" value={formData.ventas.crecimiento_mensual} onChange={e => handleNested('ventas', 'crecimiento_mensual', parseFloat(e.target.value))} className="w-full p-2 border dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 outline-none" /></div>
                  </div>
                </section>

                <button type="submit" disabled={loading} className="cursor-pointer w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold rounded-xl transition-all shadow-lg">
                  {loading ? "Ejecutando algoritmo decisional..." : "Generar Dictamen de Inversión 🚀"}
                </button>
              </form>
            </div>

            <div className="lg:col-span-5 space-y-6">
              {res ? (
                <div className="results-wrapper space-y-6">
                  {/* SECCIÓN MARCA BLANCA Y EXPORTACIÓN */}
                  <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col gap-3">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Marca Blanca (PDF)</label>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-900/30 dark:file:text-indigo-300 hover:file:bg-indigo-100 cursor-pointer file:cursor-pointer" />
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                       <button onClick={exportarPDF} className="cursor-pointer py-3 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors">📄 PDF Ejecutivo</button>
                       <button onClick={() => exportarAExcel(formData.nombre_idea, res)} className="cursor-pointer py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors">📊 Datos a CSV</button>
                     </div>
                  </div>

                  {/* DICTAMEN PRINCIPAL */}
                  <div className={`p-6 border-2 rounded-2xl shadow-md text-center ${res.metricas.recomendacion.estado.includes("INVERTIR") && !res.metricas.recomendacion.estado.includes("NO") ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-400 dark:border-emerald-600' : res.metricas.recomendacion.estado.includes("NO") ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-400 dark:border-rose-600' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-400 dark:border-amber-600'}`}>
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-lg uppercase tracking-wide mb-2">Dictamen de Inversión</h3>
                    <div className={`text-3xl font-black mb-1 ${res.metricas.recomendacion.estado.includes("INVERTIR") && !res.metricas.recomendacion.estado.includes("NO") ? 'text-emerald-600 dark:text-emerald-400' : res.metricas.recomendacion.estado.includes("NO") ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>{res.metricas.recomendacion.estado}</div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{res.metricas.recomendacion.msg}</p>
                    <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-around">
                       <div>
                         <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Score Algorítmico</p>
                         <p className="text-xl font-black text-slate-800 dark:text-slate-100">{res.metricas.score}<span className="text-sm text-slate-500 dark:text-slate-400">/100</span></p>
                       </div>
                       <div>
                         <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">ROI Estimado</p>
                         <p className="text-xl font-black text-slate-800 dark:text-slate-100">{res.metricas.roi}%</p>
                       </div>
                    </div>
                  </div>

                  {/* GESTIÓN DEL CAPITAL Y PRÉSTAMOS */}
                  <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-3 ml-2">Gestión de tu Capital ({formData.moneda} {formData.capital_disponible})</h3>
                    <div className="ml-2 space-y-2">
                       <p className="text-sm text-slate-600 dark:text-slate-400 flex justify-between">
                         <span>1. Reserva Intocable (3 meses)</span>
                         <span className="font-bold text-slate-800 dark:text-slate-200">{formData.moneda} {res.metricas.reserva_emergencia}</span>
                       </p>
                       <p className="text-sm text-slate-600 dark:text-slate-400 flex justify-between">
                         <span>2. Capital Seguro para Invertir</span>
                         <span className="font-bold text-emerald-600 dark:text-emerald-400">{formData.moneda} {res.metricas.capital_invertible}</span>
                       </p>
                       <p className={`text-sm flex justify-between pt-2 border-t dark:border-slate-700 mt-2 ${invTotal > res.metricas.capital_invertible ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                         <span>3. Tu Inversión Total</span>
                         <span>{formData.moneda} {invTotal}</span>
                       </p>
                       {res.metricas.prestamo?.monto > 0 && (
                         <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-1">🏦 Préstamo Bancario Activo</p>
                            <p className="text-xs text-amber-700 dark:text-amber-500 flex justify-between"><span>Monto Financiado:</span> <span>{formData.moneda} {res.metricas.prestamo.monto}</span></p>
                            <p className="text-xs text-amber-700 dark:text-amber-500 flex justify-between"><span>Cuota Mensual (Restada de caja):</span> <span className="font-bold">{formData.moneda} {res.metricas.prestamo.cuota_mensual}</span></p>
                         </div>
                       )}
                    </div>
                  </div>

                  {/* INDICADORES FINANCIEROS */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl relative group">
                       <div className="flex justify-between items-center mb-1">
                         <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Riesgo (Pérdida)</p>
                         <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-full w-4 h-4 flex items-center justify-center cursor-help">?</span>
                       </div>
                       <p className={`text-2xl font-extrabold ${res.riesgo.probabilidad_perdida > 30 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                         {res.riesgo.probabilidad_perdida}%
                       </p>
                       <div className="absolute top-full left-0 mt-2 hidden group-hover:block w-48 p-3 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg shadow-xl z-20">
                          Probabilidad de que tu proyecto cierre el **primer año completo** con saldo negativo.
                       </div>
                     </div>
                     <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl relative group">
                       <div className="flex justify-between items-center mb-1">
                         <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Payback</p>
                         <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-full w-4 h-4 flex items-center justify-center cursor-help">?</span>
                       </div>
                       <p className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400">{typeof res.base.mes_recuperacion === 'number' ? `Mes ${res.base.mes_recuperacion}` : '+1 Año'}</p>
                       <div className="absolute top-full right-0 mt-2 hidden group-hover:block w-48 p-3 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg shadow-xl z-20">
                          Tiempo estimado para recuperar tu inversión inicial operando en el escenario base realista.
                       </div>
                     </div>
                     <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                       <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Margen Neto</p>
                       <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{res.base.margen_neto}%</p>
                     </div>
                     <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl relative group">
                       <div className="flex justify-between items-center mb-1">
                         <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Punto de Equilibrio</p>
                         <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-full w-4 h-4 flex items-center justify-center cursor-help">?</span>
                       </div>
                       <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{res.metricas.punto_equilibrio} <span className="text-sm font-medium">v/mes</span></p>
                       <div className="absolute top-full right-0 mt-2 hidden group-hover:block w-48 p-3 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg shadow-xl z-20">
                          Ventas exactas necesarias al mes para no perder ni ganar dinero (cubre costos fijos, cuotas e impuestos).
                       </div>
                     </div>
                  </div>

                  {/* MÓDULO QUÉ PASA SI SINCRONIZADO BIDIRECCIONAL */}
                  <div className="p-5 bg-indigo-900 text-white rounded-xl shadow-md">
                    <h3 className="font-bold text-indigo-100 mb-4 text-sm flex items-center gap-2">
                       <span>🧪 Sensibilidad Dinámica: Ajusta y recalcula al instante</span>
                    </h3>
                    <div className="space-y-5">
                       <div>
                          <div className="flex justify-between text-xs font-medium mb-2">
                             <span className="text-indigo-200">Precio de Venta Dinámico</span>
                             <span className="text-white font-bold bg-indigo-800 px-2 py-1 rounded">{formData.moneda} {formData.precio_venta.toFixed(2)}</span>
                          </div>
                          <input type="range" 
                             min={Math.max(1, formData.costo_directo + 1)} max={Math.max(100, formData.precio_venta * 2)} step="0.5" 
                             value={formData.precio_venta} 
                             onChange={(e) => handleSimple('precio_venta', parseFloat(e.target.value))} 
                             onMouseUp={ejecutarSimulacion} onTouchEnd={ejecutarSimulacion}
                             className="w-full accent-emerald-400 cursor-pointer h-1 bg-indigo-700 rounded-lg appearance-none" 
                          />
                       </div>
                       <div>
                          <div className="flex justify-between text-xs font-medium mb-2">
                             <span className="text-indigo-200">Costo Directo Dinámico</span>
                             <span className="text-white font-bold bg-indigo-800 px-2 py-1 rounded">{formData.moneda} {formData.costo_directo.toFixed(2)}</span>
                          </div>
                          <input type="range" 
                             min="1" max={formData.precio_venta - 0.5} step="0.5" 
                             value={formData.costo_directo} 
                             onChange={(e) => handleSimple('costo_directo', parseFloat(e.target.value))} 
                             onMouseUp={ejecutarSimulacion} onTouchEnd={ejecutarSimulacion}
                             className="w-full accent-rose-400 cursor-pointer h-1 bg-indigo-700 rounded-lg appearance-none" 
                          />
                       </div>
                    </div>
                  </div>

                  {/* EL GRÁFICO 3 LÍNEAS CON PUNTO DE EQUILIBRIO VISUAL */}
                  <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-sm">Proyección Multi-Escenario (Caja Acumulada)</h3>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#334155" : "#e2e8f0"} />
                          <XAxis dataKey="mes" tick={{fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b'}} />
                          <YAxis tick={{fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b'}} width={45}/>
                          <Tooltip formatter={(value: any) => `${formData.moneda} ${value}`} contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', color: darkMode ? '#f8fafc' : '#0f172a' }} />
                          <Legend wrapperStyle={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b' }} />
                          <ReferenceLine y={0} stroke={darkMode ? "#94a3b8" : "#000"} strokeWidth={1} />
                          {typeof res.metricas.mes_alcanza_equilibrio === 'number' && (
                            <ReferenceLine x={`Mes ${res.metricas.mes_alcanza_equilibrio}`} stroke="#8b5cf6" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: 'EQUILIBRIO', fill: '#8b5cf6', fontSize: 10, fontWeight: 'bold' }} />
                          )}
                          <Line type="monotone" dataKey="pesimista" stroke="#e11d48" strokeWidth={2} name="Pesimista" dot={false} isAnimationActive={false} />
                          <Line type="monotone" dataKey="base" stroke="#4f46e5" strokeWidth={3} name="Base (Realista)" dot={false} activeDot={{r: 6}} isAnimationActive={false} />
                          <Line type="monotone" dataKey="optimista" stroke="#10b981" strokeWidth={2} name="Optimista" dot={false} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* --- PANEL DEL CONSEJERO IA Y CHAT DINÁMICO --- */}
                  <div className="p-5 bg-slate-800 text-slate-100 rounded-xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🤖</div>
                    <h3 className="font-bold text-white mb-3 text-lg relative z-10">Auditoría Estratégica AI</h3>
                    
                    <div className="flex gap-2 mb-4 flex-wrap relative z-10">
                      <button onClick={() => pedirConsejo('auditor')} className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-bold transition-all ${activeRol === 'auditor' ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>🧐 Riesgo & Costos</button>
                      <button onClick={() => pedirConsejo('marketing')} className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-bold transition-all ${activeRol === 'marketing' ? 'bg-purple-500 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>🚀 Crecimiento</button>
                      <button onClick={() => pedirConsejo('operaciones')} className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-bold transition-all ${activeRol === 'operaciones' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>⚙️ Operaciones</button>
                    </div>

                    {consejoIA && (
                      <div className="p-5 bg-slate-900/50 rounded-t-lg border border-slate-700 shadow-inner text-sm text-slate-300 max-h-[400px] overflow-y-auto relative z-10 custom-scrollbar">
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
                        
                        {/* Historial de Chat Dinámico */}
                        {chatHistory.map((msg, i) => (
                           <div key={i} className={`mt-4 p-3 rounded-lg ${msg.role === 'user' ? 'bg-indigo-900/50 border border-indigo-700/50 text-indigo-100 ml-8' : 'bg-slate-800 border border-slate-700 text-slate-300 mr-8'}`}>
                              <p className="text-xs font-bold mb-1 opacity-50">{msg.role === 'user' ? 'Tú' : 'IA Consejero'}</p>
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                           </div>
                        ))}
                        {cargandoChat && (
                           <div className="mt-4 p-3 rounded-lg bg-slate-800 border border-slate-700 mr-8 animate-pulse">
                              <div className="h-2 bg-slate-600 rounded w-1/4 mb-2"></div>
                              <div className="h-2 bg-slate-600 rounded w-1/2"></div>
                           </div>
                        )}
                      </div>
                    )}
                    
                    {consejoIA && (
                       <form onSubmit={enviarMensajeChat} className="relative z-10 border border-t-0 border-slate-700 rounded-b-lg overflow-hidden flex">
                          <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Pregúntale al asesor: ¿Qué pasa si contrato un repartidor?" className="flex-1 bg-slate-900 p-3 text-sm text-white outline-none placeholder:text-slate-500" disabled={cargandoChat} />
                          <button type="submit" disabled={cargandoChat || !chatInput.trim()} className="bg-indigo-600 hover:bg-indigo-500 px-4 font-bold text-white disabled:opacity-50 cursor-pointer transition-colors">Enviar</button>
                       </form>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 rounded-2xl bg-white dark:bg-slate-800 p-8">
                  <div className="text-6xl mb-4 opacity-50">📈</div>
                  <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-2">Plataforma de Decisión</h3>
                  <p className="text-center text-sm">Ejecuta la simulación para obtener el Score, análisis de riesgo y el chatbot financiero.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- PESTAÑA 2: RANKING Y COMPARACIÓN --- */}
        {activeTab === 'ranking' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[80vh]">
            <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Ranking de Mis Proyectos</h2>
              <div className="flex flex-wrap items-center gap-2 md:gap-4">
                {selectedToCompare.length > 0 && (
                  <div className="flex gap-2 md:gap-4">
                    <button onClick={deseleccionarTodos} className="cursor-pointer px-3 md:px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs md:text-sm shadow-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Deseleccionar</button>
                    <button onClick={eliminarSeleccionados} className="cursor-pointer px-3 md:px-4 py-2 bg-rose-600 text-white rounded-lg font-bold text-xs md:text-sm shadow-md hover:bg-rose-700 transition-colors">Eliminar ({selectedToCompare.length})</button>
                    <button onClick={() => setShowCompareModal(true)} className="cursor-pointer px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs md:text-sm shadow-md hover:bg-indigo-700 transition-colors">Comparar ({selectedToCompare.length})</button>
                  </div>
                )}
                <button onClick={cargarHistorial} className="cursor-pointer text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">↻ Actualizar</button>
              </div>
            </div>
            
            <div className="overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse relative select-none">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs md:text-sm uppercase sticky top-0 z-10 shadow-sm border-b dark:border-slate-700">
                  <tr>
                    <th className="p-3 md:p-4 text-center">
                      <input type="checkbox" className="w-4 h-4 text-indigo-600 cursor-pointer" onChange={toggleAll} checked={historial.length > 0 && selectedToCompare.length === historial.length} />
                    </th>
                    <th className="p-3 md:p-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 group transition-colors" onClick={() => requestSort('fecha')}>Fecha <SortIcon columnKey="fecha" /></th>
                    <th className="p-3 md:p-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 group transition-colors" onClick={() => requestSort('proyecto')}>Proyecto <SortIcon columnKey="proyecto" /></th>
                    <th className="p-3 md:p-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 group transition-colors" onClick={() => requestSort('sector')}>Sector <SortIcon columnKey="sector" /></th>
                    <th className="p-3 md:p-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 group transition-colors" onClick={() => requestSort('score')}>Score <SortIcon columnKey="score" /></th>
                    <th className="p-3 md:p-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 group transition-colors" onClick={() => requestSort('inversion')}>Inversión <SortIcon columnKey="inversion" /></th>
                    <th className="p-3 md:p-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 group transition-colors" onClick={() => requestSort('ganancia')}>Ganancia <SortIcon columnKey="ganancia" /></th>
                    <th className="p-3 md:p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedHistorial().length > 0 ? (
                    getSortedHistorial().map((item, idx) => {
                      const resBD = item.financial_results;
                      if (!resBD || !resBD.metricas) return null;
                      const score = resBD.metricas.score || 0;
                      
                      return (
                        <tr key={item.id || idx} className={`border-b dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors ${selectedToCompare.some(s => s.id === item.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}>
                          <td className="p-3 md:p-4 text-center">
                            <input type="checkbox" className="w-4 h-4 text-indigo-600 cursor-pointer" checked={selectedToCompare.some(s => s.id === item.id)} onChange={() => toggleCompare(item)} />
                          </td>
                          <td className="p-3 md:p-4 text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatFecha(item.created_at)}</td>
                          <td className="p-3 md:p-4 font-bold text-slate-800 dark:text-slate-200">{item.project_name}</td>
                          <td className="p-3 md:p-4 text-sm text-slate-600 dark:text-slate-400">{item.inputs?.sector || "N/A"}</td>
                          <td className="p-3 md:p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${score >= 75 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : score >= 45 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>{score}/100</span>
                          </td>
                          <td className="p-3 md:p-4 text-sm font-medium dark:text-slate-300">{item.inputs?.moneda || "S/"} {resBD.metricas.inversion_total}</td>
                          <td className={`p-3 md:p-4 text-sm font-bold ${resBD.riesgo?.ganancia_promedio_anio >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{item.inputs?.moneda || "S/"} {resBD.riesgo?.ganancia_promedio_anio}</td>
                          <td className="p-3 md:p-4 text-center">
                             <div className="flex justify-center gap-2">
                               <button onClick={() => editarSimulacion(item)} className="cursor-pointer text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md transition-colors" title="Cargar en el simulador">✏️ Editar</button>
                               <button onClick={() => exportarAExcel(item.project_name, resBD)} className="cursor-pointer text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md transition-colors" title="Exportar CSV">📊 CSV</button>
                               <button onClick={() => eliminarSimulacion(item.id)} className="cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-md transition-colors" title="Eliminar">🗑️</button>
                             </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400">Aún no hay proyectos guardados en tu historial.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL COMPARATIVA */}
        {showCompareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowCompareModal(false); }}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <h2 className="text-2xl font-black text-indigo-900 dark:text-indigo-400">Comparativa Decisional</h2>
                <button onClick={() => setShowCompareModal(false)} className="cursor-pointer px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">✕ Cerrar</button>
              </div>
              <div className="p-6 overflow-x-auto flex-1 bg-slate-100/50 dark:bg-slate-900/20">
                <div className="flex gap-6 min-w-max">
                  {selectedToCompare.map(item => {
                    const r = item.financial_results;
                    return (
                      <div key={item.id} className="w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-md flex flex-col relative hover:shadow-xl transition-shadow">
                         <button onClick={() => toggleCompare(item)} className="cursor-pointer absolute top-4 right-4 text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
                         <h3 className="font-bold text-xl text-slate-800 dark:text-slate-200 mb-1 pr-8 leading-tight">{item.project_name}</h3>
                         <div className="space-y-4 flex-1 text-sm mt-4">
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2"><span className="text-slate-500 dark:text-slate-400">Inversión:</span><span className="font-black text-slate-800 dark:text-slate-200">{item.inputs?.moneda} {r.metricas.inversion_total}</span></div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2"><span className="text-slate-500 dark:text-slate-400">ROI:</span><span className="font-black text-indigo-600 dark:text-indigo-400">{r.metricas?.roi || 0}%</span></div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2"><span className="text-slate-500 dark:text-slate-400">Punto Eq.:</span><span className="font-bold text-slate-800 dark:text-slate-200">{r.metricas.punto_equilibrio} v/m</span></div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2"><span className="text-slate-500 dark:text-slate-400">Riesgo:</span><span className={`font-black ${r.riesgo.probabilidad_perdida > 30 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{r.riesgo.probabilidad_perdida}%</span></div>
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
