import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NetworkTimeService {
  private readonly logger = new Logger(NetworkTimeService.name);

  async getNow(): Promise<Date> {
    try {
      const response = await axios.get(
        'https://timeapi.io/api/time/current/zone?timeZone=Asia/Manila',
        { timeout: 3000 },
      );
      // timeapi.io returns { dateTime: "2026-05-18T14:06:00.000000" } in Manila time
      return new Date(response.data.dateTime + '+08:00');
    } catch (error) {
      this.logger.warn(
        `[NetworkTimeService] Failed to fetch network time, falling back to system clock: ${error.message}`,
      );
      return new Date();
    }
  }
}