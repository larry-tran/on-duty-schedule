export interface ServiceNowHeaders {
  accept: string;
  'accept-language': string;
  'cache-control': string;
  'sec-ch-ua': string;
  'sec-ch-ua-mobile': string;
  'sec-ch-ua-platform': string;
  'sec-fetch-dest': string;
  'sec-fetch-mode': string;
  'sec-fetch-site': string;
  'upgrade-insecure-requests': string;
  cookie: string;
}

export interface IncidentPayload {
  sysparm_ck: string;
  sys_base_uri: string;
  sys_target: string;
  sys_uniqueName: string;
  sys_uniqueValue: string;
  sys_displayValue: string;
  sys_titleValue: string;
  onLoad_sys_updated_on: string;
  sys_row: string;
  sys_modCount: string;
  sys_action: string;
  sysparm_collection: string;
  sysparm_collectionID: string;
  sysparm_collection_key: string;
  sysparm_collection_related_field: string;
  sysparm_collection_relationship: string;
  sysparm_redirect_url: string;
  sysparm_goto_url: string;
  isFormPage: string;
  sysparm_referring_url: string;
  sysparm_view: string;
  sysparm_changeset: string;
  sysparm_template_editable: string;
  sysparm_record_row: string;
  sysparm_record_list: string;
  sysparm_record_rows: string;
  sysparm_record_target: string;
  sysparm_modify_check: string;
  sysparm_action_template: string;
  sysparm_link_collection: string;
  sysparm_pop_onLoad: string;
  sysparm_nameofstack: string;
  sysparm_transaction_scope: string;
  sysparm_transaction_update_set: string;
  sysparm_record_scope: string;
  sys_original: {
    incident: {
      number: string;
      state: string;
      hold_reason: string;
      u_contact_attempt: string;
      follow_up: string;
      caller_id: string;
      opened_at: string;
      opened_by: string;
      contact_type: string;
      location: string;
      company: string;
      u_on_behalf_of: {
        preferred_language: string;
        email: string;
        phone: string;
        mobile_phone: string;
      };
      short_description: string;
      description: string;
      business_impact: string;
      u_template: string;
      u_template_results: string;
      u_gem: string;
      u_gem_ref: string;
      u_impact: string;
      u_priority: string;
      u_urgency: string;
      u_assignment_group: string;
      assigned_to: string;
    };
  };
  incident: {
    number: string;
    state: string;
    hold_reason: string;
    u_contact_attempt: string;
    follow_up: string;
    caller_id: string;
    opened_at: string;
    opened_by: string;
    contact_type: string;
    location: string;
    company: string;
    u_on_behalf_of: {
      preferred_language: string;
      email: string;
      phone: string;
      mobile_phone: string;
    };
    short_description: string;
    description: string;
    business_impact: string;
    u_template: string;
    u_template_results: string;
    u_gem: string;
    u_gem_ref: string;
    u_impact: string;
    u_priority: string;
    u_urgency: string;
    u_assignment_group: string;
    assigned_to: string;
  };
  sys_display: {
    original: {
      incident: {
        caller_id: string;
        location: string;
        company: string;
        short_description: string;
      };
    };
    incident: {
      caller_id: string;
      location: string;
      company: string;
      short_description: string;
    };
  };
}

