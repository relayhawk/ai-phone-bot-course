from marshmallow import fields
from .base import SWAIGEntity

class Appointment(SWAIGEntity):
    lead_id = fields.Str(required=True, metadata={"description": "The unique identifier of the lead associated with this appointment."})
    appointment_date = fields.DateTime(required=True, metadata={
        "description": "The date and time of the appointment in ISO 8601 format.",
        "pattern": "^\\d{5}$"
        })
