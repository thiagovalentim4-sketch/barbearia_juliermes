'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from '../admin.module.css';
import { Lock, Mail, Scissors } from 'lucide-react';

export default function PaginaLoginAdmin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const lidarComLogin = async (e) => {
    e.preventDefault();
    if (!email || !senha) {
      setErro('Por favor, preencha todos os campos.');
      return;
    }

    try {
      setCarregando(true);
      setErro('');

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

      if (error) throw error;
      router.replace('/admin/dashboard');
    } catch (err) {
      console.error('Erro de autenticação:', err);
      let mensagem = 'Credenciais inválidas. Tente novamente.';
      if (err.message && err.message.includes('Invalid login credentials')) {
        mensagem = 'E-mail ou senha incorretos. Verifique os dados e tente novamente.';
      }
      setErro(err.message || mensagem);
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label" htmlFor="password-input">Senha</label>
                <Link href="/admin/forgot-password" style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 500 }}>
                  Esqueci a senha
                </Link>
              </div>
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
