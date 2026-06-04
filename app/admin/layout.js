'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, isMockMode } from '@/lib/supabase';
import styles from './admin.module.css';

// Rotas que não precisam de autenticação
const ROTAS_PUBLICAS = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState(null);

  // VERIFICAR SESSÃO
  useEffect(() => {
    // Se for rota pública, não faz nada
    if (ROTAS_PUBLICAS.includes(pathname)) {
      setCarregando(false);
      return;
    }

    let isMounted = true;

    const verificarSessao = async () => {
      try {
        let temSessao = false;

        if (isMockMode) {
          // Verifica mock
          if (typeof window !== 'undefined') {
            const sessaoMock = localStorage.getItem('barber_session');
            if (sessaoMock) {
              temSessao = true;
              setUsuario(JSON.parse(sessaoMock).user);
            }
          }
        } else {
          // Verifica Supabase
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            temSessao = true;
            setUsuario(session.user);
          }
        }

        // Se não tem sessão, redireciona para login
        if (!temSessao && isMounted) {
          console.log('Sem sessão, redirecionando para login...');
          router.replace('/admin/login');
        }
      } catch (err) {
        console.error('Erro ao verificar sessão:', err);
      } finally {
        if (isMounted) {
          setCarregando(false);
        }
      }
    };

    verificarSessao();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  const fazerLogout = async () => {
    try {
      if (isMockMode) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('barber_session');
          localStorage.removeItem('barber_slug');
        }
      } else {
        await supabase.auth.signOut();
      }
      router.replace('/admin/login');
    } catch (err) {
      console.error('Erro no logout:', err);
      router.replace('/admin/login');
    }
  };

  if (carregando) {
    return (
      <div style={{ 
        display: 'flex', 
        width: '100vw', 
        height: '100vh', 
        backgroundColor: 'var(--bg-primary)', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: 'var(--text-secondary)' 
      }}>
        Carregando...
      </div>
    );
  }

  // Se for rota pública, renderiza sem sidebar
  if (ROTAS_PUBLICAS.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Painel Admin</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href="/c/garagem-barber" target="_blank" style={{ textDecoration: 'none', color: 'var(--primary)' }}>
            Ver Página Pública
          </a>
          <button onClick={fazerLogout} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
            Sair
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
