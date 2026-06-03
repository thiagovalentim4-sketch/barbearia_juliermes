'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase, mockDb, isMockMode } from '@/lib/supabase';
import { obterHorariosDisponiveis, criarDataHoraCompleta } from '@/lib/scheduler';
import styles from './client.module.css';
import { 
  Calendar, Clock, Scissors, User, Phone, Mail, Check, 
  ChevronLeft, ChevronRight, MapPin, Wifi, Tv, Gamepad2 
} from 'lucide-react';

const PASSOS = {
  SERVICO: 1,
  PROFISSIONAL: 2,
  HORARIO: 3,
  CADASTRO: 4,
  SUCESSO: 5
};

// Ícone do Instagram customizado em SVG para evitar incompatibilidade de versão do Lucide
const InstagramIcon = ({ size = 16, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export default function PaginaAgendamento() {
  const { slug } = useParams();
  
  // Estados de dados carregados
  const [barbearia, setBarbearia] = useState(null);
  const [profissionais, setProfissionais] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Estados de seleção do fluxo
  const [passoAtual, setPassoAtual] = useState(PASSOS.SERVICO);
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [profissionalSelecionado, setProfissionalSelecionado] = useState(null);
  const [dataSelecionada, setDataSelecionada] = useState(''); // YYYY-MM-DD
  const [horarioSelecionado, setHorarioSelecionado] = useState(''); // HH:MM
  const [gradeHorarios, setGradeHorarios] = useState([]);
  
  // Estados do formulário do cliente
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [carregandoConfirmacao, setCarregandoConfirmacao] = useState(false);
  const [agendamentoConfirmado, setAgendamentoConfirmado] = useState(null);

  // Lista dos próximos 7 dias para seleção de data
  const [proximosDias, setProximosDias] = useState([]);

  // 1. Carregar dados da Barbearia, Serviços e Profissionais
  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);
        let dadosBarbearia = null;
        let listaProfissionais = [];
        let listaServicos = [];

        if (isMockMode) {
          dadosBarbearia = await mockDb.getBarbeariaBySlug(slug);
          if (dadosBarbearia) {
            listaProfissionais = await mockDb.getProfissionais(dadosBarbearia.id);
            listaServicos = await mockDb.getServicos(dadosBarbearia.id);
          }
        } else {
          // Busca real no Supabase
          const { data: barbeariaData, error: bError } = await supabase
            .from('barbearias')
            .select('*')
            .eq('slug', slug)
            .single();

          if (bError) throw bError;
          dadosBarbearia = barbeariaData;

          if (dadosBarbearia) {
            const { data: profs, error: pError } = await supabase
              .from('profissionais')
              .select('*')
              .eq('barbearia_id', dadosBarbearia.id);
            if (pError) throw pError;
            listaProfissionais = profs;

            const { data: servs, error: sError } = await supabase
              .from('servicos')
              .select('*')
              .eq('barbearia_id', dadosBarbearia.id)
              .order('created_at', { ascending: true });
            if (sError) throw sError;
            listaServicos = servs;
          }
        }

        if (!dadosBarbearia) {
          setErro('Barbearia não encontrada. Verifique o link e tente novamente.');
        } else {
          setBarbearia(dadosBarbearia);
          setProfissionais(listaProfissionais);
          setServicos(listaServicos);
          
          // Pré-selecionar o primeiro profissional
          if (listaProfissionais.length > 0) {
            setProfissionalSelecionado(listaProfissionais[0]);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setErro('Erro ao carregar as informações. Tente novamente mais tarde.');
      } finally {
        setCarregando(false);
      }
    }

    if (slug) {
      carregarDados();
    }
  }, [slug]);

  // 2. Gerar datas (próximos 7 dias)
  useEffect(() => {
    const dias = [];
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let diaCount = 0;
    
    // Gerar os próximos dias úteis (pulando domingo e segunda)
    for (let i = 0; i < 12 && diaCount < 7; i++) {
      const data = new Date();
      data.setDate(data.getDate() + i);
      
      const diaDaSemanaIndex = data.getDay();
      
      // Pular Domingo (0) e Segunda (1) conforme regra da imagem
      if (diaDaSemanaIndex === 0 || diaDaSemanaIndex === 1) {
        continue;
      }
      
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const dia = String(data.getDate()).padStart(2, '0');
      const stringData = `${ano}-${mes}-${dia}`;
      
      dias.push({
        label: i === 0 ? 'Hoje' : diasSemana[diaDaSemanaIndex],
        numero: data.getDate(),
        dataStr: stringData
      });
      
      diaCount++;
    }

    setProximosDias(dias);
    if (dias.length > 0) {
      setDataSelecionada(dias[0].dataStr); // Seleciona o primeiro dia disponível
    }
  }, []);

  // 3. Calcular grade de horários livres de forma reativa
  useEffect(() => {
    if (!profissionalSelecionado || !dataSelecionada || !servicoSelecionado) {
      setGradeHorarios([]);
      return;
    }

    async function buscarEGerarHorarios() {
      try {
        let agendamentosExistentes = [];
        let bloqueiosExistentes = [];

        if (isMockMode) {
          agendamentosExistentes = await mockDb.getAgendamentos(profissionalSelecionado.id);
          bloqueiosExistentes = await mockDb.getBloqueios(profissionalSelecionado.id);
        } else {
          // Busca real no Supabase com filtros de data do dia correspondente
          const dataInicio = `${dataSelecionada}T00:00:00.000Z`;
          const dataFim = `${dataSelecionada}T23:59:59.999Z`;

          const { data: ags } = await supabase
            .from('agendamentos')
            .select('*')
            .eq('profissional_id', profissionalSelecionado.id)
            .gte('data_hora', dataInicio)
            .lte('data_hora', dataFim);
          
          const { data: bloqs } = await supabase
            .from('bloqueios')
            .select('*')
            .eq('profissional_id', profissionalSelecionado.id)
            .gte('data_hora_inicio', dataInicio)
            .lte('data_hora_fim', dataFim);

          agendamentosExistentes = ags || [];
          bloqueiosExistentes = bloqs || [];
        }

        // Gerar grade livre respeitando a duração do serviço escolhido
        const slots = obterHorariosDisponiveis(
          dataSelecionada,
          servicoSelecionado.duracao_minutos,
          agendamentosExistentes,
          bloqueiosExistentes
        );

        setGradeHorarios(slots);
      } catch (err) {
        console.error('Erro ao calcular horários livres:', err);
      }
    }

    buscarEGerarHorarios();
  }, [profissionalSelecionado, dataSelecionada, servicoSelecionado]);

  // Formatação de Dinheiro BRL
  const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  // Avançar no Fluxo
  const proximoPasso = () => {
    if (passoAtual === PASSOS.SERVICO && !servicoSelecionado) return;
    if (passoAtual === PASSOS.PROFISSIONAL && !profissionalSelecionado) return;
    if (passoAtual === PASSOS.HORARIO && (!dataSelecionada || !horarioSelecionado)) return;
    
    setPassoAtual(passoAtual + 1);
  };

  // Voltar no Fluxo
  const voltarPasso = () => {
    if (passoAtual > PASSOS.SERVICO) {
      setPassoAtual(passoAtual - 1);
    }
  };

  // Concluir agendamento
  const confirmarAgendamento = async (e) => {
    e.preventDefault();
    if (!nome || !telefone) {
      alert('Nome e WhatsApp são obrigatórios!');
      return;
    }

    try {
      setCarregandoConfirmacao(true);
      
      const dataHoraCompleta = criarDataHoraCompleta(dataSelecionada, horarioSelecionado);
      
      const dadosAgendamento = {
        profissional_id: profissionalSelecionado.id,
        servico_id: servicoSelecionado.id,
        cliente_nome: nome,
        cliente_telefone: telefone,
        cliente_email: email || null,
        data_hora: dataHoraCompleta.toISOString(),
        status: 'confirmado'
      };

      let agendamentoSalvo = null;

      if (isMockMode) {
        agendamentoSalvo = await mockDb.saveAgendamento(dadosAgendamento);
        // Simular envio de WhatsApp imediato (no console)
        console.log(`[Z-API Mock] Notificação disparada para ${telefone}: Olá ${nome}! Seu agendamento de ${servicoSelecionado.nome} com ${profissionalSelecionado.nome} está confirmado para o dia ${new Date(dadosAgendamento.data_hora).toLocaleDateString()} às ${horarioSelecionado}.`);
      } else {
        // Salvar no Supabase
        const { data, error } = await supabase
          .from('agendamentos')
          .insert([dadosAgendamento])
          .select()
          .single();

        if (error) throw error;
        agendamentoSalvo = data;
        
        // Disparar uma request silenciosa para disparar a lógica do lembrete (webhook de background)
        fetch('/api/send-reminders', { method: 'POST', body: JSON.stringify({ agendamentoId: data.id }) }).catch(() => {});
      }

      setAgendamentoConfirmado(agendamentoSalvo);
      setPassoAtual(PASSOS.SUCESSO);
    } catch (err) {
      console.error('Erro ao agendar:', err);
      alert('Houve um erro ao salvar o agendamento. Tente novamente.');
    } finally {
      setCarregandoConfirmacao(false);
    }
  };

  // Renderizador de Loading / Erro
  if (carregando) {
    return (
      <div className={styles.wrapper}>
        <div className={`${styles.container} flex-center`} style={{ minHeight: '400px' }}>
          <div className="text-secondary" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span>Carregando barbearia...</span>
            <style jsx>{`
              @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
          </div>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className={styles.wrapper}>
        <div className={`${styles.container} flex-center`} style={{ minHeight: '400px', padding: '32px', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--error)', marginBottom: 12 }}>Ops!</h2>
          <p className="text-secondary">{erro}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        
        {/* Cabeçalho com Logotipo Croppado */}
        <header className={styles.header}>
          <img 
            src="/logo.png" 
            alt="Garagem Barber Logo" 
            style={{ 
              maxHeight: '120px', 
              width: 'auto',
              margin: '0 auto 8px', 
              display: 'block',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' 
            }} 
          />
          <h1 className={`${styles.logo} text-gradient`} style={{ fontSize: '1.6rem', fontWeight: 900 }}>{barbearia?.nome}</h1>
          <p className={styles.subtitle} style={{ color: 'var(--primary)', fontWeight: 600, letterSpacing: '0.05em' }}>TRADIÇÃO • ESTILO • QUALIDADE</p>
        </header>

        {/* Barra de Progresso do MVP (Não exibe se for tela de Sucesso) */}
        {passoAtual !== PASSOS.SUCESSO && (
          <div style={{ padding: '16px 24px 0' }}>
            <div className={styles.progressContainer}>
              <div className={styles.progressLine} />
              <div 
                className={styles.progressFill} 
                style={{ width: `${((passoAtual - 1) / 3) * 100}%` }} 
              />
              {[1, 2, 3, 4].map((step) => (
                <div 
                  key={step} 
                  className={`${styles.progressStep} ${
                    passoAtual === step ? styles.stepActive : passoAtual > step ? styles.stepCompleted : ''
                  }`}
                >
                  {passoAtual > step ? <Check size={16} /> : step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conteúdo Principal do Fluxo */}
        <main className={styles.content}>
          
          {/* PASSO 1: SELEÇÃO DE SERVIÇOS */}
          {passoAtual === PASSOS.SERVICO && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h2 className={styles.stepTitle}>Qual o serviço de hoje?</h2>
                <p className={styles.stepDescription}>Selecione o corte ou combo desejado:</p>
              </div>
              
              <div className={styles.list}>
                {servicos.map((servico) => {
                  const ehPromo = servico.nome.toUpperCase().includes('PROMOÇÃO');
                  return (
                    <div 
                      key={servico.id}
                      className={`${styles.itemCard} ${ehPromo ? styles.promoCard : ''} ${servicoSelecionado?.id === servico.id ? styles.itemSelected : ''}`}
                      onClick={() => {
                        setServicoSelecionado(servico);
                        setHorarioSelecionado(''); // Reseta horário caso mude serviço
                      }}
                    >
                      {ehPromo && <div className={styles.promoBadge}>Ganhe Sobrancelha!</div>}
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName} style={ehPromo ? { color: '#00e676', fontWeight: 800 } : {}}>
                          {servico.nome}
                        </span>
                        <span className={styles.itemSub}>
                          <Clock size={14} /> {servico.duracao_minutos} min
                        </span>
                      </div>
                      <span className={styles.itemPrice} style={ehPromo ? { color: '#00e676', fontSize: '1.2rem' } : {}}>
                        {formatarPreco(servico.preco)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Informações de Contato e Diferenciais (Visível na seleção de serviços) */}
              <div className={styles.barberDetailsCard} style={{ marginTop: 8 }}>
                <div className={styles.detailRow}>
                  <MapPin className={styles.detailIcon} size={16} />
                  <div>
                    <strong>Endereço:</strong><br />
                    {barbearia?.endereco}
                  </div>
                </div>
                <div className={styles.detailRow}>
                  <Clock className={styles.detailIcon} size={16} />
                  <div>
                    <strong>Horário de Funcionamento:</strong><br />
                    Terça a Sexta: 09h às 19h<br />
                    Sábado: 08h às 19h (Dom/Seg Fechado)
                  </div>
                </div>
                
                {/* Comodidades/Amenities */}
                <div className={styles.amenitiesGrid}>
                  <div className={styles.amenityItem}>
                    <Wifi size={14} style={{ color: 'var(--primary)' }} />
                    <span>Wi-Fi Grátis</span>
                  </div>
                  <div className={styles.amenityItem}>
                    <Tv size={14} style={{ color: 'var(--primary)' }} />
                    <span>Ambiente Climatizado</span>
                  </div>
                  <div className={styles.amenityItem}>
                    <Gamepad2 size={14} style={{ color: 'var(--primary)' }} />
                    <span>Vídeo Game e Bebidas</span>
                  </div>
                  <div className={styles.amenityItem}>
                    <InstagramIcon size={14} style={{ color: 'var(--primary)' }} />
                    <span>@julermes_barber</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 2: SELEÇÃO DE PROFISSIONAL */}
          {passoAtual === PASSOS.PROFISSIONAL && (
            <div className="animate-fade-in">
              <h2 className={styles.stepTitle}>Quem vai te atender?</h2>
              <p className={styles.stepDescription}>Escolha o profissional disponível:</p>
              
              <div className={styles.list}>
                {profissionais.map((prof) => (
                  <div 
                    key={prof.id}
                    className={`${styles.itemCard} ${profissionalSelecionado?.id === prof.id ? styles.itemSelected : ''}`}
                    onClick={() => {
                      setProfissionalSelecionado(prof);
                      setHorarioSelecionado(''); // Reseta horário ao mudar profissional
                    }}
                  >
                    <div className={styles.profCard}>
                      <img 
                        src={prof.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                        alt={prof.nome} 
                        className={styles.avatar}
                      />
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{prof.nome}</span>
                        <span className={styles.itemSub}>
                          <User size={14} /> Barbeiro Profissional
                        </span>
                      </div>
                    </div>
                    {profissionalSelecionado?.id === prof.id && (
                      <div style={{ color: 'var(--primary)' }}><Check size={20} /></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PASSO 3: GRADE DE HORÁRIOS */}
          {passoAtual === PASSOS.HORARIO && (
            <div className="animate-fade-in">
              <h2 className={styles.stepTitle}>Selecione seu horário</h2>
              <p className={styles.stepDescription}>
                Serviço: <strong>{servicoSelecionado?.nome}</strong> ({servicoSelecionado?.duracao_minutos} min)
              </p>
              
              {/* Seletor de Dias */}
              <div className={styles.weekDays}>
                {proximosDias.map((dia) => (
                  <button 
                    key={dia.dataStr}
                    type="button"
                    className={`${styles.dayButton} ${dataSelecionada === dia.dataStr ? styles.dayActive : ''}`}
                    onClick={() => {
                      setDataSelecionada(dia.dataStr);
                      setHorarioSelecionado(''); // Reseta seleção anterior
                    }}
                  >
                    <span className={styles.dayLabel}>{dia.label}</span>
                    <span className={styles.dayValue}>{dia.numero}</span>
                  </button>
                ))}
              </div>

              {/* Grid de Horários Livres */}
              <h3 style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--text-secondary)' }}>
                Horários disponíveis para {new Date(dataSelecionada + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}:
              </h3>
              
              <div className={styles.slotsGrid}>
                {gradeHorarios.length > 0 ? (
                  gradeHorarios.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`${styles.slotButton} ${horarioSelecionado === slot ? styles.slotActive : ''}`}
                      onClick={() => setHorarioSelecionado(slot)}
                    >
                      {slot}
                    </button>
                  ))
                ) : (
                  <div className={styles.noSlots}>
                    Nenhum horário disponível para esta data com {profissionalSelecionado?.nome}. Tente outra data.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASSO 4: CADASTRO SIMPLIFICADO */}
          {passoAtual === PASSOS.CADASTRO && (
            <form onSubmit={confirmarAgendamento} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h2 className={styles.stepTitle}>Falta bem pouco!</h2>
                <p className={styles.stepDescription}>Só precisamos do básico para confirmar seu agendamento:</p>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="client-name">Seu Nome Completo *</label>
                <input 
                  type="text" 
                  id="client-name"
                  className="input-field" 
                  placeholder="Ex: João da Silva" 
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="client-phone">Seu WhatsApp *</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
                  <input 
                    type="tel" 
                    id="client-phone"
                    className="input-field" 
                    style={{ paddingLeft: '44px' }}
                    placeholder="Ex: (21) 97580-9004" 
                    required
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="client-email">Seu E-mail (Opcional)</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    id="client-email"
                    className="input-field" 
                    style={{ paddingLeft: '44px' }}
                    placeholder="Ex: joao@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: 8 }}>
                🔒 Seus dados estão seguros e serão usados apenas para a confirmação do horário.
              </p>
            </form>
          )}

          {/* PASSO 5: SUCESSO / CONFIRMADO */}
          {passoAtual === PASSOS.SUCESSO && (
            <div className={`${styles.successContainer} animate-fade-in`}>
              <div className={styles.successIcon}>
                <Check size={36} />
              </div>
              <div>
                <h2 className={styles.successTitle}>Agendado com Sucesso!</h2>
                <p className="text-secondary" style={{ fontSize: '0.9rem', marginTop: 4 }}>
                  Tudo certo, seu horário está reservado na Garagem Barber.
                </p>
              </div>

              <div className={styles.successSummary}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Serviço</span>
                  <span className={styles.summaryValue}>{servicoSelecionado?.nome}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Barbeiro</span>
                  <span className={styles.summaryValue}>{profissionalSelecionado?.nome}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Data</span>
                  <span className={styles.summaryValue}>
                    {new Date(dataSelecionada + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Horário</span>
                  <span className={styles.summaryValue} style={{ color: 'var(--primary)' }}>
                    {horarioSelecionado} hs
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Valor</span>
                  <span className={styles.summaryValue}>{formatarPreco(servicoSelecionado?.preco)}</span>
                </div>
                <div className={styles.summaryRow} style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                  <span className={styles.summaryLabel}>Status</span>
                  <span className={styles.badge}>Confirmado</span>
                </div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  💬 Você receberá um lembrete automático no WhatsApp {telefone} algumas horas antes do agendamento!
                </div>
                <button 
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => {
                    // Reseta fluxo
                    setPassoAtual(PASSOS.SERVICO);
                    setServicoSelecionado(null);
                    setHorarioSelecionado('');
                    setNome('');
                    setTelefone('');
                    setEmail('');
                  }}
                >
                  Novo Agendamento
                </button>
              </div>
            </div>
          )}

        </main>

        {/* Rodapé de Ações com Botões Voltar / Avançar */}
        {passoAtual !== PASSOS.SUCESSO && (
          <footer className={`${styles.footer} ${passoAtual === PASSOS.SERVICO ? styles.footerSingle : ''}`}>
            {passoAtual > PASSOS.SERVICO && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={voltarPasso}
              >
                <ChevronLeft size={18} /> Voltar
              </button>
            )}
            
            {passoAtual < PASSOS.CADASTRO ? (
              <button 
                type="button" 
                className="btn btn-primary"
                disabled={
                  (passoAtual === PASSOS.SERVICO && !servicoSelecionado) ||
                  (passoAtual === PASSOS.PROFISSIONAL && !profissionalSelecionado) ||
                  (passoAtual === PASSOS.HORARIO && !horarioSelecionado)
                }
                onClick={proximoPasso}
              >
                Avançar <ChevronRight size={18} />
              </button>
            ) : (
              passoAtual === PASSOS.CADASTRO && (
                <button 
                  type="button" 
                  className="btn btn-primary"
                  disabled={carregandoConfirmacao || !nome || !telefone}
                  onClick={confirmarAgendamento}
                >
                  {carregandoConfirmacao ? 'Agendando...' : 'Confirmar Horário'}
                </button>
              )
            )}
          </footer>
        )}

      </div>
    </div>
  );
}
