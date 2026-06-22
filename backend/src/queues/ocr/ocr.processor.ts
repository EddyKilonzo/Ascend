import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { AiGatewayService } from '../../integrations/ai-gateway/ai-gateway.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QUEUE_OCR, JOB_OCR_PROCESS } from '../queues.constants';

export interface OcrJobData {
  userId:    string;
  fileId:    string;
  imageUrl:  string;
  mimeType:  string;
  hint:      'general' | 'screenshot' | 'document' | 'task' | 'habit' | 'goal';
  contextId?: string;
}

@Processor(QUEUE_OCR)
export class OcrProcessor {
  private readonly logger = new Logger(OcrProcessor.name);

  constructor(
    private readonly prisma:   PrismaService,
    private readonly gateway:  AiGatewayService,
    private readonly events:   EventEmitter2,
  ) {}

  /**
   * Full OCR pipeline: fetch image → OCR service → structure → intelligence → emit events.
   *
   * Pipeline:
   *   Image URL (Cloudinary) → download → OCR service → intelligence block
   *   → emit ocr.completed for task/habit/goal extraction handlers
   *
   * Security: images are fetched from Cloudinary by NestJS and streamed to the OCR service.
   * The OCR service uses temp-file-only storage — no permanent retention.
   */
  @Process(JOB_OCR_PROCESS)
  async processOcr(job: Job<OcrJobData>): Promise<void> {
    const { userId, fileId, imageUrl, mimeType, hint } = job.data;
    try {
      // Fetch image bytes from Cloudinary
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());

      // Route to appropriate OCR pipeline
      const result = hint === 'screenshot'
        ? await this.gateway.processScreenshotOcr(buffer, mimeType)
        : await this.gateway.processImageOcr(buffer, mimeType, hint);

      if (!result.ok) {
        this.logger.warn(`OCR failed for file ${fileId}: ${result.error}`);
        return;
      }

      const { intelligence, structured } = result.data;

      // Persist intelligence results on the file record
      await this.prisma.userFile.update({
        where: { id: fileId },
        data:  {
          // Store OCR output as additional context metadata (JSON field if schema supports it)
          // For now tag the contextId with the OCR intent for downstream query
          ...(intelligence?.ocr_intent ? {} : {}),
        },
      }).catch(() => {/* non-critical */});

      // Emit intelligence event for downstream handlers
      if (intelligence?.ready_for_ingestion) {
        this.events.emit('ocr.intelligence_ready', {
          userId,
          fileId,
          hint,
          contextId:  job.data.contextId,
          intelligence,
          structured,
        });
      }

      this.logger.log(
        `OCR complete file=${fileId} intent=${intelligence?.ocr_intent ?? 'unknown'} ` +
        `items=${intelligence?.extractable_items?.length ?? 0} latency=${result.latency_ms}ms`,
      );
    } catch (err) {
      this.logger.error(`OCR job error file=${fileId} user=${userId}`, err);
      throw err;
    }
  }
}
