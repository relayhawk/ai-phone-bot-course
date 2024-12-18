export interface Flow {
  sid: string;
  friendly_name: string;
  status: string;
  definition: any;
  commit_message: string;
  valid: boolean;
}

export interface Execution {
  sid: string;
  status: string;
  date_created: string;
  date_updated: string;
  contact_channel_address: string;
}

export interface ExecutionStep {
  sid: string;
  name: string;
  type: string;
  executed: boolean;
  timestamp: string;
}

export interface ExecutionLog {
  step_sid: string;
  name: string;
  type: string;
  timestamp: string;
  transition: string;
} 