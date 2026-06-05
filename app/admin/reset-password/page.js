'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from '../admin.module.css';
import { Lock, ArrowLeft } from 'lucide-react';

export default function PaginaRedefinirSenha() {
  const router = useRouter();
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  const lidarComRedefinicao = async (e) => {
    e.preventDefault();
    if (!senha || !confirmarSenha) {
      setErro('Por favor, preencha ambos os campos.');
      return;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    try {
      setCarregando(true);
      setErro('');

      const { error } = await supabase.auth.updateUser({
        password: senha
      });

      if (error) throw error;
      setSucesso(true);
    } catch (err) {
      console.error('Erro ao redefinir senha:', err);
      setErro('Ocorreu um erro ao redefinir sua senha.');
    } finally {
      setCarregando(false);
    }
  };

  if (sucesso) {
    return (
      <div className={styles.adminWrapper} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.loginContainer}>
          <div className={styles.loginCard} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 className="text-gradient" style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Senha redefinida!
            </h2>
            <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>
              Sua senha foi alterada com sucesso.
            </p>
            <Link href="/admin/login" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Ir para o login
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
              <Lock size={24} />
            </div>
            <h1 className="text-gradient" style={{ fontSize: '1.6rem', fontWeight: 800 }}>
              Nova senha
            </h1>
            <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Digite sua nova senha
            </p>
          </div>


          {erro && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.8rem', color: 'var(--error)', textAlign: 'center' }}>
              ❌ {erro}
            </div>
          )}

          <form onSubmit={lidarComRedefinicao} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Nova senha</label>
              <input
                type="password"
                className="input-field"
                placeholder="Sua nova senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Confirmar nova senha</label>
              <input
                type="password"
                className="input-field"
                placeholder="Confirme sua senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={carregando}
            >
              {carregando ? 'Redefinindo...' : 'Redefinir senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
