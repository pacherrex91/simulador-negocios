"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import ReactMarkdown from 'react-markdown';
import * as XLSX from 'xlsx';

// 🔥 CONFIGURACIÓN DE CONEXIÓN 🔥
const API_URL = "https://simulador-backend-ytbv.onrender.com"; 
// const API_URL = "https://simulador-backend-ytbv.onrender.com](https://simulador-backend-ytbv.onrender.com";

// COMPONENTE TOOLTIP REPARADO (Usa <span> en vez de <div> para no romper HTML)
const InfoTooltip = ({ text }: { text: string }) => (
  <span className="relative group inline-flex items-center justify-center ml-2 align-middle print:hidden">
    <span className="text-[11px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full w-5 h-5 flex items-center justify-center cursor-help border border-indigo-200 dark:border-indigo-800 transition-colors group-hover:bg-indigo-500 group-hover:text-white">i</span>
    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg shadow-xl z-50 text-center font-normal leading-relaxed pointer-events-none">
      {text}
      <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700 block"></span>
    </span>
  </span>
);

// 1. MEGA TEMPLATES COMPLETOS (LAS 100 IDEAS)
const TEMPLATES: any = {
  vacio: { category: "", volumen: "medio", nombre_idea: "", sector: "", moneda: "S/", capital_disponible: 10000, inversion: { insumos: 0, equipos: 0, empaques: 0, permisos: 0, otros: 0 }, precio_venta: 0, costo_directo: 0, gastos_fijos: { marketing: 0, logistica: 0, sueldo_emprendedor: 1200, otros: 0 }, ventas: { pesimista: 0, base: 0, optimista: 0, crecimiento_mensual: 0 }, regimen_tributario: "NRUS", inflacion_anual: 3.0 },
  
  // 🍔 GASTRONOMÍA Y ALIMENTOS
  cafeteria: { category: "🍔 Gastronomía", volumen: "alto", nombre_idea: "Cafetería de Especialidad", sector: "Gastronomía", moneda: "S/", capital_disponible: 25000, inversion: { insumos: 2000, equipos: 15000, empaques: 1000, permisos: 800, otros: 1200 }, precio_venta: 12, costo_directo: 4, gastos_fijos: { marketing: 500, logistica: 200, sueldo_emprendedor: 1200, otros: 2000 }, ventas: { pesimista: 400, base: 800, optimista: 1200, crecimiento_mensual: 3 }, regimen_tributario: "MYPE", inflacion_anual: 4.0 },
  dark_kitchen: { category: "🍔 Gastronomía", volumen: "alto", nombre_idea: "Dark Kitchen (Delivery)", sector: "Gastronomía", moneda: "S/", capital_disponible: 15000, inversion: { insumos: 1500, equipos: 8000, empaques: 800, permisos: 500, otros: 1000 }, precio_venta: 22, costo_directo: 9, gastos_fijos: { marketing: 800, logistica: 0, sueldo_emprendedor: 1200, otros: 1500 }, ventas: { pesimista: 300, base: 600, optimista: 900, crecimiento_mensual: 5 }, regimen_tributario: "NRUS", inflacion_anual: 3.5 },
  food_truck: { category: "🍔 Gastronomía", volumen: "alto", nombre_idea: "Food Truck Ambulante", sector: "Gastronomía", moneda: "S/", capital_disponible: 35000, inversion: { insumos: 1000, equipos: 25000, empaques: 500, permisos: 1500, otros: 2000 }, precio_venta: 18, costo_directo: 7, gastos_fijos: { marketing: 300, logistica: 400, sueldo_emprendedor: 1200, otros: 800 }, ventas: { pesimista: 500, base: 1000, optimista: 1500, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3.0 },
  panaderia: { category: "🍔 Gastronomía", volumen: "alto", nombre_idea: "Panadería Artesanal", sector: "Gastronomía", moneda: "S/", capital_disponible: 20000, inversion: { insumos: 1200, equipos: 12000, empaques: 400, permisos: 600, otros: 1000 }, precio_venta: 15, costo_directo: 4, gastos_fijos: { marketing: 200, logistica: 100, sueldo_emprendedor: 1200, otros: 1800 }, ventas: { pesimista: 600, base: 1200, optimista: 2000, crecimiento_mensual: 4 }, regimen_tributario: "NRUS", inflacion_anual: 3.5 },
  restaurante_menu: { category: "🍔 Gastronomía", volumen: "alto", nombre_idea: "Restaurante de Menú Diario", sector: "Gastronomía", moneda: "S/", capital_disponible: 15000, inversion: { insumos: 1500, equipos: 6000, empaques: 200, permisos: 800, otros: 2000 }, precio_venta: 14, costo_directo: 7, gastos_fijos: { marketing: 100, logistica: 0, sueldo_emprendedor: 1200, otros: 2500 }, ventas: { pesimista: 800, base: 1500, optimista: 2200, crecimiento_mensual: 1 }, regimen_tributario: "NRUS", inflacion_anual: 5.0 },
  cevicheria: { category: "🍔 Gastronomía", volumen: "alto", nombre_idea: "Cevichería / Pescados", sector: "Gastronomía", moneda: "S/", capital_disponible: 30000, inversion: { insumos: 2500, equipos: 12000, empaques: 500, permisos: 1000, otros: 3000 }, precio_venta: 35, costo_directo: 14, gastos_fijos: { marketing: 500, logistica: 100, sueldo_emprendedor: 1200, otros: 3500 }, ventas: { pesimista: 300, base: 700, optimista: 1200, crecimiento_mensual: 3 }, regimen_tributario: "MYPE", inflacion_anual: 4.0 },
  pizzeria: { category: "🍔 Gastronomía", volumen: "alto", nombre_idea: "Pizzería Artesanal", sector: "Gastronomía", moneda: "S/", capital_disponible: 28000, inversion: { insumos: 1500, equipos: 16000, empaques: 800, permisos: 600, otros: 2000 }, precio_venta: 30, costo_directo: 9, gastos_fijos: { marketing: 400, logistica: 500, sueldo_emprendedor: 1200, otros: 2200 }, ventas: { pesimista: 400, base: 800, optimista: 1400, crecimiento_mensual: 4 }, regimen_tributario: "RER", inflacion_anual: 3.5 },
  jugueria: { category: "🍔 Gastronomía", volumen: "alto", nombre_idea: "Juguería y Saludables", sector: "Gastronomía", moneda: "S/", capital_disponible: 10000, inversion: { insumos: 800, equipos: 4000, empaques: 400, permisos: 400, otros: 1000 }, precio_venta: 10, costo_directo: 3, gastos_fijos: { marketing: 100, logistica: 50, sueldo_emprendedor: 1200, otros: 1200 }, ventas: { pesimista: 600, base: 1200, optimista: 1800, crecimiento_mensual: 2 }, regimen_tributario: "NRUS", inflacion_anual: 3.0 },
  pasteleria: { category: "🍔 Gastronomía", volumen: "medio", nombre_idea: "Pastelería Fina / Tortas", sector: "Gastronomía", moneda: "S/", capital_disponible: 18000, inversion: { insumos: 1000, equipos: 10000, empaques: 800, permisos: 500, otros: 1500 }, precio_venta: 60, costo_directo: 18, gastos_fijos: { marketing: 300, logistica: 200, sueldo_emprendedor: 1200, otros: 1500 }, ventas: { pesimista: 50, base: 120, optimista: 250, crecimiento_mensual: 5 }, regimen_tributario: "NRUS", inflacion_anual: 3.0 },
  bar_restaurante: { category: "🍔 Gastronomía", volumen: "alto", nombre_idea: "Bar & Restobar", sector: "Gastronomía / Ocio", moneda: "S/", capital_disponible: 50000, inversion: { insumos: 5000, equipos: 20000, empaques: 500, permisos: 3000, otros: 8000 }, precio_venta: 25, costo_directo: 8, gastos_fijos: { marketing: 1000, logistica: 300, sueldo_emprendedor: 1200, otros: 5000 }, ventas: { pesimista: 800, base: 1800, optimista: 3000, crecimiento_mensual: 3 }, regimen_tributario: "MYPE", inflacion_anual: 4.5 },

  // 🛍️ RETAIL Y E-COMMERCE
  ecommerce_ropa: { category: "🛍️ Retail", volumen: "medio", nombre_idea: "E-commerce Ropa Urbana", sector: "Retail / Moda", moneda: "S/", capital_disponible: 8000, inversion: { insumos: 5000, equipos: 500, empaques: 300, permisos: 150, otros: 500 }, precio_venta: 80, costo_directo: 35, gastos_fijos: { marketing: 1000, logistica: 400, sueldo_emprendedor: 1200, otros: 300 }, ventas: { pesimista: 50, base: 120, optimista: 250, crecimiento_mensual: 8 }, regimen_tributario: "RER", inflacion_anual: 2.5 },
  importacion_tech: { category: "🛍️ Retail", volumen: "medio", nombre_idea: "Importación Tecnología", sector: "E-commerce", moneda: "S/", capital_disponible: 11000, inversion: { insumos: 7500, equipos: 800, empaques: 400, permisos: 400, otros: 800 }, precio_venta: 170, costo_directo: 70, gastos_fijos: { marketing: 1100, logistica: 550, sueldo_emprendedor: 1200, otros: 400 }, ventas: { pesimista: 30, base: 100, optimista: 200, crecimiento_mensual: 10 }, regimen_tributario: "NRUS", inflacion_anual: 2.0 },
  tienda_mascotas: { category: "🛍️ Retail", volumen: "alto", nombre_idea: "Pet Shop Online", sector: "Retail / Mascotas", moneda: "S/", capital_disponible: 5000, inversion: { insumos: 3000, equipos: 300, empaques: 200, permisos: 150, otros: 400 }, precio_venta: 40, costo_directo: 15, gastos_fijos: { marketing: 400, logistica: 300, sueldo_emprendedor: 1200, otros: 200 }, ventas: { pesimista: 80, base: 200, optimista: 350, crecimiento_mensual: 6 }, regimen_tributario: "NRUS", inflacion_anual: 3.0 },
  cosmetica_natural: { category: "🛍️ Retail", volumen: "alto", nombre_idea: "Cosmética Natural", sector: "Retail / Salud", moneda: "S/", capital_disponible: 6000, inversion: { insumos: 2500, equipos: 1000, empaques: 800, permisos: 1200, otros: 500 }, precio_venta: 35, costo_directo: 12, gastos_fijos: { marketing: 500, logistica: 200, sueldo_emprendedor: 1200, otros: 300 }, ventas: { pesimista: 100, base: 250, optimista: 400, crecimiento_mensual: 7 }, regimen_tributario: "RER", inflacion_anual: 3.0 },
  tienda_regalos: { category: "🛍️ Retail", volumen: "medio", nombre_idea: "Tienda de Regalos Personalizados", sector: "Retail", moneda: "S/", capital_disponible: 3000, inversion: { insumos: 1000, equipos: 800, empaques: 400, permisos: 50, otros: 300 }, precio_venta: 50, costo_directo: 15, gastos_fijos: { marketing: 200, logistica: 150, sueldo_emprendedor: 1200, otros: 100 }, ventas: { pesimista: 40, base: 100, optimista: 200, crecimiento_mensual: 5 }, regimen_tributario: "NRUS", inflacion_anual: 2.0 },
  dropshipping: { category: "🛍️ Retail", volumen: "medio", nombre_idea: "Tienda Dropshipping", sector: "E-commerce", moneda: "S/", capital_disponible: 3800, inversion: { insumos: 0, equipos: 0, empaques: 0, permisos: 200, otros: 1900 }, precio_venta: 115, costo_directo: 38, gastos_fijos: { marketing: 2200, logistica: 0, sueldo_emprendedor: 1200, otros: 380 }, ventas: { pesimista: 30, base: 150, optimista: 400, crecimiento_mensual: 15 }, regimen_tributario: "NRUS", inflacion_anual: 1.0 },
  venta_zapatillas: { category: "🛍️ Retail", volumen: "medio", nombre_idea: "Venta de Zapatillas Importadas", sector: "Retail", moneda: "S/", capital_disponible: 12000, inversion: { insumos: 10000, equipos: 200, empaques: 300, permisos: 100, otros: 500 }, precio_venta: 250, costo_directo: 120, gastos_fijos: { marketing: 800, logistica: 400, sueldo_emprendedor: 1200, otros: 300 }, ventas: { pesimista: 20, base: 60, optimista: 120, crecimiento_mensual: 8 }, regimen_tributario: "RER", inflacion_anual: 2.0 },
  minimarket: { category: "🛍️ Retail", volumen: "alto", nombre_idea: "Minimarket de Barrio", sector: "Retail", moneda: "S/", capital_disponible: 25000, inversion: { insumos: 12000, equipos: 8000, empaques: 200, permisos: 800, otros: 2000 }, precio_venta: 15, costo_directo: 10, gastos_fijos: { marketing: 0, logistica: 200, sueldo_emprendedor: 1200, otros: 2000 }, ventas: { pesimista: 800, base: 1500, optimista: 2500, crecimiento_mensual: 2 }, regimen_tributario: "NRUS", inflacion_anual: 4.0 },
  libreria: { category: "🛍️ Retail", volumen: "alto", nombre_idea: "Librería y Útiles", sector: "Retail", moneda: "S/", capital_disponible: 10000, inversion: { insumos: 6000, equipos: 1500, empaques: 100, permisos: 300, otros: 500 }, precio_venta: 5, costo_directo: 2.5, gastos_fijos: { marketing: 50, logistica: 50, sueldo_emprendedor: 1200, otros: 800 }, ventas: { pesimista: 600, base: 1500, optimista: 3000, crecimiento_mensual: 2 }, regimen_tributario: "NRUS", inflacion_anual: 3.0 },
  joyeria: { category: "🛍️ Retail", volumen: "medio", nombre_idea: "Joyería / Bisutería Fina", sector: "Retail", moneda: "S/", capital_disponible: 7000, inversion: { insumos: 4000, equipos: 500, empaques: 600, permisos: 200, otros: 400 }, precio_venta: 80, costo_directo: 25, gastos_fijos: { marketing: 400, logistica: 150, sueldo_emprendedor: 1200, otros: 300 }, ventas: { pesimista: 30, base: 80, optimista: 150, crecimiento_mensual: 6 }, regimen_tributario: "NRUS", inflacion_anual: 2.0 },

  // 💻 SERVICIOS B2B Y DIGITALES
  agencia_marketing: { category: "💻 Servicios B2B", volumen: "bajo", nombre_idea: "Agencia de Marketing Digital", sector: "Servicios B2B", moneda: "S/", capital_disponible: 7500, inversion: { insumos: 0, equipos: 5600, empaques: 0, permisos: 400, otros: 1500 }, precio_venta: 1900, costo_directo: 190, gastos_fijos: { marketing: 750, logistica: 0, sueldo_emprendedor: 1200, otros: 1100 }, ventas: { pesimista: 2, base: 5, optimista: 10, crecimiento_mensual: 5 }, regimen_tributario: "MYPE", inflacion_anual: 3.0 },
  desarrollo_web: { category: "💻 Servicios B2B", volumen: "bajo", nombre_idea: "Estudio Desarrollo Web", sector: "Tecnología", moneda: "S/", capital_disponible: 5600, inversion: { insumos: 0, equipos: 3800, empaques: 0, permisos: 200, otros: 750 }, precio_venta: 3000, costo_directo: 380, gastos_fijos: { marketing: 560, logistica: 0, sueldo_emprendedor: 1200, otros: 750 }, ventas: { pesimista: 1, base: 3, optimista: 6, crecimiento_mensual: 4 }, regimen_tributario: "RER", inflacion_anual: 2.5 },
  consultoria_contable: { category: "💻 Servicios B2B", volumen: "bajo", nombre_idea: "Consultoría Contable Mypes", sector: "Servicios B2B", moneda: "S/", capital_disponible: 3000, inversion: { insumos: 200, equipos: 1500, empaques: 0, permisos: 300, otros: 200 }, precio_venta: 250, costo_directo: 0, gastos_fijos: { marketing: 300, logistica: 100, sueldo_emprendedor: 1200, otros: 400 }, ventas: { pesimista: 10, base: 25, optimista: 45, crecimiento_mensual: 3 }, regimen_tributario: "MYPE", inflacion_anual: 3.0 },
  asistente_virtual: { category: "💻 Servicios B2B", volumen: "bajo", nombre_idea: "Asistencia Virtual Freelance", sector: "Servicios Digitales", moneda: "S/", capital_disponible: 3800, inversion: { insumos: 0, equipos: 3000, empaques: 0, permisos: 180, otros: 380 }, precio_venta: 1100, costo_directo: 0, gastos_fijos: { marketing: 380, logistica: 0, sueldo_emprendedor: 1200, otros: 380 }, ventas: { pesimista: 2, base: 5, optimista: 8, crecimiento_mensual: 5 }, regimen_tributario: "NRUS", inflacion_anual: 2.0 },
  estudio_fotografia: { category: "💻 Servicios B2B", volumen: "bajo", nombre_idea: "Estudio de Fotografía B2B", sector: "Servicios / Media", moneda: "S/", capital_disponible: 12000, inversion: { insumos: 500, equipos: 9000, empaques: 0, permisos: 300, otros: 1000 }, precio_venta: 600, costo_directo: 50, gastos_fijos: { marketing: 300, logistica: 200, sueldo_emprendedor: 1200, otros: 800 }, ventas: { pesimista: 3, base: 8, optimista: 15, crecimiento_mensual: 4 }, regimen_tributario: "RER", inflacion_anual: 3.0 },
  agencia_inmobiliaria: { category: "💻 Servicios B2B", volumen: "bajo", nombre_idea: "Agencia Inmobiliaria", sector: "Servicios", moneda: "S/", capital_disponible: 18000, inversion: { insumos: 0, equipos: 5600, empaques: 0, permisos: 1800, otros: 5600 }, precio_venta: 11000, costo_directo: 1100, gastos_fijos: { marketing: 3000, logistica: 750, sueldo_emprendedor: 1200, otros: 3800 }, ventas: { pesimista: 0, base: 2, optimista: 5, crecimiento_mensual: 1 }, regimen_tributario: "MYPE", inflacion_anual: 2.5 },
  creacion_contenido: { category: "💻 Servicios B2B", volumen: "bajo", nombre_idea: "Agencia Creadora de Contenido", sector: "Media", moneda: "S/", capital_disponible: 4000, inversion: { insumos: 0, equipos: 3000, empaques: 0, permisos: 100, otros: 500 }, precio_venta: 800, costo_directo: 50, gastos_fijos: { marketing: 200, logistica: 100, sueldo_emprendedor: 1200, otros: 300 }, ventas: { pesimista: 2, base: 6, optimista: 12, crecimiento_mensual: 6 }, regimen_tributario: "NRUS", inflacion_anual: 2.0 },
  coworking: { category: "💻 Servicios B2B", volumen: "bajo", nombre_idea: "Espacio Coworking Pequeño", sector: "Inmobiliaria", moneda: "S/", capital_disponible: 30000, inversion: { insumos: 1000, equipos: 15000, empaques: 0, permisos: 1500, otros: 8000 }, precio_venta: 400, costo_directo: 10, gastos_fijos: { marketing: 500, logistica: 0, sueldo_emprendedor: 1200, otros: 6000 }, ventas: { pesimista: 10, base: 25, optimista: 45, crecimiento_mensual: 4 }, regimen_tributario: "MYPE", inflacion_anual: 4.5 },
  consultoria_rh: { category: "💻 Servicios B2B", volumen: "bajo", nombre_idea: "Consultoría de RRHH", sector: "Servicios B2B", moneda: "S/", capital_disponible: 2500, inversion: { insumos: 0, equipos: 1500, empaques: 0, permisos: 200, otros: 500 }, precio_venta: 1200, costo_directo: 100, gastos_fijos: { marketing: 300, logistica: 50, sueldo_emprendedor: 1200, otros: 400 }, ventas: { pesimista: 1, base: 4, optimista: 8, crecimiento_mensual: 3 }, regimen_tributario: "RER", inflacion_anual: 3.0 },
  software_saas: { category: "💻 Servicios B2B", volumen: "medio", nombre_idea: "Plataforma SaaS (Micro)", sector: "Tecnología", moneda: "S/", capital_disponible: 18000, inversion: { insumos: 0, equipos: 7500, empaques: 0, permisos: 1800, otros: 5600 }, precio_venta: 110, costo_directo: 7, gastos_fijos: { marketing: 3800, logistica: 0, sueldo_emprendedor: 1200, otros: 3000 }, ventas: { pesimista: 20, base: 100, optimista: 500, crecimiento_mensual: 15 }, regimen_tributario: "MYPE", inflacion_anual: 2.0 },

  // 💅 SALUD, BIENESTAR Y BELLEZA
  barberia: { category: "💅 Belleza & Salud", volumen: "alto", nombre_idea: "Barbería Clásica", sector: "Belleza", moneda: "S/", capital_disponible: 12000, inversion: { insumos: 1000, equipos: 7000, empaques: 0, permisos: 500, otros: 2000 }, precio_venta: 35, costo_directo: 3, gastos_fijos: { marketing: 300, logistica: 0, sueldo_emprendedor: 1200, otros: 1500 }, ventas: { pesimista: 150, base: 300, optimista: 500, crecimiento_mensual: 2 }, regimen_tributario: "NRUS", inflacion_anual: 4.0 },
  estudio_unas: { category: "💅 Belleza & Salud", volumen: "medio", nombre_idea: "Estudio de Uñas (Nail Bar)", sector: "Belleza", moneda: "S/", capital_disponible: 8000, inversion: { insumos: 2000, equipos: 3000, empaques: 0, permisos: 400, otros: 1000 }, precio_venta: 60, costo_directo: 8, gastos_fijos: { marketing: 250, logistica: 0, sueldo_emprendedor: 1200, otros: 1000 }, ventas: { pesimista: 80, base: 160, optimista: 250, crecimiento_mensual: 3 }, regimen_tributario: "NRUS", inflacion_anual: 3.5 },
  gimnasio_boutique: { category: "💅 Belleza & Salud", volumen: "medio", nombre_idea: "Gimnasio Funcional", sector: "Salud", moneda: "S/", capital_disponible: 40000, inversion: { insumos: 0, equipos: 35000, empaques: 0, permisos: 1200, otros: 3000 }, precio_venta: 180, costo_directo: 0, gastos_fijos: { marketing: 600, logistica: 0, sueldo_emprendedor: 1200, otros: 4000 }, ventas: { pesimista: 50, base: 120, optimista: 250, crecimiento_mensual: 4 }, regimen_tributario: "MYPE", inflacion_anual: 4.0 },
  consultorio_psicologico: { category: "💅 Belleza & Salud", volumen: "bajo", nombre_idea: "Consultorio Psicológico Online", sector: "Salud", moneda: "S/", capital_disponible: 2000, inversion: { insumos: 0, equipos: 1000, empaques: 0, permisos: 200, otros: 300 }, precio_venta: 100, costo_directo: 0, gastos_fijos: { marketing: 200, logistica: 0, sueldo_emprendedor: 1200, otros: 150 }, ventas: { pesimista: 20, base: 45, optimista: 80, crecimiento_mensual: 5 }, regimen_tributario: "NRUS", inflacion_anual: 2.0 },
  spa_masajes: { category: "💅 Belleza & Salud", volumen: "medio", nombre_idea: "Centro de Masajes y Spa", sector: "Bienestar", moneda: "S/", capital_disponible: 18000, inversion: { insumos: 1500, equipos: 8000, empaques: 0, permisos: 800, otros: 3000 }, precio_venta: 120, costo_directo: 15, gastos_fijos: { marketing: 400, logistica: 50, sueldo_emprendedor: 1200, otros: 2500 }, ventas: { pesimista: 50, base: 100, optimista: 180, crecimiento_mensual: 3 }, regimen_tributario: "RER", inflacion_anual: 3.5 },
  centro_yoga: { category: "💅 Belleza & Salud", volumen: "medio", nombre_idea: "Estudio de Yoga y Pilates", sector: "Bienestar", moneda: "S/", capital_disponible: 15000, inversion: { insumos: 500, equipos: 4000, empaques: 0, permisos: 600, otros: 4000 }, precio_venta: 150, costo_directo: 0, gastos_fijos: { marketing: 300, logistica: 0, sueldo_emprendedor: 1200, otros: 2000 }, ventas: { pesimista: 30, base: 70, optimista: 120, crecimiento_mensual: 4 }, regimen_tributario: "NRUS", inflacion_anual: 3.0 },
  clinica_dental: { category: "💅 Belleza & Salud", volumen: "medio", nombre_idea: "Consultorio Odontológico", sector: "Salud", moneda: "S/", capital_disponible: 45000, inversion: { insumos: 3000, equipos: 30000, empaques: 0, permisos: 1500, otros: 5000 }, precio_venta: 150, costo_directo: 40, gastos_fijos: { marketing: 500, logistica: 100, sueldo_emprendedor: 1200, otros: 2500 }, ventas: { pesimista: 40, base: 100, optimista: 200, crecimiento_mensual: 3 }, regimen_tributario: "MYPE", inflacion_anual: 4.0 },
  nutricionista: { category: "💅 Belleza & Salud", volumen: "bajo", nombre_idea: "Asesoría Nutricional Personalizada", sector: "Salud", moneda: "S/", capital_disponible: 2500, inversion: { insumos: 0, equipos: 1500, empaques: 100, permisos: 300, otros: 200 }, precio_venta: 120, costo_directo: 5, gastos_fijos: { marketing: 250, logistica: 0, sueldo_emprendedor: 1200, otros: 400 }, ventas: { pesimista: 15, base: 40, optimista: 80, crecimiento_mensual: 5 }, regimen_tributario: "NRUS", inflacion_anual: 2.5 },
  centro_estetica: { category: "💅 Belleza & Salud", volumen: "medio", nombre_idea: "Medicina Estética (Láser/Botox)", sector: "Salud / Belleza", moneda: "S/", capital_disponible: 95000, inversion: { insumos: 7500, equipos: 68000, empaques: 0, permisos: 3800, otros: 7500 }, precio_venta: 560, costo_directo: 110, gastos_fijos: { marketing: 3000, logistica: 0, sueldo_emprendedor: 1200, otros: 4500 }, ventas: { pesimista: 20, base: 60, optimista: 120, crecimiento_mensual: 4 }, regimen_tributario: "MYPE", inflacion_anual: 3.0 },
  maquillaje_domicilio: { category: "💅 Belleza & Salud", volumen: "bajo", nombre_idea: "Maquillaje a Domicilio", sector: "Belleza", moneda: "S/", capital_disponible: 3000, inversion: { insumos: 1500, equipos: 500, empaques: 0, permisos: 0, otros: 500 }, precio_venta: 180, costo_directo: 20, gastos_fijos: { marketing: 200, logistica: 300, sueldo_emprendedor: 1200, otros: 100 }, ventas: { pesimista: 10, base: 25, optimista: 50, crecimiento_mensual: 6 }, regimen_tributario: "NRUS", inflacion_anual: 2.0 },

  // 📚 EDUCACIÓN, EVENTOS Y OCIO
  cursos_online: { category: "📚 Educación y Ocio", volumen: "medio", nombre_idea: "Academia Cursos Pregrabados", sector: "Educación", moneda: "S/", capital_disponible: 5600, inversion: { insumos: 0, equipos: 3000, empaques: 0, permisos: 0, otros: 1100 }, precio_venta: 150, costo_directo: 7, gastos_fijos: { marketing: 1800, logistica: 0, sueldo_emprendedor: 1200, otros: 380 }, ventas: { pesimista: 10, base: 50, optimista: 150, crecimiento_mensual: 10 }, regimen_tributario: "RER", inflacion_anual: 2.0 },
  organizacion_bodas: { category: "📚 Educación y Ocio", volumen: "bajo", nombre_idea: "Wedding Planner", sector: "Eventos", moneda: "S/", capital_disponible: 5000, inversion: { insumos: 500, equipos: 1500, empaques: 0, permisos: 200, otros: 800 }, precio_venta: 4500, costo_directo: 200, gastos_fijos: { marketing: 400, logistica: 200, sueldo_emprendedor: 1200, otros: 300 }, ventas: { pesimista: 0, base: 2, optimista: 4, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3.0 },
  clases_refuerzo: { category: "📚 Educación y Ocio", volumen: "bajo", nombre_idea: "Centro de Refuerzo Escolar", sector: "Educación", moneda: "S/", capital_disponible: 7000, inversion: { insumos: 500, equipos: 3000, empaques: 0, permisos: 400, otros: 1000 }, precio_venta: 250, costo_directo: 20, gastos_fijos: { marketing: 200, logistica: 0, sueldo_emprendedor: 1200, otros: 1200 }, ventas: { pesimista: 15, base: 35, optimista: 60, crecimiento_mensual: 3 }, regimen_tributario: "NRUS", inflacion_anual: 3.5 },
  animacion_infantil: { category: "📚 Educación y Ocio", volumen: "bajo", nombre_idea: "Shows y Animación Infantil", sector: "Eventos", moneda: "S/", capital_disponible: 4000, inversion: { insumos: 800, equipos: 2000, empaques: 0, permisos: 100, otros: 500 }, precio_venta: 400, costo_directo: 50, gastos_fijos: { marketing: 250, logistica: 100, sueldo_emprendedor: 1200, otros: 150 }, ventas: { pesimista: 4, base: 10, optimista: 20, crecimiento_mensual: 4 }, regimen_tributario: "NRUS", inflacion_anual: 3.0 },
  agencia_turismo: { category: "📚 Educación y Ocio", volumen: "bajo", nombre_idea: "Agencia de Viajes y Tours", sector: "Turismo", moneda: "S/", capital_disponible: 18000, inversion: { insumos: 0, equipos: 5600, empaques: 0, permisos: 3000, otros: 3800 }, precio_venta: 1800, costo_directo: 1300, gastos_fijos: { marketing: 2200, logistica: 380, sueldo_emprendedor: 1200, otros: 1800 }, ventas: { pesimista: 5, base: 15, optimista: 40, crecimiento_mensual: 5 }, regimen_tributario: "MYPE", inflacion_anual: 3.0 },
  alquiler_canchas: { category: "📚 Educación y Ocio", volumen: "alto", nombre_idea: "Alquiler de Canchas Sintéticas", sector: "Deportes", moneda: "S/", capital_disponible: 60000, inversion: { insumos: 1000, equipos: 40000, empaques: 0, permisos: 2000, otros: 5000 }, precio_venta: 80, costo_directo: 5, gastos_fijos: { marketing: 300, logistica: 0, sueldo_emprendedor: 1200, otros: 4000 }, ventas: { pesimista: 100, base: 250, optimista: 400, crecimiento_mensual: 3 }, regimen_tributario: "MYPE", inflacion_anual: 4.0 },
  productora_eventos: { category: "📚 Educación y Ocio", volumen: "alto", nombre_idea: "Productora de Conciertos", sector: "Eventos", moneda: "S/", capital_disponible: 20000, inversion: { insumos: 1000, equipos: 5000, empaques: 0, permisos: 3000, otros: 5000 }, precio_venta: 80, costo_directo: 30, gastos_fijos: { marketing: 2000, logistica: 1000, sueldo_emprendedor: 1200, otros: 2000 }, ventas: { pesimista: 100, base: 300, optimista: 800, crecimiento_mensual: 5 }, regimen_tributario: "MYPE", inflacion_anual: 4.0 },
  academia_baile: { category: "📚 Educación y Ocio", volumen: "medio", nombre_idea: "Academia de Baile", sector: "Educación", moneda: "S/", capital_disponible: 15000, inversion: { insumos: 500, equipos: 5000, empaques: 0, permisos: 800, otros: 3000 }, precio_venta: 150, costo_directo: 0, gastos_fijos: { marketing: 400, logistica: 0, sueldo_emprendedor: 1200, otros: 2500 }, ventas: { pesimista: 30, base: 80, optimista: 150, crecimiento_mensual: 4 }, regimen_tributario: "NRUS", inflacion_anual: 3.5 },
  tutorias_idiomas: { category: "📚 Educación y Ocio", volumen: "bajo", nombre_idea: "Enseñanza de Idiomas Online", sector: "Educación", moneda: "S/", capital_disponible: 3800, inversion: { insumos: 0, equipos: 2200, empaques: 0, permisos: 0, otros: 750 }, precio_venta: 300, costo_directo: 18, gastos_fijos: { marketing: 750, logistica: 0, sueldo_emprendedor: 1200, otros: 380 }, ventas: { pesimista: 10, base: 25, optimista: 50, crecimiento_mensual: 6 }, regimen_tributario: "NRUS", inflacion_anual: 2.0 },
  estudio_musica: { category: "📚 Educación y Ocio", volumen: "medio", nombre_idea: "Estudio de Grabación Musical", sector: "Arte", moneda: "S/", capital_disponible: 25000, inversion: { insumos: 500, equipos: 18000, empaques: 0, permisos: 500, otros: 3000 }, precio_venta: 80, costo_directo: 0, gastos_fijos: { marketing: 300, logistica: 0, sueldo_emprendedor: 1200, otros: 1200 }, ventas: { pesimista: 20, base: 60, optimista: 120, crecimiento_mensual: 3 }, regimen_tributario: "RER", inflacion_anual: 3.0 },

  // 🛡️ SERVICIOS POLICIALES Y SEGURIDAD
  pnp_tactico: { category: "🛡️ Seguridad PNP", volumen: "medio", nombre_idea: "Ropa Militar PNP", sector: "Textil", moneda: "S/", capital_disponible: 15000, inversion: { insumos: 5000, equipos: 8000, empaques: 500, permisos: 500, otros: 1000 }, precio_venta: 85, costo_directo: 35, gastos_fijos: { marketing: 300, logistica: 200, sueldo_emprendedor: 1200, otros: 500 }, ventas: { pesimista: 40, base: 80, optimista: 150, crecimiento_mensual: 5 }, regimen_tributario: "MYPE", inflacion_anual: 3.0 },
  copias_comisaria: { category: "🛡️ Seguridad PNP", volumen: "alto", nombre_idea: "Centro Trámites y Copias", sector: "Servicios", moneda: "S/", capital_disponible: 8000, inversion: { insumos: 1000, equipos: 5000, empaques: 0, permisos: 500, otros: 1500 }, precio_venta: 2.5, costo_directo: 0.5, gastos_fijos: { marketing: 0, logistica: 0, sueldo_emprendedor: 1200, otros: 1000 }, ventas: { pesimista: 800, base: 1500, optimista: 3000, crecimiento_mensual: 2 }, regimen_tributario: "NRUS", inflacion_anual: 3.0 },
  pnp_academia: { category: "🛡️ Seguridad PNP", volumen: "medio", nombre_idea: "Academia Asimilación PNP", sector: "Educación", moneda: "S/", capital_disponible: 12000, inversion: { insumos: 1000, equipos: 5000, empaques: 0, permisos: 1000, otros: 5000 }, precio_venta: 250, costo_directo: 20, gastos_fijos: { marketing: 800, logistica: 0, sueldo_emprendedor: 1200, otros: 2000 }, ventas: { pesimista: 40, base: 80, optimista: 150, crecimiento_mensual: 8 }, regimen_tributario: "MYPE", inflacion_anual: 3.5 },
  equipamiento_pnp: { category: "🛡️ Seguridad PNP", volumen: "medio", nombre_idea: "Venta Equipamiento Táctico", sector: "Retail", moneda: "S/", capital_disponible: 20000, inversion: { insumos: 15000, equipos: 2000, empaques: 500, permisos: 500, otros: 2000 }, precio_venta: 120, costo_directo: 60, gastos_fijos: { marketing: 500, logistica: 300, sueldo_emprendedor: 1200, otros: 800 }, ventas: { pesimista: 40, base: 70, optimista: 120, crecimiento_mensual: 4 }, regimen_tributario: "RER", inflacion_anual: 3.0 },
  sastreria_pnp: { category: "🛡️ Seguridad PNP", volumen: "medio", nombre_idea: "Sastrería Uniformes PNP", sector: "Textil", moneda: "S/", capital_disponible: 10000, inversion: { insumos: 2000, equipos: 6000, empaques: 200, permisos: 300, otros: 1500 }, precio_venta: 150, costo_directo: 50, gastos_fijos: { marketing: 200, logistica: 50, sueldo_emprendedor: 1200, otros: 600 }, ventas: { pesimista: 30, base: 60, optimista: 100, crecimiento_mensual: 3 }, regimen_tributario: "NRUS", inflacion_anual: 3.0 },
  resguardo: { category: "🛡️ Seguridad PNP", volumen: "bajo", nombre_idea: "Seguridad Privada / VIP", sector: "Servicios", moneda: "S/", capital_disponible: 15000, inversion: { insumos: 2000, equipos: 8000, empaques: 0, permisos: 3000, otros: 2000 }, precio_venta: 4000, costo_directo: 2000, gastos_fijos: { marketing: 500, logistica: 500, sueldo_emprendedor: 1200, otros: 1000 }, ventas: { pesimista: 1, base: 5, optimista: 10, crecimiento_mensual: 2 }, regimen_tributario: "MYPE", inflacion_anual: 4.0 },
  cctv: { category: "🛡️ Seguridad PNP", volumen: "bajo", nombre_idea: "Instalación de CCTV", sector: "Tecnología", moneda: "S/", capital_disponible: 8000, inversion: { insumos: 4000, equipos: 2000, empaques: 0, permisos: 200, otros: 1800 }, precio_venta: 1200, costo_directo: 600, gastos_fijos: { marketing: 300, logistica: 200, sueldo_emprendedor: 1200, otros: 300 }, ventas: { pesimista: 5, base: 15, optimista: 30, crecimiento_mensual: 5 }, regimen_tributario: "RER", inflacion_anual: 3.0 },
  poligono: { category: "🛡️ Seguridad PNP", volumen: "medio", nombre_idea: "Polígono Tiro Virtual", sector: "Entrenamiento", moneda: "S/", capital_disponible: 45000, inversion: { insumos: 1000, equipos: 35000, empaques: 0, permisos: 4000, otros: 5000 }, precio_venta: 60, costo_directo: 5, gastos_fijos: { marketing: 800, logistica: 0, sueldo_emprendedor: 1200, otros: 3000 }, ventas: { pesimista: 60, base: 120, optimista: 250, crecimiento_mensual: 6 }, regimen_tributario: "MYPE", inflacion_anual: 4.0 },
  asesoria_legal: { category: "🛡️ Seguridad PNP", volumen: "bajo", nombre_idea: "Asesoría Legal Policial", sector: "Servicios Legales", moneda: "S/", capital_disponible: 5000, inversion: { insumos: 500, equipos: 2500, empaques: 0, permisos: 500, otros: 1500 }, precio_venta: 300, costo_directo: 20, gastos_fijos: { marketing: 400, logistica: 0, sueldo_emprendedor: 1200, otros: 600 }, ventas: { pesimista: 10, base: 20, optimista: 40, crecimiento_mensual: 4 }, regimen_tributario: "RER", inflacion_anual: 3.5 },
  centro_medico: { category: "🛡️ Seguridad PNP", volumen: "alto", nombre_idea: "Exámenes Psicosomáticos", sector: "Salud", moneda: "S/", capital_disponible: 60000, inversion: { insumos: 5000, equipos: 40000, empaques: 0, permisos: 5000, otros: 10000 }, precio_venta: 100, costo_directo: 20, gastos_fijos: { marketing: 1000, logistica: 0, sueldo_emprendedor: 1200, otros: 6000 }, ventas: { pesimista: 150, base: 300, optimista: 600, crecimiento_mensual: 3 }, regimen_tributario: "MYPE", inflacion_anual: 4.0 },

  // 📡 TECNOLOGÍA, IA Y SUSCRIPCIONES
  tv_digital: { category: "📡 Tecnología", volumen: "medio", nombre_idea: "Tv Digital / Streaming", sector: "Entretenimiento", moneda: "S/", capital_disponible: 3000, inversion: { insumos: 1500, equipos: 500, empaques: 0, permisos: 0, otros: 1000 }, precio_venta: 25, costo_directo: 12, gastos_fijos: { marketing: 300, logistica: 0, sueldo_emprendedor: 1200, otros: 200 }, ventas: { pesimista: 50, base: 150, optimista: 300, crecimiento_mensual: 10 }, regimen_tributario: "NRUS", inflacion_anual: 2.5 },
  bots_wsp: { category: "📡 Tecnología", volumen: "bajo", nombre_idea: "Bots de WhatsApp Pymes", sector: "Tecnología", moneda: "S/", capital_disponible: 5600, inversion: { insumos: 750, equipos: 3000, empaques: 0, permisos: 0, otros: 1800 }, precio_venta: 560, costo_directo: 75, gastos_fijos: { marketing: 560, logistica: 0, sueldo_emprendedor: 1200, otros: 380 }, ventas: { pesimista: 5, base: 15, optimista: 30, crecimiento_mensual: 8 }, regimen_tributario: "NRUS", inflacion_anual: 2.0 },
  dashboards: { category: "📡 Tecnología", volumen: "bajo", nombre_idea: "Dashboards y BI Pymes", sector: "Software", moneda: "S/", capital_disponible: 3800, inversion: { insumos: 0, equipos: 3000, empaques: 0, permisos: 0, otros: 750 }, precio_venta: 1100, costo_directo: 38, gastos_fijos: { marketing: 380, logistica: 0, sueldo_emprendedor: 1200, otros: 380 }, ventas: { pesimista: 2, base: 6, optimista: 15, crecimiento_mensual: 5 }, regimen_tributario: "NRUS", inflacion_anual: 2.0 },
  agencia_ia: { category: "📡 Tecnología", volumen: "bajo", nombre_idea: "Agencia IA para Negocios", sector: "Consultoría", moneda: "S/", capital_disponible: 9500, inversion: { insumos: 1100, equipos: 5600, empaques: 0, permisos: 380, otros: 2200 }, precio_venta: 3000, costo_directo: 180, gastos_fijos: { marketing: 1100, logistica: 0, sueldo_emprendedor: 1200, otros: 750 }, ventas: { pesimista: 2, base: 5, optimista: 12, crecimiento_mensual: 6 }, regimen_tributario: "RER", inflacion_anual: 2.5 },
  smartwatches: { category: "📡 Tecnología", volumen: "medio", nombre_idea: "Venta de Smartwatches", sector: "Retail Tech", moneda: "S/", capital_disponible: 10000, inversion: { insumos: 8000, equipos: 500, empaques: 200, permisos: 100, otros: 1200 }, precio_venta: 150, costo_directo: 70, gastos_fijos: { marketing: 600, logistica: 200, sueldo_emprendedor: 1200, otros: 200 }, ventas: { pesimista: 30, base: 80, optimista: 150, crecimiento_mensual: 8 }, regimen_tributario: "RER", inflacion_anual: 3.0 },
  crm: { category: "📡 Tecnología", volumen: "medio", nombre_idea: "SaaS CRM para Ventas", sector: "Software", moneda: "S/", capital_disponible: 18000, inversion: { insumos: 3800, equipos: 5600, empaques: 0, permisos: 1800, otros: 7500 }, precio_venta: 180, costo_directo: 18, gastos_fijos: { marketing: 3000, logistica: 0, sueldo_emprendedor: 1200, otros: 1800 }, ventas: { pesimista: 30, base: 100, optimista: 300, crecimiento_mensual: 12 }, regimen_tributario: "MYPE", inflacion_anual: 2.0 },
  iptv_b2b: { category: "📡 Tecnología", volumen: "bajo", nombre_idea: "Tv Digital B2B (Hoteles)", sector: "Servicios", moneda: "S/", capital_disponible: 8000, inversion: { insumos: 4000, equipos: 1000, empaques: 0, permisos: 500, otros: 2500 }, precio_venta: 500, costo_directo: 150, gastos_fijos: { marketing: 300, logistica: 100, sueldo_emprendedor: 1200, otros: 400 }, ventas: { pesimista: 2, base: 8, optimista: 20, crecimiento_mensual: 5 }, regimen_tributario: "RER", inflacion_anual: 3.5 },
  flyers: { category: "📡 Tecnología", volumen: "medio", nombre_idea: "Diseño Gráfico Exprés", sector: "Diseño", moneda: "S/", capital_disponible: 3800, inversion: { insumos: 380, equipos: 3000, empaques: 0, permisos: 0, otros: 380 }, precio_venta: 75, costo_directo: 0, gastos_fijos: { marketing: 380, logistica: 0, sueldo_emprendedor: 1200, otros: 180 }, ventas: { pesimista: 30, base: 90, optimista: 150, crecimiento_mensual: 5 }, regimen_tributario: "NRUS", inflacion_anual: 2.0 },
  funnels: { category: "📡 Tecnología", volumen: "bajo", nombre_idea: "Creador Embudos de Venta", sector: "Marketing", moneda: "S/", capital_disponible: 5600, inversion: { insumos: 750, equipos: 3800, empaques: 0, permisos: 0, otros: 1100 }, precio_venta: 1300, costo_directo: 110, gastos_fijos: { marketing: 750, logistica: 0, sueldo_emprendedor: 1200, otros: 380 }, ventas: { pesimista: 3, base: 10, optimista: 25, crecimiento_mensual: 7 }, regimen_tributario: "NRUS", inflacion_anual: 2.0 },
  hosting: { category: "📡 Tecnología", volumen: "alto", nombre_idea: "Venta Hosting y Dominios", sector: "Tecnología", moneda: "S/", capital_disponible: 11000, inversion: { insumos: 5600, equipos: 1800, empaques: 0, permisos: 380, otros: 3400 }, precio_venta: 180, costo_directo: 90, gastos_fijos: { marketing: 1500, logistica: 0, sueldo_emprendedor: 1200, otros: 750 }, ventas: { pesimista: 50, base: 150, optimista: 400, crecimiento_mensual: 10 }, regimen_tributario: "RER", inflacion_anual: 2.0 },

  // 🚗 TRANSPORTE Y LOGÍSTICA
  taxis: { category: "🚗 Transporte", volumen: "alto", nombre_idea: "Flota de Taxis / App", sector: "Transporte", moneda: "S/", capital_disponible: 50000, inversion: { insumos: 2000, equipos: 40000, empaques: 0, permisos: 3000, otros: 5000 }, precio_venta: 15, costo_directo: 5, gastos_fijos: { marketing: 500, logistica: 1000, sueldo_emprendedor: 1200, otros: 2500 }, ventas: { pesimista: 300, base: 800, optimista: 1500, crecimiento_mensual: 2 }, regimen_tributario: "MYPE", inflacion_anual: 4.5 },
  motos_delivery: { category: "🚗 Transporte", volumen: "medio", nombre_idea: "Alquiler Motos Delivery", sector: "Transporte", moneda: "S/", capital_disponible: 25000, inversion: { insumos: 1000, equipos: 20000, empaques: 0, permisos: 1500, otros: 2500 }, precio_venta: 35, costo_directo: 5, gastos_fijos: { marketing: 200, logistica: 500, sueldo_emprendedor: 1200, otros: 1000 }, ventas: { pesimista: 60, base: 150, optimista: 250, crecimiento_mensual: 3 }, regimen_tributario: "RER", inflacion_anual: 3.5 },
  taller: { category: "🚗 Transporte", volumen: "medio", nombre_idea: "Taller Mecánico Rápido", sector: "Automotriz", moneda: "S/", capital_disponible: 35000, inversion: { insumos: 5000, equipos: 20000, empaques: 0, permisos: 2000, otros: 8000 }, precio_venta: 150, costo_directo: 50, gastos_fijos: { marketing: 400, logistica: 200, sueldo_emprendedor: 1200, otros: 3000 }, ventas: { pesimista: 40, base: 90, optimista: 180, crecimiento_mensual: 3 }, regimen_tributario: "MYPE", inflacion_anual: 4.0 },
  carwash: { category: "🚗 Transporte", volumen: "alto", nombre_idea: "Car Wash a Domicilio", sector: "Servicios", moneda: "S/", capital_disponible: 12000, inversion: { insumos: 2000, equipos: 6000, empaques: 0, permisos: 1000, otros: 3000 }, precio_venta: 25, costo_directo: 5, gastos_fijos: { marketing: 300, logistica: 400, sueldo_emprendedor: 1200, otros: 1500 }, ventas: { pesimista: 150, base: 400, optimista: 800, crecimiento_mensual: 4 }, regimen_tributario: "NRUS", inflacion_anual: 3.0 },
  mudanzas: { category: "🚗 Transporte", volumen: "bajo", nombre_idea: "Empresa de Mudanzas", sector: "Logística", moneda: "S/", capital_disponible: 25000, inversion: { insumos: 1000, equipos: 18000, empaques: 1500, permisos: 1000, otros: 3500 }, precio_venta: 350, costo_directo: 80, gastos_fijos: { marketing: 400, logistica: 600, sueldo_emprendedor: 1200, otros: 1500 }, ventas: { pesimista: 10, base: 30, optimista: 60, crecimiento_mensual: 3 }, regimen_tributario: "MYPE", inflacion_anual: 4.0 },
  grua: { category: "🚗 Transporte", volumen: "bajo", nombre_idea: "Auxilio Mecánico y Grúa", sector: "Transporte", moneda: "S/", capital_disponible: 45000, inversion: { insumos: 1000, equipos: 38000, empaques: 0, permisos: 2000, otros: 4000 }, precio_venta: 180, costo_directo: 40, gastos_fijos: { marketing: 500, logistica: 800, sueldo_emprendedor: 1200, otros: 1000 }, ventas: { pesimista: 15, base: 40, optimista: 80, crecimiento_mensual: 2 }, regimen_tributario: "MYPE", inflacion_anual: 4.5 },
  repuestos: { category: "🚗 Transporte", volumen: "medio", nombre_idea: "Repuestos Automotrices", sector: "Retail", moneda: "S/", capital_disponible: 20000, inversion: { insumos: 12000, equipos: 2000, empaques: 500, permisos: 1000, otros: 4500 }, precio_venta: 120, costo_directo: 60, gastos_fijos: { marketing: 300, logistica: 400, sueldo_emprendedor: 1200, otros: 1800 }, ventas: { pesimista: 60, base: 150, optimista: 300, crecimiento_mensual: 4 }, regimen_tributario: "MYPE", inflacion_anual: 3.5 },
  rent_a_car: { category: "🚗 Transporte", volumen: "bajo", nombre_idea: "Rent a Car Turístico", sector: "Transporte", moneda: "S/", capital_disponible: 60000, inversion: { insumos: 2000, equipos: 50000, empaques: 0, permisos: 3000, otros: 5000 }, precio_venta: 150, costo_directo: 20, gastos_fijos: { marketing: 600, logistica: 800, sueldo_emprendedor: 1200, otros: 2000 }, ventas: { pesimista: 15, base: 45, optimista: 90, crecimiento_mensual: 2 }, regimen_tributario: "MYPE", inflacion_anual: 4.0 },
  minivans: { category: "🚗 Transporte", volumen: "bajo", nombre_idea: "Transporte Privado Minivans", sector: "Transporte", moneda: "S/", capital_disponible: 40000, inversion: { insumos: 1000, equipos: 35000, empaques: 0, permisos: 1500, otros: 2500 }, precio_venta: 300, costo_directo: 80, gastos_fijos: { marketing: 300, logistica: 600, sueldo_emprendedor: 1200, otros: 1500 }, ventas: { pesimista: 10, base: 25, optimista: 50, crecimiento_mensual: 3 }, regimen_tributario: "MYPE", inflacion_anual: 3.5 },
  courier: { category: "🚗 Transporte", volumen: "alto", nombre_idea: "Envíos Express Última Milla", sector: "Logística", moneda: "S/", capital_disponible: 15000, inversion: { insumos: 1000, equipos: 8000, empaques: 2000, permisos: 1000, otros: 3000 }, precio_venta: 12, costo_directo: 4, gastos_fijos: { marketing: 500, logistica: 800, sueldo_emprendedor: 1200, otros: 1200 }, ventas: { pesimista: 300, base: 1000, optimista: 2500, crecimiento_mensual: 5 }, regimen_tributario: "RER", inflacion_anual: 3.0 },

  // 🛠️ MANTENIMIENTO Y OFICIOS
  limpieza: { category: "🛠️ Mantenimiento", volumen: "medio", nombre_idea: "Limpieza Especializada", sector: "Servicios", moneda: "S/", capital_disponible: 5000, inversion: { insumos: 1500, equipos: 2000, empaques: 0, permisos: 300, otros: 1200 }, precio_venta: 80, costo_directo: 15, gastos_fijos: { marketing: 300, logistica: 200, sueldo_emprendedor: 1200, otros: 300 }, ventas: { pesimista: 30, base: 80, optimista: 150, crecimiento_mensual: 4 }, regimen_tributario: "NRUS", inflacion_anual: 3.0 },
  aire_acondicionado: { category: "🛠️ Mantenimiento", volumen: "bajo", nombre_idea: "Instalación Aire Acondic.", sector: "Mantenimiento", moneda: "S/", capital_disponible: 8000, inversion: { insumos: 2000, equipos: 3000, empaques: 0, permisos: 500, otros: 2500 }, precio_venta: 250, costo_directo: 50, gastos_fijos: { marketing: 200, logistica: 300, sueldo_emprendedor: 1200, otros: 500 }, ventas: { pesimista: 10, base: 35, optimista: 70, crecimiento_mensual: 3 }, regimen_tributario: "RER", inflacion_anual: 3.5 },
  gasfiteria: { category: "🛠️ Mantenimiento", volumen: "medio", nombre_idea: "Gasfitería y Servicios", sector: "Mantenimiento", moneda: "S/", capital_disponible: 3000, inversion: { insumos: 1000, equipos: 1500, empaques: 0, permisos: 100, otros: 400 }, precio_venta: 70, costo_directo: 10, gastos_fijos: { marketing: 150, logistica: 200, sueldo_emprendedor: 1200, otros: 150 }, ventas: { pesimista: 20, base: 50, optimista: 100, crecimiento_mensual: 2 }, regimen_tributario: "NRUS", inflacion_anual: 3.0 },
  electrico: { category: "🛠️ Mantenimiento", volumen: "bajo", nombre_idea: "Servicio Eléctrico Residen.", sector: "Mantenimiento", moneda: "S/", capital_disponible: 4000, inversion: { insumos: 1500, equipos: 1500, empaques: 0, permisos: 200, otros: 800 }, precio_venta: 100, costo_directo: 20, gastos_fijos: { marketing: 150, logistica: 200, sueldo_emprendedor: 1200, otros: 200 }, ventas: { pesimista: 15, base: 40, optimista: 80, crecimiento_mensual: 3 }, regimen_tributario: "NRUS", inflacion_anual: 3.0 },
  pintura: { category: "🛠️ Mantenimiento", volumen: "bajo", nombre_idea: "Pintura y Remodelación", sector: "Construcción", moneda: "S/", capital_disponible: 5000, inversion: { insumos: 2000, equipos: 1500, empaques: 0, permisos: 200, otros: 1300 }, precio_venta: 800, costo_directo: 300, gastos_fijos: { marketing: 200, logistica: 300, sueldo_emprendedor: 1200, otros: 400 }, ventas: { pesimista: 5, base: 15, optimista: 30, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3.5 },
  jardineria: { category: "🛠️ Mantenimiento", volumen: "bajo", nombre_idea: "Jardinería y Paisajismo", sector: "Servicios", moneda: "S/", capital_disponible: 4000, inversion: { insumos: 1000, equipos: 2000, empaques: 0, permisos: 100, otros: 900 }, precio_venta: 120, costo_directo: 30, gastos_fijos: { marketing: 150, logistica: 250, sueldo_emprendedor: 1200, otros: 200 }, ventas: { pesimista: 15, base: 40, optimista: 80, crecimiento_mensual: 3 }, regimen_tributario: "NRUS", inflacion_anual: 3.0 },
  fumigacion: { category: "🛠️ Mantenimiento", volumen: "bajo", nombre_idea: "Fumigación y Plagas", sector: "Servicios", moneda: "S/", capital_disponible: 6000, inversion: { insumos: 2000, equipos: 2500, empaques: 0, permisos: 800, otros: 700 }, precio_venta: 180, costo_directo: 40, gastos_fijos: { marketing: 250, logistica: 300, sueldo_emprendedor: 1200, otros: 300 }, ventas: { pesimista: 15, base: 45, optimista: 90, crecimiento_mensual: 4 }, regimen_tributario: "RER", inflacion_anual: 3.0 },
  melamina: { category: "🛠️ Mantenimiento", volumen: "bajo", nombre_idea: "Muebles de Melamina", sector: "Carpintería", moneda: "S/", capital_disponible: 8000, inversion: { insumos: 3000, equipos: 3000, empaques: 200, permisos: 300, otros: 1500 }, precio_venta: 600, costo_directo: 250, gastos_fijos: { marketing: 300, logistica: 400, sueldo_emprendedor: 1200, otros: 500 }, ventas: { pesimista: 3, base: 10, optimista: 25, crecimiento_mensual: 4 }, regimen_tributario: "RER", inflacion_anual: 3.5 },
  electrodomesticos: { category: "🛠️ Mantenimiento", volumen: "medio", nombre_idea: "Reparación Electrodomést.", sector: "Mantenimiento", moneda: "S/", capital_disponible: 4000, inversion: { insumos: 1500, equipos: 1500, empaques: 0, permisos: 200, otros: 800 }, precio_venta: 90, costo_directo: 25, gastos_fijos: { marketing: 200, logistica: 200, sueldo_emprendedor: 1200, otros: 300 }, ventas: { pesimista: 25, base: 70, optimista: 140, crecimiento_mensual: 3 }, regimen_tributario: "NRUS", inflacion_anual: 3.0 },
  drywall: { category: "🛠️ Mantenimiento", volumen: "bajo", nombre_idea: "Instalación Drywall", sector: "Construcción", moneda: "S/", capital_disponible: 6000, inversion: { insumos: 2500, equipos: 2000, empaques: 0, permisos: 200, otros: 1300 }, precio_venta: 1200, costo_directo: 600, gastos_fijos: { marketing: 250, logistica: 400, sueldo_emprendedor: 1200, otros: 400 }, ventas: { pesimista: 2, base: 8, optimista: 15, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3.5 },

  // 🎨 PASATIEMPOS Y MASCOTAS
  tatuajes: { category: "🎨 Pasatiempos", volumen: "medio", nombre_idea: "Estudio de Tatuajes", sector: "Arte / Belleza", moneda: "S/", capital_disponible: 10000, inversion: { insumos: 2000, equipos: 4000, empaques: 500, permisos: 1000, otros: 2500 }, precio_venta: 150, costo_directo: 20, gastos_fijos: { marketing: 300, logistica: 0, sueldo_emprendedor: 1200, otros: 1200 }, ventas: { pesimista: 30, base: 70, optimista: 150, crecimiento_mensual: 4 }, regimen_tributario: "RER", inflacion_anual: 3.0 },
  pingpong: { category: "🎨 Pasatiempos", volumen: "medio", nombre_idea: "Academia Tenis de Mesa", sector: "Deportes", moneda: "S/", capital_disponible: 18000, inversion: { insumos: 1000, equipos: 8000, empaques: 0, permisos: 1500, otros: 7500 }, precio_venta: 120, costo_directo: 5, gastos_fijos: { marketing: 300, logistica: 0, sueldo_emprendedor: 1200, otros: 3000 }, ventas: { pesimista: 40, base: 90, optimista: 180, crecimiento_mensual: 5 }, regimen_tributario: "MYPE", inflacion_anual: 3.5 },
  vet_movil: { category: "🎨 Pasatiempos", volumen: "medio", nombre_idea: "Veterinaria Móvil", sector: "Salud Animal", moneda: "S/", capital_disponible: 45000, inversion: { insumos: 5000, equipos: 35000, empaques: 500, permisos: 1500, otros: 3000 }, precio_venta: 80, costo_directo: 15, gastos_fijos: { marketing: 400, logistica: 800, sueldo_emprendedor: 1200, otros: 1500 }, ventas: { pesimista: 50, base: 120, optimista: 250, crecimiento_mensual: 3 }, regimen_tributario: "MYPE", inflacion_anual: 4.0 },
  guarderia: { category: "🎨 Pasatiempos", volumen: "medio", nombre_idea: "Guardería Mascotas", sector: "Mascotas", moneda: "S/", capital_disponible: 25000, inversion: { insumos: 2000, equipos: 12000, empaques: 0, permisos: 2000, otros: 9000 }, precio_venta: 40, costo_directo: 5, gastos_fijos: { marketing: 400, logistica: 0, sueldo_emprendedor: 1200, otros: 3500 }, ventas: { pesimista: 30, base: 80, optimista: 200, crecimiento_mensual: 6 }, regimen_tributario: "MYPE", inflacion_anual: 3.5 },
  artes_marciales: { category: "🎨 Pasatiempos", volumen: "medio", nombre_idea: "Artes Marciales", sector: "Deportes", moneda: "S/", capital_disponible: 20000, inversion: { insumos: 1000, equipos: 10000, empaques: 0, permisos: 1500, otros: 7500 }, precio_venta: 140, costo_directo: 0, gastos_fijos: { marketing: 300, logistica: 0, sueldo_emprendedor: 1200, otros: 3000 }, ventas: { pesimista: 30, base: 75, optimista: 150, crecimiento_mensual: 4 }, regimen_tributario: "MYPE", inflacion_anual: 3.0 },
  torneos: { category: "🎨 Pasatiempos", volumen: "bajo", nombre_idea: "Torneos Deportivos", sector: "Eventos", moneda: "S/", capital_disponible: 10000, inversion: { insumos: 3000, equipos: 2000, empaques: 0, permisos: 1500, otros: 3500 }, precio_venta: 1500, costo_directo: 600, gastos_fijos: { marketing: 800, logistica: 500, sueldo_emprendedor: 1200, otros: 1000 }, ventas: { pesimista: 1, base: 4, optimista: 10, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3.5 },
  barberia_movil: { category: "🎨 Pasatiempos", volumen: "medio", nombre_idea: "Barbería Móvil", sector: "Belleza", moneda: "S/", capital_disponible: 35000, inversion: { insumos: 1500, equipos: 25000, empaques: 0, permisos: 1500, otros: 7000 }, precio_venta: 45, costo_directo: 5, gastos_fijos: { marketing: 400, logistica: 600, sueldo_emprendedor: 1200, otros: 1000 }, ventas: { pesimista: 60, base: 150, optimista: 300, crecimiento_mensual: 3 }, regimen_tributario: "MYPE", inflacion_anual: 4.0 },
  cerveza: { category: "🎨 Pasatiempos", volumen: "alto", nombre_idea: "Cerveza Artesanal", sector: "Alimentos", moneda: "S/", capital_disponible: 25000, inversion: { insumos: 5000, equipos: 12000, empaques: 3000, permisos: 2000, otros: 3000 }, precio_venta: 12, costo_directo: 4, gastos_fijos: { marketing: 500, logistica: 600, sueldo_emprendedor: 1200, otros: 1500 }, ventas: { pesimista: 200, base: 500, optimista: 1200, crecimiento_mensual: 5 }, regimen_tributario: "MYPE", inflacion_anual: 3.5 },
  coleccionables: { category: "🎨 Pasatiempos", volumen: "medio", nombre_idea: "Juegos de Mesa y Hobbie", sector: "Retail", moneda: "S/", capital_disponible: 15000, inversion: { insumos: 10000, equipos: 2000, empaques: 500, permisos: 800, otros: 1700 }, precio_venta: 120, costo_directo: 60, gastos_fijos: { marketing: 400, logistica: 300, sueldo_emprendedor: 1200, otros: 1500 }, ventas: { pesimista: 40, base: 100, optimista: 250, crecimiento_mensual: 4 }, regimen_tributario: "RER", inflacion_anual: 3.0 },
  spa_mascotas: { category: "🎨 Pasatiempos", volumen: "medio", nombre_idea: "Peluquería Canina", sector: "Mascotas", moneda: "S/", capital_disponible: 12000, inversion: { insumos: 2000, equipos: 6000, empaques: 300, permisos: 700, otros: 3000 }, precio_venta: 50, costo_directo: 10, gastos_fijos: { marketing: 300, logistica: 100, sueldo_emprendedor: 1200, otros: 1500 }, ventas: { pesimista: 50, base: 120, optimista: 250, crecimiento_mensual: 4 }, regimen_tributario: "NRUS", inflacion_anual: 3.0 }
};

const CATEGORIAS_ITEMS = ["Insumos", "Equipos", "Proveedores", "Personal", "Marketing", "Otros"];

export default function Home() {
  const [activeTab, setActiveTab] = useState('simulador');
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState({ name: "Manuel - Admin", isLogged: true });
  
  const [formData, setFormData] = useState<any>({
    nombre_idea: "", sector: "", moneda: "S/", capital_disponible: 25000,
    precio_venta: 12, costo_directo: 4, regimen_tributario: "MYPE", inflacion_anual: 3.0,
    ventas: { pesimista: 400, base: 800, optimista: 1200, crecimiento_mensual: 3 },
    tasa_descuento: 12, meses_reserva: 3, estacionalidad: Array(12).fill(0),
    solicitar_prestamo: false, financiamiento_monto: 0, financiamiento_tasa_mensual: 1.5, financiamiento_plazo: 24
  });

  const [invItems, setInvItems] = useState<any[]>([
    { id: '1', nombre: 'Stock Inicial', monto: 2000, categoria: 'Insumos', vida_util: 0, residual: 0 },
    { id: '2', nombre: 'Maquinaria Principal', monto: 15000, categoria: 'Equipos', vida_util: 36, residual: 1500 }
  ]);

  const [gastoItems, setGastoItems] = useState<any[]>([
    { id: '1', nombre: 'Alquiler de Local', monto: 2000, categoria: 'Otros' },
    { id: '2', nombre: 'Sueldo Emprendedor', monto: 1200, categoria: 'Personal' }
  ]);

  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [consejoIA, setConsejoIA] = useState("");
  const [activeRol, setActiveRol] = useState("");
  const [cargandoIA, setCargandoIA] = useState(false);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const invTotal = invItems.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
  const gastoTotal = gastoItems.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);

  const cargarPlantilla = (key: string) => {
    if (key === 'vacio') {
       setFormData(TEMPLATES.vacio); setInvItems([]); setGastoItems([]); setRes(null);
    } else {
       const t = TEMPLATES[key];
       if(!t) return;
       setFormData({...t, tasa_descuento: 12, meses_reserva: 3, estacionalidad: Array(12).fill(0)});
       setInvItems([
         { id: '1', nombre: 'Insumos', monto: t.inversion?.insumos||0, categoria: 'Insumos', vida_util: 0, residual: 0 },
         { id: '2', nombre: 'Equipos', monto: t.inversion?.equipos||0, categoria: 'Equipos', vida_util: 60, residual: (t.inversion?.equipos||0)*0.1 },
         { id: '3', nombre: 'Otros', monto: (t.inversion?.permisos||0)+(t.inversion?.otros||0), categoria: 'Otros', vida_util: 0, residual: 0 },
       ].filter(x => x.monto > 0));
       setGastoItems([
         { id: '1', nombre: 'Marketing', monto: t.gastos_fijos?.marketing||0, categoria: 'Marketing' },
         { id: '2', nombre: 'Logística', monto: t.gastos_fijos?.logistica||0, categoria: 'Proveedores' },
         { id: '3', nombre: 'Sueldo Emprendedor', monto: t.gastos_fijos?.sueldo_emprendedor||1200, categoria: 'Personal' },
         { id: '4', nombre: 'Otros Fijos', monto: t.gastos_fijos?.otros||0, categoria: 'Otros' }
       ].filter(x => x.monto > 0));
       setRes(null);
    }
  };

  const ejecutarSimulacion = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        inversion_dinamica: invItems,
        gastos_dinamicos: gastoItems,
        financiamiento_monto: formData.solicitar_prestamo && (invTotal > formData.capital_disponible) ? (invTotal - formData.capital_disponible) : 0
      };
      const peticion = await fetch(`${API_URL}/simular`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const data = await peticion.json();
      setRes(data);
      setActiveTab('resultados');
    } catch (error) { 
      alert("⚠️ No se pudo conectar al Backend.\nAsegúrate de que 'uvicorn main:app --reload' esté corriendo en la terminal de Python."); 
    }
    setLoading(false);
  };

  const pedirConsejo = async (rol: string) => {
    setActiveRol(rol); 
    setCargandoIA(true); setConsejoIA("La IA está analizando la viabilidad...");
    try {
      const response = await fetch(`${API_URL}/consejero`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol, idea: formData.nombre_idea, sector: formData.sector, metricas: res?.metricas })
      });
      const data = await response.json();
      setConsejoIA(data.consejo);
    } catch (error) { setConsejoIA("Hubo un error al contactar al consejero."); }
    setCargandoIA(false);
  };

  const handleExportarExcel = () => {
    if(!res || !res.metricas) return alert("Simula primero");
    const wb = XLSX.utils.book_new();
    const wsResumen = XLSX.utils.json_to_sheet([{
       Proyecto: formData.nombre_idea, VAN: res.metricas.van, TIR: res.metricas.tir, ROI: res.metricas.roi, Inversion: res.metricas.inversion_total
    }]);
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");
    const wsPyG = XLSX.utils.json_to_sheet(res.base.p_y_g);
    XLSX.utils.book_append_sheet(wb, wsPyG, "Estado Resultados (36M)");
    XLSX.writeFile(wb, `Simulacion_${formData.nombre_idea}.xlsx`);
  };

  const exportarPDF = () => window.print();

  const addItemInv = () => setInvItems([...invItems, {id: Date.now().toString(), nombre: '', monto: 0, categoria: 'Equipos', vida_util: 0, residual: 0}]);
  const addItemGas = () => setGastoItems([...gastoItems, {id: Date.now().toString(), nombre: '', monto: 0, categoria: 'Otros'}]);
  
  const updateInv = (id:string, field:string, value:any) => setInvItems(invItems.map(x => x.id === id ? {...x, [field]:value} : x));
  const updateGas = (id:string, field:string, value:any) => setGastoItems(gastoItems.map(x => x.id === id ? {...x, [field]:value} : x));

  const groupedTemplates = Object.keys(TEMPLATES).reduce((acc: any, key) => {
    if (key === 'vacio') return acc;
    const cat = TEMPLATES[key].category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({ key, ...TEMPLATES[key] });
    return acc;
  }, {});

  // EXTRACCIÓN SEGURA DE VARIABLES PARA EVITAR "UNDEFINED" CRASHES
  const alertaLiquidez = res?.metricas?.alerta_liquidez || "";
  const estadoRecomendacion = res?.metricas?.recomendacion?.estado || "EVALUANDO";
  const mensajeRecomendacion = res?.metricas?.recomendacion?.msg || "Resultados cargados.";

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 font-sans text-slate-800 dark:text-slate-200 print:bg-white print:p-0 transition-colors duration-200">
      
      {/* HEADER & TABS */}
      <div className="max-w-7xl mx-auto print:hidden">
        {/* TOPBAR */}
        <div className="flex flex-wrap justify-between items-center mb-8 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                 {user.name.charAt(0)}
              </div>
              <div>
                 <p className="text-sm font-bold dark:text-white">{user.name}</p>
                 <p className="text-xs text-slate-500 dark:text-slate-400">Motor V3.3 - Enterprise</p>
              </div>
           </div>
           
           <div className="flex items-center gap-3 mt-4 md:mt-0">
              <button onClick={() => setDarkMode(!darkMode)} className="cursor-pointer text-xl p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}>
                {darkMode ? '☀️' : '🌙'}
              </button>
           </div>
        </div>

        <header className="mb-6 text-center">
          <h1 className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-400">Decisiones de Inversión IA</h1>
          <div className="flex justify-center mt-6 gap-2">
            <button onClick={() => setActiveTab('simulador')} className={`cursor-pointer px-6 py-2 font-bold rounded-lg transition-colors ${activeTab === 'simulador' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>1. Configurar</button>
            <button onClick={() => {if(res && res.metricas)setActiveTab('resultados')}} className={`cursor-pointer px-6 py-2 font-bold rounded-lg transition-colors ${activeTab === 'resultados' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'} ${(!res || !res.metricas) && 'opacity-50 cursor-not-allowed'}`}>2. Resultados & Dictamen</button>
          </div>
        </header>
      </div>

      {/* TABS CONTENT */}
      {activeTab === 'simulador' && (
        <div className="max-w-6xl mx-auto space-y-6">
           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
             
             {/* Cargar Base Agrupada */}
             <div className="flex items-center gap-4 mb-6 flex-wrap">
                <span className="font-bold flex items-center dark:text-white">Cargar Base: <InfoTooltip text="Selecciona una de las 100 plantillas pre-cargadas para empezar." /></span>
                <select onChange={(e) => cargarPlantilla(e.target.value)} className="cursor-pointer p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-white text-sm flex-1 outline-none focus:border-indigo-500">
                  <option value="vacio">Personalizado (Desde Cero)</option>
                  {Object.keys(groupedTemplates).map(cat => (
                    <optgroup key={cat} label={cat}>
                      {groupedTemplates[cat].map((t:any) => (
                        <option key={t.key} value={t.key}>{t.nombre_idea}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* BLOQUE IZQ: DATOS BÁSICOS Y VENTAS */}
               <div className="space-y-6">
                 <div>
                    <h3 className="font-bold text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/50 pb-2 mb-3">Datos del Negocio</h3>
                    <input type="text" placeholder="Nombre Idea" value={formData.nombre_idea} onChange={e=>setFormData({...formData, nombre_idea: e.target.value})} className="w-full p-2 mb-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-500" />
                    <div className="flex gap-2">
                       <select value={formData.moneda} onChange={e=>setFormData({...formData, moneda:e.target.value})} className="cursor-pointer p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 dark:text-white w-24 outline-none"><option>S/</option><option>USD</option></select>
                       <input type="number" placeholder="Capital Disponible" value={formData.capital_disponible} onChange={e=>setFormData({...formData, capital_disponible: Number(e.target.value)})} className="w-full p-2 border-2 border-emerald-400 dark:border-emerald-600 rounded bg-emerald-50 dark:bg-slate-900 dark:text-emerald-400 font-bold outline-none" />
                    </div>
                 </div>

                 <div>
                    <h3 className="font-bold text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/50 pb-2 mb-3 flex items-center">Unitarios y Proyección <InfoTooltip text="Precios y volúmenes de venta del primer mes de operación." /></h3>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                       <div><label className="text-xs font-bold dark:text-slate-300">Precio Venta</label><input type="number" value={formData.precio_venta} onChange={e=>setFormData({...formData, precio_venta: Number(e.target.value)})} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-500" /></div>
                       <div><label className="text-xs font-bold dark:text-slate-300">Costo Directo</label><input type="number" value={formData.costo_directo} onChange={e=>setFormData({...formData, costo_directo: Number(e.target.value)})} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-500" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                       <div><label className="text-xs font-bold text-rose-500">Vol. Pesimista</label><input type="number" value={formData.ventas.pesimista} onChange={e=>setFormData({...formData, ventas: {...formData.ventas, pesimista: Number(e.target.value)}})} className="w-full p-2 border border-rose-200 dark:border-rose-900/50 rounded bg-slate-50 dark:bg-slate-900 dark:text-rose-400 outline-none" /></div>
                       <div><label className="text-xs font-bold text-indigo-500">Vol. Base</label><input type="number" value={formData.ventas.base} onChange={e=>setFormData({...formData, ventas: {...formData.ventas, base: Number(e.target.value)}})} className="w-full p-2 border border-indigo-300 dark:border-indigo-700 rounded bg-indigo-50 dark:bg-slate-900 dark:text-indigo-400 outline-none" /></div>
                       <div><label className="text-xs font-bold text-emerald-500">Vol. Optimista</label><input type="number" value={formData.ventas.optimista} onChange={e=>setFormData({...formData, ventas: {...formData.ventas, optimista: Number(e.target.value)}})} className="w-full p-2 border border-emerald-200 dark:border-emerald-900/50 rounded bg-slate-50 dark:bg-slate-900 dark:text-emerald-400 outline-none" /></div>
                    </div>
                 </div>
                 
                 <div>
                    <h3 className="font-bold text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/50 pb-2 mb-3 flex items-center">Parámetros Financieros (Avanzado) <InfoTooltip text="Tasas usadas para el cálculo del Valor Actual Neto e Impuestos." /></h3>
                    <div className="grid grid-cols-2 gap-2">
                       <div><label className="text-xs font-bold dark:text-slate-300">Tasa Descuento VAN (%)</label><input type="number" value={formData.tasa_descuento} onChange={e=>setFormData({...formData, tasa_descuento: Number(e.target.value)})} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-500" /></div>
                       <div><label className="text-xs font-bold dark:text-slate-300">Reserva Seguridad</label><select value={formData.meses_reserva} onChange={e=>setFormData({...formData, meses_reserva: Number(e.target.value)})} className="cursor-pointer w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 dark:text-white outline-none"><option value="3">3 Meses</option><option value="6">6 Meses</option><option value="12">1 Año</option></select></div>
                    </div>
                    <div className="mt-2">
                      <label className="text-xs font-bold block mb-1 dark:text-slate-300">Régimen Tributario</label>
                      <select value={formData.regimen_tributario} onChange={e=>setFormData({...formData, regimen_tributario: e.target.value})} className="cursor-pointer w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 dark:text-white outline-none">
                        <option value="NRUS">NRUS (Mypes pequeñas)</option><option value="RER">RER (Régimen Especial)</option><option value="MYPE">Régimen MYPE/General</option>
                      </select>
                    </div>
                 </div>
               </div>

               {/* BLOQUE DER: LISTAS DINÁMICAS */}
               <div className="space-y-6">
                 <div>
                    <div className="flex justify-between items-center border-b border-indigo-100 dark:border-indigo-900/50 pb-2 mb-3">
                      <h3 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center">Inversión Inicial <InfoTooltip text="Gastos de una sola vez antes de abrir." /></h3>
                      <span className="font-bold text-sm bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded dark:text-white">Total: {formData.moneda} {invTotal}</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {invItems.map((item) => (
                         <div key={item.id} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                            <input type="text" value={item.nombre} onChange={e=>updateInv(item.id, 'nombre', e.target.value)} placeholder="Ej. Horno" className="flex-1 bg-transparent text-sm outline-none w-20 dark:text-white" />
                            <select value={item.categoria} onChange={e=>updateInv(item.id, 'categoria', e.target.value)} className="cursor-pointer w-24 text-xs bg-transparent outline-none dark:text-slate-300">
                              {CATEGORIAS_ITEMS.map(c=><option key={c}>{c}</option>)}
                            </select>
                            <input type="number" value={item.monto} onChange={e=>updateInv(item.id, 'monto', Number(e.target.value))} className="w-20 text-sm bg-transparent outline-none font-bold dark:text-white" />
                            {item.categoria === 'Equipos' && <input type="number" placeholder="Meses Vida" title="Vida Util Meses" value={item.vida_util} onChange={e=>updateInv(item.id, 'vida_util', Number(e.target.value))} className="w-16 text-xs bg-white dark:bg-slate-800 dark:text-white border dark:border-slate-600 p-1 rounded" />}
                            <button onClick={()=>setInvItems(invItems.filter(x=>x.id!==item.id))} className="cursor-pointer text-rose-500 hover:text-rose-700 font-bold px-2">✕</button>
                         </div>
                      ))}
                    </div>
                    <button onClick={addItemInv} className="cursor-pointer mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">+ Agregar Inversión</button>
                 </div>

                 <div>
                    <div className="flex justify-between items-center border-b border-indigo-100 dark:border-indigo-900/50 pb-2 mb-3">
                      <h3 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center">Gastos Fijos Mensuales <InfoTooltip text="Gastos que pagarás vendas o no vendas." /></h3>
                      <span className="font-bold text-sm bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded dark:text-white">Total: {formData.moneda} {gastoTotal}</span>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {gastoItems.map((item) => (
                         <div key={item.id} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                            <input type="text" value={item.nombre} onChange={e=>updateGas(item.id, 'nombre', e.target.value)} placeholder="Ej. Alquiler" className="flex-1 bg-transparent text-sm outline-none dark:text-white" />
                            <select value={item.categoria} onChange={e=>updateGas(item.id, 'categoria', e.target.value)} className="cursor-pointer w-28 text-xs bg-transparent outline-none dark:text-slate-300">
                              {CATEGORIAS_ITEMS.map(c=><option key={c}>{c}</option>)}
                            </select>
                            <input type="number" value={item.monto} onChange={e=>updateGas(item.id, 'monto', Number(e.target.value))} className="w-24 text-sm bg-transparent outline-none font-bold dark:text-white" />
                            <button onClick={()=>setGastoItems(gastoItems.filter(x=>x.id!==item.id))} className="cursor-pointer text-rose-500 hover:text-rose-700 font-bold px-2">✕</button>
                         </div>
                      ))}
                    </div>
                    <button onClick={addItemGas} className="cursor-pointer mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">+ Agregar Gasto Fijo</button>
                 </div>
               </div>
             </div>
             
             <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="font-bold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center">Estacionalidad de Ventas (% ajuste) <InfoTooltip text="Ajusta qué meses subirán o bajarán tus ventas según la temporada." /></h3>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                   {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((mes, idx) => (
                     <div key={mes} className="flex flex-col items-center min-w-[60px]">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{mes}</label>
                        <input type="number" value={formData.estacionalidad[idx]} onChange={e => {const newEst = [...formData.estacionalidad]; newEst[idx] = Number(e.target.value); setFormData({...formData, estacionalidad: newEst});}} className="w-14 text-center p-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-500" />
                     </div>
                   ))}
                </div>
             </div>

             <div className="mt-8 flex justify-center">
               <button onClick={ejecutarSimulacion} disabled={loading} className="cursor-pointer w-full md:w-1/2 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xl font-black rounded-xl shadow-lg transition-all transform hover:scale-105">
                 {loading ? "Calculando VAN y TIR..." : "🚀 Generar Modelo 36 Meses"}
               </button>
             </div>
           </div>
        </div>
      )}

      {/* TABS RESULTADOS */}
      {activeTab === 'resultados' && res && res.metricas && (
        <div className="max-w-7xl mx-auto animate-in fade-in zoom-in duration-300">
          {/* Dashboard Resumen KPI */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm mb-6 border border-slate-200 dark:border-slate-700 print:shadow-none print:border-none">
             <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                <div>
                   <h2 className="text-2xl font-black text-slate-800 dark:text-white">{formData.nombre_idea || 'Proyecto sin nombre'}</h2>
                   <p className="text-sm text-slate-500 dark:text-slate-400">Dictamen Financiero Profesional V3.3</p>
                </div>
                <div className="flex gap-2 print:hidden">
                   <button onClick={handleExportarExcel} className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-colors">📥 Exportar .xlsx</button>
                   <button onClick={exportarPDF} className="cursor-pointer bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-colors">📄 Generar PDF</button>
                </div>
             </div>

             <div className={`p-6 rounded-2xl mb-8 text-center border-2 shadow-sm ${estadoRecomendacion.includes("INVERTIR") && !estadoRecomendacion.includes("NO") ? 'bg-emerald-50 border-emerald-400 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-600 dark:text-emerald-300' : estadoRecomendacion.includes("NO") ? 'bg-rose-50 border-rose-400 text-rose-800 dark:bg-rose-900/20 dark:border-rose-600 dark:text-rose-300' : 'bg-amber-50 border-amber-400 text-amber-800 dark:bg-amber-900/20 dark:border-amber-600 dark:text-amber-300'}`}>
                <h3 className="text-4xl font-black tracking-tight">{estadoRecomendacion}</h3>
                <p className="font-medium mt-2 text-lg">{mensajeRecomendacion}</p>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                   <p className="text-xs text-slate-500 font-bold uppercase">Inversión Req.</p>
                   <p className="text-2xl font-black dark:text-white">{formData.moneda} {Number(res.metricas?.inversion_total || 0).toLocaleString('es-PE')}</p>
                </div>
                <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                   <p className="text-xs text-slate-500 font-bold uppercase">Reserva ({formData.meses_reserva} Meses)</p>
                   <p className={`text-2xl font-black ${alertaLiquidez.includes('⚠️') ? 'text-rose-500' : 'dark:text-white'}`}>{formData.moneda} {Number(res.metricas?.reserva_emergencia || 0).toLocaleString('es-PE')}</p>
                   <p className="text-[10px] text-rose-500 leading-tight mt-1">{alertaLiquidez.includes('⚠️') ? alertaLiquidez : ''}</p>
                </div>
                <div className="p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-200 dark:border-indigo-800">
                   <p className="text-xs text-indigo-500 dark:text-indigo-400 font-bold uppercase flex items-center gap-1">VAN <InfoTooltip text="Valor Actual Neto: Dinero puro que ganarás a día de hoy, descontando tu tasa de riesgo." /></p>
                   <p className={`text-3xl font-black ${(res.metricas?.van || 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{formData.moneda} {Number(res.metricas?.van || 0).toLocaleString('es-PE')}</p>
                </div>
                <div className="p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-200 dark:border-indigo-800">
                   <p className="text-xs text-indigo-500 dark:text-indigo-400 font-bold uppercase flex items-center gap-1">TIR <InfoTooltip text="Tasa Interna de Retorno: La rentabilidad real que te da el proyecto al año." /></p>
                   <p className={`text-3xl font-black ${(res.metricas?.tir || 0) > formData.tasa_descuento ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{Number(res.metricas?.tir || 0).toFixed(1)}%</p>
                </div>
                <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                   <p className="text-xs text-slate-500 font-bold uppercase">Relación B/C</p>
                   <p className="text-xl font-black dark:text-white">{Number(res.metricas?.b_c || 0).toFixed(2)}</p>
                </div>
                <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                   <p className="text-xs text-slate-500 font-bold uppercase flex items-center gap-1">Payback <InfoTooltip text="Mes en el que recuperas toda tu inversión inicial." /></p>
                   <p className="text-xl font-black dark:text-white">{typeof res.base?.mes_recuperacion === 'number' ? `Mes ${res.base.mes_recuperacion}` : '+3 Años'}</p>
                </div>
                <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                   <p className="text-xs text-slate-500 font-bold uppercase flex items-center gap-1">Punto Eq. <InfoTooltip text="Ventas mínimas mensuales para no quebrar." /></p>
                   <p className="text-xl font-black dark:text-white">{res.metricas?.punto_equilibrio || 0} <span className="text-xs font-normal text-slate-500">v/m</span></p>
                </div>
                <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                   <p className="text-xs text-slate-500 font-bold uppercase flex items-center gap-1">ROI Directo <InfoTooltip text="Retorno sobre la Inversión simple al mes 36." /></p>
                   <p className="text-xl font-black dark:text-white">{Number(res.metricas?.roi || 0).toFixed(1)}%</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
             {/* MATRIZ DE SENSIBILIDAD 5x5 */}
             <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto custom-scrollbar">
                <h3 className="font-bold text-lg mb-2 flex items-center dark:text-white">Matriz de Sensibilidad (VAN) <InfoTooltip text="Simula escenarios de VAN si subes/bajas el precio y volumen simultáneamente." /></h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Filas: Variación Precio | Columnas: Variación Volumen</p>
                <table className="w-full text-center text-xs">
                   <thead>
                      <tr>
                         <th className="dark:text-white">P \ V</th>
                         {[0.8, 0.9, 1.0, 1.1, 1.2].map(v => <th key={v} className="p-2 bg-slate-100 dark:bg-slate-700 dark:text-white rounded-t">{Math.round(v*100)}%</th>)}
                      </tr>
                   </thead>
                   <tbody>
                      {(res.matriz_sensibilidad || []).map((fila:any) => (
                         <tr key={fila.precio_mult}>
                            <td className="p-2 bg-slate-100 dark:bg-slate-700 font-bold dark:text-white">{Math.round(fila.precio_mult*100)}%</td>
                            {fila.valores.map((celda:any, i:number) => (
                               <td key={i} className={`p-2 border dark:border-slate-600 font-bold ${celda.van > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                  {Number(celda.van || 0).toLocaleString('es-PE', {maximumFractionDigits:0})}
                               </td>
                            ))}
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             {/* GRÁFICO FLUJO DE CAJA 36 MESES */}
             <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg mb-4 flex items-center dark:text-white">Evolución de Caja (36 Meses) <InfoTooltip text="Curva de recuperación de tu dinero a lo largo del tiempo. Si la línea cae bajo 0, te quedaste sin liquidez." /></h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={res.base?.p_y_g || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#334155" : "#e2e8f0"} />
                      <XAxis dataKey="mes" tick={{fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b'}} />
                      <YAxis tick={{fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b'}} width={50}/>
                      <Tooltip formatter={(value: any) => `${formData.moneda} ${Number(value || 0).toLocaleString('es-PE')}`} contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', color: darkMode ? '#f8fafc' : '#0f172a' }}/>
                      <ReferenceLine y={0} stroke={darkMode ? "#94a3b8" : "#000"} />
                      <Line type="monotone" dataKey="caja_acumulada" stroke="#4f46e5" strokeWidth={3} name="Caja Acumulada" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>

          {/* ESTADO DE RESULTADOS 36 MESES (TABLA DESPLEGABLE) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
             <div className="p-4 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-lg dark:text-white">Estado de Resultados y Flujo de Caja</h3>
                <span className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 px-3 py-1 rounded-full font-bold shadow-sm">Mes 1 al 36</span>
             </div>
             <div className="overflow-x-auto custom-scrollbar p-0">
                <table className="w-full text-right text-xs">
                   <thead className="bg-slate-50 dark:bg-slate-800 sticky left-0 z-10">
                      <tr>
                         <th className="p-3 text-left bg-slate-100 dark:bg-slate-800 sticky left-0 font-black z-20 dark:text-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Concepto</th>
                         {(res.base?.p_y_g || []).map((m:any) => <th key={m.mes} className="p-3 min-w-[90px] dark:text-slate-300">Mes {m.mes}</th>)}
                      </tr>
                   </thead>
                   <tbody>
                      <tr className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                         <td className="p-3 text-left font-bold bg-white dark:bg-slate-800 sticky left-0 z-10 text-slate-500 dark:text-slate-400 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Ventas (Und)</td>
                         {(res.base?.p_y_g || []).map((m:any) => <td key={m.mes} className="p-3 text-slate-500 dark:text-slate-400">{Number(m.ventas_unidades || 0).toLocaleString('es-PE')}</td>)}
                      </tr>
                      <tr className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                         <td className="p-3 text-left font-bold bg-slate-50 dark:bg-slate-900 sticky left-0 z-10 dark:text-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Ingresos (+)</td>
                         {(res.base?.p_y_g || []).map((m:any) => <td key={m.mes} className="p-3 dark:text-slate-300">{Number(m.ingresos || 0).toLocaleString('es-PE')}</td>)}
                      </tr>
                      <tr className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                         <td className="p-3 text-left font-bold bg-white dark:bg-slate-800 sticky left-0 z-10 text-rose-500 dark:text-rose-400 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Costos Var. (-)</td>
                         {(res.base?.p_y_g || []).map((m:any) => <td key={m.mes} className="p-3 text-rose-500 dark:text-rose-400">{Number(m.costos_variables || 0).toLocaleString('es-PE')}</td>)}
                      </tr>
                      <tr className="border-b-2 border-slate-300 dark:border-slate-600 bg-indigo-50/50 dark:bg-indigo-900/10">
                         <td className="p-3 text-left font-black bg-indigo-50 dark:bg-indigo-900/30 sticky left-0 z-10 text-indigo-900 dark:text-indigo-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Margen Bruto</td>
                         {(res.base?.p_y_g || []).map((m:any) => <td key={m.mes} className="p-3 font-bold text-indigo-900 dark:text-indigo-300">{Number(m.margen_bruto || 0).toLocaleString('es-PE')}</td>)}
                      </tr>
                      <tr className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                         <td className="p-3 text-left font-bold bg-white dark:bg-slate-800 sticky left-0 z-10 text-amber-600 dark:text-amber-500 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Gastos Fijos (-)</td>
                         {(res.base?.p_y_g || []).map((m:any) => <td key={m.mes} className="p-3 text-amber-600 dark:text-amber-500">{Number(m.gastos_fijos || 0).toLocaleString('es-PE')}</td>)}
                      </tr>
                      <tr className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                         <td className="p-3 text-left font-bold bg-white dark:bg-slate-800 sticky left-0 z-10 text-amber-600 dark:text-amber-500 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Depreciación (-)</td>
                         {(res.base?.p_y_g || []).map((m:any) => <td key={m.mes} className="p-3 text-amber-600 dark:text-amber-500">{Number(m.depreciacion || 0).toLocaleString('es-PE')}</td>)}
                      </tr>
                      <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                         <td className="p-3 text-left font-bold bg-slate-50 dark:bg-slate-900 sticky left-0 z-10 dark:text-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">EBIT</td>
                         {(res.base?.p_y_g || []).map((m:any) => <td key={m.mes} className="p-3 font-medium dark:text-slate-300">{Number(m.ebit || 0).toLocaleString('es-PE')}</td>)}
                      </tr>
                      <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                         <td className="p-3 text-left font-bold bg-white dark:bg-slate-800 sticky left-0 z-10 text-rose-500 dark:text-rose-400 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Impuestos (-)</td>
                         {(res.base?.p_y_g || []).map((m:any) => <td key={m.mes} className="p-3 text-rose-500 dark:text-rose-400">{Number(m.impuestos || 0).toLocaleString('es-PE')}</td>)}
                      </tr>
                      <tr className="border-b-4 border-slate-400 dark:border-slate-500 bg-emerald-50/50 dark:bg-emerald-900/10">
                         <td className="p-3 text-left font-black bg-emerald-50 dark:bg-emerald-900/30 sticky left-0 z-10 text-emerald-800 dark:text-emerald-400 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Utilidad Neta</td>
                         {(res.base?.p_y_g || []).map((m:any) => <td key={m.mes} className="p-3 font-black text-emerald-700 dark:text-emerald-400">{Number(m.utilidad_neta || 0).toLocaleString('es-PE')}</td>)}
                      </tr>
                      <tr>
                         <td className="p-4 text-left font-black bg-slate-800 dark:bg-slate-950 text-white sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">Caja Acumulada</td>
                         {(res.base?.p_y_g || []).map((m:any) => <td key={m.mes} className={`p-4 font-black ${m.caja_acumulada < 0 ? 'text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400' : 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>{Number(m.caja_acumulada || 0).toLocaleString('es-PE')}</td>)}
                      </tr>
                   </tbody>
                </table>
             </div>
          </div>

          {/* --- PANEL DEL CONSEJERO IA --- */}
          <div className="p-6 bg-slate-800 dark:bg-slate-900 text-slate-100 rounded-2xl shadow-xl border border-slate-700 relative overflow-hidden mb-8 print:hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl">🤖</div>
            <h3 className="font-bold text-white mb-4 text-xl relative z-10 flex items-center">
                Auditoría Estratégica AI
            </h3>
            
            <div className="flex gap-3 mb-6 flex-wrap relative z-10">
              <button onClick={() => pedirConsejo('auditor')} className={`cursor-pointer px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md ${activeRol === 'auditor' ? 'bg-indigo-500 text-white scale-105' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>🧐 Riesgo & Costos</button>
              <button onClick={() => pedirConsejo('marketing')} className={`cursor-pointer px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md ${activeRol === 'marketing' ? 'bg-purple-500 text-white scale-105' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>🚀 Crecimiento</button>
              <button onClick={() => pedirConsejo('operaciones')} className={`cursor-pointer px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md ${activeRol === 'operaciones' ? 'bg-emerald-500 text-white scale-105' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>⚙️ Operaciones</button>
            </div>

            {consejoIA && (
              <div className="p-6 bg-slate-900/80 rounded-xl border border-slate-700 shadow-inner text-sm text-slate-300 max-h-[400px] overflow-y-auto relative z-10 custom-scrollbar">
                {cargandoIA ? (
                  <div className="animate-pulse flex space-x-4 items-center p-4">
                      <div className="h-6 w-6 bg-indigo-500 rounded-full"></div>
                      <p className="text-indigo-300 font-bold tracking-wide text-base">La IA de Google Gemini está procesando el dictamen...</p>
                  </div>
                ) : (
                  <ReactMarkdown
                    components={{
                      h3: ({node, ...props}) => <h3 className="text-xl font-bold text-white mt-5 mb-3 border-b border-slate-700 pb-2" {...props} />,
                      h4: ({node, ...props}) => <h4 className="text-lg font-bold text-indigo-400 mt-4 mb-2" {...props} />,
                      p: ({node, ...props}) => <p className="mb-3 leading-relaxed text-base" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-white bg-slate-700/50 px-1.5 py-0.5 rounded" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-300" {...props} />,
                      li: ({node, ...props}) => <li className="pl-1" {...props} />
                    }}
                  >
                    {consejoIA}
                  </ReactMarkdown>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}