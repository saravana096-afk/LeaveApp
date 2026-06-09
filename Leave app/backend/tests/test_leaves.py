import pytest
from models import db, User, LeaveBalance
from datetime import date, timedelta


def register_login(client, username, email, password='pass123', gender='male'):
    client.post('/api/auth/register', json={
        'username': username, 'email': email, 'password': password,
        'first_name': 'Test', 'last_name': 'User', 'gender': gender
    })
    res = client.post('/api/auth/login', json={'username': username, 'password': password})
    return res.get_json()['access_token']


def make_admin(username):
    u = User.query.filter_by(username=username).first()
    u.is_admin = True
    db.session.commit()


def set_balance(client, token, user_id, leave_type, total_days):
    client.post(f'/api/users/{user_id}/leave-balance',
                json={'leave_type': leave_type, 'total_days': total_days, 'year': date.today().year},
                headers={'Authorization': f'Bearer {token}'})


def future(days=1):
    return (date.today() + timedelta(days=days)).isoformat()


@pytest.fixture
def setup(client):
    emp_token = register_login(client, 'employee', 'emp@test.com')
    adm_token = register_login(client, 'adminuser', 'admin@test.com')
    make_admin('adminuser')
    # re-login admin to get fresh token after role change
    adm_token = client.post('/api/auth/login',
                            json={'username': 'adminuser', 'password': 'pass123'}).get_json()['access_token']

    emp = User.query.filter_by(username='employee').first()
    adm = User.query.filter_by(username='adminuser').first()

    set_balance(client, adm_token, emp.id, 'annual', 20)
    set_balance(client, adm_token, emp.id, 'sick', 10)

    return emp_token, adm_token, emp.id, adm.id


# ── Submit Leave ───────────────────────────────────────────────────────────────

class TestSubmitLeave:
    def test_submit_success(self, client, setup):
        emp_token, *_ = setup
        res = client.post('/api/leaves/request', json={
            'leave_type': 'annual', 'start_date': future(1), 'end_date': future(3), 'reason': 'Vacation'
        }, headers={'Authorization': f'Bearer {emp_token}'})
        assert res.status_code == 201
        assert res.get_json()['status'] == 'pending'

    def test_submit_no_balance(self, client, setup):
        emp_token, *_ = setup
        res = client.post('/api/leaves/request', json={
            'leave_type': 'bereavement', 'start_date': future(1), 'end_date': future(2)
        }, headers={'Authorization': f'Bearer {emp_token}'})
        assert res.status_code == 400
        assert 'Insufficient leave balance' in res.get_json()['error']

    def test_submit_exceeds_balance(self, client, setup):
        emp_token, *_ = setup
        res = client.post('/api/leaves/request', json={
            'leave_type': 'sick', 'start_date': future(1), 'end_date': future(30)
        }, headers={'Authorization': f'Bearer {emp_token}'})
        assert res.status_code == 400

    def test_submit_invalid_dates(self, client, setup):
        emp_token, *_ = setup
        res = client.post('/api/leaves/request', json={
            'leave_type': 'annual', 'start_date': future(5), 'end_date': future(1)
        }, headers={'Authorization': f'Bearer {emp_token}'})
        assert res.status_code == 400

    def test_submit_missing_fields(self, client, setup):
        emp_token, *_ = setup
        res = client.post('/api/leaves/request', json={'leave_type': 'annual'},
                          headers={'Authorization': f'Bearer {emp_token}'})
        assert res.status_code == 400

    def test_submit_without_token(self, client):
        res = client.post('/api/leaves/request', json={
            'leave_type': 'annual', 'start_date': future(1), 'end_date': future(2)
        })
        assert res.status_code == 401

    def test_maternity_blocked_for_male(self, client, setup):
        emp_token, adm_token, emp_id, _ = setup
        set_balance(client, adm_token, emp_id, 'maternity', 90)
        res = client.post('/api/leaves/request', json={
            'leave_type': 'maternity', 'start_date': future(1), 'end_date': future(5)
        }, headers={'Authorization': f'Bearer {emp_token}'})
        assert res.status_code == 403
        assert 'female' in res.get_json()['error']

    def test_maternity_allowed_for_female(self, client, setup):
        _, adm_token, _, _ = setup
        fem_token = register_login(client, 'femuser', 'fem@test.com', gender='female')
        fem = User.query.filter_by(username='femuser').first()
        set_balance(client, adm_token, fem.id, 'maternity', 90)
        res = client.post('/api/leaves/request', json={
            'leave_type': 'maternity', 'start_date': future(1), 'end_date': future(5)
        }, headers={'Authorization': f'Bearer {fem_token}'})
        assert res.status_code == 201


# ── Get Requests ───────────────────────────────────────────────────────────────

class TestGetLeaves:
    def test_employee_sees_own_only(self, client, setup):
        emp_token, *_ = setup
        client.post('/api/leaves/request', json={
            'leave_type': 'annual', 'start_date': future(1), 'end_date': future(2)
        }, headers={'Authorization': f'Bearer {emp_token}'})
        res = client.get('/api/leaves/requests', headers={'Authorization': f'Bearer {emp_token}'})
        assert res.status_code == 200
        assert len(res.get_json()['requests']) == 1

    def test_admin_sees_all(self, client, setup):
        emp_token, adm_token, *_ = setup
        client.post('/api/leaves/request', json={
            'leave_type': 'annual', 'start_date': future(1), 'end_date': future(2)
        }, headers={'Authorization': f'Bearer {emp_token}'})
        res = client.get('/api/leaves/requests', headers={'Authorization': f'Bearer {adm_token}'})
        assert res.status_code == 200
        assert len(res.get_json()['requests']) >= 1


# ── Approve / Reject ───────────────────────────────────────────────────────────

class TestApproveReject:
    def _submit(self, client, token):
        res = client.post('/api/leaves/request', json={
            'leave_type': 'annual', 'start_date': future(1), 'end_date': future(2)
        }, headers={'Authorization': f'Bearer {token}'})
        return res.get_json()['request_id']

    def test_approve_success(self, client, setup):
        emp_token, adm_token, *_ = setup
        rid = self._submit(client, emp_token)
        res = client.post(f'/api/leaves/requests/{rid}/approve',
                          headers={'Authorization': f'Bearer {adm_token}'})
        assert res.status_code == 200
        assert res.get_json()['status'] == 'approved'

    def test_reject_success(self, client, setup):
        emp_token, adm_token, *_ = setup
        rid = self._submit(client, emp_token)
        res = client.post(f'/api/leaves/requests/{rid}/reject',
                          json={'reason': 'Short staffed'},
                          headers={'Authorization': f'Bearer {adm_token}'})
        assert res.status_code == 200
        assert res.get_json()['status'] == 'rejected'

    def test_non_admin_cannot_approve(self, client, setup):
        emp_token, *_ = setup
        rid = self._submit(client, emp_token)
        res = client.post(f'/api/leaves/requests/{rid}/approve',
                          headers={'Authorization': f'Bearer {emp_token}'})
        assert res.status_code == 403

    def test_cannot_approve_twice(self, client, setup):
        emp_token, adm_token, *_ = setup
        rid = self._submit(client, emp_token)
        client.post(f'/api/leaves/requests/{rid}/approve',
                    headers={'Authorization': f'Bearer {adm_token}'})
        res = client.post(f'/api/leaves/requests/{rid}/approve',
                          headers={'Authorization': f'Bearer {adm_token}'})
        assert res.status_code == 400

    def test_balance_deducted_on_approve(self, client, setup):
        emp_token, adm_token, emp_id, _ = setup
        rid = self._submit(client, emp_token)

        before = client.get(f'/api/users/{emp_id}/leave-balance',
                            headers={'Authorization': f'Bearer {emp_token}'}).get_json()
        days_before = next(b['remaining_days'] for b in before['balances'] if b['leave_type'] == 'annual')

        client.post(f'/api/leaves/requests/{rid}/approve',
                    headers={'Authorization': f'Bearer {adm_token}'})

        after = client.get(f'/api/users/{emp_id}/leave-balance',
                           headers={'Authorization': f'Bearer {emp_token}'}).get_json()
        days_after = next(b['remaining_days'] for b in after['balances'] if b['leave_type'] == 'annual')

        assert days_after < days_before


# ── Cancel ─────────────────────────────────────────────────────────────────────

class TestCancel:
    def test_cancel_pending(self, client, setup):
        emp_token, *_ = setup
        res = client.post('/api/leaves/request', json={
            'leave_type': 'annual', 'start_date': future(1), 'end_date': future(2)
        }, headers={'Authorization': f'Bearer {emp_token}'})
        rid = res.get_json()['request_id']
        res = client.post(f'/api/leaves/requests/{rid}/cancel',
                          headers={'Authorization': f'Bearer {emp_token}'})
        assert res.status_code == 200
        assert res.get_json()['status'] == 'cancelled'

    def test_cancel_approved_restores_balance(self, client, setup):
        emp_token, adm_token, emp_id, _ = setup
        res = client.post('/api/leaves/request', json={
            'leave_type': 'annual', 'start_date': future(1), 'end_date': future(2)
        }, headers={'Authorization': f'Bearer {emp_token}'})
        rid = res.get_json()['request_id']
        client.post(f'/api/leaves/requests/{rid}/approve',
                    headers={'Authorization': f'Bearer {adm_token}'})

        before = client.get(f'/api/users/{emp_id}/leave-balance',
                            headers={'Authorization': f'Bearer {emp_token}'}).get_json()
        days_before = next(b['remaining_days'] for b in before['balances'] if b['leave_type'] == 'annual')

        client.post(f'/api/leaves/requests/{rid}/cancel',
                    headers={'Authorization': f'Bearer {emp_token}'})

        after = client.get(f'/api/users/{emp_id}/leave-balance',
                           headers={'Authorization': f'Bearer {emp_token}'}).get_json()
        days_after = next(b['remaining_days'] for b in after['balances'] if b['leave_type'] == 'annual')

        assert days_after > days_before
