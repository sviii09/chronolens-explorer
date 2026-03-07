import requests
print('sending POST')
resp = requests.post('http://localhost:5000/query', json={
    'query': 'test question',
    'user_role': 'public',
    'time_filter': None
})
print('status', resp.status_code)
print('response', resp.text[:1000])
