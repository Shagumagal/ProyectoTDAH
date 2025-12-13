import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ResultadosAlumno } from '../types';
import { inferDSM5 } from '../utils/dsm5';

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  label: {
    fontSize: 10,
    color: '#475569',
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  studentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 4,
  },
  infoItem: {
    flexDirection: 'column',
  },
  infoLabel: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 8,
    color: 'white',
  },
  badgeHigh: { backgroundColor: '#ef4444' },
  badgeMed: { backgroundColor: '#f59e0b' },
  badgeLow: { backgroundColor: '#10b981' },
});

const MetricRow = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, highlight ? { color: '#4f46e5' } : {}]}>{value}</Text>
  </View>
);

const Section = ({ title, children, style = {} }: { title: string, children: React.ReactNode, style?: any }) => (
  <View style={[styles.section, style]}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

export const ResultsPDF = ({ data }: { data: ResultadosAlumno }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reporte de Resultados Cognitivos</Text>
          <Text style={styles.subtitle}>Evaluación de Atención, Control Inhibitorio y Planificación</Text>
        </View>

        {/* Student Info */}
        <View style={styles.studentInfo}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Alumno</Text>
            <Text style={styles.infoValue}>{data.alumno.nombre || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>ID</Text>
            <Text style={styles.infoValue}>{data.alumno.id}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Edad</Text>
            <Text style={styles.infoValue}>{data.alumno.edad ? `${data.alumno.edad} años` : 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Fecha</Text>
            <Text style={styles.infoValue}>{new Date(data.fecha).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Go/No-Go Section */}
        <Section title="1. Atención e Inhibición (Go/No-Go)">
          <View style={styles.grid}>
            <View style={styles.col}>
              <MetricRow label="Precisión (Accuracy)" value={`${(data.goNoGo.accuracy * 100).toFixed(1)}%`} highlight />
              <MetricRow label="Tasa de Comisiones" value={`${(data.goNoGo.commissionRate * 100).toFixed(1)}%`} />
              <MetricRow label="Tasa de Omisiones" value={`${(data.goNoGo.omissionRate * 100).toFixed(1)}%`} />
            </View>
            <View style={styles.col}>
              <MetricRow label="Tiempo de Reacción" value={`${data.goNoGo.medianRT.toFixed(3)}s`} />
              <MetricRow label="Variabilidad (CV)" value={data.goNoGo.cvRT.toFixed(2)} />
              <MetricRow label="Fatiga (Vigilance)" value={(data.goNoGo.vigilanceDecrement || 0).toFixed(2)} />
            </View>
          </View>
        </Section>

        {/* Stop Signal Section */}
        <Section title="2. Control Inhibitorio (Stop Signal)">
          <View style={styles.grid}>
            <View style={styles.col}>
              <MetricRow label="Fallas de Stop" value={`${(data.stopSignal.stopFailureRate * 100).toFixed(1)}%`} highlight />
              <MetricRow label="SSRT (Vel. Frenado)" value={`${((data.stopSignal.ssrt || 0) * 1000).toFixed(0)}ms`} highlight />
            </View>
            <View style={styles.col}>
              <MetricRow label="Tiempo Reacción (Go)" value={`${data.stopSignal.medianRT.toFixed(3)}s`} />
              <MetricRow label="SSD Promedio" value={`${((data.stopSignal.ssdAverage || 0) * 1000).toFixed(0)}ms`} />
            </View>
          </View>
        </Section>

        {/* Tower of London Section */}
        {data.tol && (
          <Section title="3. Planificación (Torre de Londres)">
            <View style={styles.grid}>
              <View style={styles.col}>
                <MetricRow label="Latencia Planificación" value={`${data.tol.planLatency.toFixed(1)}s`} highlight />
                <MetricRow label="Puntaje Planificación" value={`${((data.tol.planningScore || 0) * 100).toFixed(0)}%`} />
              </View>
              <View style={styles.col}>
                <MetricRow label="Movimientos Extra" value={data.tol.excessMoves.toString()} />
                <MetricRow label="Violaciones de Reglas" value={data.tol.ruleViolations.toString()} />
              </View>
            </View>
          </Section>
        )}

        {/* Hyperactivity Section (if available) */}
        {data.tol?.hyperactivity && (
          <Section title="4. Análisis de Actividad Motora (Hiperactividad)">
            <View style={styles.grid}>
              <View style={styles.col}>
                <MetricRow label="Movimiento Frenético" value={`${((data.tol.hyperactivity.freneticMovement || 0) * 100).toFixed(0)}%`} />
                <MetricRow label="Clics Innecesarios" value={(data.tol.hyperactivity.unnecessaryClicks || 0).toString()} />
              </View>
              <View style={styles.col}>
                <MetricRow label="Distancia Mouse" value={`${((data.tol.hyperactivity.mouseDistance || 0) / 1000).toFixed(1)}k px`} />
                <MetricRow label="Impulsividad Motora" value={(data.tol.hyperactivity.clickRate || 0) > 0.5 ? "Alta" : "Normal"} />
              </View>
            </View>
          </Section>
        )}

        {/* AI Analysis Section */}
        {data.aiAnalysisText && (
          <Section title="5. Interpretación Clínica Automatizada (Asesor IA)">
             <View style={{ padding: 8, backgroundColor: '#f0f9ff', borderRadius: 4, borderWidth: 1, borderColor: '#bae6fd' }}>
                <Text style={{ fontSize: 10, lineHeight: 1.6, color: '#0369a1', textAlign: 'justify' }}>
                  {data.aiAnalysisText}
                </Text>
             </View>
          </Section>
        )}

        {/* DSM-5 Criteria Section */}
        <Section title="6. Criterios DSM-5-TR Asociados (Orientativo)">
          <View style={styles.grid}>
            {inferDSM5(data)
              .filter(c => !c.medidoPor.includes("No medido") && !c.medidoPor.includes("No medido por juegos actuales"))
              .map((c) => (
              <View key={c.id} style={{ width: '100%', marginBottom: 6, paddingBottom: 6, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#334155', flex: 1 }}>{c.id} - {c.label}</Text>
                  <View style={[
                    styles.badge, 
                    c.evidencia === 'fuerte' ? styles.badgeHigh : 
                    c.evidencia === 'moderada' ? styles.badgeMed : 
                    c.evidencia === 'debil' ? styles.badgeLow : { backgroundColor: '#cbd5e1' }
                  ]}>
                    <Text style={{ color: 'white', fontSize: 8 }}>
                      {c.evidencia === 'sin' ? 'Baja' : c.evidencia.charAt(0).toUpperCase() + c.evidencia.slice(1)}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 8, color: '#64748b' }}>
                  Medido por: {c.medidoPor.join(", ")}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Footer */}
        <Text style={styles.footer}>
          Este reporte es generado automáticamente y no constituye un diagnóstico clínico. 
          Página 1 de 1 - Generado el {new Date().toLocaleString()}
        </Text>
      </Page>
    </Document>
  );
};
