from flask import Flask, jsonify, send_file, request, Response
import requests
import os
from signalwire_swaig.core import SWAIG, SWAIGArgument
import logging
from dotenv import load_dotenv
from jinja2 import Environment, FileSystemLoader
import json
import time

load_dotenv()

app = Flask(__name__)

swaig = SWAIG(
    app,
    auth=(os.getenv('HTTP_USERNAME'), os.getenv('HTTP_PASSWORD'))
)

def create_lead(first_name, last_name, phone, address, city, state, zip, country, meta_data):
    logging.info(f"Creating lead: {first_name} {last_name} {phone} {address} {city} {state} {zip} {country}")
    logging.info(f"Meta data: {meta_data}")
    return {"response": "Lead created successfully"}


# required=true on params will only make the call after the params are provided
# azure voices will repeat phone nubmers best
# use cartesia to best control speed and emotion
@swaig.endpoint("Create a user lead",
    first_name=SWAIGArgument("string", "The first name of the user"),
    last_name=SWAIGArgument("string", "The last name of the user"),
    # email=SWAIGArgument("string", "The email address of the user"),
    phone=SWAIGArgument("string", "The phone number of the user"),
    address=SWAIGArgument("string", "The address of the user"),
    city=SWAIGArgument("string", "The city of the user"),
    state=SWAIGArgument("string", "The state of the user"),
    zip=SWAIGArgument("string", "The zip code of the user"),
    country=SWAIGArgument("string", "The country of the user"))
def swaig_create_lead(first_name, last_name, phone, address, city, state, zip, country, meta_data, meta_data_token):
        create_lead(first_name, last_name, phone, address, city, state, zip, country, meta_data)
        return "Lead created successfully"


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
    
    # Generate function documentation
    function_docs = []
    for idx, (func_name, func_info) in enumerate(swaig_instance.functions.items(), 1):
        # Get parameters info
        params = []
        if 'parameters' in func_info:
            properties = func_info['parameters'].get('properties', {})
            required_params = func_info['parameters'].get('required', [])
            
            for param_name, param_info in properties.items():
                param_type = param_info.get('type', 'string')
                param_desc = param_info.get('description', '')
                param_default = param_info.get('default')
                
                param_doc = f"   - {param_name} ({param_type})"
                if param_desc:
                    param_doc += f": {param_desc}"
                if param_default is not None:
                    param_doc += f" (default: {param_default})"
                if param_name in required_params:
                    param_doc += " (required)"
                    
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
@app.route('/generate_swaml', methods=['GET', 'POST'])
def create_swaml():
    if request.method == 'POST':
        logging.info(f"Request: {request.json}")
    prompt_text = generate_prompt_text('prompts/hvac.j2', swaig)
    swaml = generate_swaml(swaig, prompt_text)
    logging.info(f"Swaml: {swaml}")
    if request.method == 'POST':
        return jsonify(json.loads(swaml))
    else:
        return Response(swaml, mimetype='text/plain')


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=os.getenv("PORT", 5000), debug=os.getenv("DEBUG"))
