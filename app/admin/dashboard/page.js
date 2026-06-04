'use client';

import React, { useState, useEffect } from 'react';
import { supabase, mockDb, isMockMode } from '@/lib/supabase';
import { criarDataHoraCompleta } from '@/lib/scheduler';
import styles from '../admin.module.css';
import { Calendar, Clock, DollarSign, Ban, Plus, X, Trash2, CalendarCheck, ShieldAlert, RefreshCw } from 'lucide-react';

export default function DashboardAdmin() {
  const [profissional, setProfissional] = useState(null);
  const [dataSelecionada, setDataSelecionada] = useState(''); // YYYY-MM-DD
  const [agendamentos, setAgendamentos] = useState([]);
  const [bloqueios, setBloqueios] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [usarModoMock, setUsarModoMock] = useState(isMockMode);

  // Estados do Modal de Bloqueio
  const [modalAberto, setModalAberto] = useState(false);
  const [horaInicioBloqueio, setHoraInicioBloqueio] = useState('12:00');
  const [horaFimBloqueio, setHoraFimBloqueio] = useState('13:00');
  const [motivoBloqueio, setMotivoBloqueio] = useState('Almoço');
  const [salvandoBloqueio, setSalvandoBloqueio] = useState(false);

  // Inicializar data selecionada como hoje
  useEffect(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    setDataSelecionada(`${ano}-${mes}-${dia}`);
  }, []);

  // Carregar profissional padrão e serviços filtrando pelo proprietário autenticado no Supabase real
  useEffect(() => {
    async function inicializar() {
      try {
        let prof = null;
        let servs = [];
        let modoMock = isMockMode;
        
        if (isMockMode) {
          const profs = await mockDb.getProfissionais();
          if (profs.length > 0) prof = profs[0];
          servs = await mockDb.getServicos();
        } else {
        console.log('🔍 Iniciando modo REAL do Supabase...');
        
        // Supabase real: busca o usuário logado
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('👤 Usuário do Supabase:', { user, userError });
        
        if (user) {
          // Buscar barbearia cujo proprietário é o usuário logado
          console.log('🔍 Buscando barbearias com owner_id:', user.id);
          const { data: barbeariaData, error: bError } = await supabase
            .from('barbearias')
            .select('*')
            .eq('owner_id', user.id)
            .single();
            
          console.log('🏪 Resultado da busca de barbearias:', { barbeariaData, bError });
            
          if (bError) {
            console.warn("⚠️ Nenhuma barbearia vinculada ao seu usuário. Usando modo mock.");
            // Fallback para mock
            modoMock = true;
            const profs = await mockDb.getProfissionais();
            if (profs.length > 0) prof = profs[0];
            servs = await mockDb.getServicos();
          } else if (barbeariaData) {
            console.log('✅ Barbearia encontrada:', barbeariaData);
            
            // Buscar profissionais da barbearia encontrada
            console.log('🔍 Buscando profissionais da barbearia ID:', barbeariaData.id);
            const { data: profs, error: pError } = await supabase
              .from('profissionais')
              .select('*')
              .eq('barbearia_id', barbeariaData.id);
              
            console.log('👨‍💼 Profissionais encontrados:', { profs, pError });
              
            if (profs && profs.length > 0) {
              prof = profs[0]; // Seleciona o primeiro profissional por padrão
            } else {
              console.warn('⚠️ Nenhum profissional encontrado! Usando mock.');
              const profsMock = await mockDb.getProfissionais();
              if (profsMock.length > 0) prof = profsMock[0];
            }
            
            // Buscar serviços da barbearia encontrada
            console.log('🔍 Buscando serviços da barbearia ID:', barbeariaData.id);
            const { data: s, error: sError } = await supabase
              .from('servicos')
              .select('*')
              .eq('barbearia_id', barbeariaData.id);
              
            console.log('✂️ Serviços encontrados:', { s, sError });
            servs = s || [];
            
            if (servs.length === 0) {
              console.warn('⚠️ Nenhum serviço encontrado! Usando mock.');
              servs = await mockDb.getServicos();
            }
          }
        } else {
          console.warn('⚠️ Nenhum usuário logado no Supabase! Usando modo mock.');
          // Se não houver usuário logado, usa modo mock
          modoMock = true;
          const profs = await mockDb.getProfissionais();
          if (profs.length > 0) prof = profs[0];
          servs = await mockDb.getServicos();
        }
      }
        
        console.log('🔐 Dashboard inicializado: usarModoMock=', modoMock, 'profissional=', prof, 'servicos=', servs);
        setUsarModoMock(modoMock);
        setProfissional(prof);
        setServicos(servs);
      } catch (err) {
        console.error('Erro na inicialização do painel:', err);
        // Fallback para mock em caso de erro
        try {
          const profs = await mockDb.getProfissionais();
          const prof = profs.length > 0 ? profs[0] : null;
          const servs = await mockDb.getServicos();
          setUsarModoMock(true);
          setProfissional(prof);
          setServicos(servs);
        } catch (mockErr) {
          console.error('Erro no fallback mock:', mockErr);
        }
      }
    }
    inicializar();
  }, []);

  // Carregar agendamentos e bloqueios toda vez que mudar a data ou profissional
  const carregarAgendaDoDia = async () => {
    if (!profissional || !dataSelecionada) return;
    try {
      console.log('🔄 Carregando agenda para:', dataSelecionada, 'Profissional:', profissional.id);
      setCarregando(true);
      let ags = [];
      let bloqs = [];

      if (usarModoMock) {
        // No modo mock, ignoramos o profissionalId e pegamos TUDO
        ags = await mockDb.getAgendamentos();
        bloqs = await mockDb.getBloqueios();
      } else {
          try {
            console.log('📅 Buscando agendamentos no Supabase para:', dataSelecionada, 'Profissional:', profissional.id);
            
            // Criar data no fuso horário LOCAL!
            const [ano, mes, dia] = dataSelecionada.split('-').map(Number);
            const dataInicioLocal = new Date(ano, mes - 1, dia, 0, 0, 0);
            const dataFimLocal = new Date(ano, mes - 1, dia, 23, 59, 59, 999);
            
            const dataInicio = dataInicioLocal.toISOString();
            const dataFim = dataFimLocal.toISOString();
            
            console.log('📅 Intervalo de busca (LOCAL para UTC):', dataInicioLocal, dataInicio, 'até', dataFimLocal, dataFim);

            const { data: agData, error: agError } = await supabase
              .from('agendamentos')
              .select('*, servicos(nome, preco, duracao_minutos)')
              .eq('profissional_id', profissional.id)
              .gte('data_hora', dataInicio)
              .lte('data_hora', dataFim);
            
            console.log('📅 Agendamentos do Supabase:', { agData, agError });
            
            const { data: bloqData, error: bloqError } = await supabase
              .from('bloqueios')
              .select('*')
              .eq('profissional_id', profissional.id)
              .gte('data_hora_inicio', dataInicio)
              .lte('data_hora_fim', dataFim);

            console.log('🚫 Bloqueios do Supabase:', { bloqData, bloqError });

            ags = agData || [];
            bloqs = bloqData || [];
          } catch (err) {
            console.error('❌ Erro ao carregar do Supabase, usando mock:', err);
            // Fallback para mock
            ags = await mockDb.getAgendamentos(profissional.id);
            bloqs = await mockDb.getBloqueios(profissional.id);
          }
        }

      // Filtrar agendamentos do dia selecionado no frontend se for modo mock
      if (usarModoMock) {
        console.log('🔍 Filtrando mock: dataSelecionada=', dataSelecionada, 'total agendamentos=', ags.length);
        
        // Criar intervalo do dia selecionado (LOCAL!)
        const [anoSel, mesSel, diaSel] = dataSelecionada.split('-').map(Number);
        const inicioDiaLocal = new Date(anoSel, mesSel - 1, diaSel, 0, 0, 0, 0);
        const fimDiaLocal = new Date(anoSel, mesSel - 1, diaSel, 23, 59, 59, 999);
        
        console.log('🔍 Intervalo do dia selecionado (LOCAL):', inicioDiaLocal, 'até', fimDiaLocal);
        
        ags = ags.filter(a => {
          const dataAgendamento = new Date(a.data_hora);
          const match = dataAgendamento >= inicioDiaLocal && dataAgendamento <= fimDiaLocal;
          console.log(`   → Agendamento ${a.id}: data_hora=${a.data_hora} (LOCAL: ${dataAgendamento}), match=${match}`);
          return match;
        });

        bloqs = bloqs.filter(b => {
          const dataBloqueio = new Date(b.data_hora_inicio);
          const match = dataBloqueio >= inicioDiaLocal && dataBloqueio <= fimDiaLocal;
          return match;
        });
        
        console.log('🔍 Agendamentos após filtro:', ags.length);
      }

      // Ordenar agendamentos por hora
      ags.sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
      bloqs.sort((a, b) => new Date(a.data_hora_inicio) - new Date(b.data_hora_inicio));
      
      console.log('📅 Agendamentos carregados:', ags);
      console.log('🚫 Bloqueios carregados:', bloqs);

      setAgendamentos(ags);
      setBloqueios(bloqs);
    } catch (err) {
      console.error('Erro ao carregar agenda:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarAgendaDoDia();
  }, [profissional, dataSelecionada]);

  // Formatação de Dinheiro
  const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  // Obter detalhes do serviço para o agendamento (especialmente no modo mock)
  const obterDetalhesServico = (appt) => {
    if (appt.servicos) return appt.servicos;
    return servicos.find(s => s.id === appt.servico_id) || { nome: 'Serviço', preco: 0 };
  };

  // Cancelar Agendamento
  const cancelarAgendamento = async (id) => {
    if (!confirm('Deseja realmente cancelar este agendamento? Um lembrete de cancelamento poderá ser enviado.')) return;
    try {
      if (usarModoMock) {
        await mockDb.cancelAgendamento(id);
      } else {
        try {
          const { error } = await supabase
            .from('agendamentos')
            .update({ status: 'cancelado' })
            .eq('id', id);
          if (error) throw error;
        } catch (err) {
          console.error('Erro no Supabase, usando mock:', err);
          await mockDb.cancelAgendamento(id);
        }
      }
      
      // Atualizar lista local
      carregarAgendaDoDia();
    } catch (err) {
      console.error('Erro ao cancelar agendamento:', err);
      alert('Erro ao cancelar.');
    }
  };

  // Criar Bloqueio de Horário
  const criarBloqueio = async (e) => {
    e.preventDefault();
    if (!horaInicioBloqueio || !horaFimBloqueio) return;
    
    try {
      setSalvandoBloqueio(true);
      
      const inicio = criarDataHoraCompleta(dataSelecionada, horaInicioBloqueio);
      const fim = criarDataHoraCompleta(dataSelecionada, horaFimBloqueio);
      
      if (inicio >= fim) {
        alert('O horário de término deve ser após o horário de início!');
        setSalvandoBloqueio(false);
        return;
      }

      const dadosBloqueio = {
        profissional_id: profissional.id,
        data_hora_inicio: inicio.toISOString(),
        data_hora_fim: fim.toISOString(),
        motivo: motivoBloqueio
      };

      if (usarModoMock) {
        await mockDb.saveBloqueio(dadosBloqueio);
      } else {
        try {
          const { error } = await supabase.from('bloqueios').insert([dadosBloqueio]);
          if (error) throw error;
        } catch (err) {
          console.error('Erro no Supabase, usando mock:', err);
          await mockDb.saveBloqueio(dadosBloqueio);
        }
      }

      setModalAberto(false);
      carregarAgendaDoDia();
    } catch (err) {
      console.error('Erro ao criar bloqueio:', err);
      alert('Erro ao salvar bloqueio.');
    } finally {
      setSalvandoBloqueio(false);
    }
  };

  // Excluir Bloqueio
  const excluirBloqueio = async (id) => {
    try {
      if (usarModoMock) {
        await mockDb.deleteBloqueio(id);
      } else {
        try {
          const { error } = await supabase.from('bloqueios').delete().eq('id', id);
          if (error) throw error;
        } catch (err) {
          console.error('Erro no Supabase, usando mock:', err);
          await mockDb.deleteBloqueio(id);
        }
      }
      carregarAgendaDoDia();
    } catch (err) {
      console.error('Erro ao deletar bloqueio:', err);
    }
  };

  // Cálculos de Estatísticas
  const agendamentosConfirmados = agendamentos.filter(a => a.status === 'confirmado');
  const faturamentoEstimado = agendamentosConfirmados.reduce((total, a) => {
    const s = obterDetalhesServico(a);
    return total + Number(s.preco);
  }, 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Cabeçalho do Dashboard */}
      <div className={styles.sectionHeader}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Sua Agenda</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
            Gerencie o expediente de {profissional?.nome || 'Carregando...'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={async () => {
              // Adicionar agendamento de teste HOJE
              const agora = new Date();
              const dataStr = `${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2,'0')}-${String(agora.getDate()).padStart(2,'0')}`;
              const horaStr = `${String(agora.getHours()+1).padStart(2,'0')}:00`;
              
              await mockDb.saveAgendamento({
                profissional_id: 'p1-julermes-id',
                servico_id: 's2-corte-id',
                cliente_nome: 'TESTE ADMIN',
                cliente_telefone: '(11) 99999-9999',
                data_hora: new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), agora.getHours()+1, 0, 0).toISOString(),
                status: 'confirmado'
              });
              
              carregarAgendaDoDia();
            }} 
            className="btn btn-secondary"
            disabled={!profissional}
          >
            <Plus size={18} /> Testar Agendamento
          </button>
          <button 
            onClick={() => carregarAgendaDoDia()} 
            className="btn btn-secondary"
            disabled={!profissional}
          >
            <RefreshCw size={18} /> Atualizar
          </button>
          <button 
            onClick={() => setModalAberto(true)} 
            className="btn btn-primary"
            disabled={!profissional}
          >
            <Plus size={18} /> Bloquear Horário
          </button>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><CalendarCheck size={22} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{agendamentosConfirmados.length}</span>
            <span className={styles.statLabel}>Agendados Hoje</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: 'var(--success)' }}><DollarSign size={22} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{formatarPreco(faturamentoEstimado)}</span>
            <span className={styles.statLabel}>Estimado Hoje</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: 'var(--text-muted)' }}><Ban size={22} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{bloqueios.length}</span>
            <span className={styles.statLabel}>Bloqueios Ativos</span>
          </div>
        </div>
      </div>

      {/* Layout de Filtro de Data & Agenda */}
      <div className={styles.agendaLayout}>
        
        {/* Lado Esquerdo: Filtro de Data */}
        <div className={styles.miniCalendar}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Selecionar Dia</h3>
          <div className="input-group">
            <input
              type="date"
              className="input-field"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
            />
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              Data selecionada: {new Date(dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 12 }}>
            💡 Escolha a data acima para conferir os compromissos agendados e gerenciar horários.
          </p>
        </div>

        {/* Lado Direito: Listagem da Agenda */}
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>
              Compromissos de {new Date(dataSelecionada + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h2>

          {carregando ? (
            <div className="flex-center" style={{ padding: '40px', color: 'var(--text-secondary)' }}>
              Carregando agendamentos...
            </div>
          ) : (
            <div className={styles.appointmentsList}>
              {/* Seção de Bloqueios do Dia */}
              {bloqueios.map((bloq) => {
                const hInicio = new Date(bloq.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const hFim = new Date(bloq.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={bloq.id} className={styles.blockCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Ban size={18} style={{ color: 'var(--error)' }} />
                      <div>
                        <strong>{hInicio} às {hFim}</strong> - Horário Bloqueado ({bloq.motivo || 'Sem motivo'})
                      </div>
                    </div>
                    <button 
                      onClick={() => excluirBloqueio(bloq.id)} 
                      style={{ color: 'var(--error)', backgroundColor: 'transparent', cursor: 'pointer' }}
                      title="Remover Bloqueio"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}

              {/* Seção de Agendamentos do Dia */}
          {agendamentos.length === 0 && bloqueios.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
              Nenhum compromisso ou bloqueio para este dia.
            </div>
          ) : (
            agendamentos.map((appt) => {
              const s = obterDetalhesServico(appt);
              
              // Data e hora em formato BRASILEIRO (fuso horário local!)
              const dataHoraLocal = new Date(appt.data_hora);
              const hora = dataHoraLocal.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              const dataFormatada = dataHoraLocal.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
              
              const eCancelado = appt.status === 'cancelado';

              return (
                <div
                  key={appt.id}
                  className={styles.appointmentCard}
                  style={eCancelado ? { borderLeftColor: 'var(--error)', opacity: 0.6 } : {}}
                >
                  <div className={styles.apptTime}>{hora}</div>
                      <div className={styles.apptInfo}>
                        <div className={styles.apptClient}>
                          {appt.cliente_nome}
                          {eCancelado && <span style={{ marginLeft: 8, fontSize: '0.75rem', padding: '2px 6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-sm)' }}>Cancelado</span>}
                        </div>
                        <div className={styles.apptDetails}>
                          <span>Serviço: <strong>{s.nome}</strong></span>
                          <span>Preço: {formatarPreco(s.preco)}</span>
                          <span>WhatsApp: {appt.cliente_telefone}</span>
                        </div>
                      </div>
                      
                      {!eCancelado && (
                        <div className={styles.apptActions}>
                          <button 
                            onClick={() => cancelarAgendamento(appt.id)}
                            className="btn btn-danger"
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

      </div>

      {/* MODAL DE BLOQUEIO DE HORÁRIO */}
      {modalAberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            
            <div className={styles.modalHeader}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Bloquear Grade</h2>
              <button 
                onClick={() => setModalAberto(false)} 
                style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={criarBloqueio} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Dia Selecionado</label>
                <input 
                  type="text" 
                  className="input-field" 
                  disabled 
                  value={new Date(dataSelecionada + 'T12:00:00').toLocaleDateString('pt-BR')} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="start-time">Hora Início</label>
                  <input 
                    type="time" 
                    id="start-time"
                    className="input-field" 
                    required
                    value={horaInicioBloqueio}
                    onChange={(e) => setHoraInicioBloqueio(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="end-time">Hora Fim</label>
                  <input 
                    type="time" 
                    id="end-time"
                    className="input-field" 
                    required
                    value={horaFimBloqueio}
                    onChange={(e) => setHoraFimBloqueio(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="block-reason">Motivo (Ex: Almoço, Folga, Compromisso)</label>
                <input 
                  type="text" 
                  id="block-reason"
                  className="input-field" 
                  placeholder="Ex: Horário de almoço"
                  value={motivoBloqueio}
                  onChange={(e) => setMotivoBloqueio(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setModalAberto(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  disabled={salvandoBloqueio}
                >
                  {salvandoBloqueio ? 'Bloqueando...' : 'Salvar Bloqueio'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
