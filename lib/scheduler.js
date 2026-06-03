/**
 * Utilitários de Agendamento e Grade de Horários
 * Lida com o cálculo de horários livres, prevenção de double-booking,
 * respeito a bloqueios manuais e tempo de duração dos serviços.
 */

const INTERVALO_MINUTOS = 30; // Incremento mínimo dos horários (ex: de 30 em 30 min)

/**
 * Converte um objeto de data e hora em timestamp numérico para comparação fácil.
 */
const toTimestamp = (dateOrStr) => {
  return new Date(dateOrStr).getTime();
};

/**
 * Verifica se dois intervalos de tempo se sobrepõem.
 * Retorna true se houver sobreposição.
 */
export const checkOverlap = (startA, endA, startB, endB) => {
  const sA = toTimestamp(startA);
  const eA = toTimestamp(endA);
  const sB = toTimestamp(startB);
  const eB = toTimestamp(endB);

  return sA < eB && eA > sB;
};

/**
 * Gera a grade de horários disponíveis para um profissional em um dia específico.
 * 
 * Regra de funcionamento (conforme imagem):
 * - Segunda e Domingo: FECHADO
 * - Terça a Sexta: 09:00 às 19:00
 * - Sábado: 08:00 às 19:00
 * 
 * @param {string} dataStr - Data no formato YYYY-MM-DD
 * @param {number} duracaoServico - Duração do serviço em minutos (ex: 30)
 * @param {Array} agendamentos - Lista de agendamentos existentes do profissional
 * @param {Array} bloqueios - Lista de bloqueios do profissional
 * @returns {Array} Lista de strings com horários disponíveis (ex: ["09:00", "09:30", ...])
 */
export const obterHorariosDisponiveis = (
  dataStr,
  duracaoServico,
  agendamentos = [],
  bloqueios = []
) => {
  const horarios = [];
  
  // Data base de referência para o dia selecionado (em fuso horário local)
  const [ano, mes, dia] = dataStr.split('-').map(Number);
  const dataReferencia = new Date(ano, mes - 1, dia);
  const diaSemana = dataReferencia.getDay(); // 0 = Domingo, 1 = Segunda, 2 = Terça, ..., 6 = Sábado

  // 1. Verificar se a barbearia está aberta neste dia da semana
  if (diaSemana === 0 || diaSemana === 1) {
    return []; // Domingo e Segunda-feira está fechado
  }

  // 2. Determinar horários de abertura e fechamento baseados no dia da semana
  let horaAbertura = 9;
  let horaFechamento = 19;

  if (diaSemana === 6) {
    // Sábado: 08:00 às 19:00
    horaAbertura = 8;
  }

  // Início e fim do expediente do dia
  const inicioExpediente = new Date(ano, mes - 1, dia, horaAbertura, 0, 0);
  const fimExpediente = new Date(ano, mes - 1, dia, horaFechamento, 0, 0);

  // Hora atual para evitar agendamentos no passado
  const agora = new Date();

  // Iterar de INTERVALO_MINUTOS em INTERVALO_MINUTOS
  let horaAtual = new Date(inicioExpediente);

  while (horaAtual < fimExpediente) {
    // Definir fim teórico deste serviço se agendado neste horário
    const fimServico = new Date(horaAtual.getTime() + duracaoServico * 60000);
    
    // Se o serviço ultrapassa o horário de encerramento do expediente, interrompe
    if (fimServico > fimExpediente) {
      break;
    }

    // Ignorar horários no passado para o dia de hoje
    if (horaAtual <= agora) {
      horaAtual = new Date(horaAtual.getTime() + INTERVALO_MINUTOS * 60000);
      continue;
    }

    // Verificar se este intervalo (horaAtual até fimServico) bate com algum agendamento ativo
    const conflitoAgendamento = agendamentos.some(agendamento => {
      if (agendamento.status === 'cancelado') return false;
      
      const agInicio = new Date(agendamento.data_hora);
      const duracaoAg = agendamento.duracao_minutos || 30;
      const agFim = new Date(agInicio.getTime() + duracaoAg * 60000);

      return checkOverlap(horaAtual, fimServico, agInicio, agFim);
    });

    // Verificar se este intervalo bate com algum bloqueio do barbeiro (almoço, folga)
    const conflitoBloqueio = bloqueios.some(bloqueio => {
      const bloqInicio = new Date(bloqueio.data_hora_inicio);
      const bloqFim = new Date(bloqueio.data_hora_fim);

      return checkOverlap(horaAtual, fimServico, bloqInicio, bloqFim);
    });

    // Se não há conflito de agendamento nem de bloqueio, este horário está livre!
    if (!conflitoAgendamento && !conflitoBloqueio) {
      const hh = String(horaAtual.getHours()).padStart(2, '0');
      const mm = String(horaAtual.getMinutes()).padStart(2, '0');
      horarios.push(`${hh}:${mm}`);
    }

    // Avançar para a próxima fatia de tempo
    horaAtual = new Date(horaAtual.getTime() + INTERVALO_MINUTOS * 60000);
  }

  return horarios;
};

/**
 * Converte um horário formato HH:MM de um dia YYYY-MM-DD para objeto Date completo
 */
export const criarDataHoraCompleta = (dataStr, horarioStr) => {
  const [ano, mes, dia] = dataStr.split('-').map(Number);
  const [horas, minutos] = horarioStr.split(':').map(Number);
  return new Date(ano, mes - 1, dia, horas, minutos, 0);
};
