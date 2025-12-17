import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

// Initialize AI Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- HITECH CONTEXT & PERSONA ---
const HITECH_SYSTEM_PROMPT = `
ERES EL SISTEMA DE IA DE HITECH RTS (HITECH CORE AI).
Tu objetivo es asistir a inversores y usuarios explicando la propuesta de valor, técnica y comercial de HITECH RTS con extrema precisión.

=== CONTEXTO GENERAL DEL PITCH ===
1. PROBLEMA: La industria opera rectificadores "a ciegas" (Cajas Negras). Downtime costoso. Dependencia de técnicos empíricos.
2. SOLUCIÓN: "HITECH Diagnostic Suite". Gestión de activos basada en datos, no en "fe".
3. TRACCIÓN: SRG Global ($225k MXN asegurados), Probabilidad de poliza de manteniento con Flex & Gate.
4. INVERSIÓN SOLICITADA: $330,000 MXN ($200k Deuda Mario, $130k Ops 60 días).

=== BIBLIA TÉCNICA HITECH (DIAGNOSTIC SUITE) ===

1. CONDITION SCORE™ (CS) - SALUD TÉCNICA (0-100)
   - Fórmula Global: (DE · 30%) + (DT · 20%) + (DCtrl · 20%) + (DM · 15%) + (DOH · 15%)
   - Dimensiones:
     * DE (Eléctrica): Estabilidad V/I, rizado (ripple), protecciones.
     * DT (Térmica): Temperaturas, disipación, ventiladores.
     * DCtrl (Electrónica): Tarjetas, alarmas, sensores, HMI.
     * DM (Mecánica): Limpieza, apriete, corrosión, gabinete.
     * DOH (Operacional): Historial de MP, fallas recientes, sobrecargas.
   - Escala:
     * 90-100 (Excelente/Verde): Sano.
     * 75-89 (Bueno/Amarillo): Detalles menores.
     * 60-74 (Riesgoso/Naranja): Anomalías visibles.
     * 0-59 (Crítico/Rojo): Alto riesgo de falla inminente.

2. HEALTH RADAR™ & RISK INDEX (RI)
   - Matriz: Probabilidad (P1-P4) x Impacto (I1-I4).
   - Cálculo RI: (P * I / 16) * 100.
   - Estados Ejecutivos:
     * Stable (RI 0-25): Riesgo bajo.
     * Watch (RI 26-50): Monitoreo.
     * Alert (RI 51-75): Acción corto plazo.
     * Critical (RI 76-100): Atención inmediata.

3. SMARTQUOTE™ & TCO (DECISIÓN DE NEGOCIO)
   - TCO (Total Cost of Ownership): Compara costo de "No hacer nada" (Paros + Scrap) vs Inversión HITECH. Muestra Payback.
   - Opciones de Campaña (DS-03):
     * A (Full Campaign): Intensiva. 100% alcance. Máxima reducción de riesgo rápido. Requiere ventana amplia.
     * B (Split Campaign): Fase 1 (Críticos/Alert) -> Fase 2 (Resto). Balance financiero/operativo.
     * C (High-Flex): Micro-visitas por bloques. Mínimo impacto a producción. Logística compleja.

=== BASE DE DATOS DE ACTIVOS: SRG GLOBAL IRAPUATO (INVENTARIO) ===
Aquí está la lista de los 111 rectificadores. Úsala para responder preguntas sobre estatus, modelos, series y configuración.
FORMATO: ID | Marca | Serial | Modelo | Config | Output V/A | Proceso | Módulos Potencia | Estatus | Año

1 | CRS | Q1CN21203-0032 | Q100 | 1 of 1 | 6V 400A | Chrome Activator | 1 | Needs Upgrade | 2012
2 | CRS | Q5CN21412-0040-1 | Q500 | 1 of 3 | 15V 6000A | Decorative Chrome | 6 | Preventive Maintenance | 2014
3 | CRS | Q5CN21412-0040-2 | Q500 | 2 of 3 | 15V 6000A | Decorative Chrome | 6 | Preventive Maintenance | 2014
4 | CRS | Q5CN21107-0020 | Q500 | 1 of 1 | 8V 4000A | Microporous Nickel | 4 | Needs Upgrade | 2011
5 | CRS | Q5CN21412-0002 | Q500 | 1 of 1 | 15V 4000A | Semi-Bright Nickel | 4 | Preventive Maintenance | 2014
6 | CRS | Q5CN21411-0025 | Q100 | 1 of 1 | 6V 300A | Chrome Activator | 1 | Preventive Maintenance | 2014
7 | CRS | Q5CN21107-0015 | Q500 | 1 of 1 | 8V 4000A | Acid Copper | 4 | Needs Upgrade | 2011
8 | CRS | Q5CN21107-0005 | Q500 | 1 of 1 | 8V 4000A | Acid Copper | 4 | Needs Upgrade | 2011
9 | CRS | Q5CN21107-0006 | Q500 | 1 of 1 | 8V 4000A | Acid Copper | 4 | Needs Upgrade | 2011
10 | CRS | Q5CN21107-0007 | Q500 | 1 of 1 | 8V 4000A | Acid Copper | 4 | Needs Upgrade | 2011
11 | CRS | Q5CN21107-0011 | Q500 | 1 of 1 | 8V 4000A | Acid Copper | 4 | Needs Upgrade | 2011
12 | CRS | Q5CN21207-0005 | Q500 | 1 of 1 | 8V 4000A | Acid Copper | 4 | Needs Upgrade | 2012
13 | CRS | Q5IT11710-0003 | Q500 | 1 of 1 | 15V 1000A | Acid Copper | 1 | Fully Operational | 2017
14 | CRS | Q5IT11710-0006 | Q500 | 1 of 1 | 15V 1000A | Acid Copper | 1 | Fully Operational | 2017
15 | CRS | Q5CN21107-0004 | Q500 | 1 of 1 | 8V 4000A | Acid Copper | 4 | Needs Upgrade | 2011
16 | CRS | Q5CN21107-0008 | Q500 | 1 of 1 | 8V 4000A | Acid Copper | 4 | Needs Upgrade | 2011
17 | CRS | Q5CN21107-0009 | Q500 | 1 of 1 | 8V 4000A | Acid Copper | 4 | Near Obsolescence | 2011
18 | CRS | Q5CN21107-0010 | Q500 | 1 of 1 | 8V 4000A | Acid Copper | 4 | Needs Upgrade | 2011
19 | CRS | Q5CN21107-0016 | Q500 | 1 of 1 | 8V 4000A | Acid Copper | 4 | Needs Upgrade | 2011
20 | CRS | Q5CN21207-0006 | Q500 | 1 of 1 | 8V 4000A | Acid Copper | 4 | Needs Upgrade | 2012
21 | CRS | Q5IT11710-0005 | Q500 | 1 of 1 | 15V 1000A | Acid Copper | 1 | Fully Operational | 2017
22 | CRS | Q5CN21412-0012 | Q500 | 1 of 1 | 10V 4000A | Acid Copper | 4 | Preventive Maintenance | 2014
23 | CRS | Q5CN21412-0013 | Q500 | 1 of 1 | 10V 4000A | Acid Copper | 4 | Preventive Maintenance | 2014
24 | CRS | Q5CN21412-0005 | Q500 | 1 of 1 | 10V 4000A | Acid Copper | 4 | Preventive Maintenance | 2014
25 | CRS | Q5CN21412-0006 | Q500 | 1 of 1 | 10V 4000A | Acid Copper | 4 | Preventive Maintenance | 2014
26 | CRS | Q5CN21412-0015 | Q500 | 1 of 1 | 10V 4000A | Acid Copper | 4 | Preventive Maintenance | 2014
27 | CRS | Q5CN21412-0008 | Q500 | 1 of 1 | 10V 4000A | Acid Copper | 4 | Preventive Maintenance | 2014
28 | CRS | Q5CN21412-0004 | Q500 | 1 of 1 | 10V 4000A | Acid Copper | 4 | Preventive Maintenance | 2014
29 | CRS | Q5CN21412-0007 | Q500 | 1 of 1 | 10V 4000A | Acid Copper | 4 | Preventive Maintenance | 2014
30 | CRS | Q5CN21412-0011 | Q500 | 1 of 1 | 10V 4000A | Acid Copper | 4 | Preventive Maintenance | 2014
31 | CRS | Q5CN21412-0009 | Q500 | 1 of 1 | 10V 4000A | Acid Copper | 4 | Preventive Maintenance | 2014
32 | CRS | Q5CN21412-0010 | Q500 | 1 of 1 | 10V 4000A | Acid Copper | 4 | Preventive Maintenance | 2014
33 | CRS | Q5CN21412-0014 | Q500 | 1 of 1 | 10V 4000A | Acid Copper | 4 | Preventive Maintenance | 2014
35 | CRS | Q5CN21107-0012 | Q500 | 1 of 1 | 8V 4000A | Copper Strike | 4 | Needs Upgrade | 2011
36 | CRS | Q5CN21107-0013 | Q500 | 1 of 1 | 8V 4000A | Copper Strike | 4 | Needs Upgrade | 2011
37 | CRS | Q5CN21412-0026 | Q500 | 1 of 1 | 10V 4000A | Copper Strike | 4 | Preventive Maintenance | 2014
38 | CRS | Q5CN21412-0025 | Q500 | 1 of 1 | 10V 4000A | Copper Strike | 4 | Preventive Maintenance | 2014
39 | CRS | Q5CN21107-0036-1 | Q500 | 1 of 1 | 15V 5000A | Decorative Chrome | 5 | Near Obsolescence | 2011
40 | CRS | Q5CN21107-0036-2 | Q500 | 1 of 1 | 15V 5000A | Decorative Chrome | 5 | Near Obsolescence | 2011
41 | CRS | Q5CN21107-0036-3 | Q500 | 1 of 1 | 15V 5000A | Decorative Chrome | 5 | Near Obsolescence | 2011
42 | CRS | Q5CN21207-0017-1 | Q500 | 1 of 3 | 15V 5000A | Decorative Chrome | 5 | Needs Upgrade | 2012
43 | CRS | Q5CN21207-0017-2 | Q500 | 2 of 3 | 15V 5000A | Decorative Chrome | 5 | Needs Upgrade | 2012
44 | CRS | Q5CN21207-0017-3 | Q500 | 3 of 3 | 15V 5000A | Decorative Chrome | 5 | Needs Upgrade | 2012
45 | CRS | Q5CN21412-0001-1 | Q500 | 1 of 3 | 15V 6000A | Decorative Chrome | 6 | Preventive Maintenance | 2014
46 | CRS | Q5CN21412-0001-2 | Q500 | 2 of 3 | 15V 6000A | Decorative Chrome | 6 | Preventive Maintenance | 2014
47 | CRS | Q5CN21412-0001-3 | Q500 | 3 of 3 | 15V 6000A | Decorative Chrome | 6 | Preventive Maintenance | 2014
48 | CRS | Q5CN21412-0040-3 | Q500 | 3 of 3 | 15V 6000A | Decorative Chrome | 6 | Preventive Maintenance | 2014
49 | CRS | Q5CN21702-0057 | Q500 | 1 of 1 | 15V 5000A | Decorative Chrome | 5 | Fully Operational | 2017
50 | CRS | Q5IT11710-0001 | Q500 | 1 of 1 | 15V 3000A | Decorative Chrome | 3 | Fully Operational | 2017
51 | CRS | Q5CN21107-0029 | Q500 | 1 of 1 | 12V 2000A | Chrome Strip | 2 | Needs Upgrade | 2011
52 | CRS | Q5CN21207-0004 | Q500 | 1 of 1 | 12V 2000A | Chrome Strip | 2 | Needs Upgrade | 2012
53 | CRS | Q5CN21411-0026 | Q500 | 1 of 1 | 12V 4000A | Chrome Strip | 4 | Preventive Maintenance | 2014
54 | CRS | Q5CN21412-0039 | Q500 | 1 of 1 | 12V 4000A | Chrome Strip | 4 | Preventive Maintenance | 2014
55 | CRS | Q5IT11707-0008-1 | Q500 | 1 of 3 | 18V 5000A | Sulfated Chrome | 6 | Fully Operational | 2017
56 | CRS | Q5IT11707-0008-2 | Q500 | 2 of 3 | 18V 5000A | Sulfated Chrome | 6 | Fully Operational | 2017
57 | CRS | Q5IT11707-0008-3 | Q500 | 3 of 3 | 18V 5000A | Sulfated Chrome | 6 | Fully Operational | 2017
58 | CRS | Q5IT11710-0010 | Q500 | 1 of 1 | 15V 1000A | Bright Nickel | 1 | Fully Operational | 2017
59 | CRS | Q5CN21107-0033 | Q500 | 1 of 1 | 15V 5000A | Bright Nickel | 5 | Near Obsolescence | 2011
60 | CRS | Q5CN21107-0034 | Q500 | 1 of 1 | 15V 5000A | Bright Nickel | 5 | Near Obsolescence | 2011
61 | CRS | Q5CN21107-0035 | Q500 | 1 of 1 | 15V 5000A | Bright Nickel | 5 | Near Obsolescence | 2011
62 | CRS | Q5CN21207-0016 | Q500 | 1 of 1 | 15V 5000A | Bright Nickel | 5 | Needs Upgrade | 2012
63 | CRS | Q5CN21412-0031 | Q500 | 1 of 1 | 15V 5000A | Bright Nickel | 5 | Preventive Maintenance | 2014
64 | CRS | Q5CN21411-0032 | Q500 | 1 of 1 | 15V 5000A | Bright Nickel | 5 | Preventive Maintenance | 2014
65 | CRS | Q5CN21411-0029 | Q500 | 1 of 1 | 15V 5000A | Bright Nickel | 5 | Preventive Maintenance | 2014
66 | CRS | Q5CN21411-0030 | Q500 | 1 of 1 | 15V 5000A | Bright Nickel | 5 | Preventive Maintenance | 2014
67 | CRS | Q5CN21207-0014 | Q500 | 1 of 1 | 15V 4000A | Microporous Nickel | 4 | Needs Upgrade | 2012
68 | CRS | Q5IT11710-0008 | Q500 | 1 of 1 | 15V 1000A | Microporous Nickel | 1 | Fully Operational | 2017
69 | CRS | Q5CN21412-0037 | Q500 | 1 of 1 | 15V 4000A | Microporous Nickel | 4 | Preventive Maintenance | 2014
70 | CRS | Q5CN21411-0021 | Q500 | 1 of 1 | 15V 4000A | Microporous Nickel | 4 | Preventive Maintenance | 2014
71 | CRS | Q5IT11603-0010 | Q500 | 1 of 1 | 15V 5000A | Satin Nickel | 5 | Fully Operational | 2016
72 | CRS | Q5IT11603-0011 | Q500 | 1 of 1 | 15V 5000A | Satin Nickel | 5 | Fully Operational | 2016
73 | CRS | Q5IT11710-0007 | Q500 | 1 of 1 | 15V 1000A | Satin Nickel | 1 | Fully Operational | 2017
74 | CRS | Q5IT11710-0009 | Q500 | 1 of 1 | 15V 1000A | Satin Nickel | 1 | Fully Operational | 2017
75 | CRS | Q5CN21207-0013 | Q500 | 1 of 1 | 15V 4000A | Semi-Bright Nickel | 4 | Needs Upgrade | 2012
76 | CRS | Q5IT11710-0011 | Q500 | 1 of 1 | 15V 1000A | Semi-Bright Nickel | 1 | Fully Operational | 2017
77 | CRS | Q5CN21107-0019 | Q500 | 1 of 1 | 15V 4000A | Semi-Bright Nickel | 4 | Near Obsolescence | 2011
78 | CRS | Q5CN21107-0021 | Q500 | 1 of 1 | 15V 4000A | Semi-Bright Nickel | 4 | Near Obsolescence | 2011
79 | CRS | Q5CN21107-0022 | Q500 | 1 of 1 | 15V 4000A | Semi-Bright Nickel | 4 | Near Obsolescence | 2011
80 | CRS | Q5CN21107-0026 | Q500 | 1 of 1 | 15V 4000A | Semi-Bright Nickel | 4 | Near Obsolescence | 2011
81 | CRS | Q5CN21207-0015 | Q500 | 1 of 1 | 15V 4000A | Semi-Bright Nickel | 4 | Needs Upgrade | 2012
82 | CRS | Q5IT11710-0002 | Q500 | 1 of 1 | 15V 1000A | Semi-Bright Nickel | 1 | Fully Operational | 2017
83 | CRS | Q5CN21107-0025 | Q500 | 1 of 1 | 15V 4000A | Semi-Bright Nickel | 4 | Near Obsolescence | 2011
84 | CRS | Q5CN21107-0027 | Q500 | 1 of 1 | 15V 4000A | Semi-Bright Nickel | 4 | Near Obsolescence | 2011
85 | CRS | Q5IT11710-0012 | Q500 | 1 of 1 | 15V 1000A | Semi-Bright Nickel | 1 | Fully Operational | 2017
86 | CRS | Q5CN21411-0019 | Q500 | 1 of 1 | 15V 4000A | Semi-Bright Nickel | 4 | Preventive Maintenance | 2014
87 | CRS | Q5CN21411-0020 | Q500 | 1 of 1 | 15V 4000A | Semi-Bright Nickel | 4 | Preventive Maintenance | 2014
88 | CRS | Q5CN21412-0038 | Q500 | 1 of 1 | 15V 4000A | Semi-Bright Nickel | 4 | Preventive Maintenance | 2014
89 | CRS | Q5CN21412-003 | Q500 | 1 of 1 | 15V 4000A | Semi-Bright Nickel | 4 | Preventive Maintenance | 2014
90 | CRS | Q5CN21411-0018 | Q500 | 1 of 1 | 15V 4000A | Semi-Bright Nickel | 4 | Preventive Maintenance | 2014
91 | CRS | Q5CN21411-0017 | Q500 | 1 of 1 | 15V 4000A | Semi-Bright Nickel | 4 | Preventive Maintenance | 2014
92 | CRS | Q5CN21412-0036 | Q500 | 1 of 1 | 15V 4000A | Semi-Bright Nickel | 4 | Preventive Maintenance | 2014
93 | CRS | Q5IT11707-0007 | Q500 | 1 of 1 | 18V 2000A | Tri Passivation | 3 | Fully Operational | 2017
94 | CRS | Q5CN21107-0032 | Q500 | 1 of 1 | 12V 2000A | Rackstrip | 2 | Needs Upgrade | 2011
95 | CRS | Q5CN21108-0031 | Q500 | 1 of 3 | 12V 2000A | Rackstrip | 2 | Needs Upgrade | 2011
96 | CRS | Q5CN21108-0032 | Q500 | 2 of 3 | 12V 2000A | Rackstrip | 2 | Needs Upgrade | 2011
97 | CRS | Q5CN21109-0029 | Q500 | 3 of 3 | 12V 2000A | Rackstrip | 2 | Needs Upgrade | 2011
98 | CRS | Q5CN21313-0034 | Q500 | 1 of 1 | 12V 4000A | Rackstrip | 4 | Preventive Maintenance | 2014
99 | CRS | Q5CN21107-0028 | Q500 | 1 of 1 | 12V 2000A | Rackstrip | 2 | Needs Upgrade | 2011
100 | CRS | Q5CN21107-0030 | Q500 | 1 of 1 | 12V 2000A | Rackstrip | 2 | Needs Upgrade | 2011
101 | CRS | Q5CN21107-0031 | Q500 | 1 of 1 | 12V 2000A | Rackstrip | 2 | Needs Upgrade | 2011
102 | CRS | Q5CN21312-0033 | Q500 | 1 of 1 | 12V 4000A | Rackstrip | 4 | Needs Upgrade | 2013
103 | CRS | Q5CN21312-0034 | Q500 | 1 of 1 | 12V 4000A | Rackstrip | 4 | Needs Upgrade | 2013
104 | CRS | Q5CN21411-0024 | Q500 | 1 of 1 | 12V 4000A | Rackstrip | 4 | Preventive Maintenance | 2014
105 | CRS | Q5CN21411-0023 | Q500 | 1 of 1 | 12V 4000A | Rackstrip | 4 | Preventive Maintenance | 2014
106 | CRS | Q5CN21411-0022 | Q500 | 1 of 1 | 12V 4000A | Rackstrip | 4 | Preventive Maintenance | 2014
107 | CRS | Q5CN21411-0251 | Q500 | 1 of 1 | 12V 4000A | Rackstrip | 4 | Preventive Maintenance | 2014
108 | CRS | Q5CN21411-0027 | Q500 | 1 of 1 | 10V 3000A | ETCH Recovery | 3 | Preventive Maintenance | 2014
109 | CRS | Q5CN21411-0028 | Q500 | 1 of 1 | 10V 3000A | ETCH Recovery | 3 | Preventive Maintenance | 2014
110 | CRS | Q5CN21107-0017 | Q500 | 1 of 1 | 8V 3000A | ETCH Recovery | 3 | Needs Upgrade | 2011
111 | CRS | Q5CN21107-0018 | Q500 | 1 of 1 | 8V 3000A | ETCH Recovery | 3 | Needs Upgrade | 2011

TONO Y ESTILO:
- Eres un experto técnico senior y consultor de negocios.
- Tus respuestas son estructuradas, usando Markdown (listas, **negritas**).
- Si te preguntan por dinero, enfócate en el ROI y la mitigación de riesgo.
- Si te preguntan por técnica, usa los términos HITECH (CS, RI, DE, DT, etc.).
- Cuando cites equipos de la base de datos, menciona el ID y la serie para precisión.
`;

type Message = {
  role: 'user' | 'model';
  text: string;
  sources?: { title: string; uri: string }[];
};

type Mode = 'chat' | 'fast' | 'think' | 'search' | 'voice';

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('chat');
  const [messages, setMessages] = useState<Message[]>([
  {
    role: 'model',
    text:
      'HITECH CORE v2.2 listo. Soy el sistema de IA de HITECH RTS: te explico negocio, técnica y retorno sobre inversión en español claro. ¿Qué quieres analizar primero: riesgo, dinero o operación?'
  }
]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  
  // Refs for Live API
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const currentSessionRef = useRef<Promise<any> | null>(null);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean up voice on unmount
  useEffect(() => {
    return () => {
      stopVoice();
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      let responseText = '';
      let sources: { title: string; uri: string }[] = [];

      if (mode === 'chat') {
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: userMsg,
          config: { systemInstruction: HITECH_SYSTEM_PROMPT }
        });
        responseText = response.text || "No response generated.";
      } 
      else if (mode === 'fast') {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-lite',
          contents: userMsg,
          config: { systemInstruction: HITECH_SYSTEM_PROMPT }
        });
        responseText = response.text || "No response generated.";
      }
      else if (mode === 'think') {
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: userMsg,
          config: { 
            thinkingConfig: { thinkingBudget: 32768 },
            systemInstruction: HITECH_SYSTEM_PROMPT
          }
        });
        responseText = response.text || "Thinking process complete.";
      }
      else if (mode === 'search') {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userMsg,
          config: { 
            tools: [{ googleSearch: {} }],
            systemInstruction: HITECH_SYSTEM_PROMPT + " Busca información técnica actualizada sobre rectificadores industriales, precios de cobre, o tendencias de mantenimiento predictivo si es necesario."
          }
        });
        responseText = response.text || "Search complete.";
        
        // Extract grounding
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          sources = chunks
            .map((c: any) => c.web)
            .filter((w: any) => w)
            .map((w: any) => ({ title: w.title, uri: w.uri }));
        }
      }

      setMessages(prev => [...prev, { role: 'model', text: responseText, sources }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Error processing request. Check console." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Voice Logic ---
  const startVoice = async () => {
    setIsVoiceActive(true);
    setMessages(prev => [...prev, { role: 'model', text: "Conectando con HITECH VOICE..." }]);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      
      // Output Audio Context (24kHz for response)
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: HITECH_SYSTEM_PROMPT + " Responde de manera concisa y hablada. Eres el experto técnico de HITECH. Usa respuestas cortas ideales para conversación."
        },
        callbacks: {
          onopen: () => {
             setMessages(prev => [...prev, { role: 'model', text: "Voz Conectada. Te escucho." }]);
             
             // Setup Input Stream
             const source = audioCtx.createMediaStreamSource(stream);
             const processor = audioCtx.createScriptProcessor(4096, 1, 1);
             
             processor.onaudioprocess = (e) => {
               const inputData = e.inputBuffer.getChannelData(0);
               const pcmData = base64EncodeAudio(inputData);
               
               sessionPromise.then(session => {
                  session.sendRealtimeInput({
                    media: {
                      mimeType: 'audio/pcm;rate=16000',
                      data: pcmData
                    }
                  });
               });
             };
             
             source.connect(processor);
             processor.connect(audioCtx.destination);
             
             sourceNodeRef.current = source;
             processorRef.current = processor;
          },
          onmessage: async (msg: LiveServerMessage) => {
             const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (audioData) {
                const audioBuffer = await decodeAudio(audioData, outputCtx);
                playAudio(audioBuffer, outputCtx);
             }
             if (msg.serverContent?.interrupted) {
                cancelAudio();
             }
          },
          onclose: () => {
             console.log("Session closed");
             if (isVoiceActive) stopVoice();
          },
          onerror: (err) => {
             console.error("Session error", err);
             if (isVoiceActive) stopVoice();
          }
        }
      });
      
      currentSessionRef.current = sessionPromise;

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: "Failed to start voice mode." }]);
      setIsVoiceActive(false);
    }
  };

  const stopVoice = () => {
    setIsVoiceActive(false);
    
    // Stop tracks
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    
    // Disconnect nodes
    processorRef.current?.disconnect();
    sourceNodeRef.current?.disconnect();
    
    // Close context
    audioContextRef.current?.close();
    
    // Close Session
    if (currentSessionRef.current) {
      currentSessionRef.current.then((session: any) => session.close());
    }

    currentSessionRef.current = null;
  };

  const toggleVoice = () => {
    if (isVoiceActive) stopVoice();
    else startVoice();
  };

  // Audio Helpers
  function base64EncodeAudio(float32Array: Float32Array): string {
     const int16Array = new Int16Array(float32Array.length);
     for (let i = 0; i < float32Array.length; i++) {
       let s = Math.max(-1, Math.min(1, float32Array[i]));
       int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
     }
     const uint8Array = new Uint8Array(int16Array.buffer);
     let binary = '';
     for(let i=0; i<uint8Array.byteLength; i++) binary += String.fromCharCode(uint8Array[i]);
     return btoa(binary);
  }

  async function decodeAudio(base64: string, ctx: AudioContext) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for(let i=0; i<binary.length; i++) bytes[i] = binary.charCodeAt(i);
    
    const float32 = new Float32Array(bytes.length / 2);
    const dataView = new DataView(bytes.buffer);
    for (let i = 0; i < float32.length; i++) {
        float32[i] = dataView.getInt16(i * 2, true) / 32768.0;
    }
    
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);
    return buffer;
  }

  function playAudio(buffer: AudioBuffer, ctx: AudioContext) {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    const now = ctx.currentTime;
    const start = Math.max(now, nextStartTimeRef.current);
    source.start(start);
    nextStartTimeRef.current = start + buffer.duration;
    
    audioQueueRef.current.push(source);
    source.onended = () => {
       audioQueueRef.current = audioQueueRef.current.filter(s => s !== source);
    };
  }

  function cancelAudio() {
    audioQueueRef.current.forEach(s => s.stop());
    audioQueueRef.current = [];
    nextStartTimeRef.current = 0;
  }
  
  // --- UI ---

  return (
    <>
       {/* Toggle Button */}
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className="fixed bottom-8 right-8 w-16 h-16 bg-cyan/10 border-2 border-cyan rounded-full flex items-center justify-center text-3xl shadow-[0_0_20px_#00F0FF] hover:bg-cyan hover:text-black transition-all z-50 group"
       >
         {isOpen ? '✖' : '🤖'}
       </button>

       {/* Window */}
       {isOpen && (
         <div className="fixed bottom-28 right-8 w-[400px] h-[600px] bg-panel border border-cyan/50 rounded-lg flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] z-50 animate-fade-up">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40 rounded-t-lg">
               <h3 className="font-display font-bold text-white tracking-wider">HITECH AI</h3>
               <div className="flex gap-2">
                 <select 
                   className="bg-black border border-cyan/50 text-cyan text-xs p-1 rounded font-code uppercase"
                   value={mode}
                   onChange={(e) => setMode(e.target.value as Mode)}
                   disabled={isVoiceActive}
                 >
                   <option value="chat">Chat (Pro 3)</option>
                   <option value="fast">Fast (Flash Lite)</option>
                   <option value="think">Think (Reasoning)</option>
                   <option value="search">Search (Google)</option>
                   <option value="voice">Voice (Live)</option>
                 </select>
               </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-main">
               {messages.map((m, i) => (
                 <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-cyan/20 border border-cyan/30 text-white' : 'bg-white/10 border border-white/20 text-gray-200'}`}>
                       <div dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    </div>
                    {/* Sources */}
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-2 text-xs text-gray-400 max-w-[85%]">
                        <span className="font-bold text-gold">SOURCES:</span>
                        <ul className="list-disc pl-4 mt-1">
                          {m.sources.map((s, idx) => (
                            <li key={idx}><a href={s.uri} target="_blank" rel="noopener noreferrer" className="hover:text-cyan underline truncate block">{s.title}</a></li>
                          ))}
                        </ul>
                      </div>
                    )}
                 </div>
               ))}
               {isLoading && <div className="text-cyan text-xs font-code animate-pulse">PROCESSING...</div>}
               <div ref={messagesEndRef}></div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-black/40 rounded-b-lg">
               {mode === 'voice' ? (
                  <button 
                    onClick={toggleVoice}
                    className={`w-full py-3 font-display font-bold tracking-widest border rounded transition-all ${isVoiceActive ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'bg-cyan/20 border-cyan text-cyan hover:bg-cyan hover:text-black'}`}
                  >
                    {isVoiceActive ? 'STOP VOICE' : 'START LIVE SESSION'}
                  </button>
               ) : (
                  <div className="flex gap-2">
                     <input 
                       type="text" 
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                       placeholder="Ask HITECH system..."
                       className="flex-1 bg-black/50 border border-white/20 rounded px-3 py-2 text-white text-sm focus:border-cyan outline-none font-code"
                     />
                     <button 
                       onClick={handleSend}
                       disabled={isLoading}
                       className="bg-gold/20 border border-gold text-gold px-4 py-2 rounded hover:bg-gold hover:text-black transition-all font-bold"
                     >
                       ➤
                     </button>
                  </div>
               )}
            </div>
         </div>
       )}
    </>
  );
}