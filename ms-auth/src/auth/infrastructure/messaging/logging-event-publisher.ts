import { Injectable, Logger } from '@nestjs/common';
import { DomainEvent } from '../../../shared/domain-event';
import { EventPublisher } from '../../domain/ports/out/event-publisher';

@Injectable()
export class LoggingEventPublisher implements EventPublisher {
  private readonly logger = new Logger('DomainEvents');

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      this.logger.log(
        `${event.eventName()} @ ${event.occurredAt.toISOString()} :: ${JSON.stringify(event)}`,
      );
    }
  }
}
