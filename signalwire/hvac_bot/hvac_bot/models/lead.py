from marshmallow import fields
from .base import SWAIGEntity

class Lead(SWAIGEntity):
    first_name = fields.Str(required=True, metadata={"description": "The customer's first name."})
    last_name = fields.Str(required=True, metadata={"description": "The customer's last name."})
    phone = fields.Str(required=True, metadata={"description": "The customer's phone number in a standard format (e.g., +1XXXXXXXXXX)."})
    # email = fields.Email(allow_none=True, metadata={"description": "The email address of the user"})