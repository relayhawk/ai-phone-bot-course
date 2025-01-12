## setup

### pre-requisites

- [docker](https://docs.docker.com/get-docker/)
- [docker-compose](https://docs.docker.com/compose/install/)

### run

```bash
make run
```

### Configure Signalwire

1. Get your ngrok URL by using the following command:

```bash
 curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'
```

2. Log into Signal Wire
3. Update phone number inbound call settings
   - Select Phone number in the navigation menu
   - Select the phone number you want to update
   - Select Edit settings
   - Set `Handle Calls Using` to `a SWML Script`
   - Check the "Use External URL for SWML Script handler" checkbox
   - Set `SWML Script` to the ngrok URL from the previous step
   - Click Save

4. Test the phone number by calling it