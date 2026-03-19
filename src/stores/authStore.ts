import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { estaOnline } from '../lib/sync';
import { guardarCredencialesCache, verificarCredencialesOffline, limpiarCredencialesCache } from '../lib/offlineAuth';
import type { Perfil } from '../types';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  perfil: Perfil | null;
  loading: boolean;
  error: string | null;
  
  // Acciones
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  incrementarIntentosFallidos: () => Promise<void>;
  resetearIntentosFallidos: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  perfil: null,
  loading: true,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });

      const online = estaOnline();

      if (online) {
        // Modo online: login normal con Supabase
        // Intentar login primero
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          // Obtener perfil del usuario
          const { data: perfil, error: perfilError } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (perfilError) throw perfilError;

          // Verificar si el usuario está bloqueado
          if (perfil?.bloqueado_hasta) {
            const bloqueadoHasta = new Date(perfil.bloqueado_hasta);
            if (bloqueadoHasta > new Date()) {
              const minutosRestantes = Math.ceil((bloqueadoHasta.getTime() - Date.now()) / 60000);
              // Cerrar sesión si está bloqueado
              await supabase.auth.signOut();
              throw new Error(`Cuenta bloqueada. Intenta de nuevo en ${minutosRestantes} minutos.`);
            }
          }

          // Resetear intentos fallidos en login exitoso
          await get().resetearIntentosFallidos();

          // Guardar credenciales en caché para modo offline
          await guardarCredencialesCache(email, password, perfil);

          set({ user: data.user, perfil, loading: false, error: null });
        }
      } else {
        // Modo offline: verificar credenciales en caché
        const resultado = await verificarCredencialesOffline(email, password);

        if (!resultado.valido) {
          throw new Error('Credenciales incorrectas o no disponibles offline');
        }

        // Crear un objeto User simulado para modo offline
        const offlineUser: User = {
          id: resultado.perfil.id,
          email: email,
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as User;

        set({
          user: offlineUser,
          perfil: resultado.perfil,
          loading: false,
          error: null,
        });

        console.log('Login offline exitoso');
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ loading: true });
      
      const { user } = get();
      const online = estaOnline();

      if (online) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }

      // Limpiar credenciales en caché
      if (user?.email) {
        await limpiarCredencialesCache(user.email);
      }

      set({ user: null, perfil: null, loading: false, error: null });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  checkAuth: async () => {
    try {
      set({ loading: true });
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', user.id)
          .single();

        set({ user, perfil, loading: false });
      } else {
        set({ user: null, perfil: null, loading: false });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  incrementarIntentosFallidos: async () => {
    const { user } = get();
    if (!user) return;

    try {
      // Obtener intentos actuales y datos del perfil
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('intentos_fallidos, nombre, email')
        .eq('id', user.id)
        .single();

      const intentos = (perfil?.intentos_fallidos || 0) + 1;

      // Si llega a 3 intentos, bloquear por 15 minutos
      if (intentos >= 3) {
        const bloqueadoHasta = new Date();
        bloqueadoHasta.setMinutes(bloqueadoHasta.getMinutes() + 15);

        await supabase
          .from('perfiles')
          .update({
            intentos_fallidos: intentos,
            bloqueado_hasta: bloqueadoHasta.toISOString(),
          })
          .eq('id', user.id);

        // Notificar al Dueño por correo
        try {
          // Obtener email del Dueño
          const { data: dueno } = await supabase
            .from('perfiles')
            .select('email')
            .eq('rol', 'Dueño')
            .single();

          if (dueno?.email) {
            // Llamar a Edge Function para enviar notificación
            await supabase.functions.invoke('notificar-bloqueo', {
              body: {
                emailDueno: dueno.email,
                usuarioBloqueado: perfil?.nombre || perfil?.email || 'Usuario desconocido',
                emailBloqueado: perfil?.email,
                bloqueadoHasta: bloqueadoHasta.toISOString(),
              },
            });
          }
        } catch (notifError) {
          console.error('Error al notificar al Dueño:', notifError);
          // No lanzar error para no interrumpir el flujo de bloqueo
        }
      } else {
        await supabase
          .from('perfiles')
          .update({ intentos_fallidos: intentos })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error al incrementar intentos fallidos:', error);
    }
  },

  resetearIntentosFallidos: async () => {
    const { user } = get();
    if (!user) return;

    try {
      await supabase
        .from('perfiles')
        .update({
          intentos_fallidos: 0,
          bloqueado_hasta: null,
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error al resetear intentos fallidos:', error);
    }
  },
}));
