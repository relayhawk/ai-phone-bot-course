from marshmallow import fields
from .base import SWAIGEntity

class ServiceAddress(SWAIGEntity):
    street_address = fields.Str(required=True, metadata={"description": "The street address where service is needed."})
    city = fields.Str(required=True, metadata={"description": "The city where the service is needed."})
    state = fields.Str(required=True, metadata={"description": "The state where the service is needed."})
    zip = fields.Str(required=True, metadata={
        "description": "The five digit zip code where the service is needed.",
        "pattern": "^\\d{5}$"
        })
