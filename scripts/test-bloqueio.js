const fs = require('fs');
const path = require('path');

const ENV_PATH = path.resolve(__dirname, '..', '.env.local');

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

(async () => {
  try {
    const env = loadEnv(ENV_PATH);
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      console.error('Faltam variáveis NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local');
      process.exit(1);
    }

    const base = url.replace(/\/$/, '');
    const headers = {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    };

    console.log('-> Testando leitura de `profissionais` (GET)');
    const profRes = await fetch(`${base}/rest/v1/profissionais?select=*&limit=1`, { headers });
    const profText = await profRes.text();
    console.log('Status:', profRes.status, profRes.statusText);
    console.log('Resposta (profissionais):', profText);

    // Tentar inserir um bloqueio de teste
    const inicio = new Date();
    const fim = new Date(inicio.getTime() + 60 * 60 * 1000);
    const dados = {
      profissional_id: (profRes.ok && profText && profText !== '[]') ? JSON.parse(profText)[0].id : 'test-profissional-id',
      data_hora_inicio: inicio.toISOString(),
      data_hora_fim: fim.toISOString(),
      motivo: 'TEST_NODE'
    };

    console.log('-> Tentando inserir bloqueio de teste:', dados);
    const insertRes = await fetch(`${base}/rest/v1/bloqueios`, { method: 'POST', headers, body: JSON.stringify(dados) });
    const insertText = await insertRes.text();
    console.log('Status insert:', insertRes.status, insertRes.statusText);
    console.log('Resposta insert:', insertText);

    if (insertRes.ok) {
      let inserted;
      try { inserted = JSON.parse(insertText); } catch(e) { inserted = null; }
      const id = inserted && inserted[0] && inserted[0].id;
      if (id) {
        console.log('-> Inserção retornou id:', id, 'agora removendo...');
        const delRes = await fetch(`${base}/rest/v1/bloqueios?id=eq.${id}`, { method: 'DELETE', headers });
        console.log('Status delete:', delRes.status, delRes.statusText);
        const delText = await delRes.text();
        console.log('Resposta delete:', delText);
      }
    }

    console.log('Teste finalizado.');
  } catch (err) {
    console.error('Erro no script de teste:', err);
    process.exit(1);
  }
})();
