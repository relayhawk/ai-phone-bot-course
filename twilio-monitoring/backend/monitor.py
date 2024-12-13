from flask import Flask, jsonify
from twilio.rest import Client
import json
import os
from datetime import datetime
from flask_cors import CORS
import dotenv

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

dotenv.load_dotenv('.env')
# Load Twilio credentials from environment variables
account_sid = os.getenv('TWILIO_ACCOUNT_SID')
auth_token = os.getenv('TWILIO_AUTH_TOKEN')

# Initialize Twilio client
client = Client(account_sid, auth_token)

# File paths for JSON storage
DATA_DIR = 'data'
FLOWS_FILE = os.path.join(DATA_DIR, 'flows.json')
EXECUTIONS_FILE = os.path.join(DATA_DIR, 'executions.json')

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

def save_to_json(data, filename):
    """Save data to JSON file with timestamp"""
    # Ensure the directory exists
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    data_with_timestamp = {
        'timestamp': datetime.now().isoformat(),
        'data': data
    }
    with open(filename, 'w') as f:
        json.dump(data_with_timestamp, f, indent=2)

@app.route('/v2/flows', methods=['GET'])
def list_flows():
    try:
        flows = client.studio.v2.flows.list()
        return jsonify([{
            'sid': flow.sid,
            'friendly_name': flow.friendly_name,
            'status': flow.status,
            'date_created': str(flow.date_created),
            'date_updated': str(flow.date_updated),
            'url': flow.url,
            'links': flow.links,
        } for flow in flows])
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/v2/flows/<flow_sid>', methods=['GET'])
def get_flow(flow_sid):
    try:
        flow = client.studio.v2.flows(flow_sid).fetch()
        return jsonify(flow._properties)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/v2/flows/<flow_sid>/executions', methods=['GET'])
def list_executions(flow_sid):
    try:
        executions = client.studio.v2.flows(flow_sid).executions.list()
        return jsonify([{
            'sid': execution.sid,
            'account_sid': execution.account_sid,
            'flow_sid': execution.flow_sid,
            'status': execution.status,
            'contact_channel_address': execution.contact_channel_address,
            'context': execution.context,
            'date_created': str(execution.date_created),
            'date_updated': str(execution.date_updated),
            'url': execution.url,
            'links': execution.links
        } for execution in executions])
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/v2/flows/<flow_sid>/executions/<execution_sid>', methods=['GET'])
def get_execution(flow_sid, execution_sid):
    try:
        execution = client.studio.v2.flows(flow_sid).executions(execution_sid).fetch()
        # Fetch and save the flow definition
        flow = client.studio.v2.flows(execution.flow_sid).fetch()
        flow_definition = flow.definition
        save_to_json(flow_definition, f'data/flows/{execution.flow_sid}.json')
        return jsonify({
            'sid': execution.sid,
            'account_sid': execution.account_sid,
            'flow_sid': execution.flow_sid,
            'status': execution.status,
            'contact_channel_address': execution.contact_channel_address,
            'context': execution.context,
            'date_created': str(execution.date_created),
            'date_updated': str(execution.date_updated),
            'url': execution.url,
            'links': execution.links
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/v2/flows/<flow_sid>/executions/<execution_sid>/steps', methods=['GET'])
def list_steps(flow_sid, execution_sid):
    try:
        # First, load the flow definition from the saved JSON
        flow_file = f'data/flows/{flow_sid}.json'
        with open(flow_file, 'r') as f:
            flow_data = json.load(f)
            
        # Create a mapping of widget names to their types
        widget_types = {
            state['name']: state['type']
            for state in flow_data['data']['states']
        }
        print(widget_types)
        
        steps = client.studio.v2.flows(flow_sid).executions(execution_sid).steps.list()
        steps = list(reversed(steps))

        # Get context for each step
        step_data = []
        for step in steps:
            step_context = client.studio.v2.flows(flow_sid)\
                .executions(execution_sid)\
                .steps(step.sid)\
                .step_context()\
                .fetch()
                
            # Get the widget type from our mapping
            widget_type = widget_types.get(step.transitioned_from, 'unknown')
                
            step_data.append({
                'sid': step.sid,
                'account_sid': step.account_sid,
                'flow_sid': step.flow_sid,
                'execution_sid': step.execution_sid,
                'name': step.name,
                'widget_type': widget_type,  # Add the widget type
                'context': step.context,
                'transitioned_from': step.transitioned_from,
                'transitioned_to': step.transitioned_to,
                'date_created': str(step.date_created),
                'date_updated': str(step.date_updated),
                'url': step.url,
                'step_context': step_context.context
            })
            
        return jsonify(step_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/v2/flows/<flow_sid>/executions/<execution_sid>/steps/<step_sid>', methods=['GET'])
def get_step(flow_sid, execution_sid, step_sid):
    try:
        step = client.studio.v2.flows(flow_sid).executions(execution_sid).steps(step_sid).fetch()
        return jsonify(step._properties)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/v2/flows/<flow_sid>/executions/<execution_sid>/steps/<step_sid>/context', methods=['GET'])
def get_step_context(flow_sid, execution_sid, step_sid):
    try:
        context = client.studio.v2.flows(flow_sid).executions(execution_sid).steps(step_sid).step_context().fetch()
        return jsonify(context._properties)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
