import requests, pytest

def test_get_jobs():
    r = requests.get("http://localhost:8080/jobs")
    assert r.status_code in [200]

def test_post_jobs():
    r = requests.post("http://localhost:8080/jobs")
    assert r.status_code in [200, 402]

def test_get_jobs_id():
    r = requests.get("http://localhost:8080/jobs/test")
    assert r.status_code in [200]

def test_post_jobs_id_claim():
    r = requests.post("http://localhost:8080/jobs/test/claim")
    assert r.status_code in [200]

def test_post_jobs_id_submit():
    r = requests.post("http://localhost:8080/jobs/test/submit")
    assert r.status_code in [200]

def test_post_jobs_id_feature():
    r = requests.post("http://localhost:8080/jobs/test/feature")
    assert r.status_code in [200, 402]

def test_get_jobs_id_status():
    r = requests.get("http://localhost:8080/jobs/test/status")
    assert r.status_code in [200]

def test_get_auth_nonce():
    r = requests.get("http://localhost:8080/auth/nonce?address=test")
    assert r.status_code in [200]

def test_post_auth_verify():
    r = requests.post("http://localhost:8080/auth/verify")
    assert r.status_code in [200]

def test_get_agents_address():
    r = requests.get("http://localhost:8080/agents/test")
    assert r.status_code in [200]

def test_get_agents_address_history():
    r = requests.get("http://localhost:8080/agents/test/history")
    assert r.status_code in [200]

def test_get_agents_address_timeline():
    r = requests.get("http://localhost:8080/agents/test/timeline")
    assert r.status_code in [200]

def test_get_well_known_x402():
    r = requests.get("http://localhost:8080/.well-known/x402")
    assert r.status_code in [200]

def test_get_stats():
    r = requests.get("http://localhost:8080/stats")
    assert r.status_code in [200]

def test_get_leaderboard():
    r = requests.get("http://localhost:8080/leaderboard")
    assert r.status_code in [200]
