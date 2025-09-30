// app/analytics/loading.tsx
export default function AnalyticsLoading() {
  // Puedes crear un esqueleto de carga más elaborado si lo deseas
  return (
    <main style={{ padding: '32px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Panel de Analíticas</h1>
      <p style={{ marginTop: '50px', color: 'var(--brand-muted)' }}>
        Cargando gráficos y datos...
      </p>
    </main>
  );
}