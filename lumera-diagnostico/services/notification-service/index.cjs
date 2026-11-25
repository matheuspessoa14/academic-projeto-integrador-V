const amqp = require('amqplib');
const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const fila = process.env.RABBITMQ_QUEUE || 'lumera.agendamentos.criados';

async function iniciar() {
  let conn;
  while (!conn) {
    try { conn = await amqp.connect(url); }
    catch (erro) { console.error('[Notification Service] RabbitMQ indisponivel. Tentando novamente:', erro.message); await new Promise(r => setTimeout(r, 3000)); }
  }
  const canal = await conn.createChannel();
  await canal.assertQueue(fila, { durable: true });
  await canal.prefetch(1);
  console.log('[Notification Service] CONECTADO AO RABBITMQ. Aguardando eventos na fila:', fila);
  await canal.consume(fila, msg => {
    if (!msg) return;
    try {
      const evento = JSON.parse(msg.content.toString());
      console.log('[Notification Service] EVENTO RECEBIDO:', JSON.stringify(evento));
      console.log('[Notification Service] Notificacao simulada para consulta:', evento.agendamentoId);
      canal.ack(msg);
    } catch (erro) { console.error('[Notification Service] Falha ao processar:', erro.message); canal.nack(msg, false, false); }
  });
  conn.on('close', () => { console.error('[Notification Service] Conexao interrompida; encerrando para reinicio pelo Docker.'); process.exit(1); });
}
iniciar().catch(erro => { console.error(erro);process.exit(1); });
