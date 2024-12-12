import axios from 'axios';
import { Flow, Execution, ExecutionStep, ExecutionLog } from '../types/twilio';

const API_BASE_URL = 'http://127.0.0.1:5000';

export const studioApi = {
  // Flows
  listFlows: async () => {
    const response = await fetch(`${API_BASE_URL}/v2/flows`);
    return response.json();
  },

  getFlow: async (flowSid: string) => {
    const response = await fetch(`${API_BASE_URL}/v2/flows/${flowSid}`);
    return response.json();
  },

  // Executions
  listExecutions: async (flowSid: string) => {
    const response = await fetch(`${API_BASE_URL}/v2/flows/${flowSid}/executions`);
    return response.json();
  },

  getExecution: async (flowSid: string, executionSid: string) => {
    const response = await fetch(`${API_BASE_URL}/v2/flows/${flowSid}/executions/${executionSid}`);
    return response.json();
  },

  // Steps
  listSteps: async (flowSid: string, executionSid: string) => {
    const response = await fetch(`${API_BASE_URL}/v2/flows/${flowSid}/executions/${executionSid}/steps`);
    return response.json();
  },

  getStep: async (flowSid: string, executionSid: string, stepSid: string) => {
    const response = await fetch(`${API_BASE_URL}/v2/flows/${flowSid}/executions/${executionSid}/steps/${stepSid}`);
    return response.json();
  },

  // Step Context
  getStepContext: async (flowSid: string, executionSid: string, stepSid: string) => {
    const response = await fetch(`${API_BASE_URL}/v2/flows/${flowSid}/executions/${executionSid}/steps/${stepSid}/context`);
    return response.json();
  }
};