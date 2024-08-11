import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import * as cron from 'node-cron';
import { CheerioAPI } from 'cheerio';
import { ServiceNowService } from './service-now.service';
import { ServiceNowHeaders } from './models/service-now.model';
import * as qs from 'querystring';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);
  private readonly url: string;
  private readonly serviceNowHeaders: ServiceNowHeaders;

  private jar = new CookieJar();
  private client = wrapper(axios.create({ jar: this.jar }));
  private job: cron.ScheduledTask;

  constructor(
    private configService: ConfigService,
    private readonly serviceNowService: ServiceNowService,
  ) {
    this.url = this.configService.get<string>('URL');

    // this.headers = JSON.parse(this.configService.get<string>('HEADERS_JSON'));
    this.serviceNowHeaders = this.serviceNowService.getHeaders();
  }

  async fetchTasksData() {
    try {
      const response = await this.client.get(this.url, {
        headers: this.serviceNowHeaders as unknown as Record<string, string>,
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

  private paramsToString(params: Record<string, any>): string {
    return qs.stringify(params);
  }
  
  // Convert formDataString to object
  private formDataStringToObject(formDataString: string): Record<string, string> {
    return qs.parse(formDataString) as Record<string, string>;
  }
  
  // Compare two objects
  private compareObjects(obj1: Record<string, any>, obj2: Record<string, any>): any {
    const keysObj1 = new Set(Object.keys(obj1));
    const keysObj2 = new Set(Object.keys(obj2));

    const missingInObj1 = Array.from(keysObj2).filter(key => !keysObj1.has(key));
    const missingInObj2 = Array.from(keysObj1).filter(key => !keysObj2.has(key));

    const valueDifferences: string[] = [];
    for (const key of keysObj1) {
      if (keysObj2.has(key) && obj1[key] !== obj2[key]) {
        valueDifferences.push(`Key "${key}": Value in obj1 is "${obj1[key]}", but in obj2 it is "${obj2[key]}"`);
      }
    }

    return { missingInObj1, missingInObj2, valueDifferences };
  }

  async accessTask(link: string): Promise<any | null> {
    try {
      const response = await this.client.get(link, {
        headers: this.serviceNowHeaders as unknown as Record<string, string>,
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
        const formDataJson = {};
        const formDataString = 'sysparm_ck=56b309c4eb40d210e78af6accad0cdceec3e94afff779be3090bfdcfa95a10355674dbdf&sys_base_uri=https%3A%2F%2Fgeit.service-now.com%2F&sys_target=incident&sys_uniqueName=sys_id&sys_uniqueValue=230b03493bf74e5c6be4736aa5e45ab1&sys_displayValue=GEINC16020369&sys_titleValue=MyTech+Business+Application+Support%3A+RE-Hermes-prod&onLoad_sys_updated_on=2024-08-11+06%3A26%3A17&sys_row=0&sys_modCount=6&sys_action=46edb1afdbbc07004a29df6b5e96195f&sysparm_collection=&sysparm_collectionID=&sysparm_collection_key=&sysparm_collection_related_field=&sysparm_collection_relationship=&sysparm_redirect_url=&sysparm_goto_url=&isFormPage=true&sysparm_referring_url=&sysparm_view=Default+view&sysparm_changeset=&sysparm_template_editable=&sysparm_record_row=1&sysparm_record_list=active%3Dtrue%5Estate%3D6%5Eassignment_group%3D17a02ebe978ddd98020972e11153af02%5EORassignment_group%3D1a737891dbacb058a0ec973fd3961930%5EORDERBYDESCopened_at&sysparm_record_rows=2&sysparm_record_target=incident&sysparm_modify_check=true&sysparm_action_template=&sysparm_link_collection=&sysparm_pop_onLoad=&sysparm_nameofstack=&sysparm_transaction_scope=&sysparm_transaction_update_set=&sysparm_record_scope=&sysparm_ck=56b309c4eb40d210e78af6accad0cdceec3e94afff779be3090bfdcfa95a10355674dbdf&sys_original.incident.number=GEINC16020369&incident.number=GEINC16020369&sys_original.incident.state=6&incident.state=6&sys_original.incident.hold_reason=&incident.hold_reason=&sys_original.incident.u_contact_attempt=&incident.u_contact_attempt=&sys_original.incident.follow_up=&incident.follow_up=&sys_original.incident.caller_id=f137f1b81b3b1058b33ddc2ddc4bcb3f&incident.caller_id=f137f1b81b3b1058b33ddc2ddc4bcb3f&sys_display.original.incident.caller_id=Vanny%2C+Valentin+%28212815969%29&sys_display.incident.caller_id=Vanny%2C+Valentin+%28212815969%29&sys_original.incident.u_on_behalf_of=f137f1b81b3b1058b33ddc2ddc4bcb3f&incident.u_on_behalf_of=f137f1b81b3b1058b33ddc2ddc4bcb3f&sys_display.original.incident.u_on_behalf_of=Vanny%2C+Valentin+%28212815969%29&sys_display.incident.u_on_behalf_of=Vanny%2C+Valentin+%28212815969%29&sys_original.incident.opened_at=08%2F02%2F2024+02%3A44%3A13+PM&incident.opened_at=08%2F02%2F2024+02%3A44%3A13+PM&sys_original.incident.opened_by=f137f1b81b3b1058b33ddc2ddc4bcb3f&incident.opened_by_label=Vanny%2C+Valentin+%28212815969%29&incident.opened_by=f137f1b81b3b1058b33ddc2ddc4bcb3f&sys_display.incident.opened_by=Vanny%2C+Valentin+%28212815969%29&sys_display.original.incident.opened_by=Vanny%2C+Valentin+%28212815969%29&sys_original.incident.contact_type=self-service&incident.contact_type=self-service&sys_original.incident.location=57fceafbdb746058d8a9005ed3961982&incident.location=57fceafbdb746058d8a9005ed3961982&sys_display.original.incident.location=Qianzhou+town%2C+Huilai+county%2C+Guangdong+province%2C+Jieyang+city-BLD-3019496%2C+Jieyang%2C+Guangdong%2C+515200%2C+China&sys_display.incident.location=Qianzhou+town%2C+Huilai+county%2C+Guangdong+province%2C+Jieyang+city-BLD-3019496%2C+Jieyang%2C+Guangdong%2C+515200%2C+China&sys_original.incident.company=d1c3db93db64ba403bb5dffa5e961916&incident.company_label=GE+Renewable+Energy&incident.company=d1c3db93db64ba403bb5dffa5e961916&sys_display.incident.company=GE+Renewable+Energy&sys_display.original.incident.company=GE+Renewable+Energy&sys_original.incident.u_on_behalf_of.preferred_language=en&incident.u_on_behalf_of.preferred_language=en&sys_original.incident.u_on_behalf_of.email=Valentin.Vanny%40ge.com&incident.u_on_behalf_of.email=Valentin.Vanny%40ge.com&sys_original.incident.u_on_behalf_of.phone=&incident.u_on_behalf_of.phone=&sys_original.incident.u_on_behalf_of.mobile_phone=&incident.u_on_behalf_of.mobile_phone=&sys_original.incident.short_description=MyTech+Business+Application+Support%3A+RE-Hermes-prod&sys_display.original.incident.short_description=MyTech+Business+Application+Support%3A+RE-Hermes-prod&sys_display.incident.short_description=MyTech+Business+Application+Support%3A+RE-Hermes-prod&incident.short_description=MyTech+Business+Application+Support%3A+RE-Hermes-prod&ni.dependent_reverse.incident.short_description=null&incident.description=See+%27Notes%27+to+view+attached+files%3A+Capture.JPG+%0D%0A+++++Which+site+is+effected+%28SNZ%2FJYG%2FSLZ%2FBHT%2FPNS%2FPDP%29+%3F%0D%0AJYG%0D%0A++++++How+many+users+are+affected%3F%0D%0A1%0D%0A+++++++Name+and+URL+of+the+application%3A%0D%0AOperations+Management++++++%0D%0A++++++++Preferred+contact+method%28s%29+in+case+of+follow-up%3A%0D%0ATeams%0D%0A++++++++Contact+phone+number%3A++++++++%0D%0AN%2FA%0D%0A++++++++Has+this+been+a+recurring+issue+within+last+few+weeks%3F%0D%0AYes+one+week%0D%0A++++++++Date+that+the+issue+started%0D%0A29%2F08%0D%0A++++++++Error+message+%28attach+screenshot+of+the+error+if+there+is+one%2C+steps+that+lead+to+the+error%29%3A%0D%0AWhile+clock+on%2C+not+working+and+have+a+pop+up+message+blocking+the+BOT+execution.&sys_original.incident.description=See+%27Notes%27+to+view+attached+files%3A+Capture.JPG+%0D%0A+++++Which+site+is+effected+%28SNZ%2FJYG%2FSLZ%2FBHT%2FPNS%2FPDP%29+%3F%0D%0AJYG%0D%0A++++++How+many+users+are+affected%3F%0D%0A1%0D%0A+++++++Name+and+URL+of+the+application%3A%0D%0AOperations+Management++++++%0D%0A++++++++Preferred+contact+method%28s%29+in+case+of+follow-up%3A%0D%0ATeams%0D%0A++++++++Contact+phone+number%3A++++++++%0D%0AN%2FA%0D%0A++++++++Has+this+been+a+recurring+issue+within+last+few+weeks%3F%0D%0AYes+one+week%0D%0A++++++++Date+that+the+issue+started%0D%0A29%2F08%0D%0A++++++++Error+message+%28attach+screenshot+of+the+error+if+there+is+one%2C+steps+that+lead+to+the+error%29%3A%0D%0AWhile+clock+on%2C+not+working+and+have+a+pop+up+message+blocking+the+BOT+execution.&incident.business_impact=&sys_original.incident.business_impact=&sysparm_cxs_session_id=230b03493bf74e5c6be4736aa5e45ab1&cxs_related_search=&searchresource_dropdown=&sys_original.incident.u_template=&incident.u_template=&incident.u_template_results=&sys_original.incident.u_template_results=&incident.u_template_results=&sys_original.incident.u_ge_business=&incident.u_ge_business=&sys_display.original.incident.u_ge_business=&sys_select.incident.u_ge_business=&sys_display.incident.u_ge_business=&sys_original.incident.u_service=e25f6d43db287c5cbea6973fd39619af&incident.u_service=e25f6d43db287c5cbea6973fd39619af&sys_display.original.incident.u_service=RE-Hermes&sys_display.incident.u_service=RE-Hermes&sys_original.incident.u_environment=ab5fed43db287c5cbea6973fd3961947&incident.u_environment=ab5fed43db287c5cbea6973fd3961947&sys_display.original.incident.u_environment=RE-Hermes-prod&sys_display.incident.u_environment=RE-Hermes-prod&sys_original.incident.cmdb_ci=e25f6d43db287c5cbea6973fd39619af&incident.cmdb_ci=e25f6d43db287c5cbea6973fd39619af&sys_display.original.incident.cmdb_ci=RE-Hermes&sys_display.incident.cmdb_ci=RE-Hermes&sys_original.incident.assignment_group=1a737891dbacb058a0ec973fd3961930&incident.assignment_group=1a737891dbacb058a0ec973fd3961930&sys_display.original.incident.assignment_group=%40RENEWABLE+ENERGY+MES_Support&sys_display.incident.assignment_group=%40RENEWABLE+ENERGY+MES_Support&sys_original.incident.assigned_to=27495abd97b15110fa4cf1671153af9f&incident.assigned_to=71035ce847b8d198d11a8f48436d438a&sys_display.original.incident.assigned_to=Huynh%2C+Nghia+%28503332000%29&sys_display.incident.assigned_to=Tran%2C+Long+%28503324386%29&sys_original.incident.priority=-1&incident.priority=-1&sys_original.incident.impact=1&incident.impact=1&sys_original.incident.urgency=3&incident.urgency=3&text.value.incident.watch_list=&incident.watch_list=&sys_original.incident.watch_list=&text.value.incident.work_notes_list=&incident.work_notes_list=&sys_original.incident.work_notes_list=&incident.comments=&sys_original.incident.comments=&sys_display.incident.comments=&incident.work_notes=&sys_original.incident.work_notes=&sys_display.incident.work_notes=&activity_filter_all=on&activity_filter.actions_taken=on&activity_filter.comments=on&activity_filter.assigned_to=on&activity_filter.assignment_group=on&activity_filter.*Attachments*=on&activity_filter.business_impact=on&activity_filter.caller_id=on&activity_filter.category=on&activity_filter.caused_by=on&activity_filter.contact_type=on&activity_filter.close_code=on&activity_filter.close_notes=on&activity_filter.closed_at=on&activity_filter.closed_by=on&activity_filter.cmdb_ci=on&activity_filter.description=on&activity_filter.*EmailAutogenerated*=on&activity_filter.*EmailCorrespondence*=on&activity_filter.u_environment=on&activity_filter.impact=on&activity_filter.location=on&activity_filter.u_new_call_number=on&activity_filter.u_on_behalf_of=on&activity_filter.hold_reason=on&activity_filter.opened_at=on&activity_filter.opened_by=on&activity_filter.u_outage_owner=on&activity_filter.parent_incident=on&activity_filter.priority=on&activity_filter.cause=on&activity_filter.problem_id=on&activity_filter.u_service=on&activity_filter.short_description=on&activity_filter.state=on&activity_filter.subcategory=on&activity_filter.sys_tags=on&activity_filter.urgency=on&activity_filter.work_notes=on&sys_original.incident.parent_incident=&incident.parent_incident=&sys_display.original.incident.parent_incident=&sys_display.incident.parent_incident=&sys_original.incident.problem_id=&incident.problem_id=&sys_display.original.incident.problem_id=&sys_display.incident.problem_id=&sys_original.incident.caused_by=&incident.caused_by=&sys_display.original.incident.caused_by=&sys_display.incident.caused_by=&sys_original.incident.escalation=0&incident.escalation=0&sys_original.incident.u_new_call_number=&incident.u_new_call_number=&sys_display.original.incident.u_new_call_number=&sys_display.incident.u_new_call_number=&sys_original.incident.u_rofc=false&incident.u_rofc=false&sys_original.incident.u_call_elapsed_time=&ni.incident.u_call_elapsed_timedur_day=00&ni.incident.u_call_elapsed_timedur_hour=00&ni.incident.u_call_elapsed_timedur_min=00&ni.incident.u_call_elapsed_timedur_sec=00&incident.u_call_elapsed_time=&sys_original.incident.u_call_webticket_name=&incident.u_call_webticket_name=&sys_display.original.incident.u_call_webticket_name=&sys_display.incident.u_call_webticket_name=&sys_original.incident.close_code=Solved+%28Permanently%29&incident.close_code=Solved+%28Permanently%29&incident.close_notes=Site%3A+JYG%0D%0ATicket+type%3A+Bug%0D%0AIssue%3A+Error+toast+message+show+when+access+application%0D%0AAction%2FWorkaround%3A+Renew+integration+image%0D%0ARoot+cause%3A+Integration+image+expired+and+cannot+be+pulled.%0D%0AResolution%3A+Renew+integration+image%0D%0AAssignee%28Optional%29%3A+Long&sys_original.incident.close_notes=Site%3A+JYG%0D%0ATicket+type%3A+Bug%0D%0AIssue%3A+Error+toast+message+show+when+access+application%0D%0AAction%2FWorkaround%3A+Renew+integration+image%0D%0ARoot+cause%3A+Integration+image+expired+and+cannot+be+pulled.%0D%0AResolution%3A+Renew+integration+image%0D%0AAssignee%28Optional%29%3A+Long&sys_original.incident.category=&incident.category=&sys_original.incident.subcategory=&ni.dependent.category=incident.subcategory&ni.dependent_reverse.incident.subcategory=category&incident.subcategory=&sys_original.incident.resolved_by=71035ce847b8d198d11a8f48436d438a&incident.resolved_by_label=Tran%2C+Long+%28503324386%29&incident.resolved_by=71035ce847b8d198d11a8f48436d438a&sys_display.incident.resolved_by=Tran%2C+Long+%28503324386%29&sys_display.original.incident.resolved_by=Tran%2C+Long+%28503324386%29&sys_original.incident.resolved_at=08%2F09%2F2024+07%3A03%3A48+AM&incident.resolved_at=08%2F09%2F2024+07%3A03%3A48+AM&incident.cause=&sys_original.incident.cause=&sys_original.incident.u_outage_owner=&incident.u_outage_owner_label=&incident.u_outage_owner=&sys_display.incident.u_outage_owner=&sys_display.original.incident.u_outage_owner=&sys_original.incident.major_incident_state=&incident.major_incident_state=&sys_original.incident.proposed_by=&incident.proposed_by_label=&incident.proposed_by=&sys_display.incident.proposed_by=&sys_display.original.incident.proposed_by=&sys_original.incident.promoted_by=&incident.promoted_by_label=&incident.promoted_by=&sys_display.incident.promoted_by=&sys_display.original.incident.promoted_by=&sys_original.incident.proposed_on=&incident.proposed_on=&sys_original.incident.promoted_on=&incident.promoted_on=&incident.overview=&sys_original.incident.overview=&incident.lessons_learned=&sys_original.incident.lessons_learned=&incident.timeline=&sys_original.incident.timeline=&sysparm_encoded_record=&sysverb_update_and_stay=&create_outage_record=&8b5ac053dbfb3e0084b85d6e5e961921=&create_knowledge_inc=&ddbf640437412000dada8cdabebe5d21=&show_history=';
        // const formDataObject = this.parseQueryString(formDataString);
        form.find('input, select, textarea').each((_, element) => {
          const el = $(element);
          const name = el.attr('name');
          const value = el.attr('value') || el.text();
          if (name) {
            formDataJson[name] = value ? value.toString() : '';
          }
        });

        formDataJson['sys_action'] = '46edb1afdbbc07004a29df6b5e96195f';
        formDataJson['sys_display.incident.assigned_to'] =
          'Tran, Long (503324386)';

        const params = new URLSearchParams();
        Object.keys(formDataJson).forEach((key) => {
          params.append(key, formDataJson[key]);
        });

        // Convert params to query string
      const paramsString = this.paramsToString(params);
      // Convert formDataString to object
      const formDataObj = this.formDataStringToObject(formDataString);

      // Compare formDataJson with formDataObj
      const differences = this.compareObjects(formDataJson, formDataObj);
      return differences;

        // const assignRes = await this.client.post(
        //   'https://geit.service-now.com/incident.do',
        //   params.toString(),
        //   {
        //     headers: {
        //       ...this.serviceNowHeaders,
        //       'Content-Type': 'application/x-www-form-urlencoded', // Ensure content type matches form submission
        //     },
        //     maxRedirects: 0,
        //     validateStatus: (status) => status >= 200 && status < 400,
        //   },
        // );

        // this.logger.log(`Response Status: ${assignRes.status}`);
        // this.logger.log(`Response Data: ${JSON.stringify(assignRes.data)}`);
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
