// schedule/schedule-headers.manager.ts
import { Injectable } from '@nestjs/common';
import { ServiceNowHeaders } from './models/service-now.model';

@Injectable()
export class ServiceNowService {
  private headers: ServiceNowHeaders;

  constructor() {
    this.headers = {
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
      'cache-control': 'max-age=0',
      'sec-ch-ua':
        '"Not)A;Brand";v="99", "Microsoft Edge";v="127", "Chromium";v="127"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'upgrade-insecure-requests': '1',
      cookie: 'initial_cookie_value_here',
    };
  }

  getHeaders(): ServiceNowHeaders {
    return this.headers;
  }

  updateHeader(key: keyof ServiceNowHeaders, value: string): void {
    this.headers[key] = value;
  }

  updateHeaders(updatedHeaders: Partial<ServiceNowHeaders>): void {
    this.headers = { ...this.headers, ...updatedHeaders };
  }
}
