'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isMockMode } from '@/lib/supabase';
import styles from '../admin.module.css';
import { Lock, Mail, Scissors } from 'lucide-react';

export default function PaginaLoginAdmin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    // Verificar se já está logado
    if (typeof window !== 'undefined') {
      const sessaoMock = localStorage.getItem('barber_session');
      if (sessaoMock) {
        router.push('/admin/dashboard');
        return;
      }
    }

    if (!isMockMode) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.push('/admin/dashboard');
        }
      });
    }
  }, [router]);

  const lidarComLogin = async (e) => {
    e.preventDefault();
    if (!email || !senha) {
      setErro('Por favor, preencha todos os campos.');
      return;
    }

    try {
      setCarregando(true);
      setErro('');

      if (isMockMode) {
        // Modo Mock: Salvar sessão fictícia e redirecionar
        localStorage.setItem(
          'barber_session',
          JSON.stringify({
            user: { email, id: 'mock-user-uuid' },
            token: 'mock-jwt-token'
          })
        );
        
        // Adicionar uma barbearia mockada ao localStorage para os fluxos funcionarem
        localStorage.setItem('barber_slug', 'garagem-barber');

        router.push('/admin/dashboard');
      } else {
        // Supabase Auth Real
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: senha
        });

        if (error) throw error;
        router.push('/admin/dashboard');
      }
    } catch (err) {
      console.error('Erro de autenticação:', err);
      setErro(err.message || 'Credenciais inválidas. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className={styles.adminWrapper} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          
          <div className={styles.loginHeader}>
            <div className="flex-center" style={{ width: '48px', height: '48px', margin: '0 auto 16px', borderRadius: '50%', backgroundColor: 'rgba(212, 175, 55, 0.1)', color: 'var(--primary)' }}>
              <Scissors size={24} />
            </div>
            <h1 className="text-gradient" style={{ fontSize: '1.6rem', fontWeight: 800 }}>BarberSaaS Admin</h1>
            <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: 4 }}>
              Acesse sua agenda e configure seu painel
            </p>
          </div>

          {isMockMode && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '0.8rem', color: 'var(--warning)', textAlign: 'center' }}>
              💡 Executando em **Modo Demonstração (Mock)**. Digite qualquer e-mail/senha para testar!
            </div>
          )}

          {erro && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.8rem', color: 'var(--error)', textAlign: 'center' }}>
              ❌ {erro}
            </div>
          )}

          <form onSubmit={lidarComLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label className="input-label" htmlFor="email-input">E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  id="email-input"
                  className="input-field" 
                  style={{ paddingLeft: '44px' }}
                  placeholder="barbeiro@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="password-input">Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  id="password-input"
                  className="input-field" 
                  style={{ paddingLeft: '44px' }}
                  placeholder="Sua senha secreta" 
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 8 }}
              disabled={carregando}
            >
              {carregando ? 'Acessando...' : 'Entrar no Painel'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
