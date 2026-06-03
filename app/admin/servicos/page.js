'use client';

import React, { useState, useEffect } from 'react';
import { supabase, mockDb, isMockMode } from '@/lib/supabase';
import styles from '../admin.module.css';
import { Scissors, Clock, DollarSign, Plus, Trash2, X } from 'lucide-react';

export default function GestaoServicos() {
  const [servicos, setServicos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [barbeariaId, setBarbeariaId] = useState('b1-barbearia-mock-id');

  // Estados do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('30');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Carregar ID da barbearia e os serviços
  useEffect(() => {
    async function carregarServicos() {
      try {
        setCarregando(true);
        let lista = [];

        if (isMockMode) {
          lista = await mockDb.getServicos(barbeariaId);
        } else {
          // No Supabase, buscamos a barbearia do proprietário logado
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: barbeariaData, error } = await supabase
              .from('barbearias')
              .select('id')
              .eq('owner_id', user.id)
              .single();

            if (barbeariaData) {
              const bId = barbeariaData.id;
              setBarbeariaId(bId);
              const { data: s } = await supabase.from('servicos').select('*').eq('barbearia_id', bId);
              lista = s || [];
            }
          }
        }
        
        setServicos(lista);
      } catch (err) {
        console.error('Erro ao carregar serviços:', err);
      } finally {
        setCarregando(false);
      }
    }

    carregarServicos();
  }, [barbeariaId]);

  // Formatar preço em BRL
  const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  // Salvar novo serviço
  const criarServico = async (e) => {
    e.preventDefault();
    if (!nome || !preco || !duracao) return;

    try {
      setSalvando(true);
      const novoServico = {
        barbearia_id: barbeariaId,
        nome,
        preco: parseFloat(preco),
        duracao_minutos: parseInt(duracao),
        descricao
      };

      let salvo = null;
      if (isMockMode) {
        salvo = await mockDb.saveServico(novoServico);
      } else {
        const { data, error } = await supabase
          .from('servicos')
          .insert([novoServico])
          .select()
          .single();
        if (error) throw error;
        salvo = data;
      }

      // Atualizar lista
      if (isMockMode) {
        const lista = await mockDb.getServicos(barbeariaId);
        setServicos(lista);
      } else {
        setServicos([...servicos, salvo]);
      }

      // Resetar form e fechar modal
      setNome('');
      setPreco('');
      setDuracao('30');
      setDescricao('');
      setModalAberto(false);
    } catch (err) {
      console.error('Erro ao criar serviço:', err);
      alert('Houve um erro ao criar o serviço.');
    } finally {
      setSalvando(false);
    }
  };

  // Excluir serviço
  const deletarServico = async (id) => {
    if (!confirm('Deseja realmente excluir este serviço? Clientes não poderão mais agendá-lo.')) return;

    try {
      if (isMockMode) {
        await mockDb.deleteServico(id);
      } else {
        const { error } = await supabase.from('servicos').delete().eq('id', id);
        if (error) throw error;
      }

      setServicos(servicos.filter(s => s.id !== id));
    } catch (err) {
      console.error('Erro ao deletar serviço:', err);
      alert('Erro ao excluir serviço.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Cabeçalho */}
      <div className={styles.sectionHeader}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Cadastro de Serviços</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
            Gerencie os cortes, barbas e tratamentos oferecidos na sua barbearia
          </p>
        </div>
        <button 
          onClick={() => setModalAberto(true)} 
          className="btn btn-primary"
        >
          <Plus size={18} /> Novo Serviço
        </button>
      </div>

      {/* Grid de Serviços */}
      {carregando ? (
        <div className="flex-center" style={{ padding: '40px', color: 'var(--text-secondary)' }}>
          Carregando serviços cadastrados...
        </div>
      ) : (
        <div className={styles.servicesGrid}>
          {servicos.length === 0 ? (
            <div className={styles.emptyState}>
              <Scissors size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <h3>Nenhum serviço cadastrado</h3>
              <p style={{ fontSize: '0.85rem', marginTop: 4 }}>
                Clique no botão "Novo Serviço" no topo para registrar o seu primeiro corte ou tratamento.
              </p>
            </div>
          ) : (
            servicos.map((servico) => (
              <div key={servico.id} className={styles.serviceCard}>
                <div className={styles.serviceHeader}>
                  <div>
                    <h3 className={styles.serviceTitle}>{servico.nome}</h3>
                    {servico.descricao && (
                      <p className={styles.serviceDesc}>{servico.descricao}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => deletarServico(servico.id)} 
                    style={{ color: 'var(--error)', backgroundColor: 'transparent', cursor: 'pointer', padding: 4 }}
                    title="Excluir Serviço"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className={styles.serviceFooter}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={16} /> {servico.duracao_minutos} min
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.15rem' }}>
                    {formatarPreco(servico.preco)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL DE NOVO SERVIÇO */}
      {modalAberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            
            <div className={styles.modalHeader}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Novo Serviço</h2>
              <button 
                onClick={() => setModalAberto(false)} 
                style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={criarServico} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label" htmlFor="service-name">Nome do Serviço *</label>
                <input 
                  type="text" 
                  id="service-name"
                  className="input-field" 
                  placeholder="Ex: Corte Degradê" 
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="service-price">Preço (R$) *</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={16} style={{ position: 'absolute', left: 12, top: 15, color: 'var(--text-muted)' }} />
                    <input 
                      type="number" 
                      id="service-price"
                      step="0.01" 
                      className="input-field" 
                      style={{ paddingLeft: '32px' }}
                      placeholder="40.00" 
                      required
                      value={preco}
                      onChange={(e) => setPreco(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="service-duration">Duração (minutos) *</label>
                  <select 
                    id="service-duration"
                    className="input-field" 
                    value={duracao}
                    onChange={(e) => setDuracao(e.target.value)}
                  >
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                    <option value="90">90 min</option>
                    <option value="120">120 min</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="service-desc">Descrição / Detalhes (Opcional)</label>
                <textarea 
                  id="service-desc"
                  className="input-field" 
                  rows="3" 
                  placeholder="Descreva o que está incluso no serviço..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  style={{ resize: 'none' }}
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
                  disabled={salvando}
                >
                  {salvando ? 'Salvando...' : 'Salvar Serviço'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
