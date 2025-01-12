from marshmallow import Schema, fields
from signalwire_swaig.core import SWAIG, SWAIGArgument
import logging

logger = logging.getLogger(__name__)
class SWAIGEntity(Schema):
    """Base Schema for all SWAIG entities

    required=true on params will only make the call after the params are provided
    azure voices will repeat phone nubmers best
    use cartesia to best control speed and emotion
    this said, "I successfully created a lead", but we don't want to say that to the person
    tone when saying the name of the person was odd
    
    """
    meta_data = fields.Dict(required=True)
    created_at = fields.DateTime(dump_only=True)

    @classmethod
    def get_endpoint(cls, action: str) -> dict:
        """Generate endpoint configuration based on the action."""
        description = f"{action.capitalize()} a {cls.__name__.lower()}"
        
        # Create a dictionary comprehension to generate endpoint arguments
        # for each declared field in the schema.
        # The key is the field name, and the value is an instance of SWAIGArgument.
        arguments = {
            field_name: SWAIGArgument(
                # Use the internal method to map the field type
                type=cls._map_field_type(field),
                # Get the description of the field from its metadata, or create a default description
                # based on the field name and the action description.
                description = field.metadata.get('description', f"The {field_name} of the {description.lower()}"),
                # Get the required status directly from the field definition.
                required=field.required,  # Use the field's required attribute
                # Get the default value from metadata, if provided.
                default=field.metadata.get('default', None),
                # Get the enum values from metadata, if provided.
                enum=field.metadata.get('enum', None),
                # Get the items definition from metadata, if provided.
                items=field.metadata.get('items', None)
            )
            for field_name, field in cls._declared_fields.items()  # Iterate over all declared fields
            # Exclude specific fields from the endpoint arguments
            if field_name not in ('meta_data', 'created_at')  # Exclude unwanted fields
        }
        
        return {
            "description": description,  # Use 'description' for the endpoint
            **arguments  # Unpack arguments directly
        }

    @staticmethod
    def _map_field_type(field) -> str:
        """Map the field type to a string representation for downstream services."""
        # Define a mapping for types to their string representations
        type_mapping = {
            'DateTime': 'string',  # Map DateTime to string for downstream services
            'Email': 'string',
            'String': 'string',
            'Integer': 'integer',
            'Boolean': 'boolean',
            # Add other mappings as needed
        }
        if field.__class__.__name__ not in type_mapping:
            logger.warning(f"No type mapping found for field: {field.__class__.__name__}")
        # Return the mapped type or default to 'string'
        return type_mapping.get(field.__class__.__name__, 'string')
