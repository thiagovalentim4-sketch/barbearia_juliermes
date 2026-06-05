'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import styles from './admin.module.css';

// Rotas que não precisam de autenticação
const ROTAS_PUBLICAS = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

        const { data: { session }, error } = await supabase.auth.getSession();
        if (session) {
          temSessao = true;
          setUsuario(session.user);
        } else if (error) {
          console.error('Erro ao buscar sessão Supabase:', error);
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
      await supabase.auth.signOut();
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

  if (!isSupabaseConfigured) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
        <div style={{ maxWidth: 560, width: '100%', borderRadius: 20, border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', padding: 28, boxShadow: 'var(--shadow-lg)' }}>
          <h1 style={{ margin: 0, marginBottom: 12, fontSize: '1.6rem' }}>Supabase não configurado</h1>
          <p style={{ margin: 0, lineHeight: 1.6 }}>Para usar o painel admin localmente e no Vercel, configure as variáveis de ambiente <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.</p>
          <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>No Vercel, adicione essas variáveis em Settings &rarr; Environment Variables. Em local, preencha <code>.env.local</code>.</p>
        </div>
      </div>
    );
  }

  // Se for rota pública, renderiza sem sidebar
  if (ROTAS_PUBLICAS.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className={styles.adminWrapper}>
      {/* Mobile Header */}
      <div className={styles.mobileHeader}>
        <button className={styles.hamburgerBtn} onClick={() => setSidebarOpen(true)} aria-label="Abrir menu">☰</button>
        <div className={styles.mobileBrand}>BarberSaaS</div>
      </div>

      {/* Sidebar overlay (mobile) */}
      <div
        className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.sidebarOverlayOpen : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar (desktop + mobile slide-in) */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>BarberSaaS</div>
        <nav className={styles.navLinks}>
          <a className={styles.navLink} href="/admin/dashboard" onClick={() => setSidebarOpen(false)}>Dashboard</a>
          <a className={styles.navLink} href="/admin/servicos" onClick={() => setSidebarOpen(false)}>Serviços</a>
          <a className={styles.navLink} href="/c/garagem-barber" target="_blank" rel="noreferrer" onClick={() => setSidebarOpen(false)}>Ver Página Pública</a>
        </nav>
        <div>
          <button className={styles.navLink} onClick={fazerLogout} style={{ background: 'none', border: 'none', padding: 12, textAlign: 'left' }}>Sair</button>
        </div>
      </aside>

      <div className={styles.mainContent}>
        <div className={styles.sectionHeader}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Painel Admin</h1>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <a href="/c/garagem-barber" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'var(--primary)' }}>
              Ver Página Pública
            </a>
            <button onClick={fazerLogout} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
              Sair
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
