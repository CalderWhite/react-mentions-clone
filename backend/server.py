import os
from base64 import b64decode
import json

from elasticsearch import Elasticsearch
from flask import Flask, jsonify, request
from flask_cors import CORS


raw_elastic_key = os.getenv('ELASTIC_API_KEY')
elastic_key_id, elastic_api_key = b64decode(raw_elastic_key.encode('utf-8')).decode('utf-8').split(":")

es = Elasticsearch(
    "https://4a6635ce95f04da4a3345ffdd862465c.us-central1.gcp.cloud.es.io:443",
    api_key=(elastic_key_id, elastic_api_key)
)
app = Flask(__name__)
CORS(app)



def run_query(query_text):
    out = es.search(
        index="search-names-v3",
        query={
            "wildcard": {
                "name": {
                    "value": f"*{query_text}*",
                }
            }
        },
        fields=["name", "email", "tag"])
        
    data = [
        {
            "name": i["_source"]["name"],
            "email": i["_source"]["email"],
            "tag": i["_source"]["tag"]
        }
        for i in out["hits"]["hits"]
    ]
    return data


@app.route('/query/<name>', methods=['GET'])
def query_endpoint(name):
    res = run_query(name)
    return jsonify(res)

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=False)