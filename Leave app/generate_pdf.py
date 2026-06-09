from fpdf import FPDF, XPos, YPos

class PDF(FPDF):
    def header(self):
        self.set_fill_color(26, 26, 46)
        self.rect(0, 0, 210, 20, 'F')
        self.set_font('Helvetica', 'B', 14)
        self.set_text_color(233, 69, 96)
        self.set_y(5)
        self.cell(0, 10, 'LeaveApp - Application Structure', align='C')
        self.set_text_color(0, 0, 0)
        self.ln(18)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f'Page {self.page_no()}', align='C')

    def section_title(self, title):
        self.set_fill_color(240, 242, 245)
        self.set_font('Helvetica', 'B', 12)
        self.set_text_color(26, 26, 46)
        self.cell(0, 9, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT, fill=True)
        self.ln(2)

    def body_text(self, text):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(50, 50, 50)
        self.set_x(10)
        self.multi_cell(0, 6, text)

    def table_header(self, cols, widths):
        self.set_fill_color(26, 26, 46)
        self.set_text_color(255, 255, 255)
        self.set_font('Helvetica', 'B', 9)
        for col, w in zip(cols, widths):
            self.cell(w, 8, col, border=1, fill=True)
        self.ln()

    def table_row(self, cols, widths, fill=False):
        self.set_fill_color(245, 247, 250)
        self.set_text_color(50, 50, 50)
        self.set_font('Helvetica', '', 9)
        for col, w in zip(cols, widths):
            self.cell(w, 7, col, border=1, fill=fill)
        self.ln()

    def sub_heading(self, title):
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(26, 26, 46)
        self.cell(0, 7, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)


pdf = PDF()
pdf.set_auto_page_break(auto=True, margin=20)
pdf.add_page()

# Overview
pdf.section_title('  Overview')
pdf.body_text(
    'LeaveApp is a full-stack leave management system built with Flask (backend) '
    'and React (frontend). It supports employee leave requests, admin approval '
    'workflows, leave balance tracking, and gender-based leave restrictions.'
)
pdf.ln(4)

# Tech Stack
pdf.section_title('  Tech Stack')
pdf.table_header(['Layer', 'Technology'], [50, 140])
rows = [
    ('Backend',  'Python 3.14, Flask 3.0, Flask-SQLAlchemy, Flask-JWT-Extended'),
    ('Frontend', 'React 18, Vite 5, React Router 6, Axios'),
    ('Database', 'SQLite (development) / PostgreSQL (production)'),
    ('Testing',  'pytest 9, in-memory SQLite'),
]
for i, (a, b) in enumerate(rows):
    pdf.table_row([a, b], [50, 140], fill=(i % 2 == 0))
pdf.ln(6)

# Project Structure
pdf.section_title('  Project Structure')

pdf.sub_heading('Backend')
backend_tree = [
    ('app.py',               'Flask application factory'),
    ('config.py',            'Dev / Prod / Test configurations'),
    ('models.py',            'SQLAlchemy models: User, LeaveBalance, LeaveRequest'),
    ('requirements.txt',     'Python dependencies'),
    ('routes/auth.py',       'Endpoints: register, login, get/update profile'),
    ('routes/users.py',      'Endpoints: list users, leave balance, toggle admin'),
    ('routes/leaves.py',     'Endpoints: submit, approve, reject, cancel requests'),
    ('tests/conftest.py',    'Shared pytest fixtures (app + client)'),
    ('tests/test_auth.py',   '12 tests - register, login, profile'),
    ('tests/test_leaves.py', '17 tests - submit, approve, reject, cancel'),
    ('tests/test_users.py',  '11 tests - users, balances, admin toggle'),
]
pdf.table_header(['File', 'Description'], [70, 120])
for i, (f, d) in enumerate(backend_tree):
    pdf.table_row([f, d], [70, 120], fill=(i % 2 == 0))
pdf.ln(4)

pdf.sub_heading('Frontend')
frontend_tree = [
    ('src/api/axios.js',             'Axios instance with JWT header and 401 auto-logout'),
    ('src/contexts/AuthContext.jsx', 'Auth state - login, logout, register, localStorage'),
    ('src/components/Navbar.jsx',    'Top nav with links and logout button'),
    ('src/pages/Login.jsx',          'Login form'),
    ('src/pages/Register.jsx',       'Registration form with gender and department fields'),
    ('src/pages/Dashboard.jsx',      'Leave balance cards and recent request summary'),
    ('src/pages/ApplyLeave.jsx',     'Leave request form with live business-day counter'),
    ('src/pages/MyLeaves.jsx',       'Leave history with status filters and cancel button'),
    ('src/pages/AdminPanel.jsx',     '3-tab admin: approve/reject requests, users, balances'),
]
pdf.table_header(['File', 'Description'], [80, 110])
for i, (f, d) in enumerate(frontend_tree):
    pdf.table_row([f, d], [80, 110], fill=(i % 2 == 0))
pdf.ln(6)

# API Endpoints
pdf.section_title('  API Endpoints')

pdf.sub_heading('Auth  (/api/auth)')
pdf.table_header(['Method', 'Endpoint', 'Description'], [25, 65, 100])
for i, row in enumerate([
    ('POST', '/api/auth/register', 'Register a new user'),
    ('POST', '/api/auth/login',    'Login and receive JWT token'),
    ('GET',  '/api/auth/profile',  'Get current user profile'),
    ('PUT',  '/api/auth/profile',  'Update profile (name, department, gender)'),
]):
    pdf.table_row(list(row), [25, 65, 100], fill=(i % 2 == 0))
pdf.ln(3)

pdf.sub_heading('Leaves  (/api/leaves)')
pdf.table_header(['Method', 'Endpoint', 'Description'], [25, 85, 80])
for i, row in enumerate([
    ('POST', '/api/leaves/request',              'Submit a leave request'),
    ('GET',  '/api/leaves/requests',             'List requests (own or all for admin)'),
    ('GET',  '/api/leaves/requests/:id',         'Get a specific request'),
    ('POST', '/api/leaves/requests/:id/approve', 'Approve request (admin only)'),
    ('POST', '/api/leaves/requests/:id/reject',  'Reject request (admin only)'),
    ('POST', '/api/leaves/requests/:id/cancel',  'Cancel a request'),
]):
    pdf.table_row(list(row), [25, 85, 80], fill=(i % 2 == 0))
pdf.ln(3)

pdf.sub_heading('Users  (/api/users) - Admin only')
pdf.table_header(['Method', 'Endpoint', 'Description'], [25, 85, 80])
for i, row in enumerate([
    ('GET',  '/api/users/',                   'List all users'),
    ('GET',  '/api/users/:id',                'Get a specific user'),
    ('GET',  '/api/users/:id/leave-balance',  'Get user leave balances'),
    ('POST', '/api/users/:id/leave-balance',  'Set or update leave balance'),
    ('POST', '/api/users/:id/toggle-admin',   'Toggle admin role'),
]):
    pdf.table_row(list(row), [25, 85, 80], fill=(i % 2 == 0))
pdf.ln(6)

# Leave Types
pdf.section_title('  Leave Types')
pdf.table_header(['Type', 'Default Days', 'Notes'], [40, 35, 115])
for i, row in enumerate([
    ('Annual',      '20', 'General paid leave'),
    ('Sick',        '10', 'Medical leave'),
    ('Personal',    '5',  'Personal errands'),
    ('Maternity',   '90', 'Female employees only'),
    ('Bereavement', '5',  'Loss of family member'),
]):
    pdf.table_row(list(row), [40, 35, 115], fill=(i % 2 == 0))
pdf.ln(6)

# Test Coverage
pdf.section_title('  Test Coverage  (40 tests, all passing)')
pdf.table_header(['File', 'Tests', 'Key Scenarios'], [45, 15, 130])
for i, row in enumerate([
    ('test_auth.py',   '12', 'Register, login, wrong password, duplicate user, profile update'),
    ('test_leaves.py', '17', 'Submit, no balance, maternity restriction, approve, reject, cancel'),
    ('test_users.py',  '11', 'List users, set/get balance, update balance, toggle admin on/off'),
    ('Total',          '40', 'All passing - uses in-memory SQLite, no DB setup needed'),
]):
    pdf.table_row(list(row), [45, 15, 130], fill=(i % 2 == 0))
pdf.ln(6)

# Quick Start
pdf.section_title('  Quick Start')
for label, cmd in [
    ('Backend:',  'cd backend  &&  pip install -r requirements.txt  &&  python app.py'),
    ('Frontend:', 'cd frontend  &&  npm install  &&  npm run dev'),
    ('Tests:',    'cd backend  &&  python -m pytest tests/ -v'),
]:
    pdf.set_font('Helvetica', 'B', 10)
    pdf.set_text_color(26, 26, 46)
    pdf.cell(32, 7, label)
    pdf.set_font('Courier', '', 9)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 7, cmd, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.ln(3)
pdf.set_font('Helvetica', '', 9)
pdf.set_text_color(120, 120, 120)
pdf.cell(0, 6, 'Backend: http://localhost:5000    Frontend: http://localhost:5173', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.cell(0, 6, 'Default admin login - username: admin  /  password: admin', new_x=XPos.LMARGIN, new_y=YPos.NEXT)

pdf.output('LeaveApp_Structure.pdf')
print('PDF generated: LeaveApp_Structure.pdf')
