import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { DomainEvent } from '../../../../shared/domain-event';
import { EventPublisher } from '../../domain/ports/out/event-publisher';

const TOPIC = 'auth-events';

@Injectable()
export class KafkaEventPublisher
  implements EventPublisher, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger('DomainEvents');
  private readonly producer: Producer;

  constructor() {
    const kafka = new Kafka({
      clientId: 'ms-auth',
      brokers: [(process.env.KAFKA_BOOTSTRAP_SERVERS || 'localhost:9092')],
    });
    this.producer = kafka.producer();
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
    this.logger.log('Kafka producer conectado (auth-events)');
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    if (!events?.length) return;

    const messages = events.map((event) => {
      const e = event as Record<string, unknown>;
      const aggregateId = String(e['userId'] ?? e['email'] ?? 'unknown');
      const envelope = {
        eventName: event.eventName(),
        occurredAt: event.occurredAt.toISOString(),
        aggregateId,
        version: 1,
        data: { ...event },
      };
      this.logger.log(
        `${envelope.eventName} @ ${envelope.occurredAt} -> ${TOPIC} key=${aggregateId}`,
      );
      return { key: aggregateId, value: JSON.stringify(envelope) };
    });

    await this.producer.send({ topic: TOPIC, messages });
  }
}
