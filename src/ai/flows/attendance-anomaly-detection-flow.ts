'use server';
/**
 * @fileOverview A Genkit flow for detecting attendance anomalies for HR managers.
 *
 * - detectAttendanceAnomalies - A function that handles the attendance anomaly detection process.
 * - AttendanceAnomalyDetectionInput - The input type for the detectAttendanceAnomalies function.
 * - AttendanceAnomalyDetectionOutput - The return type for the detectAttendanceAnomalies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const AttendanceRecordSchema = z.object({
  date: z.string().describe('The date of the attendance record (YYYY-MM-DD).'),
  scheduledStartTime: z.string().optional().describe('Scheduled shift start time (HH:MM).'),
  scheduledEndTime: z.string().optional().describe('Scheduled shift end time (HH:MM).'),
  actualEntryTime: z.string().optional().describe('Actual entry time (HH:MM).'),
  actualExitTime: z.string().optional().describe('Actual exit time (HH:MM).'),
  isRemoteWork: z.boolean().default(false).describe('True if the work was performed remotely.'),
  gpsData: z.string().optional().describe('GPS coordinates if remote work was performed.'),
});

const AttendanceAnomalyDetectionInputSchema = z.object({
  employeeId: z.string().describe('Unique identifier for the employee.'),
  employeeName: z.string().describe('Full name of the employee.'),
  department: z.string().describe("Employee's department."),
  attendanceRecords: z.array(AttendanceRecordSchema).describe('A list of attendance records for the employee over a period.'),
});
export type AttendanceAnomalyDetectionInput = z.infer<typeof AttendanceAnomalyDetectionInputSchema>;

// Output Schema
const AnomalySchema = z.object({
  type: z.enum(['LateArrival', 'EarlyDeparture', 'UnexplainedAbsence', 'FrequentLateness', 'FrequentEarlyDeparture', 'InconsistentSchedule', 'Other'])
    .describe('The type of anomaly detected.'),
  description: z.string().describe('A detailed description of the anomaly.'),
  dates: z.array(z.string()).describe('List of dates associated with this anomaly (YYYY-MM-DD).'),
  insight: z.string().describe('Actionable insight or recommendation for HR.'),
  severity: z.enum(['Low', 'Medium', 'High']).describe('The severity of the anomaly.'),
});

const AttendanceAnomalyDetectionOutputSchema = z.object({
  hasAnomalies: z.boolean().describe('True if any anomalies were detected in the attendance data.'),
  anomalies: z.array(AnomalySchema).describe('A list of detected attendance anomalies and their details.'),
});
export type AttendanceAnomalyDetectionOutput = z.infer<typeof AttendanceAnomalyDetectionOutputSchema>;

export async function detectAttendanceAnomalies(input: AttendanceAnomalyDetectionInput): Promise<AttendanceAnomalyDetectionOutput> {
  return attendanceAnomalyDetectionFlow(input);
}

const anomalyDetectionPrompt = ai.definePrompt({
  name: 'attendanceAnomalyDetectionPrompt',
  input: { schema: AttendanceAnomalyDetectionInputSchema },
  output: { schema: AttendanceAnomalyDetectionOutputSchema },
  prompt: `You are an expert HR attendance analyst. Your task is to analyze the provided attendance records for an employee and identify any unusual patterns or potential discrepancies.

Analyze the attendance data for employee:
Employee ID: {{{employeeId}}}
Employee Name: {{{employeeName}}}
Department: {{{department}}}

Here are the attendance records:
{{#each attendanceRecords}}
  Date: {{{this.date}}}
  Scheduled: {{{this.scheduledStartTime}}} - {{{this.scheduledEndTime}}}
  Actual: {{{this.actualEntryTime}}} - {{{this.actualExitTime}}}
  Remote Work: {{#if this.isRemoteWork}}Yes{{else}}No{{/if}}
  {{#if this.gpsData}}GPS Data: {{{this.gpsData}}}{{/if}}
---
{{/each}}

Identify patterns such as:
-   Habitual late arrivals (e.g., consistently arriving after scheduled start time, especially by more than 15 minutes).
-   Frequent early departures (e.g., consistently leaving before scheduled end time).
-   Unexplained absences (e.g., no entry/exit record when expected).
-   Inconsistent scheduling or unusual work patterns that deviate significantly from typical expectations for their role/department.

For each anomaly found, provide:
-   A 'type' from the following: 'LateArrival', 'EarlyDeparture', 'UnexplainedAbsence', 'FrequentLateness', 'FrequentEarlyDeparture', 'InconsistentSchedule', 'Other'.
-   A 'description' explaining the anomaly.
-   A list of 'dates' (YYYY-MM-DD) relevant to the anomaly.
-   An 'insight' with an actionable recommendation for HR.
-   A 'severity' level: 'Low', 'Medium', 'High'.

If no anomalies are detected, set 'hasAnomalies' to false and 'anomalies' to an empty array.`,
});

const attendanceAnomalyDetectionFlow = ai.defineFlow(
  {
    name: 'attendanceAnomalyDetectionFlow',
    inputSchema: AttendanceAnomalyDetectionInputSchema,
    outputSchema: AttendanceAnomalyDetectionOutputSchema,
  },
  async (input) => {
    const {output} = await anomalyDetectionPrompt(input);
    return output!;
  }
);
