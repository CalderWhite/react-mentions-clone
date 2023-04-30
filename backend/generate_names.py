import requests
from uuid import uuid1
import os
from random import randint

import openai

elastic_api_key = os.getenv('ELASTIC_API_KEY')
openai.api_key = os.getenv('OPENAI_API_KEY')

def upload_item(name, email, tag):
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'ApiKey {elastic_api_key}',
    }

    params = {
        'pipeline': 'ent-search-generic-ingestion',
    }

    json_data = {
        'id': str(uuid1()),
        'name': name,
        'email': email,
        'tag': tag,
    }

    response = requests.post(
        'https://4a6635ce95f04da4a3345ffdd862465c.us-central1.gcp.cloud.es.io:443/search-names-v3/_doc',
        params=params,
        headers=headers,
        json=json_data,
    )
    response.raise_for_status()
    return response.json()


def generate_names_and_tags(n=25):
    response = openai.Completion.create(
        model='text-davinci-003',
        prompt=f'Please randomly generate {n} comma seperated full names and matching emails on the following line:',
        temperature=0.7,
        max_tokens=512,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )

    # parse the names and assign tags
    data = []
    for line in response['choices'][0]['text'].split('\n'):
        stripped = line.strip()
        print(stripped)
        if len(stripped) > 0:
            split = stripped.split(',')
            for i in range(0, len(split), 2):
                name = split[i]
                email = split[i+1].lower()
                tag = 'employee' if randint(0, 1) == 0 else 'customer'
                data.append((name.strip(), email.strip(), tag))
            break

    return data

def generate_and_upload_names():
    data = generate_names_and_tags()
    for item in data:
        upload_item(*item)


generate_and_upload_names()