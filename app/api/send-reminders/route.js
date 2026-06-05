import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Credenciais da Z-API (Configuradas nas variáveis de ambiente do Vercel/Supabase)
const ZAPI_INSTANCE_ID = process.env.ZAPI_INSTANCE_ID || '';
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN || '';
const ZAPI_SECURITY_TOKEN = process.env.ZAPI_SECURITY_TOKEN || '';

/**
 * Função utilitária para limpar e formatar o telefone do cliente para o padrão Z-API (DDI + DDD + Número)
 * Exemplo de entrada: "(11) 99999-8888" ou "11999998888" ou "5511999998888"
 * Exemplo de saída: "5511999998888"
 */
function sanitizarTelefone(telefone) {
  // Remover tudo que não for dígito
  let numeros = telefone.replace(/\D/g, '');
  
  // Se já tiver o código do país (55), assume que está correto
  if (numeros.startsWith('55') && numeros.length >= 12) {
    return numeros;
  }
  
  // Se não tiver o 55, adiciona o DDI do Brasil (55)
  return `55${numeros}`;
}

/**
 * Envia uma mensagem via Z-API se as credenciais existirem.
 * Caso contrário, simula o envio imprimindo no console.
 */
async function enviarMensagemWhatsapp(telefone, texto) {
  const telefoneSanitizado = sanitizarTelefone(telefone);

  if (!ZAPI_INSTANCE_ID || !ZAPI_CLIENT_TOKEN) {
    // Modo Simulado (Fallback)
    console.log('\n==================================================');
    console.log('🤖 SIMULAÇÃO Z-API (WHATSAPP DEMO)');
    console.log(`Para: ${telefoneSanitizado} (${telefone})`);
    console.log(`Mensagem: "${texto}"`);
    console.log('==================================================\n');
    return { success: true, mode: 'mock', message: 'Simulado com sucesso no console.' };
  }

  // Integração Real com a Z-API
  try {
    const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_CLIENT_TOKEN}/send-text`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ZAPI_SECURITY_TOKEN ? { 'Client-Token': ZAPI_SECURITY_TOKEN } : {})
      },
      body: JSON.stringify({
        phone: telefoneSanitizado,
        message: texto
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro desconhecido na Z-API');
    }

    return { success: true, mode: 'real', data };
  } catch (error) {
    console.error('❌ Falha ao enviar mensagem pela Z-API real:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * POST /api/send-reminders
 * Dispara uma notificação imediata de confirmação para um agendamento recém-criado.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { agendamentoId } = body;

    if (!agendamentoId) {
      return NextResponse.json({ error: 'ID do agendamento não informado.' }, { status: 400 });
    }

    let agendamento = null;
    let servico = null;
    let profissional = null;

    const { data, error } = await supabase
      .from('agendamentos')
      .select('*, servicos(*), profissionais(*)')
      .eq('id', agendamentoId)
      .single();

    if (error) throw error;
    agendamento = data;
    servico = data.servicos;
    profissional = data.profissionais;

    if (!agendamento) {
      return NextResponse.json({ error: 'Agendamento não encontrado.' }, { status: 404 });
    }

    // Criar a mensagem de confirmação
    const dataObj = new Date(agendamento.data_hora);
    const dataFormatada = dataObj.toLocaleDateString('pt-BR');
    const horaFormatada = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const textoConfirmacao = `Olá ${agendamento.cliente_nome}! ✂️\n\nSeu agendamento de *${servico?.nome || 'Serviço'}* com o profissional *${profissional?.nome || 'Barbeiro'}* está *CONFIRMADO*!\n\n📅 Data: ${dataFormatada}\n⏰ Horário: ${horaFormatada} hs\n\nCaso precise cancelar, por favor entre em contato. Te esperamos!`;

    const res = await enviarMensagemWhatsapp(agendamento.cliente_telefone, textoConfirmacao);

    return NextResponse.json({ success: true, result: res });
  } catch (err) {
    console.error('Erro na rota POST send-reminders:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/send-reminders
 * Pode ser rodado via CRON diário ou de hora em hora.
 * Busca agendamentos do dia/próximas horas e dispara lembretes preventivos (ex: 2 horas antes).
 */
export async function GET() {
  try {
    let agendamentosParaNotificar = [];

    // Definir janela de lembrete: de 2 a 3 horas a partir de agora
    const agora = new Date();
    const duasHoras = new Date(agora.getTime() + 2 * 60 * 60 * 1000);
    const tresHoras = new Date(agora.getTime() + 3 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('agendamentos')
      .select('*, servicos(*), profissionais(*)')
      .eq('status', 'confirmado')
      .gte('data_hora', duasHoras.toISOString())
      .lte('data_hora', tresHoras.toISOString());

    if (error) throw error;
    agendamentosParaNotificar = data || [];

    const logs = [];

    for (const ag of agendamentosParaNotificar) {
      const servico = ag.servicos;
      const profissional = ag.profissionais;
      
      const dataObj = new Date(ag.data_hora);
      const horaFormatada = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const textoLembrete = `Olá ${ag.cliente_nome}! ⏰\n\nEste é um lembrete amigável do seu horário agendado de *${servico?.nome}* hoje às *${horaFormatada} hs*.\n\nContamos com a sua presença! Até logo.`;

      const res = await enviarMensagemWhatsapp(ag.cliente_telefone, textoLembrete);
      logs.push({ agendamentoId: ag.id, status: 'enviado', res });
    }

    return NextResponse.json({
      message: `Processamento concluído. ${agendamentosParaNotificar.length} lembretes disparados.`,
      detalhes: logs
    });
  } catch (err) {
    console.error('Erro na rota GET send-reminders:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
