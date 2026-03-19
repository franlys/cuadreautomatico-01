import { useEffect, useState } from 'react';

/**
 * Componente que detecta actualizaciones del PWA y permite actualizar manualmente
 */
export function ActualizadorPWA() {
  const [mostrarActualizacion, setMostrarActualizacion] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Registrar el Service Worker y detectar actualizaciones
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        // Verificar actualizaciones cada 60 segundos
        setInterval(() => {
          reg.update();
        }, 60000);

        // Detectar cuando hay una actualización esperando
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('Nueva versión disponible');
                setMostrarActualizacion(true);
              }
            });
          }
        });
      });

      // Detectar cuando el Service Worker está listo para activarse
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const actualizarAhora = () => {
    if (registration?.waiting) {
      // Enviar mensaje al Service Worker para que se active inmediatamente
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  const cerrarNotificacion = () => {
    setMostrarActualizacion(false);
  };

  if (!mostrarActualizacion) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-blue-600 text-white rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Nueva versión disponible</h3>
          <p className="text-sm text-blue-100 mb-3">
            Hay una actualización disponible. Actualiza para obtener las últimas mejoras.
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={actualizarAhora}
              className="px-4 py-2 bg-white text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Actualizar ahora
            </button>
            <button
              onClick={cerrarNotificacion}
              className="px-4 py-2 bg-blue-700 text-white rounded-md text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              Más tarde
            </button>
          </div>
        </div>
        
        <button
          onClick={cerrarNotificacion}
          className="flex-shrink-0 text-blue-200 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
