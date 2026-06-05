'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from '../admin.module.css';
import { Mail, ArrowLeft } from 'lucide-react';

export default function PaginaEsqueciSenha() {
  const [email, setEmail] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  const lidarComEnvio = async (e) => {
    e.preventDefault();
    if (!email) {
      setErro('Por favor, informe seu e-mail.');
      return;
    }

    try {
      setCarregando(true);
      setErro('');

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:3000/admin/reset-password'
      });

      if (error) throw error;
      setSucesso(true);
    } catch (err) {
      console.error('Erro ao enviar e-mail:', err);
      setErro('Ocorreu um erro ao enviar o e-mail de recuperação.');
    } finally {
      setCarregando(false);
    }
  };

  if (sucesso) {
    return (
      <div className={styles.adminWrapper} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.loginContainer}>
          <div className={styles.loginCard} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
            <h2 className="text-gradient" style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              E-mail enviado!
            </h2>
            <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>
              Verifique sua caixa de entrada para redefinir sua senha.
            </p>
            <Link href="/admin/login" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Voltar para login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminWrapper} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div style={{ marginBottom: '1rem' }}>
            <Link href="/admin/login" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <ArrowLeft size={16} />
              <span>Voltar</span>
            </Link>
          </div>

          <div className={styles.loginHeader}>
            <div className="flex-center" style={{ width: '48px', height: '48px', margin: '0 auto 16px', borderRadius: '50%', backgroundColor: 'rgba(212, 175, 55, 0.1)', color: 'var(--primary)' }}>
              <Mail size={24} />
            </div>
            <h1 className="text-gradient" style={{ fontSize: '1.6rem', fontWeight: 800 }}>
              Redefinir senha
            </h1>
            <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Informe seu e-mail para receber o link de recuperação
            </p>
          </div>


          {erro && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.8rem', color: 'var(--error)', textAlign: 'center' }}>
              ❌ {erro}
            </div>
          )}

          <form onSubmit={lidarComEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">E-mail</label>
              <input
                type="email"
                className="input-field"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={carregando}
            >
              {carregando ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
