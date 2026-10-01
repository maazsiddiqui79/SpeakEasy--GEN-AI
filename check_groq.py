import os
import urllib.request
import json

with open('.env.local', 'r') as f:
    for line in f:
        if line.startswith('GROQ_API_KEY='):
            key = line.split('=')[1].strip()

url = 'https://api.groq.com/openai/v1/models'
req = urllib.request.Request(url, headers={'Authorization': f'Bearer {key}'})
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())
    
print("Supported models:")
for m in data['data']:
    print(m['id'])
