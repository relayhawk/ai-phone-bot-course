from flask import Flask, jsonify, send_file, request, Response
import requests
import os
from signalwire_swaig.core import SWAIG, SWAIGArgument
import logging
from dotenv import load_dotenv
from jinja2 import Environment, FileSystemLoader
import json
import time
from models.lead import Lead
from models.service_address import ServiceAddress
from models.appointment import Appointment
from marshmallow import ValidationError
import uuid  # Import the uuid module

load_dotenv()

app = Flask(__name__)

swaig = SWAIG(
    app,
    auth=(os.getenv('HTTP_USERNAME'), os.getenv('HTTP_PASSWORD'))
)

# Create logs directory if it doesn't exist
if not os.path.exists('logs'):
    os.makedirs('logs')

def create_lead(first_name, last_name, phone, address, city, state, zip, country, meta_data):
    logging.info(f"Creating lead: {first_name} {last_name} {phone} {address} {city} {state} {zip} {country}")
    logging.info(f"Meta data: {meta_data}")
    return {"response": "Lead created successfully"}

def create_appointment(date, time):
    logging.info(f"Creating appointment: {date} {time}")
    return {"response": "Appointment created successfully"}

@swaig.endpoint(**Lead.get_endpoint("create"))
def swaig_create_lead(**kwargs) -> str:
    try:
        lead = Lead.create_from_kwargs(**kwargs)  # Validate and deserialize input
        # Process lead creation logic here
        return "Lead created successfully"
    except ValidationError as e:
        return f"Validation error: {e.messages}"

@swaig.endpoint(**ServiceAddress.get_endpoint("create"))
def swaig_create_address(**kwargs) -> str:
    try:
        address = ServiceAddress.create_from_kwargs(**kwargs)  # Validate and deserialize input
        # Process appointment creation logic here
        return "Address created successfully"
    except ValidationError as e:
        return f"Validation error: {e.messages}"

@swaig.endpoint(**Appointment.get_endpoint("create"))
def swaig_create_appointment(**kwargs) -> str:
    try:
        appointment = Appointment.create_from_kwargs(**kwargs)  # Validate and deserialize input
        # Process appointment creation logic here
        return "Appointment created successfully"
    except ValidationError as e:
        return f"Validation error: {e.messages}"

def get_ngrok_url():
    # ngrok exposes an API on port 4040
    ngrok_api = "http://ngrok:4040/api/tunnels"
    retries = 5
    
    while retries > 0:
        try:
            response = requests.get(ngrok_api)
            if response.status_code == 200:
                tunnels = response.json()['tunnels']
                # Get the HTTPS URL
                for tunnel in tunnels:
                    if tunnel['proto'] == 'https':
                        return tunnel['public_url']
            retries -= 1
            time.sleep(1)  # Wait before retrying
        except requests.exceptions.RequestException:
            retries -= 1
            time.sleep(1)  # Wait before retrying
            
    raise Exception("Could not get ngrok URL after multiple attempts")



def generate_swaml(swaig_instance, prompt_text):
    # Get the base_url dynamically from ngrok
    base_url = get_ngrok_url()
    
    # Get functions from SWAIG instance
    functions = list(swaig_instance.functions.keys())
    
    # Set up Jinja environment
    env = Environment(loader=FileSystemLoader('templates'))
    template = env.get_template('swaml_template.j2')
    
    # Render the template
    rendered = template.render(
        base_url=base_url,
        functions=functions,
        prompt_text=prompt_text
    )
    
    # Optionally validate the JSON
    try:
        json.loads(rendered)
    except json.JSONDecodeError as e:
        raise ValueError(f"Generated invalid JSON: {e}")
        
    return rendered


def load_prompt_text(filename="prompts/hvac.txt"):
    try:
        with open(filename, 'r') as file:
            return file.read().strip()
    except FileNotFoundError:
        raise ValueError(f"Prompt file not found: {filename}")


def generate_prompt_text(template_path, swaig_instance):
    # Read the template file directly
    with open(f'templates/{template_path}', 'r') as file:
        template_content = file.read()
    
    env = Environment(
        loader=FileSystemLoader('templates'),
        keep_trailing_newline=True,
        trim_blocks=True,
        lstrip_blocks=True,
        autoescape=False
    )
    
    template = env.from_string(template_content)
    
    params_to_ignore = ["meta_data", "meta_data_token"]
    # Generate function documentation
    function_docs = []
    for idx, (func_name, func_info) in enumerate(swaig_instance.functions.items(), 1):
        # Get parameters info
        params = []
        logging.info(f"Function info: {func_info}")
        if 'parameters' in func_info:
            properties = func_info['parameters'].get('properties', {})
            required_params = func_info['parameters'].get('required', [])
            
            for param_name, param_info in properties.items():
                if param_name in params_to_ignore:
                    continue
                param_type = param_info.get('type', 'string')
                param_desc = param_info.get('description', '')
                param_default = param_info.get('default')
                
                # Check if the parameter is required
                required_status = "true" if param_name in required_params else "false"
                
                # Construct the parameter documentation
                param_doc = f"   - {param_name} (type:{param_type}, required:{required_status})"
                
                if param_desc:
                    param_doc += f": {param_desc}"
                if param_default is not None:
                    param_doc += f" (default: {param_default})"
                    
                params.append(param_doc)
        
        # Build function documentation
        func_desc = func_info.get('description', 'No description available')
        func_doc = f"{idx}. {func_name}: {func_desc}"
        if params:
            func_doc += "\n" + "\n".join(params)
        function_docs.append(func_doc)
    
    # Join all function docs with newlines
    formatted_docs = "\n\n".join(function_docs)
    
    # Render the template
    rendered = template.render(
        function_docs=formatted_docs
    )
    
    # Return with explicit content-type text/plain
    return rendered

@app.route('/generate_prompt_text', methods=['GET'])
def get_generate_prompt_text():
    prompt_text = generate_prompt_text('prompts/hvac.j2', swaig)
    return Response(prompt_text, mimetype='text/plain')

# Example usage:
@app.route('/swml', methods=['GET', 'POST'])
def create_swml():
    if request.method == 'POST':
        logging.info(f"Request: {request.json}")
    prompt_text = generate_prompt_text('prompts/hvac.j2', swaig)
    swaml = generate_swaml(swaig, prompt_text)
    logging.info(f"Swaml: {swaml}")
    if request.method == 'POST':
        return jsonify(json.loads(swaml))
    else:
        return Response(swaml, mimetype='text/plain')
    
def log_request_data(request_data, endpoint_name):
    """Helper function to log request data to a uniquely named file."""
    # Create a unique filename using the current timestamp and a UUID
    timestamp = int(time.time())  # Get the current time in seconds
    unique_id = str(uuid.uuid4())  # Generate a UUID
    log_file_path = f'logs/{endpoint_name}_request_{timestamp}_{unique_id}.log'  # Create a unique filename

    # Save the raw JSON to a file in the logs directory
    with open(log_file_path, 'w') as log_file:  # Use 'w' to create a new file
        log_file.write(json.dumps(request_data, indent=4))  # Write the JSON data to the file

    return log_file_path

def log_request_data(request_data, endpoint_name):
    """Helper function to log request data to a uniquely named file."""
    # Create a unique filename using the current timestamp and a UUID
    timestamp = int(time.time())  # Get the current time in seconds
    unique_id = str(uuid.uuid4())  # Generate a UUID
    log_file_path = f'logs/{endpoint_name}_request_{timestamp}_{unique_id}.log'  # Create a unique filename

    # Save the raw JSON to a file in the logs directory
    with open(log_file_path, 'w') as log_file:  # Use 'w' to create a new file
        log_file.write(json.dumps(request_data, indent=4))  # Write the JSON data to the file

    return log_file_path

@app.route('/debug', methods=['POST'])
def debug():
    # Get the raw JSON request
    request_data = request.json
    log_file_path = log_request_data(request_data, "debug")  # Log the request data with endpoint name
    return jsonify({"message": "Debug request received", "file": log_file_path}), 200

@app.route('/postprompt', methods=['POST'])
def post_prompt():
    # Get the raw JSON request
    request_data = request.json
    log_file_path = log_request_data(request_data, "postprompt")  # Log the request data with endpoint name
    return jsonify({"message": "Prompt received", "file": log_file_path}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=os.getenv("PORT", 5000), debug=os.getenv("DEBUG"))
