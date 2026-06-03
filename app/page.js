import React from 'react';
import Link from 'next/link';
import { Calendar, Scissors, ShieldAlert, Award, MessageSquare, TrendingUp, Sparkles } from 'lucide-react';

export default function HomeSaaS() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'space-between' }}>
      
      {/* Header */}
      <header style={{ padding: '24px 0', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.4rem', fontWeight: 800 }}>
            <img src="/logo.png" alt="Logo" style={{ maxHeight: '36px', width: 'auto' }} />
            <span className="text-gradient">Garagem Barber</span>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '4px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)' }}>
            🚀 Versão MVP 1.0
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container" style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 32, flex: 1 }}>
        <div 
          className="animate-pulse-slow"
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 8, 
            padding: '8px 16px', 
            borderRadius: 'var(--radius-full)', 
            backgroundColor: 'rgba(212, 175, 55, 0.08)', 
            border: '1px solid rgba(212, 175, 55, 0.15)', 
            fontSize: '0.9rem', 
            color: 'var(--primary)', 
            fontWeight: 600 
          }}
        >
          <Sparkles size={16} /> Agendamento Online Oficial • Garagem Barber
        </div>

        <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.1, maxWidth: '800px' }}>
          Agende seu Horário na <br />
          <span className="text-gradient">Garagem Barber</span>
        </h1>

        <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: 1.5 }}>
          Seu estilo, sua identidade! Aqui você sai sempre no seu melhor. Escolha o serviço e agende agora mesmo com lembrete no seu WhatsApp.
        </p>

        {/* Demo Navigation Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, width: '100%', maxWidth: '700px', marginTop: 16 }}>
          
          {/* Card Cliente */}
          <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start', textAlign: 'left', borderTop: '4px solid var(--primary)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(212, 175, 55, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyHTML: 'center', justifyContent: 'center' }}>
              <Calendar size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Página do Cliente</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Página pública otimizada para celular. Agende um corte ou combo na barbearia.
              </p>
            </div>
            <Link href="/c/garagem-barber" className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }}>
              Ir para Agendamento
            </Link>
          </div>

          {/* Card Barbeiro */}
          <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start', textAlign: 'left', borderTop: '4px solid var(--text-muted)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyHTML: 'center', justifyContent: 'center' }}>
              <Award size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Painel do Barbeiro</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Gerencie compromissos de Julermes Barber, configure bloqueios e gerencie preços.
              </p>
            </div>
            <Link href="/admin/login" className="btn btn-secondary" style={{ width: '100%', marginTop: 'auto' }}>
              Acessar Painel Admin
            </Link>
          </div>

        </div>

        {/* Diferenciais Section */}
        <div style={{ width: '100%', maxWidth: '800px', borderTop: '1px solid var(--border)', paddingTop: 40, marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <MessageSquare size={24} style={{ color: 'var(--primary)' }} />
            <h4 style={{ fontWeight: 700 }}>Lembretes via WhatsApp</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Você recebe mensagens com o horário marcado direto no celular.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <ShieldAlert size={24} style={{ color: 'var(--primary)' }} />
            <h4 style={{ fontWeight: 700 }}>Estrutura Confiável</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sem conflitos de horário. Respeita folgas e feriados locais.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <TrendingUp size={24} style={{ color: 'var(--primary)' }} />
            <h4 style={{ fontWeight: 700 }}>Espaço de Lazer</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ambiente climatizado, vídeo game, Wi-Fi e bebidas enquanto aguarda.</p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer style={{ padding: '24px 0', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <p>© 2026 Garagem Barber. Estrada Feliciano Sodré, 3049 - Mesquita.</p>
      </footer>
    </div>
  );
}
