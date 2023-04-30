import requests
from uuid import uuid1
import os
from random import randint

import openai

elastic_api_key = os.getenv('ELASTIC_API_KEY')

def delete_all():
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'ApiKey {elastic_api_key}',
    }

    json_data = {
        "query": {
            "match_all": {}
        }
    }

    response = requests.post(
        'https://4a6635ce95f04da4a3345ffdd862465c.us-central1.gcp.cloud.es.io:443/search-names-v3/_delete_by_query?conflicts=proceed',
        headers=headers,
        json=json_data,
    )
    # response.raise_for_status()
    return response.json()

print(delete_all())