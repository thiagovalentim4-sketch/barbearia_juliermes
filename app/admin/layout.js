'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, isMockMode } from '@/lib/supabase';
import styles from './admin.module.css';
import { Calendar, Scissors, LogOut, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    // Se for a tela de login, não precisa checar sessão para bloquear
    if (pathname === '/admin/login') {
      setCarregando(false);
      return;
    }

    async function verificarSessao() {
      try {
        if (isMockMode) {
          const sessaoMock = localStorage.getItem('barber_session');
          if (!sessaoMock) {
            router.push('/admin/login');
          } else {
            setUsuario(JSON.parse(sessaoMock).user);
          }
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            router.push('/admin/login');
          } else {
            setUsuario(session.user);
          }
        }
      } catch (err) {
        console.error('Erro ao verificar sessão:', err);
        router.push('/admin/login');
      } finally {
        setCarregando(false);
      }
    }

    verificarSessao();
  }, [pathname, router]);

  const fazerLogout = async () => {
    if (isMockMode) {
      localStorage.removeItem('barber_session');
      router.push('/admin/login');
    } else {
      await supabase.auth.signOut();
      router.push('/admin/login');
    }
  };

  if (carregando) {
    return (
      <div style={{ display: 'flex', width: '100vw', height: '100vh', backgroundColor: 'var(--bg-primary)', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
        <span style={{ marginLeft: 12 }}>Verificando credenciais...</span>
      </div>
    );
  }

  // Se for a página de login, renderiza puro sem a barra lateral
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className={styles.adminWrapper}>
      {/* Barra Lateral Administrativa */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Scissors size={22} style={{ color: 'var(--primary)' }} />
          <span className="text-gradient">BarberSaaS</span>
        </div>

        <nav className={styles.navLinks}>
          <Link href="/admin/dashboard" className={`${styles.navLink} ${pathname === '/admin/dashboard' ? styles.navLinkActive : ''}`}>
            <Calendar size={18} />
            <span>Agenda</span>
          </Link>
          <Link href="/admin/servicos" className={`${styles.navLink} ${pathname === '/admin/servicos' ? styles.navLinkActive : ''}`}>
            <Scissors size={18} />
            <span>Serviços</span>
          </Link>
          
          {/* Link para página pública */}
          <a 
            href="/c/garagem-barber" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.navLink}
            style={{ marginTop: 'auto', border: '1px dashed var(--border)' }}
          >
            <ExternalLink size={16} />
            <span style={{ fontSize: '0.85rem' }}>Ver Página Pública</span>
          </a>
        </nav>

        <button 
          onClick={fazerLogout} 
          className={styles.navLink} 
          style={{ width: '100%', marginTop: 'auto', color: 'var(--error)', backgroundColor: 'transparent', border: 'none', textAlign: 'left' }}
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </aside>

      {/* Conteúdo Principal */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
