from marshmallow import fields
from .base import SWAIGEntity

class Appointment(SWAIGEntity):
    lead_id = fields.Str(required=True, metadata={"description": "The ID of the lead"})
    appointment_date = fields.DateTime(required=True, metadata={"description": "The date and time of the appointment"})
