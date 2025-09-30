// app/analytics/page.tsx
import { Suspense } from 'react'
import AnalyticsClientPage from './AnalyticsClientPage'
import AnalyticsLoading from './loading'

// Este es ahora un Componente de Servidor
export default function AnalyticsPage() {
  return (
    // Suspense le dice a Next.js: "Mientras AnalyticsClientPage carga, muestra el fallback"
    <Suspense fallback={<AnalyticsLoading />}>
      <AnalyticsClientPage />
    </Suspense>
  )
}