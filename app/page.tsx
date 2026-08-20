"use client";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import ReactMarkdown from 'react-markdown';
import * as XLSX from 'xlsx';
import { supabase } from './supabase';

// 🔥 CONFIGURACIÓN DE CONEXIÓN 🔥
const API_URL = "https://simulador-backend-ytbv.onrender.com"; 


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
  cafeteria: { category: "🍔 Gastronomía", volumen: "alto", nombre_idea: "Cafetería de Especialidad", sector: "Gastronomía", moneda: "S/", capital_disponible: 49000, inversion: { insumos: 2500, equipos: 18000, empaques: 1200, permisos: 1500, otros: 6000 }, precio_venta: 14, costo_directo: 5.5, gastos_fijos: { marketing: 700, logistica: 300, sueldo_emprendedor: 2000, otros: 3500 }, ventas: { pesimista: 650, base: 1000, optimista: 1500, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3 },
  dark_kitchen: { category: "🍔 Gastronomía", volumen: "alto", nombre_idea: "Dark Kitchen (Delivery)", sector: "Gastronomía", moneda: "S/", capital_disponible: 35500, inversion: { insumos: 2500, equipos: 10000, empaques: 1200, permisos: 1200, otros: 4000 }, precio_venta: 24, costo_directo: 13, gastos_fijos: { marketing: 800, logistica: 600, sueldo_emprendedor: 1800, otros: 2200 }, ventas: { pesimista: 460, base: 700, optimista: 1050, crecimiento_mensual: 3 }, regimen_tributario: "RER", inflacion_anual: 3 },
  food_truck: { category: "🍔 Gastronomía", volumen: "alto", nombre_idea: "Food Truck Ambulante", sector: "Gastronomía", moneda: "S/", capital_disponible: 57000, inversion: { insumos: 2500, equipos: 30000, empaques: 1000, permisos: 2500, otros: 6000 }, precio_venta: 20, costo_directo: 9, gastos_fijos: { marketing: 500, logistica: 800, sueldo_emprendedor: 1800, otros: 1800 }, ventas: { pesimista: 360, base: 550, optimista: 850, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3 },
  panaderia: { category: "🍔 Gastronomía", volumen: "alto", nombre_idea: "Panadería Artesanal", sector: "Gastronomía", moneda: "S/", capital_disponible: 42000, inversion: { insumos: 3000, equipos: 16000, empaques: 800, permisos: 1200, otros: 5000 }, precio_venta: 16, costo_directo: 5.5, gastos_fijos: { marketing: 400, logistica: 300, sueldo_emprendedor: 1800, otros: 2800 }, ventas: { pesimista: 430, base: 650, optimista: 1000, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3 },
  restaurante_menu: { category: "🍔 Gastronomía", volumen: "alto", nombre_idea: "Restaurante de Menú Diario", sector: "Gastronomía", moneda: "S/", capital_disponible: 42000, inversion: { insumos: 3500, equipos: 12000, empaques: 500, permisos: 1600, otros: 6000 }, precio_venta: 16, costo_directo: 8, gastos_fijos: { marketing: 500, logistica: 200, sueldo_emprendedor: 1800, otros: 3500 }, ventas: { pesimista: 650, base: 950, optimista: 1450, crecimiento_mensual: 1.5 }, regimen_tributario: "RER", inflacion_anual: 3 },
  cevicheria: { category: "🍔 Gastronomía", volumen: "medio", nombre_idea: "Cevichería / Pescados", sector: "Gastronomía", moneda: "S/", capital_disponible: 58000, inversion: { insumos: 5000, equipos: 18000, empaques: 1000, permisos: 1800, otros: 8000 }, precio_venta: 42, costo_directo: 18, gastos_fijos: { marketing: 900, logistica: 400, sueldo_emprendedor: 2200, otros: 4500 }, ventas: { pesimista: 280, base: 430, optimista: 650, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3 },
  pizzeria: { category: "🍔 Gastronomía", volumen: "medio", nombre_idea: "Pizzería Artesanal", sector: "Gastronomía", moneda: "S/", capital_disponible: 53000, inversion: { insumos: 3000, equipos: 20000, empaques: 1200, permisos: 1500, otros: 7000 }, precio_venta: 38, costo_directo: 14, gastos_fijos: { marketing: 600, logistica: 600, sueldo_emprendedor: 2000, otros: 3500 }, ventas: { pesimista: 230, base: 350, optimista: 550, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3 },
  jugueria: { category: "🍔 Gastronomía", volumen: "alto", nombre_idea: "Juguería y Saludables", sector: "Gastronomía", moneda: "S/", capital_disponible: 25500, inversion: { insumos: 1800, equipos: 6000, empaques: 800, permisos: 1000, otros: 3500 }, precio_venta: 12, costo_directo: 4.5, gastos_fijos: { marketing: 300, logistica: 200, sueldo_emprendedor: 1500, otros: 2000 }, ventas: { pesimista: 430, base: 650, optimista: 1000, crecimiento_mensual: 1.5 }, regimen_tributario: "NRUS", inflacion_anual: 3 },
  pasteleria: { category: "🍔 Gastronomía", volumen: "medio", nombre_idea: "Pastelería Fina / Tortas", sector: "Gastronomía", moneda: "S/", capital_disponible: 31000, inversion: { insumos: 2500, equipos: 12000, empaques: 1500, permisos: 1000, otros: 4000 }, precio_venta: 70, costo_directo: 25, gastos_fijos: { marketing: 500, logistica: 300, sueldo_emprendedor: 2000, otros: 2200 }, ventas: { pesimista: 100, base: 150, optimista: 230, crecimiento_mensual: 3 }, regimen_tributario: "RER", inflacion_anual: 3 },
  bar_restaurante: { category: "🍔 Gastronomía", volumen: "alto", nombre_idea: "Bar & Restobar", sector: "Gastronomía / Ocio", moneda: "S/", capital_disponible: 95000, inversion: { insumos: 8000, equipos: 30000, empaques: 1500, permisos: 3500, otros: 15000 }, precio_venta: 32, costo_directo: 11, gastos_fijos: { marketing: 1800, logistica: 500, sueldo_emprendedor: 2500, otros: 7500 }, ventas: { pesimista: 490, base: 750, optimista: 1150, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3 },

  // 🛍️ RETAIL Y E-COMMERCE
  ecommerce_ropa: { category: "🛍️ Retail", volumen: "medio", nombre_idea: "E-commerce Ropa Urbana", sector: "Retail / Moda", moneda: "S/", capital_disponible: 22000, inversion: { insumos: 7000, equipos: 2500, empaques: 800, permisos: 400, otros: 1500 }, precio_venta: 95, costo_directo: 45, gastos_fijos: { marketing: 1500, logistica: 600, sueldo_emprendedor: 1800, otros: 800 }, ventas: { pesimista: 85, base: 130, optimista: 200, crecimiento_mensual: 3 }, regimen_tributario: "RER", inflacion_anual: 3 },
  importacion_tech: { category: "🛍️ Retail", volumen: "medio", nombre_idea: "Importación Tecnología", sector: "E-commerce", moneda: "S/", capital_disponible: 34500, inversion: { insumos: 15000, equipos: 3000, empaques: 1000, permisos: 1000, otros: 3000 }, precio_venta: 220, costo_directo: 140, gastos_fijos: { marketing: 1500, logistica: 900, sueldo_emprendedor: 2000, otros: 1200 }, ventas: { pesimista: 65, base: 100, optimista: 150, crecimiento_mensual: 3 }, regimen_tributario: "RER", inflacion_anual: 3 },
  tienda_mascotas: { category: "🛍️ Retail", volumen: "medio", nombre_idea: "Pet Shop Online", sector: "Retail / Mascotas", moneda: "S/", capital_disponible: 19500, inversion: { insumos: 8000, equipos: 2000, empaques: 600, permisos: 400, otros: 1200 }, precio_venta: 55, costo_directo: 32, gastos_fijos: { marketing: 700, logistica: 600, sueldo_emprendedor: 1600, otros: 600 }, ventas: { pesimista: 130, base: 200, optimista: 300, crecimiento_mensual: 2.5 }, regimen_tributario: "RER", inflacion_anual: 3 },
  cosmetica_natural: { category: "🛍️ Retail", volumen: "medio", nombre_idea: "Cosmética Natural", sector: "Retail / Salud", moneda: "S/", capital_disponible: 20000, inversion: { insumos: 4000, equipos: 3000, empaques: 1200, permisos: 1500, otros: 2000 }, precio_venta: 45, costo_directo: 18, gastos_fijos: { marketing: 900, logistica: 400, sueldo_emprendedor: 1800, otros: 900 }, ventas: { pesimista: 130, base: 200, optimista: 300, crecimiento_mensual: 3 }, regimen_tributario: "RER", inflacion_anual: 3 },
  tienda_regalos: { category: "🛍️ Retail", volumen: "medio", nombre_idea: "Tienda de Regalos Personalizados", sector: "Retail", moneda: "S/", capital_disponible: 13500, inversion: { insumos: 2500, equipos: 2500, empaques: 1000, permisos: 400, otros: 1200 }, precio_venta: 65, costo_directo: 25, gastos_fijos: { marketing: 500, logistica: 300, sueldo_emprendedor: 1500, otros: 500 }, ventas: { pesimista: 65, base: 95, optimista: 150, crecimiento_mensual: 2.5 }, regimen_tributario: "NRUS", inflacion_anual: 3 },
  dropshipping: { category: "🛍️ Retail", volumen: "medio", nombre_idea: "Tienda Dropshipping", sector: "E-commerce", moneda: "S/", capital_disponible: 16000, inversion: { insumos: 0, equipos: 2500, empaques: 0, permisos: 400, otros: 2500 }, precio_venta: 120, costo_directo: 70, gastos_fijos: { marketing: 2500, logistica: 200, sueldo_emprendedor: 1800, otros: 800 }, ventas: { pesimista: 95, base: 140, optimista: 210, crecimiento_mensual: 4 }, regimen_tributario: "RER", inflacion_anual: 3 },
  venta_zapatillas: { category: "🛍️ Retail", volumen: "medio", nombre_idea: "Venta de Zapatillas Importadas", sector: "Retail", moneda: "S/", capital_disponible: 33500, inversion: { insumos: 18000, equipos: 2000, empaques: 1000, permisos: 600, otros: 2000 }, precio_venta: 280, costo_directo: 160, gastos_fijos: { marketing: 1200, logistica: 800, sueldo_emprendedor: 1800, otros: 1000 }, ventas: { pesimista: 36, base: 55, optimista: 85, crecimiento_mensual: 2.5 }, regimen_tributario: "RER", inflacion_anual: 3 },
  minimarket: { category: "🛍️ Retail", volumen: "alto", nombre_idea: "Minimarket de Barrio", sector: "Retail", moneda: "S/", capital_disponible: 58000, inversion: { insumos: 18000, equipos: 12000, empaques: 800, permisos: 1800, otros: 7000 }, precio_venta: 18, costo_directo: 13, gastos_fijos: { marketing: 300, logistica: 500, sueldo_emprendedor: 1800, otros: 3500 }, ventas: { pesimista: 1000, base: 1500, optimista: 2300, crecimiento_mensual: 1 }, regimen_tributario: "RER", inflacion_anual: 3 },
  libreria: { category: "🛍️ Retail", volumen: "alto", nombre_idea: "Librería y Útiles", sector: "Retail", moneda: "S/", capital_disponible: 31000, inversion: { insumos: 10000, equipos: 3000, empaques: 400, permisos: 700, otros: 4000 }, precio_venta: 8, costo_directo: 4, gastos_fijos: { marketing: 300, logistica: 200, sueldo_emprendedor: 1600, otros: 2200 }, ventas: { pesimista: 850, base: 1300, optimista: 1950, crecimiento_mensual: 1 }, regimen_tributario: "RER", inflacion_anual: 3 },
  joyeria: { category: "🛍️ Retail", volumen: "medio", nombre_idea: "Joyería / Bisutería Fina", sector: "Retail", moneda: "S/", capital_disponible: 22000, inversion: { insumos: 8000, equipos: 2500, empaques: 800, permisos: 500, otros: 2000 }, precio_venta: 110, costo_directo: 38, gastos_fijos: { marketing: 800, logistica: 300, sueldo_emprendedor: 1800, otros: 1000 }, ventas: { pesimista: 50, base: 75, optimista: 120, crecimiento_mensual: 3 }, regimen_tributario: "NRUS", inflacion_anual: 3 },

  // 💻 SERVICIOS B2B Y DIGITALES
  agencia_marketing: { category: "💻 Servicios B2B", volumen: "bajo", nombre_idea: "Agencia de Marketing Digital", sector: "Servicios B2B", moneda: "S/", capital_disponible: 22000, inversion: { insumos: 0, equipos: 7500, empaques: 0, permisos: 500, otros: 3000 }, precio_venta: 2500, costo_directo: 500, gastos_fijos: { marketing: 1200, logistica: 100, sueldo_emprendedor: 2500, otros: 1500 }, ventas: { pesimista: 3, base: 4, optimista: 6, crecimiento_mensual: 3 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  desarrollo_web: { category: "💻 Servicios B2B", volumen: "bajo", nombre_idea: "Estudio Desarrollo Web", sector: "Tecnología", moneda: "S/", capital_disponible: 17500, inversion: { insumos: 0, equipos: 6000, empaques: 0, permisos: 400, otros: 2000 }, precio_venta: 2500, costo_directo: 300, gastos_fijos: { marketing: 800, logistica: 100, sueldo_emprendedor: 2500, otros: 1000 }, ventas: { pesimista: 2, base: 3, optimista: 5, crecimiento_mensual: 3 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  consultoria_contable: { category: "💻 Servicios B2B", volumen: "bajo", nombre_idea: "Consultoría Contable Mypes", sector: "Servicios B2B", moneda: "S/", capital_disponible: 12000, inversion: { insumos: 300, equipos: 2500, empaques: 0, permisos: 500, otros: 1000 }, precio_venta: 300, costo_directo: 20, gastos_fijos: { marketing: 500, logistica: 100, sueldo_emprendedor: 2500, otros: 700 }, ventas: { pesimista: 14, base: 20, optimista: 30, crecimiento_mensual: 2 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  asistente_virtual: { category: "💻 Servicios B2B", volumen: "bajo", nombre_idea: "Asistencia Virtual Freelance", sector: "Servicios Digitales", moneda: "S/", capital_disponible: 10000, inversion: { insumos: 0, equipos: 3000, empaques: 0, permisos: 250, otros: 800 }, precio_venta: 1200, costo_directo: 50, gastos_fijos: { marketing: 400, logistica: 50, sueldo_emprendedor: 1800, otros: 500 }, ventas: { pesimista: 3, base: 4, optimista: 6, crecimiento_mensual: 3 }, regimen_tributario: "RER", inflacion_anual: 3 },
  estudio_fotografia: { category: "💻 Servicios B2B", volumen: "bajo", nombre_idea: "Estudio de Fotografía B2B", sector: "Servicios / Media", moneda: "S/", capital_disponible: 30500, inversion: { insumos: 800, equipos: 15000, empaques: 0, permisos: 500, otros: 4000 }, precio_venta: 1500, costo_directo: 250, gastos_fijos: { marketing: 800, logistica: 300, sueldo_emprendedor: 2200, otros: 1800 }, ventas: { pesimista: 4, base: 6, optimista: 9, crecimiento_mensual: 2.5 }, regimen_tributario: "RER", inflacion_anual: 3 },
  agencia_inmobiliaria: { category: "💻 Servicios B2B", volumen: "bajo", nombre_idea: "Agencia Inmobiliaria", sector: "Servicios", moneda: "S/", capital_disponible: 30500, inversion: { insumos: 0, equipos: 7000, empaques: 0, permisos: 1200, otros: 6000 }, precio_venta: 9000, costo_directo: 900, gastos_fijos: { marketing: 2500, logistica: 500, sueldo_emprendedor: 2500, otros: 2500 }, ventas: { pesimista: 2, base: 2, optimista: 3, crecimiento_mensual: 1.5 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  creacion_contenido: { category: "💻 Servicios B2B", volumen: "bajo", nombre_idea: "Agencia Creadora de Contenido", sector: "Media", moneda: "S/", capital_disponible: 16000, inversion: { insumos: 500, equipos: 6000, empaques: 0, permisos: 300, otros: 1500 }, precio_venta: 1200, costo_directo: 150, gastos_fijos: { marketing: 800, logistica: 200, sueldo_emprendedor: 2000, otros: 800 }, ventas: { pesimista: 4, base: 5, optimista: 8, crecimiento_mensual: 3 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  coworking: { category: "💻 Servicios B2B", volumen: "bajo", nombre_idea: "Espacio Coworking Pequeño", sector: "Inmobiliaria", moneda: "S/", capital_disponible: 80500, inversion: { insumos: 1500, equipos: 25000, empaques: 0, permisos: 1800, otros: 15000 }, precio_venta: 600, costo_directo: 60, gastos_fijos: { marketing: 1000, logistica: 300, sueldo_emprendedor: 2500, otros: 8500 }, ventas: { pesimista: 20, base: 28, optimista: 42, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3 },
  consultoria_rh: { category: "💻 Servicios B2B", volumen: "bajo", nombre_idea: "Consultoría de RRHH", sector: "Servicios B2B", moneda: "S/", capital_disponible: 14000, inversion: { insumos: 0, equipos: 4000, empaques: 0, permisos: 400, otros: 1500 }, precio_venta: 1800, costo_directo: 150, gastos_fijos: { marketing: 600, logistica: 100, sueldo_emprendedor: 2500, otros: 700 }, ventas: { pesimista: 3, base: 4, optimista: 6, crecimiento_mensual: 2 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  software_saas: { category: "💻 Servicios B2B", volumen: "medio", nombre_idea: "Plataforma SaaS (Micro)", sector: "Tecnología", moneda: "S/", capital_disponible: 34000, inversion: { insumos: 0, equipos: 12000, empaques: 0, permisos: 700, otros: 5000 }, precio_venta: 150, costo_directo: 25, gastos_fijos: { marketing: 2500, logistica: 100, sueldo_emprendedor: 3000, otros: 2500 }, ventas: { pesimista: 65, base: 95, optimista: 150, crecimiento_mensual: 5 }, regimen_tributario: "MYPE", inflacion_anual: 3 },

  // 💅 SALUD, BIENESTAR Y BELLEZA
  barberia: { category: "💅 Belleza & Salud", volumen: "medio", nombre_idea: "Barbería Clásica", sector: "Belleza", moneda: "S/", capital_disponible: 32500, inversion: { insumos: 1500, equipos: 9000, empaques: 0, permisos: 700, otros: 5000 }, precio_venta: 40, costo_directo: 5, gastos_fijos: { marketing: 600, logistica: 100, sueldo_emprendedor: 1800, otros: 2800 }, ventas: { pesimista: 130, base: 200, optimista: 300, crecimiento_mensual: 1.5 }, regimen_tributario: "NRUS", inflacion_anual: 3 },
  estudio_unas: { category: "💅 Belleza & Salud", volumen: "medio", nombre_idea: "Estudio de Uñas (Nail Bar)", sector: "Belleza", moneda: "S/", capital_disponible: 27500, inversion: { insumos: 3000, equipos: 5000, empaques: 0, permisos: 600, otros: 3500 }, precio_venta: 60, costo_directo: 10, gastos_fijos: { marketing: 600, logistica: 100, sueldo_emprendedor: 1800, otros: 2500 }, ventas: { pesimista: 85, base: 130, optimista: 200, crecimiento_mensual: 2 }, regimen_tributario: "NRUS", inflacion_anual: 3 },
  gimnasio_boutique: { category: "💅 Belleza & Salud", volumen: "medio", nombre_idea: "Gimnasio Funcional", sector: "Salud", moneda: "S/", capital_disponible: 109000, inversion: { insumos: 0, equipos: 50000, empaques: 0, permisos: 1800, otros: 20000 }, precio_venta: 180, costo_directo: 10, gastos_fijos: { marketing: 1500, logistica: 300, sueldo_emprendedor: 2500, otros: 8000 }, ventas: { pesimista: 60, base: 90, optimista: 140, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3 },
  consultorio_psicologico: { category: "💅 Belleza & Salud", volumen: "bajo", nombre_idea: "Consultorio Psicológico Online", sector: "Salud", moneda: "S/", capital_disponible: 11000, inversion: { insumos: 0, equipos: 2500, empaques: 0, permisos: 500, otros: 800 }, precio_venta: 120, costo_directo: 0, gastos_fijos: { marketing: 500, logistica: 100, sueldo_emprendedor: 2500, otros: 500 }, ventas: { pesimista: 26, base: 40, optimista: 60, crecimiento_mensual: 2.5 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  spa_masajes: { category: "💅 Belleza & Salud", volumen: "medio", nombre_idea: "Centro de Masajes y Spa", sector: "Bienestar", moneda: "S/", capital_disponible: 44000, inversion: { insumos: 2500, equipos: 12000, empaques: 0, permisos: 1200, otros: 7000 }, precio_venta: 120, costo_directo: 20, gastos_fijos: { marketing: 900, logistica: 200, sueldo_emprendedor: 2000, otros: 4000 }, ventas: { pesimista: 65, base: 95, optimista: 150, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3 },
  centro_yoga: { category: "💅 Belleza & Salud", volumen: "bajo", nombre_idea: "Estudio de Yoga y Pilates", sector: "Bienestar", moneda: "S/", capital_disponible: 34500, inversion: { insumos: 800, equipos: 6000, empaques: 0, permisos: 800, otros: 8000 }, precio_venta: 180, costo_directo: 10, gastos_fijos: { marketing: 700, logistica: 100, sueldo_emprendedor: 2000, otros: 3500 }, ventas: { pesimista: 30, base: 46, optimista: 70, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3 },
  clinica_dental: { category: "💅 Belleza & Salud", volumen: "medio", nombre_idea: "Consultorio Odontológico", sector: "Salud", moneda: "S/", capital_disponible: 100000, inversion: { insumos: 5000, equipos: 50000, empaques: 0, permisos: 3500, otros: 12000 }, precio_venta: 180, costo_directo: 45, gastos_fijos: { marketing: 1000, logistica: 200, sueldo_emprendedor: 3500, otros: 5000 }, ventas: { pesimista: 65, base: 100, optimista: 150, crecimiento_mensual: 2 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  nutricionista: { category: "💅 Belleza & Salud", volumen: "bajo", nombre_idea: "Asesoría Nutricional Personalizada", sector: "Salud", moneda: "S/", capital_disponible: 11500, inversion: { insumos: 0, equipos: 2500, empaques: 0, permisos: 500, otros: 800 }, precio_venta: 150, costo_directo: 5, gastos_fijos: { marketing: 500, logistica: 100, sueldo_emprendedor: 2500, otros: 600 }, ventas: { pesimista: 24, base: 36, optimista: 55, crecimiento_mensual: 2.5 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  centro_estetica: { category: "💅 Belleza & Salud", volumen: "medio", nombre_idea: "Medicina Estética (Láser/Botox)", sector: "Salud / Belleza", moneda: "S/", capital_disponible: 182000, inversion: { insumos: 10000, equipos: 90000, empaques: 0, permisos: 6000, otros: 25000 }, precio_venta: 650, costo_directo: 180, gastos_fijos: { marketing: 3500, logistica: 500, sueldo_emprendedor: 4000, otros: 9000 }, ventas: { pesimista: 34, base: 50, optimista: 75, crecimiento_mensual: 2 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  maquillaje_domicilio: { category: "💅 Belleza & Salud", volumen: "bajo", nombre_idea: "Maquillaje a Domicilio", sector: "Belleza", moneda: "S/", capital_disponible: 12000, inversion: { insumos: 2500, equipos: 1500, empaques: 0, permisos: 300, otros: 800 }, precio_venta: 200, costo_directo: 35, gastos_fijos: { marketing: 600, logistica: 500, sueldo_emprendedor: 1800, otros: 500 }, ventas: { pesimista: 20, base: 28, optimista: 42, crecimiento_mensual: 3 }, regimen_tributario: "NRUS", inflacion_anual: 3 },

  // 📚 EDUCACIÓN, EVENTOS Y OCIO
  cursos_online: { category: "📚 Educación y Ocio", volumen: "bajo", nombre_idea: "Academia Cursos Pregrabados", sector: "Educación", moneda: "S/", capital_disponible: 19000, inversion: { insumos: 0, equipos: 6000, empaques: 0, permisos: 300, otros: 2500 }, precio_venta: 180, costo_directo: 10, gastos_fijos: { marketing: 1800, logistica: 100, sueldo_emprendedor: 2200, otros: 1000 }, ventas: { pesimista: 28, base: 42, optimista: 65, crecimiento_mensual: 4 }, regimen_tributario: "RER", inflacion_anual: 3 },
  organizacion_bodas: { category: "📚 Educación y Ocio", volumen: "bajo", nombre_idea: "Wedding Planner", sector: "Eventos", moneda: "S/", capital_disponible: 14500, inversion: { insumos: 500, equipos: 3000, empaques: 0, permisos: 500, otros: 1500 }, precio_venta: 5000, costo_directo: 800, gastos_fijos: { marketing: 900, logistica: 300, sueldo_emprendedor: 2500, otros: 800 }, ventas: { pesimista: 2, base: 2, optimista: 3, crecimiento_mensual: 2 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  clases_refuerzo: { category: "📚 Educación y Ocio", volumen: "bajo", nombre_idea: "Centro de Refuerzo Escolar", sector: "Educación", moneda: "S/", capital_disponible: 29000, inversion: { insumos: 800, equipos: 5000, empaques: 0, permisos: 600, otros: 6000 }, precio_venta: 220, costo_directo: 15, gastos_fijos: { marketing: 600, logistica: 100, sueldo_emprendedor: 1800, otros: 3000 }, ventas: { pesimista: 24, base: 34, optimista: 55, crecimiento_mensual: 2 }, regimen_tributario: "NRUS", inflacion_anual: 3 },
  animacion_infantil: { category: "📚 Educación y Ocio", volumen: "bajo", nombre_idea: "Shows y Animación Infantil", sector: "Eventos", moneda: "S/", capital_disponible: 13500, inversion: { insumos: 1500, equipos: 3500, empaques: 0, permisos: 400, otros: 1200 }, precio_venta: 600, costo_directo: 120, gastos_fijos: { marketing: 700, logistica: 300, sueldo_emprendedor: 1800, otros: 600 }, ventas: { pesimista: 7, base: 10, optimista: 16, crecimiento_mensual: 2 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  agencia_turismo: { category: "📚 Educación y Ocio", volumen: "bajo", nombre_idea: "Agencia de Viajes y Tours", sector: "Turismo", moneda: "S/", capital_disponible: 29500, inversion: { insumos: 0, equipos: 8000, empaques: 0, permisos: 3500, otros: 5000 }, precio_venta: 2200, costo_directo: 1600, gastos_fijos: { marketing: 1800, logistica: 500, sueldo_emprendedor: 2500, otros: 1500 }, ventas: { pesimista: 12, base: 16, optimista: 24, crecimiento_mensual: 2.5 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  alquiler_canchas: { category: "📚 Educación y Ocio", volumen: "medio", nombre_idea: "Alquiler de Canchas Sintéticas", sector: "Deportes", moneda: "S/", capital_disponible: 141000, inversion: { insumos: 1000, equipos: 65000, empaques: 0, permisos: 4000, otros: 30000 }, precio_venta: 100, costo_directo: 10, gastos_fijos: { marketing: 800, logistica: 300, sueldo_emprendedor: 2500, otros: 10000 }, ventas: { pesimista: 130, base: 190, optimista: 290, crecimiento_mensual: 1.5 }, regimen_tributario: "RER", inflacion_anual: 3 },
  productora_eventos: { category: "📚 Educación y Ocio", volumen: "medio", nombre_idea: "Productora de Conciertos", sector: "Eventos", moneda: "S/", capital_disponible: 72500, inversion: { insumos: 3000, equipos: 20000, empaques: 0, permisos: 5000, otros: 10000 }, precio_venta: 100, costo_directo: 45, gastos_fijos: { marketing: 3000, logistica: 2000, sueldo_emprendedor: 2500, otros: 4000 }, ventas: { pesimista: 180, base: 270, optimista: 410, crecimiento_mensual: 2 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  academia_baile: { category: "📚 Educación y Ocio", volumen: "bajo", nombre_idea: "Academia de Baile", sector: "Educación", moneda: "S/", capital_disponible: 40500, inversion: { insumos: 800, equipos: 8000, empaques: 0, permisos: 900, otros: 10000 }, precio_venta: 180, costo_directo: 5, gastos_fijos: { marketing: 700, logistica: 100, sueldo_emprendedor: 2000, otros: 4000 }, ventas: { pesimista: 32, base: 48, optimista: 75, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3 },
  tutorias_idiomas: { category: "📚 Educación y Ocio", volumen: "medio", nombre_idea: "Enseñanza de Idiomas Online", sector: "Educación", moneda: "S/", capital_disponible: 11000, inversion: { insumos: 0, equipos: 3000, empaques: 0, permisos: 300, otros: 800 }, precio_venta: 45, costo_directo: 0, gastos_fijos: { marketing: 500, logistica: 100, sueldo_emprendedor: 2200, otros: 500 }, ventas: { pesimista: 65, base: 100, optimista: 150, crecimiento_mensual: 2.5 }, regimen_tributario: "NRUS", inflacion_anual: 3 },
  estudio_musica: { category: "📚 Educación y Ocio", volumen: "medio", nombre_idea: "Estudio de Grabación Musical", sector: "Arte", moneda: "S/", capital_disponible: 50500, inversion: { insumos: 500, equipos: 25000, empaques: 0, permisos: 700, otros: 6000 }, precio_venta: 120, costo_directo: 10, gastos_fijos: { marketing: 800, logistica: 100, sueldo_emprendedor: 2200, otros: 3000 }, ventas: { pesimista: 46, base: 70, optimista: 110, crecimiento_mensual: 1.5 }, regimen_tributario: "RER", inflacion_anual: 3 },

  // 🛡️ SERVICIOS POLICIALES Y SEGURIDAD
  pnp_tactico: { category: "🛡️ Seguridad PNP", volumen: "medio", nombre_idea: "Ropa Militar PNP", sector: "Textil", moneda: "S/", capital_disponible: 36500, inversion: { insumos: 8000, equipos: 10000, empaques: 800, permisos: 800, otros: 2500 }, precio_venta: 110, costo_directo: 55, gastos_fijos: { marketing: 700, logistica: 400, sueldo_emprendedor: 1800, otros: 1800 }, ventas: { pesimista: 80, base: 120, optimista: 180, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3 },
  copias_comisaria: { category: "🛡️ Seguridad PNP", volumen: "alto", nombre_idea: "Centro Trámites y Copias", sector: "Servicios", moneda: "S/", capital_disponible: 25000, inversion: { insumos: 2000, equipos: 7000, empaques: 0, permisos: 700, otros: 3000 }, precio_venta: 3, costo_directo: 0.7, gastos_fijos: { marketing: 200, logistica: 100, sueldo_emprendedor: 1500, otros: 2200 }, ventas: { pesimista: 1400, base: 2100, optimista: 3200, crecimiento_mensual: 1 }, regimen_tributario: "NRUS", inflacion_anual: 3 },
  pnp_academia: { category: "🛡️ Seguridad PNP", volumen: "bajo", nombre_idea: "Academia Asimilación PNP", sector: "Educación", moneda: "S/", capital_disponible: 46000, inversion: { insumos: 1500, equipos: 8000, empaques: 0, permisos: 1200, otros: 10000 }, precio_venta: 300, costo_directo: 25, gastos_fijos: { marketing: 1200, logistica: 200, sueldo_emprendedor: 2500, otros: 4500 }, ventas: { pesimista: 26, base: 40, optimista: 60, crecimiento_mensual: 3 }, regimen_tributario: "RER", inflacion_anual: 3 },
  equipamiento_pnp: { category: "🛡️ Seguridad PNP", volumen: "medio", nombre_idea: "Venta Equipamiento Táctico", sector: "Retail", moneda: "S/", capital_disponible: 40500, inversion: { insumos: 18000, equipos: 3000, empaques: 1000, permisos: 800, otros: 3000 }, precio_venta: 160, costo_directo: 95, gastos_fijos: { marketing: 700, logistica: 500, sueldo_emprendedor: 1800, otros: 1800 }, ventas: { pesimista: 65, base: 100, optimista: 150, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3 },
  sastreria_pnp: { category: "🛡️ Seguridad PNP", volumen: "medio", nombre_idea: "Sastrería Uniformes PNP", sector: "Textil", moneda: "S/", capital_disponible: 31500, inversion: { insumos: 4000, equipos: 9000, empaques: 500, permisos: 700, otros: 3000 }, precio_venta: 180, costo_directo: 70, gastos_fijos: { marketing: 500, logistica: 200, sueldo_emprendedor: 1800, otros: 2200 }, ventas: { pesimista: 40, base: 60, optimista: 90, crecimiento_mensual: 1.5 }, regimen_tributario: "RER", inflacion_anual: 3 },
  resguardo: { category: "🛡️ Seguridad PNP", volumen: "bajo", nombre_idea: "Seguridad Privada / VIP", sector: "Servicios", moneda: "S/", capital_disponible: 48000, inversion: { insumos: 4000, equipos: 12000, empaques: 0, permisos: 8000, otros: 5000 }, precio_venta: 6000, costo_directo: 3500, gastos_fijos: { marketing: 800, logistica: 500, sueldo_emprendedor: 2500, otros: 2500 }, ventas: { pesimista: 3, base: 4, optimista: 6, crecimiento_mensual: 1 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  cctv: { category: "🛡️ Seguridad PNP", volumen: "bajo", nombre_idea: "Instalación de CCTV", sector: "Tecnología", moneda: "S/", capital_disponible: 27000, inversion: { insumos: 6000, equipos: 5000, empaques: 0, permisos: 800, otros: 2500 }, precio_venta: 1800, costo_directo: 950, gastos_fijos: { marketing: 600, logistica: 400, sueldo_emprendedor: 2200, otros: 900 }, ventas: { pesimista: 6, base: 8, optimista: 12, crecimiento_mensual: 2 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  poligono: { category: "🛡️ Seguridad PNP", volumen: "medio", nombre_idea: "Polígono Tiro Virtual", sector: "Entrenamiento", moneda: "S/", capital_disponible: 111000, inversion: { insumos: 1500, equipos: 50000, empaques: 0, permisos: 6000, otros: 20000 }, precio_venta: 80, costo_directo: 8, gastos_fijos: { marketing: 1200, logistica: 200, sueldo_emprendedor: 2500, otros: 7000 }, ventas: { pesimista: 130, base: 190, optimista: 290, crecimiento_mensual: 2 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  asesoria_legal: { category: "🛡️ Seguridad PNP", volumen: "bajo", nombre_idea: "Asesoría Legal Policial", sector: "Servicios Legales", moneda: "S/", capital_disponible: 15000, inversion: { insumos: 300, equipos: 3500, empaques: 0, permisos: 600, otros: 1500 }, precio_venta: 400, costo_directo: 20, gastos_fijos: { marketing: 600, logistica: 100, sueldo_emprendedor: 3000, otros: 800 }, ventas: { pesimista: 12, base: 18, optimista: 28, crecimiento_mensual: 2 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  centro_medico: { category: "🛡️ Seguridad PNP", volumen: "medio", nombre_idea: "Exámenes Psicosomáticos", sector: "Salud", moneda: "S/", capital_disponible: 163000, inversion: { insumos: 8000, equipos: 70000, empaques: 0, permisos: 10000, otros: 25000 }, precio_venta: 150, costo_directo: 35, gastos_fijos: { marketing: 2000, logistica: 500, sueldo_emprendedor: 4000, otros: 10000 }, ventas: { pesimista: 130, base: 200, optimista: 300, crecimiento_mensual: 1.5 }, regimen_tributario: "MYPE", inflacion_anual: 3 },

  // 📡 TECNOLOGÍA, IA Y SUSCRIPCIONES
  tv_digital: { category: "📡 Tecnología", volumen: "medio", nombre_idea: "Tv Digital / Streaming", sector: "Entretenimiento", moneda: "S/", capital_disponible: 11500, inversion: { insumos: 2000, equipos: 1500, empaques: 0, permisos: 300, otros: 1500 }, precio_venta: 35, costo_directo: 18, gastos_fijos: { marketing: 500, logistica: 100, sueldo_emprendedor: 1800, otros: 600 }, ventas: { pesimista: 150, base: 230, optimista: 350, crecimiento_mensual: 3 }, regimen_tributario: "NRUS", inflacion_anual: 3 },
  bots_wsp: { category: "📡 Tecnología", volumen: "bajo", nombre_idea: "Bots de WhatsApp Pymes", sector: "Tecnología", moneda: "S/", capital_disponible: 15500, inversion: { insumos: 500, equipos: 5000, empaques: 0, permisos: 300, otros: 1500 }, precio_venta: 900, costo_directo: 150, gastos_fijos: { marketing: 700, logistica: 100, sueldo_emprendedor: 2500, otros: 800 }, ventas: { pesimista: 6, base: 8, optimista: 12, crecimiento_mensual: 3 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  dashboards: { category: "📡 Tecnología", volumen: "bajo", nombre_idea: "Dashboards y BI Pymes", sector: "Software", moneda: "S/", capital_disponible: 14000, inversion: { insumos: 0, equipos: 4500, empaques: 0, permisos: 300, otros: 1200 }, precio_venta: 1800, costo_directo: 100, gastos_fijos: { marketing: 600, logistica: 100, sueldo_emprendedor: 2500, otros: 700 }, ventas: { pesimista: 3, base: 4, optimista: 6, crecimiento_mensual: 2.5 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  agencia_ia: { category: "📡 Tecnología", volumen: "bajo", nombre_idea: "Agencia IA para Negocios", sector: "Consultoría", moneda: "S/", capital_disponible: 24500, inversion: { insumos: 1000, equipos: 8000, empaques: 0, permisos: 500, otros: 3000 }, precio_venta: 3500, costo_directo: 500, gastos_fijos: { marketing: 1200, logistica: 100, sueldo_emprendedor: 3000, otros: 1500 }, ventas: { pesimista: 2, base: 3, optimista: 5, crecimiento_mensual: 3 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  smartwatches: { category: "📡 Tecnología", volumen: "medio", nombre_idea: "Venta de Smartwatches", sector: "Retail Tech", moneda: "S/", capital_disponible: 26000, inversion: { insumos: 12000, equipos: 2500, empaques: 600, permisos: 500, otros: 2000 }, precio_venta: 180, costo_directo: 100, gastos_fijos: { marketing: 900, logistica: 500, sueldo_emprendedor: 1800, otros: 900 }, ventas: { pesimista: 46, base: 70, optimista: 110, crecimiento_mensual: 2.5 }, regimen_tributario: "RER", inflacion_anual: 3 },
  crm: { category: "📡 Tecnología", volumen: "medio", nombre_idea: "SaaS CRM para Ventas", sector: "Software", moneda: "S/", capital_disponible: 40500, inversion: { insumos: 1500, equipos: 15000, empaques: 0, permisos: 700, otros: 6000 }, precio_venta: 220, costo_directo: 25, gastos_fijos: { marketing: 2500, logistica: 100, sueldo_emprendedor: 3000, otros: 3000 }, ventas: { pesimista: 44, base: 65, optimista: 100, crecimiento_mensual: 4 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  iptv_b2b: { category: "📡 Tecnología", volumen: "bajo", nombre_idea: "Tv Digital B2B (Hoteles)", sector: "Servicios", moneda: "S/", capital_disponible: 19500, inversion: { insumos: 4000, equipos: 3000, empaques: 0, permisos: 500, otros: 3000 }, precio_venta: 800, costo_directo: 280, gastos_fijos: { marketing: 700, logistica: 300, sueldo_emprendedor: 2500, otros: 1000 }, ventas: { pesimista: 10, base: 14, optimista: 22, crecimiento_mensual: 2 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  flyers: { category: "📡 Tecnología", volumen: "bajo", nombre_idea: "Diseño Gráfico Exprés", sector: "Diseño", moneda: "S/", capital_disponible: 11000, inversion: { insumos: 500, equipos: 3500, empaques: 0, permisos: 250, otros: 800 }, precio_venta: 90, costo_directo: 5, gastos_fijos: { marketing: 500, logistica: 100, sueldo_emprendedor: 1800, otros: 500 }, ventas: { pesimista: 30, base: 44, optimista: 70, crecimiento_mensual: 2.5 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  funnels: { category: "📡 Tecnología", volumen: "bajo", nombre_idea: "Creador Embudos de Venta", sector: "Marketing", moneda: "S/", capital_disponible: 17000, inversion: { insumos: 500, equipos: 6000, empaques: 0, permisos: 300, otros: 1500 }, precio_venta: 1800, costo_directo: 150, gastos_fijos: { marketing: 800, logistica: 100, sueldo_emprendedor: 2500, otros: 800 }, ventas: { pesimista: 3, base: 4, optimista: 6, crecimiento_mensual: 3 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  hosting: { category: "📡 Tecnología", volumen: "bajo", nombre_idea: "Venta Hosting y Dominios", sector: "Tecnología", moneda: "S/", capital_disponible: 20500, inversion: { insumos: 2500, equipos: 4000, empaques: 0, permisos: 500, otros: 4500 }, precio_venta: 250, costo_directo: 100, gastos_fijos: { marketing: 1000, logistica: 100, sueldo_emprendedor: 2200, otros: 1200 }, ventas: { pesimista: 30, base: 46, optimista: 70, crecimiento_mensual: 3 }, regimen_tributario: "MYPE", inflacion_anual: 3 },

  // 🚗 TRANSPORTE Y LOGÍSTICA
  taxis: { category: "🚗 Transporte", volumen: "alto", nombre_idea: "Flota de Taxis / App", sector: "Transporte", moneda: "S/", capital_disponible: 135000, inversion: { insumos: 2000, equipos: 90000, empaques: 0, permisos: 5000, otros: 8000 }, precio_venta: 18, costo_directo: 7, gastos_fijos: { marketing: 1000, logistica: 800, sueldo_emprendedor: 2000, otros: 6000 }, ventas: { pesimista: 750, base: 1100, optimista: 1650, crecimiento_mensual: 1 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  motos_delivery: { category: "🚗 Transporte", volumen: "medio", nombre_idea: "Alquiler Motos Delivery", sector: "Transporte", moneda: "S/", capital_disponible: 93500, inversion: { insumos: 2000, equipos: 62000, empaques: 0, permisos: 3000, otros: 6000 }, precio_venta: 40, costo_directo: 7, gastos_fijos: { marketing: 500, logistica: 800, sueldo_emprendedor: 2000, otros: 3500 }, ventas: { pesimista: 160, base: 240, optimista: 360, crecimiento_mensual: 1.5 }, regimen_tributario: "RER", inflacion_anual: 3 },
  taller: { category: "🚗 Transporte", volumen: "medio", nombre_idea: "Taller Mecánico Rápido", sector: "Automotriz", moneda: "S/", capital_disponible: 69500, inversion: { insumos: 6000, equipos: 25000, empaques: 0, permisos: 2500, otros: 12000 }, precio_venta: 220, costo_directo: 80, gastos_fijos: { marketing: 800, logistica: 400, sueldo_emprendedor: 2200, otros: 4500 }, ventas: { pesimista: 50, base: 75, optimista: 120, crecimiento_mensual: 1.5 }, regimen_tributario: "RER", inflacion_anual: 3 },
  carwash: { category: "🚗 Transporte", volumen: "medio", nombre_idea: "Car Wash a Domicilio", sector: "Servicios", moneda: "S/", capital_disponible: 27500, inversion: { insumos: 3000, equipos: 8000, empaques: 0, permisos: 500, otros: 3000 }, precio_venta: 40, costo_directo: 8, gastos_fijos: { marketing: 600, logistica: 900, sueldo_emprendedor: 1800, otros: 1000 }, ventas: { pesimista: 120, base: 170, optimista: 260, crecimiento_mensual: 2 }, regimen_tributario: "NRUS", inflacion_anual: 3 },
  mudanzas: { category: "🚗 Transporte", volumen: "bajo", nombre_idea: "Empresa de Mudanzas", sector: "Logística", moneda: "S/", capital_disponible: 106000, inversion: { insumos: 2000, equipos: 70000, empaques: 1000, permisos: 2500, otros: 6000 }, precio_venta: 550, costo_directo: 180, gastos_fijos: { marketing: 800, logistica: 1500, sueldo_emprendedor: 2200, otros: 3500 }, ventas: { pesimista: 20, base: 28, optimista: 42, crecimiento_mensual: 1.5 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  grua: { category: "🚗 Transporte", volumen: "medio", nombre_idea: "Auxilio Mecánico y Grúa", sector: "Transporte", moneda: "S/", capital_disponible: 195000, inversion: { insumos: 2000, equipos: 140000, empaques: 0, permisos: 4000, otros: 10000 }, precio_venta: 350, costo_directo: 100, gastos_fijos: { marketing: 1200, logistica: 2500, sueldo_emprendedor: 2500, otros: 6500 }, ventas: { pesimista: 44, base: 65, optimista: 100, crecimiento_mensual: 1 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  repuestos: { category: "🚗 Transporte", volumen: "medio", nombre_idea: "Repuestos Automotrices", sector: "Retail", moneda: "S/", capital_disponible: 51500, inversion: { insumos: 20000, equipos: 5000, empaques: 1000, permisos: 1200, otros: 6000 }, precio_venta: 160, costo_directo: 95, gastos_fijos: { marketing: 600, logistica: 700, sueldo_emprendedor: 1800, otros: 3000 }, ventas: { pesimista: 80, base: 120, optimista: 180, crecimiento_mensual: 1.5 }, regimen_tributario: "RER", inflacion_anual: 3 },
  rent_a_car: { category: "🚗 Transporte", volumen: "medio", nombre_idea: "Rent a Car Turístico", sector: "Transporte", moneda: "S/", capital_disponible: 213000, inversion: { insumos: 2000, equipos: 160000, empaques: 0, permisos: 5000, otros: 10000 }, precio_venta: 200, costo_directo: 50, gastos_fijos: { marketing: 1200, logistica: 1500, sueldo_emprendedor: 2200, otros: 7000 }, ventas: { pesimista: 65, base: 95, optimista: 150, crecimiento_mensual: 1 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  minivans: { category: "🚗 Transporte", volumen: "bajo", nombre_idea: "Transporte Privado Minivans", sector: "Transporte", moneda: "S/", capital_disponible: 119000, inversion: { insumos: 1500, equipos: 85000, empaques: 0, permisos: 3000, otros: 6000 }, precio_venta: 450, costo_directo: 160, gastos_fijos: { marketing: 800, logistica: 1200, sueldo_emprendedor: 2200, otros: 3500 }, ventas: { pesimista: 24, base: 34, optimista: 55, crecimiento_mensual: 1 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  courier: { category: "🚗 Transporte", volumen: "alto", nombre_idea: "Envíos Express Última Milla", sector: "Logística", moneda: "S/", capital_disponible: 66500, inversion: { insumos: 2000, equipos: 32000, empaques: 1500, permisos: 2500, otros: 5000 }, precio_venta: 15, costo_directo: 6, gastos_fijos: { marketing: 800, logistica: 1800, sueldo_emprendedor: 2200, otros: 3000 }, ventas: { pesimista: 650, base: 1000, optimista: 1500, crecimiento_mensual: 2 }, regimen_tributario: "MYPE", inflacion_anual: 3 },

  // 🛠️ MANTENIMIENTO Y OFICIOS
  limpieza: { category: "🛠️ Mantenimiento", volumen: "medio", nombre_idea: "Limpieza Especializada", sector: "Servicios", moneda: "S/", capital_disponible: 17500, inversion: { insumos: 2500, equipos: 5000, empaques: 0, permisos: 500, otros: 1800 }, precio_venta: 120, costo_directo: 25, gastos_fijos: { marketing: 600, logistica: 500, sueldo_emprendedor: 1800, otros: 800 }, ventas: { pesimista: 36, base: 55, optimista: 85, crecimiento_mensual: 2 }, regimen_tributario: "NRUS", inflacion_anual: 3 },
  aire_acondicionado: { category: "🛠️ Mantenimiento", volumen: "bajo", nombre_idea: "Instalación Aire Acondic.", sector: "Mantenimiento", moneda: "S/", capital_disponible: 26000, inversion: { insumos: 3500, equipos: 6000, empaques: 0, permisos: 700, otros: 2500 }, precio_venta: 180, costo_directo: 45, gastos_fijos: { marketing: 600, logistica: 600, sueldo_emprendedor: 2200, otros: 900 }, ventas: { pesimista: 28, base: 42, optimista: 65, crecimiento_mensual: 1.5 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  gasfiteria: { category: "🛠️ Mantenimiento", volumen: "medio", nombre_idea: "Gasfitería y Servicios", sector: "Mantenimiento", moneda: "S/", capital_disponible: 14000, inversion: { insumos: 2000, equipos: 3500, empaques: 0, permisos: 400, otros: 1200 }, precio_venta: 100, costo_directo: 20, gastos_fijos: { marketing: 400, logistica: 500, sueldo_emprendedor: 1800, otros: 600 }, ventas: { pesimista: 36, base: 55, optimista: 85, crecimiento_mensual: 1.5 }, regimen_tributario: "NRUS", inflacion_anual: 3 },
  electrico: { category: "🛠️ Mantenimiento", volumen: "bajo", nombre_idea: "Servicio Eléctrico Residen.", sector: "Mantenimiento", moneda: "S/", capital_disponible: 17000, inversion: { insumos: 2500, equipos: 4500, empaques: 0, permisos: 500, otros: 1800 }, precio_venta: 140, costo_directo: 35, gastos_fijos: { marketing: 500, logistica: 500, sueldo_emprendedor: 2000, otros: 700 }, ventas: { pesimista: 32, base: 48, optimista: 75, crecimiento_mensual: 1.5 }, regimen_tributario: "NRUS", inflacion_anual: 3 },
  pintura: { category: "🛠️ Mantenimiento", volumen: "bajo", nombre_idea: "Pintura y Remodelación", sector: "Construcción", moneda: "S/", capital_disponible: 26000, inversion: { insumos: 5000, equipos: 4000, empaques: 0, permisos: 600, otros: 2500 }, precio_venta: 1200, costo_directo: 500, gastos_fijos: { marketing: 600, logistica: 800, sueldo_emprendedor: 2200, otros: 1000 }, ventas: { pesimista: 6, base: 9, optimista: 14, crecimiento_mensual: 1 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  jardineria: { category: "🛠️ Mantenimiento", volumen: "bajo", nombre_idea: "Jardinería y Paisajismo", sector: "Servicios", moneda: "S/", capital_disponible: 19000, inversion: { insumos: 2500, equipos: 6000, empaques: 0, permisos: 500, otros: 2000 }, precio_venta: 180, costo_directo: 45, gastos_fijos: { marketing: 500, logistica: 700, sueldo_emprendedor: 1800, otros: 800 }, ventas: { pesimista: 26, base: 38, optimista: 60, crecimiento_mensual: 1.5 }, regimen_tributario: "NRUS", inflacion_anual: 3 },
  fumigacion: { category: "🛠️ Mantenimiento", volumen: "bajo", nombre_idea: "Fumigación y Plagas", sector: "Servicios", moneda: "S/", capital_disponible: 25000, inversion: { insumos: 3500, equipos: 5000, empaques: 0, permisos: 1200, otros: 2000 }, precio_venta: 250, costo_directo: 60, gastos_fijos: { marketing: 700, logistica: 700, sueldo_emprendedor: 2200, otros: 800 }, ventas: { pesimista: 22, base: 32, optimista: 48, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3 },
  melamina: { category: "🛠️ Mantenimiento", volumen: "bajo", nombre_idea: "Muebles de Melamina", sector: "Carpintería", moneda: "S/", capital_disponible: 35500, inversion: { insumos: 8000, equipos: 8000, empaques: 500, permisos: 600, otros: 3000 }, precio_venta: 1000, costo_directo: 450, gastos_fijos: { marketing: 700, logistica: 900, sueldo_emprendedor: 2200, otros: 1200 }, ventas: { pesimista: 10, base: 14, optimista: 22, crecimiento_mensual: 1.5 }, regimen_tributario: "RER", inflacion_anual: 3 },
  electrodomesticos: { category: "🛠️ Mantenimiento", volumen: "bajo", nombre_idea: "Reparación Electrodomést.", sector: "Mantenimiento", moneda: "S/", capital_disponible: 15500, inversion: { insumos: 2000, equipos: 4000, empaques: 0, permisos: 400, otros: 1500 }, precio_venta: 140, costo_directo: 35, gastos_fijos: { marketing: 500, logistica: 600, sueldo_emprendedor: 2000, otros: 700 }, ventas: { pesimista: 32, base: 48, optimista: 75, crecimiento_mensual: 1.5 }, regimen_tributario: "NRUS", inflacion_anual: 3 },
  drywall: { category: "🛠️ Mantenimiento", volumen: "bajo", nombre_idea: "Instalación Drywall", sector: "Construcción", moneda: "S/", capital_disponible: 29000, inversion: { insumos: 6000, equipos: 5000, empaques: 0, permisos: 600, otros: 3000 }, precio_venta: 1500, costo_directo: 700, gastos_fijos: { marketing: 700, logistica: 900, sueldo_emprendedor: 2200, otros: 1000 }, ventas: { pesimista: 6, base: 9, optimista: 14, crecimiento_mensual: 1 }, regimen_tributario: "MYPE", inflacion_anual: 3 },

  // 🎨 PASATIEMPOS Y MASCOTAS
  tatuajes: { category: "🎨 Pasatiempos", volumen: "bajo", nombre_idea: "Estudio de Tatuajes", sector: "Arte / Belleza", moneda: "S/", capital_disponible: 33500, inversion: { insumos: 3000, equipos: 7000, empaques: 800, permisos: 1200, otros: 4000 }, precio_venta: 250, costo_directo: 35, gastos_fijos: { marketing: 700, logistica: 100, sueldo_emprendedor: 2200, otros: 2800 }, ventas: { pesimista: 24, base: 36, optimista: 55, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3 },
  pingpong: { category: "🎨 Pasatiempos", volumen: "medio", nombre_idea: "Academia Tenis de Mesa", sector: "Deportes", moneda: "S/", capital_disponible: 50000, inversion: { insumos: 1000, equipos: 12000, empaques: 0, permisos: 1200, otros: 12000 }, precio_venta: 150, costo_directo: 5, gastos_fijos: { marketing: 700, logistica: 100, sueldo_emprendedor: 2000, otros: 5000 }, ventas: { pesimista: 46, base: 70, optimista: 110, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3 },
  vet_movil: { category: "🎨 Pasatiempos", volumen: "medio", nombre_idea: "Veterinaria Móvil", sector: "Salud Animal", moneda: "S/", capital_disponible: 129000, inversion: { insumos: 7000, equipos: 80000, empaques: 500, permisos: 3000, otros: 8000 }, precio_venta: 120, costo_directo: 30, gastos_fijos: { marketing: 800, logistica: 1800, sueldo_emprendedor: 3000, otros: 4500 }, ventas: { pesimista: 100, base: 150, optimista: 230, crecimiento_mensual: 1.5 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  guarderia: { category: "🎨 Pasatiempos", volumen: "medio", nombre_idea: "Guardería Mascotas", sector: "Mascotas", moneda: "S/", capital_disponible: 58000, inversion: { insumos: 3000, equipos: 15000, empaques: 0, permisos: 1800, otros: 12000 }, precio_venta: 50, costo_directo: 10, gastos_fijos: { marketing: 800, logistica: 300, sueldo_emprendedor: 2000, otros: 5500 }, ventas: { pesimista: 190, base: 280, optimista: 420, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3 },
  artes_marciales: { category: "🎨 Pasatiempos", volumen: "medio", nombre_idea: "Artes Marciales", sector: "Deportes", moneda: "S/", capital_disponible: 53500, inversion: { insumos: 1000, equipos: 15000, empaques: 0, permisos: 1200, otros: 12000 }, precio_venta: 160, costo_directo: 5, gastos_fijos: { marketing: 700, logistica: 100, sueldo_emprendedor: 2200, otros: 5000 }, ventas: { pesimista: 44, base: 65, optimista: 100, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3 },
  torneos: { category: "🎨 Pasatiempos", volumen: "medio", nombre_idea: "Torneos Deportivos", sector: "Eventos", moneda: "S/", capital_disponible: 31000, inversion: { insumos: 4000, equipos: 6000, empaques: 0, permisos: 1500, otros: 3500 }, precio_venta: 150, costo_directo: 50, gastos_fijos: { marketing: 1000, logistica: 800, sueldo_emprendedor: 2200, otros: 1200 }, ventas: { pesimista: 46, base: 70, optimista: 110, crecimiento_mensual: 1.5 }, regimen_tributario: "MYPE", inflacion_anual: 3 },
  barberia_movil: { category: "🎨 Pasatiempos", volumen: "medio", nombre_idea: "Barbería Móvil", sector: "Belleza", moneda: "S/", capital_disponible: 100000, inversion: { insumos: 2000, equipos: 65000, empaques: 0, permisos: 3000, otros: 8000 }, precio_venta: 55, costo_directo: 7, gastos_fijos: { marketing: 800, logistica: 1400, sueldo_emprendedor: 2000, otros: 3000 }, ventas: { pesimista: 130, base: 190, optimista: 290, crecimiento_mensual: 1.5 }, regimen_tributario: "RER", inflacion_anual: 3 },
  cerveza: { category: "🎨 Pasatiempos", volumen: "alto", nombre_idea: "Cerveza Artesanal", sector: "Alimentos", moneda: "S/", capital_disponible: 70500, inversion: { insumos: 8000, equipos: 25000, empaques: 5000, permisos: 2500, otros: 7000 }, precio_venta: 16, costo_directo: 6, gastos_fijos: { marketing: 1200, logistica: 1200, sueldo_emprendedor: 2200, otros: 3000 }, ventas: { pesimista: 650, base: 950, optimista: 1450, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3 },
  coleccionables: { category: "🎨 Pasatiempos", volumen: "medio", nombre_idea: "Juegos de Mesa y Hobbie", sector: "Retail", moneda: "S/", capital_disponible: 42500, inversion: { insumos: 15000, equipos: 3000, empaques: 800, permisos: 800, otros: 6000 }, precio_venta: 150, costo_directo: 85, gastos_fijos: { marketing: 800, logistica: 500, sueldo_emprendedor: 1800, otros: 2500 }, ventas: { pesimista: 80, base: 120, optimista: 180, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3 },
  spa_mascotas: { category: "🎨 Pasatiempos", volumen: "medio", nombre_idea: "Peluquería Canina", sector: "Mascotas", moneda: "S/", capital_disponible: 40000, inversion: { insumos: 3000, equipos: 10000, empaques: 500, permisos: 1000, otros: 6000 }, precio_venta: 70, costo_directo: 12, gastos_fijos: { marketing: 700, logistica: 200, sueldo_emprendedor: 2000, otros: 3500 }, ventas: { pesimista: 100, base: 150, optimista: 230, crecimiento_mensual: 2 }, regimen_tributario: "RER", inflacion_anual: 3 },
};

const CATEGORIAS_ITEMS = ["Insumos", "Equipos", "Proveedores", "Personal", "Marketing", "Otros"];

type ProyectoGuardado = {
  id: string;
  user_id: string | null;
  project_name: string;
  inputs: any;
  financial_results: any;
  monte_carlo_results?: any;
  llm_analysis?: any;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState('simulador');
  const [darkMode, setDarkMode] = useState(false);
  // --- SUPABASE AUTH + MIS PROYECTOS ---
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  const [proyectos, setProyectos] = useState<ProyectoGuardado[]>([]);
  const [proyectosLoading, setProyectosLoading] = useState(false);
  const [proyectoActualId, setProyectoActualId] = useState<string | null>(null);
  const [guardandoProyecto, setGuardandoProyecto] = useState(false);
  const [mensajeProyecto, setMensajeProyecto] = useState('');

  // --- COMPARADOR + RANKING DE PROYECTOS ---
  const [proyectosSeleccionadosIds, setProyectosSeleccionadosIds] = useState<string[]>([]);
  const [comparadorAbierto, setComparadorAbierto] = useState(false);
  const [rankingAbierto, setRankingAbierto] = useState(false);

  // --- RECÁLCULO SEGURO CON MOTOR V3.4 ---
  const [recalculandoId, setRecalculandoId] = useState<string | null>(null);
  const [guardandoRecalculo, setGuardandoRecalculo] = useState(false);
  const [filtroSaneamiento, setFiltroSaneamiento] = useState<'todos' | 'v34' | 'listos' | 'incompletos'>('todos');
  const [recalculoPreview, setRecalculoPreview] = useState<{
    proyecto: ProyectoGuardado;
    resultado: any;
    inputsNormalizados: any;
  } | null>(null);
  
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

  const cargarProyectos = async (userId?: string) => {
    const idUsuario = userId || authUser?.id;

    if (!idUsuario) {
      setProyectos([]);
      return;
    }

    setProyectosLoading(true);
    setMensajeProyecto('');

    const { data, error } = await supabase
      .from('simulations')
      .select('id,user_id,project_name,inputs,financial_results,monte_carlo_results,llm_analysis,status,created_at,updated_at')
      .eq('user_id', idUsuario)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error(error);
      setMensajeProyecto(`No se pudieron cargar tus proyectos: ${error.message}`);
      setProyectos([]);
    } else {
      setProyectos((data || []) as ProyectoGuardado[]);
    }

    setProyectosLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAuthUser(data.session?.user ?? null);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authUser) {
      cargarProyectos(authUser.id);
    } else {
      setProyectos([]);
      setProyectoActualId(null);
      setProyectosSeleccionadosIds([]);
      setComparadorAbierto(false);
      setRankingAbierto(false);
    }
  }, [authUser?.id]);

  useEffect(() => {
    setProyectosSeleccionadosIds((actuales) =>
      actuales.filter((id) => proyectos.some((proyecto) => proyecto.id === id))
    );
  }, [proyectos]);

  const autenticar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authEmail.trim()) {
      setAuthMessage('Escribe tu correo.');
      return;
    }

    if (authPassword.length < 6) {
      setAuthMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setAuthLoading(true);
    setAuthMessage('');

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });

        if (error) throw error;

        setAuthMessage('Sesión iniciada correctamente.');
        setShowAuth(false);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
        });

        if (error) throw error;

        if (data.session) {
          setAuthMessage('Cuenta creada y sesión iniciada.');
          setShowAuth(false);
        } else {
          setAuthMessage('Cuenta creada. Revisa tu correo para confirmar el acceso.');
        }
      }
    } catch (error: any) {
      setAuthMessage(error?.message || 'No se pudo completar el acceso.');
    } finally {
      setAuthLoading(false);
    }
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    setActiveTab('simulador');
    setMensajeProyecto('');
    setConsejoIA('');
    setRecalculoPreview(null);
    setRecalculandoId(null);
  };

  const construirInputsGuardados = () => ({
    ...formData,
    inversion_dinamica: invItems,
    gastos_dinamicos: gastoItems,
    _frontend_schema_version: 2,
    _motor_version: '3.4',
  });

  const guardarProyecto = async (forzarNuevo = false) => {
    if (!authUser) {
      setAuthMode('login');
      setAuthMessage('Inicia sesión para guardar el proyecto.');
      setShowAuth(true);
      return;
    }

    if (!res?.metricas) {
      alert('Primero genera la simulación.');
      return;
    }

    const nombreProyecto = (formData.nombre_idea || 'Proyecto sin nombre').trim();
    const ahora = new Date().toISOString();

    const registro = {
      user_id: authUser.id,
      project_name: nombreProyecto,
      inputs: construirInputsGuardados(),
      financial_results: res,
      monte_carlo_results: res?.monte_carlo_results ?? null,
      llm_analysis: consejoIA
        ? { rol: activeRol || 'general', contenido: consejoIA, updated_at: ahora }
        : null,
      status: 'completed',
      updated_at: ahora,
    };

    setGuardandoProyecto(true);
    setMensajeProyecto('');

    try {
      if (proyectoActualId && !forzarNuevo) {
        const { data, error } = await supabase
          .from('simulations')
          .update(registro)
          .eq('id', proyectoActualId)
          .eq('user_id', authUser.id)
          .select('id')
          .single();

        if (error) throw error;
        setProyectoActualId(data.id);
        setMensajeProyecto('Proyecto actualizado correctamente.');
      } else {
        const { data, error } = await supabase
          .from('simulations')
          .insert(registro)
          .select('id')
          .single();

        if (error) throw error;
        setProyectoActualId(data.id);
        setMensajeProyecto('Proyecto guardado correctamente.');
      }

      await cargarProyectos(authUser.id);
    } catch (error: any) {
      console.error(error);
      setMensajeProyecto(`No se pudo guardar: ${error?.message || 'error desconocido'}`);
    } finally {
      setGuardandoProyecto(false);
    }
  };

  const convertirInversionLegacy = (inputs: any) => {
    if (Array.isArray(inputs?.inversion_dinamica)) return inputs.inversion_dinamica;

    const inv = inputs?.inversion;
    if (!inv) return [];

    return [
      { id: 'legacy-insumos', nombre: 'Insumos', monto: Number(inv.insumos || 0), categoria: 'Insumos', vida_util: 0, residual: 0 },
      { id: 'legacy-equipos', nombre: 'Equipos', monto: Number(inv.equipos || 0), categoria: 'Equipos', vida_util: 60, residual: Number(inv.equipos || 0) * 0.10 },
      { id: 'legacy-empaques', nombre: 'Empaques', monto: Number(inv.empaques || 0), categoria: 'Otros', vida_util: 0, residual: 0 },
      { id: 'legacy-permisos', nombre: 'Permisos', monto: Number(inv.permisos || 0), categoria: 'Otros', vida_util: 0, residual: 0 },
      { id: 'legacy-otros', nombre: 'Otros', monto: Number(inv.otros || 0), categoria: 'Otros', vida_util: 0, residual: 0 },
    ].filter((x) => x.monto > 0);
  };

  const convertirGastosLegacy = (inputs: any) => {
    if (Array.isArray(inputs?.gastos_dinamicos)) return inputs.gastos_dinamicos;

    const gf = inputs?.gastos_fijos;
    if (!gf) return [];

    return [
      { id: 'legacy-marketing', nombre: 'Marketing', monto: Number(gf.marketing || 0), categoria: 'Marketing' },
      { id: 'legacy-logistica', nombre: 'Logística', monto: Number(gf.logistica || 0), categoria: 'Proveedores' },
      { id: 'legacy-sueldo', nombre: 'Sueldo Emprendedor', monto: Number(gf.sueldo_emprendedor || 0), categoria: 'Personal' },
      { id: 'legacy-otros-fijos', nombre: 'Otros Fijos', monto: Number(gf.otros || 0), categoria: 'Otros' },
    ].filter((x) => x.monto > 0);
  };

  const normalizarInputsParaV34 = (proyecto: ProyectoGuardado) => {
    const inputs = proyecto.inputs || {};
    const ventas = inputs.ventas || {};

    return {
      ...inputs,
      nombre_idea: inputs.nombre_idea ?? proyecto.project_name ?? '',
      sector: inputs.sector ?? '',
      moneda: inputs.moneda ?? 'S/',
      capital_disponible: Number(inputs.capital_disponible ?? 0),
      inversion_dinamica: convertirInversionLegacy(inputs),
      gastos_dinamicos: convertirGastosLegacy(inputs),
      precio_venta: Number(inputs.precio_venta ?? 0),
      costo_directo: Number(inputs.costo_directo ?? 0),
      ventas: {
        pesimista: Number(ventas.pesimista ?? 0),
        base: Number(ventas.base ?? 0),
        optimista: Number(ventas.optimista ?? 0),
        crecimiento_mensual: Number(ventas.crecimiento_mensual ?? 0),
      },
      regimen_tributario: inputs.regimen_tributario ?? 'NRUS',
      inflacion_anual: Number(inputs.inflacion_anual ?? 3),
      tasa_descuento: Number(inputs.tasa_descuento ?? 12),
      meses_reserva: Number(inputs.meses_reserva ?? 3),
      estacionalidad: Array.isArray(inputs.estacionalidad)
        ? [...inputs.estacionalidad, ...Array(12).fill(0)].slice(0, 12)
        : Array(12).fill(0),
      solicitar_prestamo: Boolean(
        inputs.solicitar_prestamo ||
        Number(inputs.financiamiento_monto || 0) > 0
      ),
      financiamiento_monto: Number(inputs.financiamiento_monto ?? 0),
      financiamiento_tasa_mensual: Number(inputs.financiamiento_tasa_mensual ?? 0),
      financiamiento_plazo: Number(inputs.financiamiento_plazo ?? 24),
      _frontend_schema_version: 2,
      _motor_version: '3.4',
    };
  };

  const evaluarRecalculoV34 = (proyecto: ProyectoGuardado) => {
    const payload = normalizarInputsParaV34(proyecto);
    const faltantes: string[] = [];

    if (payload.precio_venta <= 0) faltantes.push('precio de venta');
    if (payload.costo_directo < 0) faltantes.push('costo directo');
    if (payload.ventas.base <= 0) faltantes.push('ventas base');
    if (payload.ventas.pesimista < 0) faltantes.push('ventas pesimistas');
    if (payload.ventas.optimista < payload.ventas.base) faltantes.push('ventas optimistas');
    if (payload.ventas.base < payload.ventas.pesimista) faltantes.push('orden de escenarios de ventas');

    return {
      listo: faltantes.length === 0,
      faltantes,
      payload,
    };
  };

  const obtenerEstadoSaneamiento = (proyecto: ProyectoGuardado) => {
    const evaluacion = evaluarRecalculoV34(proyecto);
    const metaRecalculo = proyecto.financial_results?._recalculo_meta;
    const motorInputs = String(proyecto.inputs?._motor_version || '').trim();

    const yaV34 =
      motorInputs === '3.4' ||
      metaRecalculo?.motor_nuevo === '3.4';

    if (yaV34) {
      return {
        codigo: 'v34' as const,
        etiqueta: 'V3.4 ACTUALIZADO',
        faltantes: [] as string[],
        evaluacion,
      };
    }

    if (evaluacion.listo) {
      return {
        codigo: 'listo' as const,
        etiqueta: 'LISTO PARA RECALCULAR',
        faltantes: [] as string[],
        evaluacion,
      };
    }

    return {
      codigo: 'incompleto' as const,
      etiqueta: 'REQUIERE COMPLETAR',
      faltantes: evaluacion.faltantes,
      evaluacion,
    };
  };

  const resumenSaneamiento = proyectos.reduce(
    (acc, proyecto) => {
      const estado = obtenerEstadoSaneamiento(proyecto);
      acc.total += 1;
      if (estado.codigo === 'v34') acc.v34 += 1;
      if (estado.codigo === 'listo') acc.listos += 1;
      if (estado.codigo === 'incompleto') acc.incompletos += 1;
      return acc;
    },
    { total: 0, v34: 0, listos: 0, incompletos: 0 }
  );

  const proyectosSaneamiento = proyectos.filter((proyecto) => {
    if (filtroSaneamiento === 'todos') return true;
    const codigoEsperado =
      filtroSaneamiento === 'v34'
        ? 'v34'
        : filtroSaneamiento === 'listos'
          ? 'listo'
          : 'incompleto';
    return obtenerEstadoSaneamiento(proyecto).codigo === codigoEsperado;
  });

  const obtenerMetricasResultado = (financial: any, moneda = 'S/') => {
    const metricas = financial?.metricas || {};
    const proyectoMetricas = metricas.proyecto || financial?.proyecto || {};

    return {
      inversion: Number(metricas.inversion_total ?? proyectoMetricas.inversion_inicial ?? 0),
      van: Number(metricas.van ?? proyectoMetricas.van ?? 0),
      tir: Number(metricas.tir ?? proyectoMetricas.tir ?? 0),
      roi: Number(metricas.roi ?? proyectoMetricas.roi ?? 0),
      bc: Number(metricas.b_c ?? proyectoMetricas.b_c ?? 0),
      payback:
        metricas.payback_meses ??
        proyectoMetricas.payback_meses ??
        financial?.base?.payback_meses ??
        null,
      liquidez: String(metricas.estado_liquidez ?? 'Sin dato'),
      riesgo:
        financial?.riesgo?.probabilidad_perdida ??
        metricas.probabilidad_perdida ??
        null,
      score: Number(metricas.score ?? 0),
      recomendacion:
        metricas.recomendacion?.estado ??
        metricas.recomendacion ??
        'Sin dictamen',
      moneda,
    };
  };

  const recalcularProyectoV34 = async (proyecto: ProyectoGuardado) => {
    if (!authUser) {
      setAuthMode('login');
      setAuthMessage('Inicia sesión para recalcular proyectos.');
      setShowAuth(true);
      return;
    }

    setRecalculandoId(proyecto.id);
    setMensajeProyecto('');
    setRecalculoPreview(null);

    try {
      const evaluacion = evaluarRecalculoV34(proyecto);
      const payload = evaluacion.payload;
      const nombreSeguro = proyecto.project_name?.trim() || 'Proyecto sin nombre';

      // Los históricos incompletos no se envían al motor y tampoco generan
      // una excepción en desarrollo. Se informa al usuario de forma normal.
      if (!evaluacion.listo) {
        setMensajeProyecto(
          `No se puede recalcular "${nombreSeguro}" todavía. Faltan o son inconsistentes: ${evaluacion.faltantes.join(', ')}. Pulsa "Completar para V3.4".`
        );
        return;
      }

      const respuesta = await fetch(`${API_URL}/simular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data: any = null;
      try {
        data = await respuesta.json();
      } catch {
        throw new Error('El motor respondió con un formato no válido.');
      }

      if (!respuesta.ok) {
        const detalle =
          typeof data?.detail === 'string'
            ? data.detail
            : data?.detail
              ? JSON.stringify(data.detail)
              : `HTTP ${respuesta.status}`;
        throw new Error(detalle);
      }

      if (!data?.metricas) {
        throw new Error('El motor V3.4 no devolvió métricas financieras.');
      }

      setRecalculoPreview({
        proyecto,
        resultado: data,
        inputsNormalizados: payload,
      });

      setMensajeProyecto(
        `Vista previa V3.4 generada para "${proyecto.project_name}". Aún no se ha modificado el proyecto guardado.`
      );
    } catch (error: any) {
      const nombreSeguro = proyecto.project_name?.trim() || 'Proyecto sin nombre';
      setMensajeProyecto(
        `No se pudo recalcular "${nombreSeguro}": ${error?.message || 'error desconocido'}`
      );
    } finally {
      setRecalculandoId(null);
    }
  };

  const actualizarOriginalConRecalculo = async () => {
    if (!authUser || !recalculoPreview) return;

    const confirmar = window.confirm(
      `¿Actualizar los resultados de "${recalculoPreview.proyecto.project_name}" con el motor V3.4?\n\n` +
      'Los datos económicos originales se conservan. Se reemplazarán los resultados financieros guardados por los nuevos.'
    );

    if (!confirmar) return;

    setGuardandoRecalculo(true);
    setMensajeProyecto('');

    const ahora = new Date().toISOString();
    const motorAnterior =
      recalculoPreview.proyecto.inputs?._motor_version || 'legacy';

    // Al actualizar el original NO reemplazamos sus inputs históricos.
    // Solo sustituimos los resultados financieros después de la
    // confirmación explícita del usuario.
    const resultadoConAuditoria = {
      ...recalculoPreview.resultado,
      _recalculo_meta: {
        motor_nuevo: '3.4',
        motor_anterior: motorAnterior,
        recalculado_en: ahora,
        fuente: 'inputs_originales_guardados',
      },
    };

    try {
      const { error } = await supabase
        .from('simulations')
        .update({
          financial_results: resultadoConAuditoria,
          monte_carlo_results:
            recalculoPreview.resultado?.monte_carlo_results ?? null,
          status: 'completed',
          updated_at: ahora,
        })
        .eq('id', recalculoPreview.proyecto.id)
        .eq('user_id', authUser.id);

      if (error) throw error;

      setMensajeProyecto(
        `Proyecto "${recalculoPreview.proyecto.project_name}" actualizado con resultados V3.4.`
      );
      setRecalculoPreview(null);
      await cargarProyectos(authUser.id);
    } catch (error: any) {
      console.error(error);
      setMensajeProyecto(
        `No se pudo actualizar el proyecto: ${error?.message || 'error desconocido'}`
      );
    } finally {
      setGuardandoRecalculo(false);
    }
  };

  const guardarRecalculoComoCopia = async () => {
    if (!authUser || !recalculoPreview) return;

    setGuardandoRecalculo(true);
    setMensajeProyecto('');

    const ahora = new Date().toISOString();
    const motorAnterior =
      recalculoPreview.proyecto.inputs?._motor_version || 'legacy';

    const inputsCopia = {
      ...recalculoPreview.inputsNormalizados,
      _motor_version: '3.4',
      _recalculado_desde_motor: motorAnterior,
      _recalculado_en: ahora,
      _origen_proyecto_id: recalculoPreview.proyecto.id,
    };

    try {
      const { error } = await supabase
        .from('simulations')
        .insert({
          user_id: authUser.id,
          project_name: `${recalculoPreview.proyecto.project_name} (V3.4)`,
          inputs: inputsCopia,
          financial_results: {
            ...recalculoPreview.resultado,
            _recalculo_meta: {
              motor_nuevo: '3.4',
              motor_anterior: motorAnterior,
              recalculado_en: ahora,
              fuente: 'inputs_originales_guardados',
              proyecto_origen_id: recalculoPreview.proyecto.id,
            },
          },
          monte_carlo_results:
            recalculoPreview.resultado?.monte_carlo_results ?? null,
          llm_analysis: null,
          status: 'completed',
          updated_at: ahora,
        });

      if (error) throw error;

      setMensajeProyecto(
        `Copia V3.4 creada. El proyecto original "${recalculoPreview.proyecto.project_name}" quedó intacto.`
      );
      setRecalculoPreview(null);
      await cargarProyectos(authUser.id);
    } catch (error: any) {
      console.error(error);
      setMensajeProyecto(
        `No se pudo guardar la copia V3.4: ${error?.message || 'error desconocido'}`
      );
    } finally {
      setGuardandoRecalculo(false);
    }
  };

  const abrirProyecto = (proyecto: ProyectoGuardado) => {
    const inputs = proyecto.inputs || {};
    const ventas = inputs.ventas || {};

    setFormData({
      nombre_idea: inputs.nombre_idea ?? proyecto.project_name ?? '',
      sector: inputs.sector ?? '',
      moneda: inputs.moneda ?? 'S/',
      capital_disponible: Number(inputs.capital_disponible ?? 10000),
      precio_venta: Number(inputs.precio_venta ?? 0),
      costo_directo: Number(inputs.costo_directo ?? 0),
      regimen_tributario: inputs.regimen_tributario ?? 'NRUS',
      inflacion_anual: Number(inputs.inflacion_anual ?? 3),
      ventas: {
        pesimista: Number(ventas.pesimista ?? 0),
        base: Number(ventas.base ?? 0),
        optimista: Number(ventas.optimista ?? 0),
        crecimiento_mensual: Number(ventas.crecimiento_mensual ?? 0),
      },
      tasa_descuento: Number(inputs.tasa_descuento ?? 12),
      meses_reserva: Number(inputs.meses_reserva ?? 3),
      estacionalidad: Array.isArray(inputs.estacionalidad)
        ? [...inputs.estacionalidad, ...Array(12).fill(0)].slice(0, 12)
        : Array(12).fill(0),
      solicitar_prestamo: Boolean(inputs.solicitar_prestamo || Number(inputs.financiamiento_monto || 0) > 0),
      financiamiento_monto: Number(inputs.financiamiento_monto ?? 0),
      financiamiento_tasa_mensual: Number(inputs.financiamiento_tasa_mensual ?? 1.5),
      financiamiento_plazo: Number(inputs.financiamiento_plazo ?? 24),
    });

    setInvItems(convertirInversionLegacy(inputs));
    setGastoItems(convertirGastosLegacy(inputs));
    setRes(proyecto.financial_results || null);
    setProyectoActualId(proyecto.id);

    const analisis = proyecto.llm_analysis;
    if (typeof analisis === 'string') {
      setConsejoIA(analisis);
    } else {
      setConsejoIA(analisis?.contenido || '');
      setActiveRol(analisis?.rol || '');
    }

    setMensajeProyecto(`Proyecto "${proyecto.project_name}" abierto.`);
    setActiveTab(proyecto.financial_results?.metricas ? 'resultados' : 'simulador');
  };

  const completarProyectoParaV34 = (proyecto: ProyectoGuardado) => {
    const evaluacion = evaluarRecalculoV34(proyecto);
    const nombreSeguro = proyecto.project_name?.trim() || 'Proyecto sin nombre';

    abrirProyecto(proyecto);
    setActiveTab('simulador');
    setMensajeProyecto(
      `Completa "${nombreSeguro}" antes de recalcular. Revisa especialmente: ${evaluacion.faltantes.join(', ') || 'datos del proyecto'}. Luego genera una simulación nueva y guárdala.`
    );
  };

  const duplicarProyecto = async (proyecto: ProyectoGuardado) => {
    if (!authUser) return;

    setGuardandoProyecto(true);
    setMensajeProyecto('');

    const ahora = new Date().toISOString();
    const { error } = await supabase
      .from('simulations')
      .insert({
        user_id: authUser.id,
        project_name: `${proyecto.project_name} (copia)`,
        inputs: proyecto.inputs,
        financial_results: proyecto.financial_results,
        monte_carlo_results: proyecto.monte_carlo_results ?? null,
        llm_analysis: proyecto.llm_analysis ?? null,
        status: proyecto.status || 'completed',
        updated_at: ahora,
      });

    if (error) {
      setMensajeProyecto(`No se pudo duplicar: ${error.message}`);
    } else {
      setMensajeProyecto('Proyecto duplicado.');
      await cargarProyectos(authUser.id);
    }

    setGuardandoProyecto(false);
  };

  const eliminarProyecto = async (proyecto: ProyectoGuardado) => {
    if (!authUser) return;

    const confirmar = window.confirm(`¿Eliminar "${proyecto.project_name}"? Esta acción no se puede deshacer.`);
    if (!confirmar) return;

    const { error } = await supabase
      .from('simulations')
      .delete()
      .eq('id', proyecto.id)
      .eq('user_id', authUser.id);

    if (error) {
      setMensajeProyecto(`No se pudo eliminar: ${error.message}`);
      return;
    }

    if (proyectoActualId === proyecto.id) setProyectoActualId(null);
    setProyectosSeleccionadosIds((actuales) => actuales.filter((id) => id !== proyecto.id));
    setMensajeProyecto('Proyecto eliminado.');
    await cargarProyectos(authUser.id);
  };

  const alternarSeleccionProyecto = (proyectoId: string) => {
    if (proyectosSeleccionadosIds.includes(proyectoId)) {
      const nuevaSeleccion = proyectosSeleccionadosIds.filter((id) => id !== proyectoId);
      setProyectosSeleccionadosIds(nuevaSeleccion);
      if (nuevaSeleccion.length < 2) setComparadorAbierto(false);
      setMensajeProyecto('');
      return;
    }

    if (proyectosSeleccionadosIds.length >= 4) {
      setMensajeProyecto('Puedes comparar como máximo 4 proyectos a la vez.');
      return;
    }

    setProyectosSeleccionadosIds([...proyectosSeleccionadosIds, proyectoId]);
    setMensajeProyecto('');
  };

  const limpiarSeleccionComparador = () => {
    setProyectosSeleccionadosIds([]);
    setComparadorAbierto(false);
    setMensajeProyecto('');
  };

  const abrirComparador = () => {
    if (proyectosSeleccionadosIds.length < 2) {
      setMensajeProyecto('Selecciona al menos 2 proyectos para comparar.');
      return;
    }

    setComparadorAbierto(true);
    setRankingAbierto(false);
    setMensajeProyecto('');
  };

  const proyectosSeleccionados = proyectos.filter((proyecto) =>
    proyectosSeleccionadosIds.includes(proyecto.id)
  );

  const obtenerMetricasProyecto = (proyecto: ProyectoGuardado) => {
    const financial = proyecto.financial_results || {};
    const metricas = financial.metricas || {};
    const proyectoMetricas = metricas.proyecto || financial.proyecto || {};

    return {
      inversion: Number(metricas.inversion_total ?? proyectoMetricas.inversion_inicial ?? 0),
      van: Number(metricas.van ?? proyectoMetricas.van ?? 0),
      tir: Number(metricas.tir ?? proyectoMetricas.tir ?? 0),
      roi: Number(metricas.roi ?? proyectoMetricas.roi ?? 0),
      bc: Number(metricas.b_c ?? proyectoMetricas.b_c ?? 0),
      payback:
        metricas.payback_meses ??
        proyectoMetricas.payback_meses ??
        financial.base?.payback_meses ??
        null,
      liquidez: String(metricas.estado_liquidez ?? 'Sin dato'),
      riesgo:
        financial.riesgo?.probabilidad_perdida ??
        metricas.probabilidad_perdida ??
        null,
      score: Number(metricas.score ?? 0),
      recomendacion:
        metricas.recomendacion?.estado ??
        metricas.recomendacion ??
        'Sin dictamen',
      moneda: proyecto.inputs?.moneda || 'S/',
    };
  };

  const proyectosRanking = [...proyectos].sort((a, b) => {
    const ma = obtenerMetricasProyecto(a);
    const mb = obtenerMetricasProyecto(b);

    if (mb.score !== ma.score) return mb.score - ma.score;
    if (mb.van !== ma.van) return mb.van - ma.van;
    if (mb.bc !== ma.bc) return mb.bc - ma.bc;
    return ma.payback === null
      ? 1
      : mb.payback === null
        ? -1
        : Number(ma.payback) - Number(mb.payback);
  });

  const invTotal = invItems.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
  const gastoTotal = gastoItems.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);

  const cargarPlantilla = (key: string) => {
    setProyectoActualId(null);
    setMensajeProyecto('');
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
      alert("⚠️ No se pudo conectar al servidor del simulador. Verifica tu conexión a Internet e inténtalo nuevamente."); 
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
                 {(authUser?.email || 'I').charAt(0).toUpperCase()}
              </div>
              <div>
                 <p className="text-sm font-bold dark:text-white">
                   {!authReady ? 'Verificando sesión...' : authUser?.email || 'Invitado'}
                 </p>
                 <p className="text-xs text-slate-500 dark:text-slate-400">Motor V3.4 · Finanzas + IA + Proyectos</p>
              </div>
           </div>

           <div className="flex items-center gap-2 mt-4 md:mt-0 flex-wrap justify-end">
              {authUser ? (
                <>
                  <button
                    onClick={() => { setActiveTab('proyectos'); cargarProyectos(); }}
                    className="cursor-pointer px-3 py-2 text-sm font-bold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                  >
                    📁 Mis Proyectos
                  </button>
                  <button
                    onClick={cerrarSesion}
                    className="cursor-pointer px-3 py-2 text-sm font-bold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setAuthMode('login'); setAuthMessage(''); setShowAuth(true); }}
                  className="cursor-pointer px-4 py-2 text-sm font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  Iniciar sesión
                </button>
              )}
              <button onClick={() => setDarkMode(!darkMode)} className="cursor-pointer text-xl p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}>
                {darkMode ? '☀️' : '🌙'}
              </button>
           </div>
        </div>

        <header className="mb-6 text-center">
          <h1 className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-400">Decisiones de Inversión IA</h1>
          <div className="flex justify-center mt-6 gap-2 flex-wrap">
            <button onClick={() => setActiveTab('simulador')} className={`cursor-pointer px-6 py-2 font-bold rounded-lg transition-colors ${activeTab === 'simulador' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>1. Configurar</button>
            <button onClick={() => {if(res && res.metricas)setActiveTab('resultados')}} className={`cursor-pointer px-6 py-2 font-bold rounded-lg transition-colors ${activeTab === 'resultados' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'} ${(!res || !res.metricas) && 'opacity-50 cursor-not-allowed'}`}>2. Resultados & Dictamen</button>
            <button
              onClick={() => {
                if (authUser) {
                  setActiveTab('proyectos');
                  cargarProyectos();
                } else {
                  setAuthMode('login');
                  setAuthMessage('Inicia sesión para ver tus proyectos.');
                  setShowAuth(true);
                }
              }}
              className={`cursor-pointer px-6 py-2 font-bold rounded-lg transition-colors ${activeTab === 'proyectos' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
            >
              3. Mis Proyectos {authUser ? `(${proyectos.length})` : ''}
            </button>
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
                    <div className="mb-2">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 mb-1">
                        Nombre de la idea
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">EDITABLE</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Cafetería de Especialidad"
                        value={formData.nombre_idea}
                        onChange={e=>setFormData({...formData, nombre_idea: e.target.value})}
                        title="Haz clic aquí para editar el nombre del negocio"
                        className="w-full p-2.5 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 dark:text-white outline-none cursor-text shadow-sm transition-all hover:border-indigo-300 dark:hover:border-indigo-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40"
                      />
                    </div>
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
                       <div>
                         <label className="text-xs font-bold dark:text-slate-300 flex items-center">
                           Tasa Descuento VAN (%)
                           <InfoTooltip text="Tasa anual mínima de rentabilidad que exiges al proyecto. Se usa para traer los flujos futuros a valor presente y calcular el VAN. A mayor tasa de descuento, menor será el VAN." />
                         </label>
                         <input
                           type="number"
                           value={formData.tasa_descuento}
                           onChange={e=>setFormData({...formData, tasa_descuento: Number(e.target.value)})}
                           className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 dark:text-white outline-none transition-all hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40"
                         />
                       </div>
                       <div>
                         <label className="text-xs font-bold dark:text-slate-300 flex items-center">
                           Reserva Seguridad
                           <InfoTooltip text="Colchón de liquidez expresado en meses de gastos fijos. Es una meta de caja para soportar meses difíciles; no se suma automáticamente como costo de apertura." />
                         </label>
                         <select
                           value={formData.meses_reserva}
                           onChange={e=>setFormData({...formData, meses_reserva: Number(e.target.value)})}
                           className="cursor-pointer w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 dark:text-white outline-none transition-all hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40"
                         >
                           <option value="3">3 Meses</option>
                           <option value="6">6 Meses</option>
                           <option value="12">1 Año</option>
                         </select>
                       </div>
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
                            <div className="relative flex-1 min-w-0">
                              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 text-xs">✎</span>
                              <input
                                type="text"
                                value={item.nombre}
                                onChange={e=>updateInv(item.id, 'nombre', e.target.value)}
                                placeholder="Ej. Horno"
                                title="Editable: nombre de la inversión"
                                className="w-full pr-7 pl-2 py-1.5 bg-white dark:bg-slate-800 text-sm outline-none rounded-md border border-slate-300 dark:border-slate-600 dark:text-white cursor-text transition-all hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40"
                              />
                            </div>
                            <select
                              value={item.categoria}
                              onChange={e=>updateInv(item.id, 'categoria', e.target.value)}
                              title="Editable: categoría de la inversión"
                              className="cursor-pointer w-24 text-xs bg-white dark:bg-slate-800 px-1.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 outline-none dark:text-slate-200 hover:border-indigo-300 focus:border-indigo-500"
                            >
                              {CATEGORIAS_ITEMS.map(c=><option key={c}>{c}</option>)}
                            </select>
                            <input
                              type="number"
                              value={item.monto}
                              onChange={e=>updateInv(item.id, 'monto', Number(e.target.value))}
                              title="Editable: monto de la inversión"
                              className="w-20 text-sm bg-white dark:bg-slate-800 px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 outline-none font-bold dark:text-white hover:border-indigo-300 focus:border-indigo-500"
                            />
                            {item.categoria === 'Equipos' ? (
                              <input
                                type="number"
                                placeholder="Vida"
                                title="Vida útil en meses"
                                value={item.vida_util}
                                onChange={e=>updateInv(item.id, 'vida_util', Number(e.target.value))}
                                className="w-16 shrink-0 text-xs bg-white dark:bg-slate-800 dark:text-white border dark:border-slate-600 p-1 rounded"
                              />
                            ) : (
                              <div className="w-16 shrink-0" aria-hidden="true"></div>
                            )}
                            <button onClick={()=>setInvItems(invItems.filter(x=>x.id!==item.id))} className="cursor-pointer w-8 shrink-0 text-rose-500 hover:text-rose-700 font-bold text-center">✕</button>
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
                            <div className="relative flex-1 min-w-0">
                              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 text-xs">✎</span>
                              <input
                                type="text"
                                value={item.nombre}
                                onChange={e=>updateGas(item.id, 'nombre', e.target.value)}
                                placeholder="Ej. Alquiler"
                                title="Editable: nombre del gasto fijo"
                                className="w-full pr-7 pl-2 py-1.5 bg-white dark:bg-slate-800 text-sm outline-none rounded-md border border-slate-300 dark:border-slate-600 dark:text-white cursor-text transition-all hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40"
                              />
                            </div>
                            <select
                              value={item.categoria}
                              onChange={e=>updateGas(item.id, 'categoria', e.target.value)}
                              title="Editable: categoría del gasto"
                              className="cursor-pointer w-28 text-xs bg-white dark:bg-slate-800 px-1.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 outline-none dark:text-slate-200 hover:border-indigo-300 focus:border-indigo-500"
                            >
                              {CATEGORIAS_ITEMS.map(c=><option key={c}>{c}</option>)}
                            </select>
                            <input
                              type="number"
                              value={item.monto}
                              onChange={e=>updateGas(item.id, 'monto', Number(e.target.value))}
                              title="Editable: monto mensual"
                              className="w-24 text-sm bg-white dark:bg-slate-800 px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 outline-none font-bold dark:text-white hover:border-indigo-300 focus:border-indigo-500"
                            />
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

      {/* MIS PROYECTOS */}
      {activeTab === 'proyectos' && (
        <div className="max-w-7xl mx-auto space-y-6 print:hidden">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Mis Proyectos</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Tus simulaciones se guardan en la nube y podrás abrirlas desde otra PC o laptop iniciando sesión con la misma cuenta.
                </p>
              </div>
              <button
                onClick={() => cargarProyectos()}
                disabled={proyectosLoading}
                className="cursor-pointer px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-60"
              >
                {proyectosLoading ? 'Actualizando...' : '↻ Actualizar'}
              </button>
            </div>

            {authUser && proyectos.length > 0 && (
              <div className="mb-5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/10 overflow-hidden">
                <div className="p-5 border-b border-emerald-200 dark:border-emerald-800">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black text-emerald-900 dark:text-emerald-200">
                        🧹 Saneamiento histórico V3.4
                      </h3>
                      <p className="text-sm text-emerald-800/80 dark:text-emerald-300/80 mt-1 max-w-3xl">
                        Auditoría de tus proyectos guardados. Ninguna acción de este panel sobrescribe un proyecto sin tu confirmación.
                      </p>
                    </div>

                    <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Progreso V3.4</p>
                      <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                        {resumenSaneamiento.v34}/{resumenSaneamiento.total}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                    <button
                      onClick={() => setFiltroSaneamiento('todos')}
                      className={`cursor-pointer rounded-xl p-3 text-left border transition-all ${
                        filtroSaneamiento === 'todos'
                          ? 'border-slate-500 bg-slate-100 dark:bg-slate-800'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50'
                      }`}
                    >
                      <p className="text-[10px] uppercase font-bold text-slate-500">Total</p>
                      <p className="text-2xl font-black text-slate-800 dark:text-white">{resumenSaneamiento.total}</p>
                    </button>

                    <button
                      onClick={() => setFiltroSaneamiento('v34')}
                      className={`cursor-pointer rounded-xl p-3 text-left border transition-all ${
                        filtroSaneamiento === 'v34'
                          ? 'border-emerald-500 bg-emerald-100 dark:bg-emerald-900/30'
                          : 'border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900/50'
                      }`}
                    >
                      <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Ya V3.4</p>
                      <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{resumenSaneamiento.v34}</p>
                    </button>

                    <button
                      onClick={() => setFiltroSaneamiento('listos')}
                      className={`cursor-pointer rounded-xl p-3 text-left border transition-all ${
                        filtroSaneamiento === 'listos'
                          ? 'border-indigo-500 bg-indigo-100 dark:bg-indigo-900/30'
                          : 'border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900/50'
                      }`}
                    >
                      <p className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Listos</p>
                      <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{resumenSaneamiento.listos}</p>
                    </button>

                    <button
                      onClick={() => setFiltroSaneamiento('incompletos')}
                      className={`cursor-pointer rounded-xl p-3 text-left border transition-all ${
                        filtroSaneamiento === 'incompletos'
                          ? 'border-amber-500 bg-amber-100 dark:bg-amber-900/30'
                          : 'border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900/50'
                      }`}
                    >
                      <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Completar</p>
                      <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{resumenSaneamiento.incompletos}</p>
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                    {proyectosSaneamiento.map((proyecto) => {
                      const estado = obtenerEstadoSaneamiento(proyecto);
                      const nombreSeguro = proyecto.project_name?.trim() || 'Proyecto sin nombre';

                      return (
                        <div
                          key={`saneamiento-${proyecto.id}`}
                          className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-3"
                        >
                          <div className="min-w-0">
                            <p className="font-black text-slate-800 dark:text-white truncate">
                              {nombreSeguro}
                            </p>

                            {estado.codigo === 'v34' ? (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                                ✅ Resultados compatibles con V3.4.
                              </p>
                            ) : estado.codigo === 'listo' ? (
                              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-1">
                                🔄 Tiene inputs suficientes para generar una vista previa V3.4.
                              </p>
                            ) : (
                              <p className="text-xs text-amber-700 dark:text-amber-300 font-bold mt-1">
                                🧩 Falta revisar: {estado.faltantes.join(', ')}.
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                estado.codigo === 'v34'
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                  : estado.codigo === 'listo'
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                              }`}
                            >
                              {estado.etiqueta}
                            </span>

                            {estado.codigo === 'listo' && (
                              <button
                                onClick={() => recalcularProyectoV34(proyecto)}
                                disabled={recalculandoId === proyecto.id || guardandoRecalculo}
                                className="cursor-pointer px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-black hover:bg-emerald-500 disabled:opacity-50"
                              >
                                {recalculandoId === proyecto.id ? 'Recalculando...' : 'Vista previa'}
                              </button>
                            )}

                            {estado.codigo === 'incompleto' && (
                              <button
                                onClick={() => completarProyectoParaV34(proyecto)}
                                className="cursor-pointer px-3 py-2 rounded-lg bg-amber-500 text-amber-950 text-xs font-black hover:bg-amber-400"
                              >
                                Completar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 px-4 py-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Objetivo del saneamiento: llevar gradualmente los proyectos históricos a resultados V3.4 manteniendo sus inputs originales. Los proyectos incompletos se corrigen manualmente; no se rellenan con supuestos de las plantillas 2026.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {authUser && proyectos.length > 0 && (
              <div className="mb-5 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-900/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-indigo-800 dark:text-indigo-300">
                      ⚖️ Comparador de proyectos
                    </p>
                    <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 mt-1">
                      Marca la casilla “Comparar” de 2 a 4 proyectos. Luego pulsa “Comparar proyectos”.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-sm font-black text-indigo-700 dark:text-indigo-300">
                      {proyectosSeleccionadosIds.length}/4 seleccionados
                    </span>

                    <button
                      onClick={abrirComparador}
                      disabled={proyectosSeleccionadosIds.length < 2}
                      className="cursor-pointer px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ⚖️ Comparar proyectos
                    </button>

                    <button
                      onClick={() => {
                        setRankingAbierto(!rankingAbierto);
                        setComparadorAbierto(false);
                      }}
                      className="cursor-pointer px-4 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-sm font-bold hover:bg-amber-200 dark:hover:bg-amber-900/50"
                    >
                      🏆 {rankingAbierto ? 'Ocultar ranking' : 'Ver ranking'}
                    </button>

                    {proyectosSeleccionadosIds.length > 0 && (
                      <button
                        onClick={limpiarSeleccionComparador}
                        className="cursor-pointer px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-600"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {mensajeProyecto && (
              <div className="mb-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 text-sm font-medium text-indigo-800 dark:text-indigo-300">
                {mensajeProyecto}
              </div>
            )}

            {/* COMPARACIÓN */}
            {authUser && comparadorAbierto && proyectosSeleccionados.length >= 2 && (
              <div className="mb-6 rounded-2xl border-2 border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 overflow-hidden">
                <div className="flex items-center justify-between gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/30 border-b border-indigo-200 dark:border-indigo-800">
                  <div>
                    <h3 className="font-black text-xl text-indigo-800 dark:text-indigo-200">⚖️ Comparación financiera</h3>
                    <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80">
                      Compara entre {proyectosSeleccionados.length} proyectos. El motor no cambia los datos guardados.
                    </p>
                  </div>
                  <button
                    onClick={() => setComparadorAbierto(false)}
                    className="cursor-pointer px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    Cerrar
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-900 text-left p-3 font-black text-slate-700 dark:text-slate-200 min-w-[150px]">
                          Indicador
                        </th>
                        {proyectosSeleccionados.map((proyecto) => (
                          <th key={proyecto.id} className="p-3 text-left min-w-[190px]">
                            <div className="font-black text-slate-800 dark:text-white">
                              {proyecto.project_name || 'Proyecto sin nombre'}
                            </div>
                            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-1">
                              {proyecto.updated_at
                                ? new Date(proyecto.updated_at).toLocaleDateString('es-PE')
                                : ''}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          label: 'Inversión inicial',
                          render: (p: ProyectoGuardado) => {
                            const m = obtenerMetricasProyecto(p);
                            return `${m.moneda} ${m.inversion.toLocaleString('es-PE', { maximumFractionDigits: 2 })}`;
                          },
                        },
                        {
                          label: 'VAN',
                          render: (p: ProyectoGuardado) => {
                            const m = obtenerMetricasProyecto(p);
                            return `${m.moneda} ${m.van.toLocaleString('es-PE', { maximumFractionDigits: 2 })}`;
                          },
                        },
                        {
                          label: 'TIR',
                          render: (p: ProyectoGuardado) => `${obtenerMetricasProyecto(p).tir.toFixed(1)}%`,
                        },
                        {
                          label: 'ROI',
                          render: (p: ProyectoGuardado) => `${obtenerMetricasProyecto(p).roi.toFixed(1)}%`,
                        },
                        {
                          label: 'B/C',
                          render: (p: ProyectoGuardado) => obtenerMetricasProyecto(p).bc.toFixed(2),
                        },
                        {
                          label: 'Payback',
                          render: (p: ProyectoGuardado) => {
                            const payback = obtenerMetricasProyecto(p).payback;
                            return payback === null || payback === undefined
                              ? 'No recupera / sin dato'
                              : `${Number(payback).toFixed(2)} meses`;
                          },
                        },
                        {
                          label: 'Liquidez',
                          render: (p: ProyectoGuardado) => obtenerMetricasProyecto(p).liquidez,
                        },
                        {
                          label: 'Riesgo',
                          render: (p: ProyectoGuardado) => {
                            const riesgo = obtenerMetricasProyecto(p).riesgo;
                            return riesgo === null || riesgo === undefined
                              ? 'Sin dato'
                              : `${Number(riesgo).toFixed(0)}%`;
                          },
                        },
                        {
                          label: 'Score',
                          render: (p: ProyectoGuardado) => `${obtenerMetricasProyecto(p).score.toFixed(0)}/100`,
                        },
                        {
                          label: 'Dictamen',
                          render: (p: ProyectoGuardado) => obtenerMetricasProyecto(p).recomendacion,
                        },
                      ].map((fila) => (
                        <tr key={fila.label} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                          <td className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-900 p-3 font-black text-slate-600 dark:text-slate-300">
                            {fila.label}
                          </td>
                          {proyectosSeleccionados.map((proyecto) => (
                            <td key={`${fila.label}-${proyecto.id}`} className="p-3 font-bold text-slate-800 dark:text-slate-100 align-top">
                              {fila.render(proyecto)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/70 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Consejo: prioriza VAN, B/C, payback, liquidez, riesgo y sensibilidad. Una TIR muy alta por sí sola no garantiza que un proyecto sea superior.
                  </p>
                </div>
              </div>
            )}

            {/* RANKING */}
            {authUser && rankingAbierto && proyectos.length > 0 && (
              <div className="mb-6 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-900/10 p-4">
                <div className="mb-4">
                  <h3 className="font-black text-xl text-amber-900 dark:text-amber-200">🏆 Ranking automático</h3>
                  <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1">
                    Ordenado primero por Score del motor V3.4; en empate, por VAN, B/C y menor payback.
                  </p>
                </div>

                <div className="space-y-2">
                  {proyectosRanking.map((proyecto, index) => {
                    const m = obtenerMetricasProyecto(proyecto);
                    return (
                      <div
                        key={proyecto.id}
                        className="grid grid-cols-[46px_minmax(180px,1fr)_90px_130px_90px] gap-3 items-center rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 px-3 py-3"
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black ${
                          index === 0
                            ? 'bg-amber-400 text-amber-950'
                            : index === 1
                              ? 'bg-slate-300 text-slate-800'
                              : index === 2
                                ? 'bg-orange-200 text-orange-900'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          {index + 1}
                        </div>

                        <div className="min-w-0">
                          <p className="font-black text-slate-800 dark:text-white truncate">
                            {proyecto.project_name || 'Proyecto sin nombre'}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {m.recomendacion}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-500">Score</p>
                          <p className="font-black text-slate-800 dark:text-white">{m.score.toFixed(0)}/100</p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-500">VAN</p>
                          <p className="font-black text-slate-800 dark:text-white truncate">
                            {m.moneda} {m.van.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                          </p>
                        </div>

                        <button
                          onClick={() => abrirProyecto(proyecto)}
                          className="cursor-pointer px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-amber-950 text-sm font-black"
                        >
                          Abrir
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!authUser ? (
              <div className="text-center py-12">
                <p className="text-slate-500 dark:text-slate-400 mb-4">Inicia sesión para acceder a tus proyectos.</p>
                <button
                  onClick={() => { setAuthMode('login'); setAuthMessage(''); setShowAuth(true); }}
                  className="cursor-pointer px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500"
                >
                  Iniciar sesión
                </button>
              </div>
            ) : proyectosLoading ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">Cargando proyectos...</div>
            ) : proyectos.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-5xl mb-3">📁</div>
                <p className="font-bold text-slate-700 dark:text-slate-200">Aún no tienes proyectos asociados a esta cuenta.</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Crea una simulación y guárdala para verla aquí.
                </p>
                <button
                  onClick={() => setActiveTab('simulador')}
                  className="cursor-pointer mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500"
                >
                  Crear una simulación
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {proyectos.map((proyecto) => {
                  const metricas = proyecto.financial_results?.metricas || {};
                  const fecha = proyecto.updated_at || proyecto.created_at;
                  const seleccionado = proyectosSeleccionadosIds.includes(proyecto.id);
                  const estadoRecalculo = evaluarRecalculoV34(proyecto);

                  return (
                    <div
                      key={proyecto.id}
                      className={`rounded-2xl border p-5 transition-all ${
                        seleccionado
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 ring-2 ring-violet-200 dark:ring-violet-900'
                          : proyectoActualId === proyecto.id
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <label className="inline-flex items-center gap-2 mb-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={seleccionado}
                              onChange={() => alternarSeleccionProyecto(proyecto.id)}
                              className="w-4 h-4 accent-violet-600 cursor-pointer"
                            />
                            <span className="text-xs font-black text-violet-700 dark:text-violet-300">
                              Comparar
                            </span>
                          </label>

                          <h3 className="font-black text-lg text-slate-800 dark:text-white">
                            {proyecto.project_name || 'Proyecto sin nombre'}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {fecha ? `Actualizado: ${new Date(fecha).toLocaleString('es-PE')}` : 'Sin fecha'}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {seleccionado && (
                            <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-violet-600 text-white">
                              SELECCIONADO
                            </span>
                          )}
                          {proyectoActualId === proyecto.id && (
                            <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-indigo-600 text-white">
                              ABIERTO
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="rounded-lg bg-white dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700">
                          <p className="text-[10px] uppercase font-bold text-slate-500">VAN</p>
                          <p className="font-black text-sm dark:text-white">{Number(metricas.van || 0).toLocaleString('es-PE')}</p>
                        </div>
                        <div className="rounded-lg bg-white dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700">
                          <p className="text-[10px] uppercase font-bold text-slate-500">TIR</p>
                          <p className="font-black text-sm dark:text-white">{Number(metricas.tir || 0).toFixed(1)}%</p>
                        </div>
                        <div className="rounded-lg bg-white dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700">
                          <p className="text-[10px] uppercase font-bold text-slate-500">ROI</p>
                          <p className="font-black text-sm dark:text-white">{Number(metricas.roi || 0).toFixed(1)}%</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        <button
                          onClick={() => abrirProyecto(proyecto)}
                          className="cursor-pointer px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500"
                        >
                          Abrir
                        </button>
                        <button
                          onClick={() => duplicarProyecto(proyecto)}
                          disabled={guardandoProyecto}
                          className="cursor-pointer px-3 py-2 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-bold hover:bg-violet-200 dark:hover:bg-violet-900/50 disabled:opacity-60"
                        >
                          Duplicar
                        </button>
                        {estadoRecalculo.listo ? (
                          <button
                            onClick={() => recalcularProyectoV34(proyecto)}
                            disabled={recalculandoId === proyecto.id || guardandoRecalculo}
                            className="cursor-pointer px-3 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 disabled:opacity-60 disabled:cursor-not-allowed"
                            title="Calcula una vista previa con el motor V3.4 sin modificar el proyecto guardado."
                          >
                            {recalculandoId === proyecto.id ? 'Recalculando...' : '🔄 Recalcular V3.4'}
                          </button>
                        ) : (
                          <button
                            onClick={() => completarProyectoParaV34(proyecto)}
                            className="cursor-pointer px-3 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-sm font-bold hover:bg-amber-200 dark:hover:bg-amber-900/50"
                            title={`Faltan datos para recalcular: ${estadoRecalculo.faltantes.join(', ')}`}
                          >
                            🧩 Completar para V3.4
                          </button>
                        )}
                        <button
                          onClick={() => eliminarProyecto(proyecto)}
                          className="cursor-pointer px-3 py-2 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-sm font-bold hover:bg-rose-200 dark:hover:bg-rose-900/50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                   <p className="text-sm text-slate-500 dark:text-slate-400">Dictamen Financiero Profesional V3.4</p>
                </div>
                <div className="flex gap-2 print:hidden flex-wrap justify-end">
                   <button
                     onClick={() => guardarProyecto(false)}
                     disabled={guardandoProyecto}
                     className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-colors"
                   >
                     {guardandoProyecto ? 'Guardando...' : proyectoActualId ? '💾 Actualizar proyecto' : '💾 Guardar proyecto'}
                   </button>
                   {proyectoActualId && (
                     <button
                       onClick={() => guardarProyecto(true)}
                       disabled={guardandoProyecto}
                       className="cursor-pointer bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-colors"
                     >
                       🗂️ Guardar copia
                     </button>
                   )}
                   <button onClick={handleExportarExcel} className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-colors">📥 Exportar .xlsx</button>
                   <button onClick={exportarPDF} className="cursor-pointer bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-colors">📄 Generar PDF</button>
                </div>
             </div>

             {mensajeProyecto && (
               <div className="mb-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 text-sm font-medium text-indigo-800 dark:text-indigo-300">
                 {mensajeProyecto}
               </div>
             )}

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
      {/* MODAL DE RECÁLCULO SEGURO V3.4 */}
      {recalculoPreview && (() => {
        const moneda = recalculoPreview.proyecto.inputs?.moneda || 'S/';
        const anteriores = obtenerMetricasResultado(
          recalculoPreview.proyecto.financial_results,
          moneda
        );
        const nuevos = obtenerMetricasResultado(
          recalculoPreview.resultado,
          moneda
        );
        const motorAnterior =
          recalculoPreview.proyecto.inputs?._motor_version || 'Histórico / Legacy';

        const filas = [
          {
            label: 'Inversión inicial',
            anterior: `${anteriores.moneda} ${anteriores.inversion.toLocaleString('es-PE', { maximumFractionDigits: 2 })}`,
            nuevo: `${nuevos.moneda} ${nuevos.inversion.toLocaleString('es-PE', { maximumFractionDigits: 2 })}`,
          },
          {
            label: 'VAN',
            anterior: `${anteriores.moneda} ${anteriores.van.toLocaleString('es-PE', { maximumFractionDigits: 2 })}`,
            nuevo: `${nuevos.moneda} ${nuevos.van.toLocaleString('es-PE', { maximumFractionDigits: 2 })}`,
          },
          {
            label: 'TIR',
            anterior: `${anteriores.tir.toFixed(1)}%`,
            nuevo: `${nuevos.tir.toFixed(1)}%`,
          },
          {
            label: 'ROI',
            anterior: `${anteriores.roi.toFixed(1)}%`,
            nuevo: `${nuevos.roi.toFixed(1)}%`,
          },
          {
            label: 'B/C',
            anterior: anteriores.bc.toFixed(2),
            nuevo: nuevos.bc.toFixed(2),
          },
          {
            label: 'Payback',
            anterior:
              anteriores.payback === null || anteriores.payback === undefined
                ? 'No recupera / sin dato'
                : `${Number(anteriores.payback).toFixed(2)} meses`,
            nuevo:
              nuevos.payback === null || nuevos.payback === undefined
                ? 'No recupera / sin dato'
                : `${Number(nuevos.payback).toFixed(2)} meses`,
          },
          {
            label: 'Liquidez',
            anterior: anteriores.liquidez,
            nuevo: nuevos.liquidez,
          },
          {
            label: 'Riesgo',
            anterior:
              anteriores.riesgo === null || anteriores.riesgo === undefined
                ? 'Sin dato'
                : `${Number(anteriores.riesgo).toFixed(0)}%`,
            nuevo:
              nuevos.riesgo === null || nuevos.riesgo === undefined
                ? 'Sin dato'
                : `${Number(nuevos.riesgo).toFixed(0)}%`,
          },
          {
            label: 'Score',
            anterior: `${anteriores.score.toFixed(0)}/100`,
            nuevo: `${nuevos.score.toFixed(0)}/100`,
          },
          {
            label: 'Dictamen',
            anterior: anteriores.recomendacion,
            nuevo: nuevos.recomendacion,
          },
        ];

        return (
          <div className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
            <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 p-5 bg-white/95 dark:bg-slate-800/95 backdrop-blur border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                    🔄 Vista previa de recálculo V3.4
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {recalculoPreview.proyecto.project_name}
                  </p>
                </div>
                <button
                  onClick={() => setRecalculoPreview(null)}
                  disabled={guardandoRecalculo}
                  className="cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-white text-xl disabled:opacity-50"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              <div className="p-5">
                <div className="mb-5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
                  <p className="font-black text-emerald-800 dark:text-emerald-300">
                    ✅ Aún no se ha modificado nada en Supabase.
                  </p>
                  <p className="text-sm text-emerald-700/90 dark:text-emerald-300/90 mt-1">
                    Esta pantalla usa los inputs guardados del proyecto y compara sus resultados anteriores con un cálculo nuevo del motor V3.4.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Motor guardado</p>
                    <p className="font-black text-slate-800 dark:text-white mt-1">{motorAnterior}</p>
                  </div>
                  <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 p-3">
                    <p className="text-[10px] uppercase font-bold text-indigo-500">Motor nuevo</p>
                    <p className="font-black text-indigo-800 dark:text-indigo-200 mt-1">V3.4</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Proyecto original</p>
                    <p className="font-black text-slate-800 dark:text-white mt-1 truncate">
                      {recalculoPreview.proyecto.project_name}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left p-3 font-black text-slate-700 dark:text-slate-200">Indicador</th>
                        <th className="text-left p-3 font-black text-slate-700 dark:text-slate-200">Antes</th>
                        <th className="text-left p-3 font-black text-emerald-700 dark:text-emerald-300">Nuevo V3.4</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map((fila) => (
                        <tr key={fila.label} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                          <td className="p-3 font-black text-slate-600 dark:text-slate-300 bg-slate-50/60 dark:bg-slate-900/30">
                            {fila.label}
                          </td>
                          <td className="p-3 font-bold text-slate-700 dark:text-slate-300">
                            {fila.anterior}
                          </td>
                          <td className="p-3 font-black text-emerald-700 dark:text-emerald-300">
                            {fila.nuevo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3">
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    El recálculo no toma los valores de las plantillas 2026. Usa los inputs que ya estaban guardados en este proyecto.
                  </p>
                  <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-1">
                    “Guardar como copia” conserva intacto el original. “Actualizar original” requiere confirmación adicional.
                  </p>
                </div>

                <div className="flex flex-wrap justify-end gap-3 mt-6">
                  <button
                    onClick={() => setRecalculoPreview(null)}
                    disabled={guardandoRecalculo}
                    className="cursor-pointer px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={guardarRecalculoComoCopia}
                    disabled={guardandoRecalculo}
                    className="cursor-pointer px-5 py-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-black hover:bg-indigo-200 dark:hover:bg-indigo-900/50 disabled:opacity-50"
                  >
                    {guardandoRecalculo ? 'Guardando...' : '📄 Guardar como copia V3.4'}
                  </button>

                  <button
                    onClick={actualizarOriginalConRecalculo}
                    disabled={guardandoRecalculo}
                    className="cursor-pointer px-5 py-3 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {guardandoRecalculo ? 'Actualizando...' : '✅ Actualizar original'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL DE ACCESO */}
      {showAuth && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                  {authMode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Usa la misma cuenta para acceder a tus proyectos desde cualquier equipo.
                </p>
              </div>
              <button
                onClick={() => setShowAuth(false)}
                className="cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-white text-xl"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={autenticar} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  placeholder="tu@correo.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              {authMessage && (
                <div className="rounded-lg bg-slate-100 dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
                  {authMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="cursor-pointer w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-black"
              >
                {authLoading
                  ? 'Procesando...'
                  : authMode === 'login'
                    ? 'Entrar'
                    : 'Crear cuenta'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                setAuthMessage('');
              }}
              className="cursor-pointer w-full mt-4 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {authMode === 'login'
                ? '¿No tienes cuenta? Crear una'
                : 'Ya tengo cuenta. Iniciar sesión'}
            </button>
          </div>
        </div>
      )}

    </main>
  );
}