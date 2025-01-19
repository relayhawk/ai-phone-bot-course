import { Company, ContactReasons } from '../types';

export const mockCompany: Company = {
  name: "ACME Corporation",
  description: "Leading provider of innovative solutions",
}; 

export const contactReasons: ContactReasons = [
    {
      id: "4c573563-5ea4-4d27-8d4a-74b13f3118e1",
      title: "Schedule an Appointment",
      description: "Get help with technical issues",
      gather: [
        {
          type: "text",
          name: "firstName",
          label: "First Name",
          description: "First name of the person you are scheduling the appointment for"
        },
        {
          type: "text",
          name: "lastName",
          label: "Last Name",
          description: "Last name of the person you are scheduling the appointment for"
        },
        {
          type: "text",
          name: "phone",
          label: "Phone Number",
          description: "Phone number of the person you are scheduling the appointment for"
        },
        {
          type: "text",
          name: "email",
          label: "Email",
          description: "Email of the person you are scheduling the appointment for"
        },
        {
          type: "text",
          name: "date",
          label: "Date",
          description: "Date of the appointment"
        },
        {
          type: "text",
          name: "time",
          label: "Time",
          description: "Time of the appointment"
        }
      ]
    },
    {
      id: "4c573563-5ea4-4d27-8d4a-74b13f3118e2",
      title: "Employee Call Out",
      description: "Get help with technical issues",
      gather: [
        {
          type: "text",
          name: "firstName",
          label: "First Name",
          description: "First name of the person you are scheduling the appointment for"
        },
        {
            type: "text",
            name: "lastName",
            label: "Last Name",
            description: "Last name of the person you are scheduling the appointment for"
          },
          {
            type: "text",
            name: "phone",
            label: "Phone Number",
            description: "Phone number of the person you are scheduling the appointment for"
          },
          {
            type: "text",
            name: "shiftDate",
            label: "Shift Date",
            description: "Date of the shift"
          },
          {
            type: "text",
            name: "shiftStartTime",
            label: "Shift Start Time",
            description: "Start time of the shift"
          },
          {
            type: "text",
            name: "shiftEndTime",
            label: "Shift End Time",
            description: "End time of the shift"
          },
          {
            type: "text",
            name: "facility",
            label: "Facility",
            description: "Facility of the shift"
          },
          {
            type: "text",
            name: "reasonForCall",
            label: "Reason for Call",
            description: "Reason for calling out"
          },
          {
            type: "text",
            name: "isDoubleShift",
            label: "Double Shift",
            description: "Is this a double shift"
          }
      ]
    },
    {
      id: "4c573563-5ea4-4d27-8d4a-74b13f3118e3",
      title: "Service Tech Check-In",
      description: "Post-service completion report",
      gather: [
        {
          type: "text",
          name: "techInfo",
          label: "Technician Name and ID",
          description: "Enter your full name and technician ID"
        },
        {
          type: "text",
          name: "jobSite",
          label: "Job Site Details",
          description: "Enter the job site address or customer name"
        },
        {
          type: "text",
          name: "visitReason",
          label: "Primary Visit Reason",
          description: "What was the main reason for your service visit?"
        },
        {
          type: "text",
          name: "issueResolved",
          label: "Issue Resolution",
          description: "Was the issue resolved? (Yes/No)"
        },
        {
          type: "text",
          name: "partsReplaced",
          label: "Parts Replacement",
          description: "Were any parts replaced? (Yes/No)"
        },
        {
          type: "text",
          name: "oldPartSerial",
          label: "Old Part Serial",
          description: "If replaced, enter the old part's serial number"
        },
        {
          type: "text",
          name: "newPartSerial",
          label: "New Part Serial",
          description: "If replaced, enter the new part's serial number"
        },
        {
          type: "text",
          name: "additionalIssues",
          label: "Additional Issues",
          description: "Did you encounter any issues needing follow-up? (Yes/No)"
        },
        {
          type: "text",
          name: "recommendations",
          label: "Recommendations",
          description: "Any recommendations or additional actions required?"
        },
        {
          type: "text",
          name: "completionTime",
          label: "Completion Time",
          description: "What time did you complete the job at the site?"
        }
      ]
    }
  ]