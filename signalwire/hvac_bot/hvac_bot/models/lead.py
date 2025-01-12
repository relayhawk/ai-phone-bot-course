from marshmallow import fields
from .base import SWAIGEntity

class Lead(SWAIGEntity):
    first_name = fields.Str(required=True, metadata={"description": "The first name of the user"})
    last_name = fields.Str(required=True, metadata={"description": "The last name of the user"})
    phone = fields.Str(required=True, metadata={"description": "The phone number of the user"})
    address = fields.Str(required=True, metadata={"description": "The address of the user"})
    city = fields.Str(required=True, metadata={"description": "The city of the user"})
    state = fields.Str(required=True, metadata={"description": "The state of the user"})
    zip = fields.Str(required=True, metadata={"description": "The zip code of the user"})
    country = fields.Str(required=True, metadata={"description": "The country of the user"})
    # email = fields.Email(allow_none=True, metadata={"description": "The email address of the user"})