import pytest
from models import User


def register(client, username='testuser', email='test@example.com',
             password='password123', gender='male'):
    return client.post('/api/auth/register', json={
        'username': username, 'email': email, 'password': password,
        'first_name': 'Test', 'last_name': 'User', 'gender': gender
    })


def login(client, username='testuser', password='password123'):
    res = client.post('/api/auth/login', json={'username': username, 'password': password})
    return res.get_json().get('access_token')


@pytest.fixture
def token(client):
    register(client)
    return login(client)


# ── Register ──────────────────────────────────────────────────────────────────

class TestRegister:
    def test_register_success(self, client):
        res = register(client, 'newuser', 'new@example.com', 'pass123', 'female')
        assert res.status_code == 201
        assert 'user_id' in res.get_json()

    def test_register_missing_fields(self, client):
        res = client.post('/api/auth/register', json={'username': 'only'})
        assert res.status_code == 400

    def test_register_duplicate_username(self, client):
        register(client)
        res = register(client, 'testuser', 'other@example.com')
        assert res.status_code == 400
        assert 'Username already exists' in res.get_json()['error']

    def test_register_duplicate_email(self, client):
        register(client)
        res = register(client, 'otheruser', 'test@example.com')
        assert res.status_code == 400
        assert 'Email already exists' in res.get_json()['error']


# ── Login ─────────────────────────────────────────────────────────────────────

class TestLogin:
    def test_login_success(self, client):
        register(client)
        res = client.post('/api/auth/login', json={'username': 'testuser', 'password': 'password123'})
        assert res.status_code == 200
        data = res.get_json()
        assert 'access_token' in data
        assert data['user']['username'] == 'testuser'
        assert 'gender' in data['user']

    def test_login_wrong_password(self, client):
        register(client)
        res = client.post('/api/auth/login', json={'username': 'testuser', 'password': 'wrong'})
        assert res.status_code == 401

    def test_login_nonexistent_user(self, client):
        res = client.post('/api/auth/login', json={'username': 'nobody', 'password': 'pass'})
        assert res.status_code == 401

    def test_login_missing_fields(self, client):
        res = client.post('/api/auth/login', json={'username': 'testuser'})
        assert res.status_code == 400


# ── Profile ───────────────────────────────────────────────────────────────────

class TestProfile:
    def test_get_profile(self, client, token):
        res = client.get('/api/auth/profile', headers={'Authorization': f'Bearer {token}'})
        assert res.status_code == 200
        data = res.get_json()
        assert data['username'] == 'testuser'
        assert data['gender'] == 'male'

    def test_get_profile_no_token(self, client):
        res = client.get('/api/auth/profile')
        assert res.status_code == 401

    def test_update_profile(self, client, token):
        res = client.put('/api/auth/profile',
                         json={'first_name': 'Updated', 'department': 'Engineering'},
                         headers={'Authorization': f'Bearer {token}'})
        assert res.status_code == 200

    def test_update_gender(self, client, token):
        res = client.put('/api/auth/profile',
                         json={'gender': 'female'},
                         headers={'Authorization': f'Bearer {token}'})
        assert res.status_code == 200
        profile = client.get('/api/auth/profile', headers={'Authorization': f'Bearer {token}'})
        assert profile.get_json()['gender'] == 'female'
