import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// LUMERA_RABBITMQ_PW2: publisher AMQP real via RabbitMQ.
export async function publicarAgendamentoCriado(evento: Record<string, unknown>): Promise<void> {
  const url = process.env.RABBITMQ_URL;
  if (!url) return; // Sem RabbitMQ nos testes unitarios.
  let conn: any;
  let channel: any;
  try {
    const amqp = require('amqplib');
    conn = await amqp.connect(url);
    channel = await conn.createConfirmChannel();
    const fila = process.env.RABBITMQ_QUEUE || 'lumera.agendamentos.criados';
    await channel.assertQueue(fila, { durable: true });
    channel.sendToQueue(fila, Buffer.from(JSON.stringify(evento)), {
      persistent: true,
      contentType: 'application/json',
    });
    await channel.waitForConfirms();
    console.log('[RabbitMQ] Evento publicado:', evento.tipo, evento.agendamentoId);
  } catch (erro) {
    console.error('[RabbitMQ] Nao foi possivel publicar:', erro instanceof Error ? erro.message : erro);
  } finally {
    if (channel) await channel.close().catch(() => {});
    if (conn) await conn.close().catch(() => {});
  }
}
