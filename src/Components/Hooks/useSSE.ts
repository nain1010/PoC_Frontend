import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import config from '../../config';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SSE_URL = `${config.api.API_URL}/events`;

export function useSSE() {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const authUserStr = (sessionStorage.getItem("authUser") || localStorage.getItem("authUser"));
  const authUser = authUserStr ? JSON.parse(authUserStr) : null;
  const currentUserId = authUser ? (authUser.id || authUser.usuario_id) : null;

  useEffect(() => {
    if (esRef.current) return;

    const es = new EventSource(SSE_URL);
    esRef.current = es;

    es.addEventListener('project_created', () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    });

    es.addEventListener('project_deleted', () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    });

    es.addEventListener('member_updated', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.project_id) {
          queryClient.invalidateQueries({ queryKey: ['project', data.project_id] });
          queryClient.invalidateQueries({ queryKey: ['activity', data.project_id] });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        if (data.actor_id && data.actor_id !== currentUserId) {
          // toast.info('Actualización remota en el proyecto detectada.', { position: 'top-right', autoClose: 3000 });
        }
        }
      } catch {
        queryClient.invalidateQueries({ queryKey: ['project'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    });

    es.addEventListener('project_updated', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.project_id) {
          queryClient.invalidateQueries({ queryKey: ['project', data.project_id] });
          queryClient.invalidateQueries({ queryKey: ['velocity', data.project_id] });
          queryClient.invalidateQueries({ queryKey: ['capacity', data.project_id] });
          queryClient.invalidateQueries({ queryKey: ['activity', data.project_id] });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          if (data.actor_id && data.actor_id !== currentUserId) {
            // toast.info('Actualización remota en el proyecto detectada.', { position: 'top-right', autoClose: 3000 });
          }
        }
      } catch {
        queryClient.invalidateQueries({ queryKey: ['project'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    });

    es.addEventListener('user_created', () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    });

    es.addEventListener('user_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    });

    es.addEventListener('user_deleted', () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    });

    // --- Pages events (sidebar tree + page content) ---
    es.addEventListener('page_created', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.project_id) {
          queryClient.invalidateQueries({ queryKey: ['pages', data.project_id] });
        }
      } catch {
        queryClient.invalidateQueries({ queryKey: ['pages'] });
      }
    });

    es.addEventListener('page_updated', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.project_id) {
          queryClient.invalidateQueries({ queryKey: ['pages', data.project_id] });
        }
      } catch {
        queryClient.invalidateQueries({ queryKey: ['pages'] });
      }
    });

    es.addEventListener('page_deleted', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.project_id) {
          queryClient.invalidateQueries({ queryKey: ['pages', data.project_id] });
        }
      } catch {
        queryClient.invalidateQueries({ queryKey: ['pages'] });
      }
    });

    es.onerror = () => {
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [queryClient]);
}
