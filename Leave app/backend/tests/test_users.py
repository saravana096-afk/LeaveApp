import pytest
from models import db, User


def register_login(client, username, email, password='pass123'):
    client.post('/api/auth/register', json={
        'username': username, 'email': email, 'password': password,
        'first_name': 'Test', 'last_name': 'User', 'gender': 'male'
    })
    res = client.post('/api/auth/login', json={'username': username, 'password': password})
    return res.get_json()['access_token']


def make_admin(username):
    u = User.query.filter_by(username=username).first()
    u.is_admin = True
    db.session.commit()


@pytest.fixture
def users(client):
    emp_token = register_login(client, 'employee', 'emp@test.com')
    adm_token = register_login(client, 'adminuser', 'admin@test.com')
    make_admin('adminuser')
    adm_token = client.post('/api/auth/login',
                            json={'username': 'adminuser', 'password': 'pass123'}).get_json()['access_token']
    emp = User.query.filter_by(username='employee').first()
    adm = User.query.filter_by(username='adminuser').first()
    return emp_token, adm_token, emp.id, adm.id


# ── List Users ────────────────────────────────────────────────────────────────

class TestGetUsers:
    def test_admin_lists_users(self, client, users):
        _, adm_token, *_ = users
        res = client.get('/api/users/', headers={'Authorization': f'Bearer {adm_token}'})
        assert res.status_code == 200
        assert len(res.get_json()['users']) == 2

    def test_non_admin_blocked(self, client, users):
        emp_token, *_ = users
        res = client.get('/api/users/', headers={'Authorization': f'Bearer {emp_token}'})
        assert res.status_code == 403

    def test_get_user_by_id(self, client, users):
        emp_token, _, emp_id, _ = users
        res = client.get(f'/api/users/{emp_id}', headers={'Authorization': f'Bearer {emp_token}'})
        assert res.status_code == 200
        assert res.get_json()['username'] == 'employee'

    def test_get_nonexistent_user(self, client, users):
        emp_token, *_ = users
        res = client.get('/api/users/999', headers={'Authorization': f'Bearer {emp_token}'})
        assert res.status_code == 404


# ── Leave Balance ─────────────────────────────────────────────────────────────

class TestLeaveBalance:
    def test_admin_sets_balance(self, client, users):
        _, adm_token, emp_id, _ = users
        res = client.post(f'/api/users/{emp_id}/leave-balance',
                          json={'leave_type': 'annual', 'total_days': 20, 'year': 2026},
                          headers={'Authorization': f'Bearer {adm_token}'})
        assert res.status_code == 201
        data = res.get_json()['balance']
        assert data['total_days'] == 20
        assert data['remaining_days'] == 20

    def test_non_admin_cannot_set_balance(self, client, users):
        emp_token, _, emp_id, _ = users
        res = client.post(f'/api/users/{emp_id}/leave-balance',
                          json={'leave_type': 'annual', 'total_days': 20, 'year': 2026},
                          headers={'Authorization': f'Bearer {emp_token}'})
        assert res.status_code == 403

    def test_get_balance(self, client, users):
        emp_token, adm_token, emp_id, _ = users
        client.post(f'/api/users/{emp_id}/leave-balance',
                    json={'leave_type': 'sick', 'total_days': 10, 'year': 2026},
                    headers={'Authorization': f'Bearer {adm_token}'})
        res = client.get(f'/api/users/{emp_id}/leave-balance',
                         headers={'Authorization': f'Bearer {emp_token}'})
        assert res.status_code == 200
        balances = res.get_json()['balances']
        assert any(b['leave_type'] == 'sick' for b in balances)

    def test_update_existing_balance(self, client, users):
        _, adm_token, emp_id, _ = users
        client.post(f'/api/users/{emp_id}/leave-balance',
                    json={'leave_type': 'annual', 'total_days': 15, 'year': 2026},
                    headers={'Authorization': f'Bearer {adm_token}'})
        res = client.post(f'/api/users/{emp_id}/leave-balance',
                          json={'leave_type': 'annual', 'total_days': 25, 'year': 2026},
                          headers={'Authorization': f'Bearer {adm_token}'})
        assert res.status_code == 201
        assert res.get_json()['balance']['total_days'] == 25


# ── Toggle Admin ──────────────────────────────────────────────────────────────

class TestToggleAdmin:
    def test_admin_promotes_user(self, client, users):
        _, adm_token, emp_id, _ = users
        res = client.post(f'/api/users/{emp_id}/toggle-admin',
                          headers={'Authorization': f'Bearer {adm_token}'})
        assert res.status_code == 200
        assert res.get_json()['is_admin'] is True

    def test_toggle_twice_reverts(self, client, users):
        _, adm_token, emp_id, _ = users
        client.post(f'/api/users/{emp_id}/toggle-admin',
                    headers={'Authorization': f'Bearer {adm_token}'})
        res = client.post(f'/api/users/{emp_id}/toggle-admin',
                          headers={'Authorization': f'Bearer {adm_token}'})
        assert res.get_json()['is_admin'] is False

    def test_non_admin_cannot_toggle(self, client, users):
        emp_token, _, emp_id, _ = users
        res = client.post(f'/api/users/{emp_id}/toggle-admin',
                          headers={'Authorization': f'Bearer {emp_token}'})
        assert res.status_code == 403
