import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import * as cron from 'node-cron';
import { CheerioAPI } from 'cheerio';
import { ServiceNowService } from './service-now.service';
import { IncidentPayload } from './models/service-now.model';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);
  private readonly url: string;
  private readonly headers: Record<string, string>;

  private jar = new CookieJar();
  private client = wrapper(axios.create({ jar: this.jar }));
  private job: cron.ScheduledTask;

  constructor(
    private configService: ConfigService,
    private readonly serviceNowService: ServiceNowService,
  ) {
    this.url = this.configService.get<string>('URL');

    this.headers = JSON.parse(this.configService.get<string>('HEADERS_JSON'));
  }

  async fetchTasksData() {
    try {
      const response = await this.client.get(this.url, {
        headers: this.headers,
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
      });

      if (response.status === 200) {
        this.logger.log('Authenticated. Parsing data...');
        const html = response.data;
        const $ = cheerio.load(html);
        const data = this.parseHtml($);
        this.logger.log(JSON.stringify(data, null, 2));
        return data;
      } else {
        this.logger.error(`Unexpected status code: ${response.status}`);
        throw new Error(`Status code ${response.status} received`);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async accessTask(link: string): Promise<any | null> {
    try {
      this.logger.log('link', link);
      const response = await this.client.get(link, {
        headers: this.headers,
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
      });

      if (response.status === 200) {
        this.logger.log('Authenticated. Parsing data...');
        const html = response.data;
        const $ = cheerio.load(html);

        const form = $('form[name="incident.do"]');
        if (form.length === 0) {
          console.error('Form with name "incident.do" not found');
          return;
        }

        // Extract names, ids, or classes of all input elements within this form
        const formData = {};
        const tag = [];
        form.find('input').each((i, input) => {
          let name = $(input).attr('name');
          let value = $(input).attr('value') as string | '';
          tag.push(name);

          if (!name) {
            // If no name, check for id or class
            const id = $(input).attr('id');
            const className = $(input).attr('class');

            if (id) {
              name = id;
            } else if (className) {
              name = className;
            }
          }

          if (name) {
            formData[name] = value;
          }
        });
        this.logger.log("TAG", tag);

        // const assignRes = await this.client.post('https://geit.service-now.com/incident.do', formData, {
        //   headers: {
        //     ...this.headers,
        //     'Content-Type': 'application/x-www-form-urlencoded', // Ensure content type matches form submission
        //   },
        //   maxRedirects: 0,
        //   validateStatus: (status) => status >= 200 && status < 400,
        // });

        return formData;
      } else {
        this.logger.error(`Unexpected status code: ${response.status}`);
        throw new Error(`Status code ${response.status} received`);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private parseHtml($: CheerioAPI): any[] {
    const headers = [];
    const data = [];

    $('table#incident_task_table thead th').each((index, element) => {
      const headerName = $(element).attr('name');
      headers.push(headerName || $(element).text().trim());
    });

    $('table#incident_task_table tbody tr').each((index, element) => {
      const row = {};
      $(element)
        .find('td')
        .each((i, cell) => {
          if (i >= 2) {
            const $cell = $(cell);
            const link = $cell.find('a').attr('href');
            const value = $cell.text().trim();
            row[headers[i]] = link
              ? { link: new URL(link, this.url).href, value }
              : value;
          }
        });
      data.push(row);
    });

    return data;
  }

  private handleError(error: any) {
    if (error.response) {
      const { status, headers } = error.response;
      if (status === 302 || status === 303) {
        const redirectUrl = headers.location;
        this.logger.log(`Redirect detected: ${redirectUrl}`);
        if (redirectUrl.includes('SSO.saml2')) {
          this.logger.warn('SSO detected. Authentication required.');
        }
      } else {
        this.logger.error(`Error response: ${status}`, error.response.data);
      }
    } else {
      this.logger.error('Request error:', error.message);
    }

    this.stopCronJob();
  }

  startCronJob() {
    if (this.job) {
      this.logger.warn('Cron job is already running.');
      return;
    }

    this.job = cron.schedule('*/1 * * * *', () => {
      this.fetchTasksData();
    });
    this.logger.log('Cron job started');
  }

  stopCronJob() {
    if (this.job) {
      this.job.stop();
      this.logger.log('Cron job stopped');
      this.job = null;
    } else {
      this.logger.warn('No cron job is currently running.');
    }
  }

  // Update the cookie value in headers
  updateCookie(newCookie: string): void {
    this.serviceNowService.updateHeader('cookie', newCookie);
  }
}
