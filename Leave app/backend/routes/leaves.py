from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, LeaveRequest, LeaveBalance, User, LeaveStatus
from datetime import datetime, date
from dateutil.relativedelta import relativedelta

leaves_bp = Blueprint('leaves', __name__)

def calculate_business_days(start_date, end_date):
    """Calculate business days between two dates"""
    if start_date > end_date:
        return 0
    
    current_date = start_date
    business_days = 0
    
    while current_date <= end_date:
        if current_date.weekday() < 5:  # 0-4 are Monday-Friday
            business_days += 1
        current_date += relativedelta(days=1)
    
    return business_days

@leaves_bp.route('/request', methods=['POST'])
@jwt_required()
def create_leave_request():
    """Create a new leave request"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    # Validate input
    if not all(k in data for k in ['leave_type', 'start_date', 'end_date']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400
    
    if start_date > end_date:
        return jsonify({'error': 'Start date must be before end date'}), 400

    # Maternity leave is only for female employees
    if data['leave_type'] == 'maternity':
        user = User.query.get(user_id)
        if user.gender != 'female':
            return jsonify({'error': 'Maternity leave is only available for female employees'}), 403

    # Calculate days requested
    days_requested = calculate_business_days(start_date, end_date)
    
    # Check leave balance
    balance = LeaveBalance.query.filter_by(
        user_id=user_id,
        leave_type=data['leave_type'],
        year=start_date.year
    ).first()
    
    if not balance or balance.remaining_days < days_requested:
        return jsonify({'error': 'Insufficient leave balance'}), 400
    
    # Create leave request
    leave_request = LeaveRequest(
        user_id=user_id,
        leave_type=data['leave_type'],
        start_date=start_date,
        end_date=end_date,
        reason=data.get('reason', ''),
        days_requested=days_requested
    )
    
    db.session.add(leave_request)
    db.session.commit()
    
    return jsonify({
        'message': 'Leave request submitted',
        'request_id': leave_request.id,
        'status': leave_request.status
    }), 201

@leaves_bp.route('/requests', methods=['GET'])
@jwt_required()
def get_leave_requests():
    """Get leave requests"""
    user_id = int(get_jwt_identity())
    current_user = User.query.get(user_id)
    
    # If user is admin, get all requests; otherwise get user's own requests
    if current_user.is_admin:
        requests = LeaveRequest.query.all()
    else:
        requests = LeaveRequest.query.filter_by(user_id=user_id).all()
    
    return jsonify({
        'requests': [{
            'id': lr.id,
            'user_id': lr.user_id,
            'username': lr.requester.username,
            'leave_type': lr.leave_type,
            'start_date': lr.start_date.isoformat(),
            'end_date': lr.end_date.isoformat(),
            'days_requested': lr.days_requested,
            'reason': lr.reason,
            'status': lr.status,
            'created_at': lr.created_at.isoformat()
        } for lr in requests]
    }), 200

@leaves_bp.route('/requests/<int:request_id>', methods=['GET'])
@jwt_required()
def get_leave_request(request_id):
    """Get specific leave request"""
    leave_request = LeaveRequest.query.get(request_id)
    
    if not leave_request:
        return jsonify({'error': 'Leave request not found'}), 404
    
    return jsonify({
        'id': leave_request.id,
        'user_id': leave_request.user_id,
        'username': leave_request.requester.username,
        'leave_type': leave_request.leave_type,
        'start_date': leave_request.start_date.isoformat(),
        'end_date': leave_request.end_date.isoformat(),
        'days_requested': leave_request.days_requested,
        'reason': leave_request.reason,
        'status': leave_request.status,
        'created_at': leave_request.created_at.isoformat()
    }), 200

@leaves_bp.route('/requests/<int:request_id>/approve', methods=['POST'])
@jwt_required()
def approve_leave_request(request_id):
    """Approve leave request (admin only)"""
    user_id = int(get_jwt_identity())
    current_user = User.query.get(user_id)
    
    if not current_user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    leave_request = LeaveRequest.query.get(request_id)
    if not leave_request:
        return jsonify({'error': 'Leave request not found'}), 404
    
    if leave_request.status != LeaveStatus.PENDING.value:
        return jsonify({'error': f'Cannot approve {leave_request.status} request'}), 400
    
    # Update leave balance
    balance = LeaveBalance.query.filter_by(
        user_id=leave_request.user_id,
        leave_type=leave_request.leave_type,
        year=leave_request.start_date.year
    ).first()
    
    if balance:
        balance.used_days += leave_request.days_requested
        balance.remaining_days = balance.total_days - balance.used_days
    
    # Update request
    leave_request.status = LeaveStatus.APPROVED.value
    leave_request.approved_by = user_id
    leave_request.approved_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Leave request approved',
        'status': leave_request.status
    }), 200

@leaves_bp.route('/requests/<int:request_id>/reject', methods=['POST'])
@jwt_required()
def reject_leave_request(request_id):
    """Reject leave request (admin only)"""
    user_id = int(get_jwt_identity())
    current_user = User.query.get(user_id)
    
    if not current_user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    leave_request = LeaveRequest.query.get(request_id)
    if not leave_request:
        return jsonify({'error': 'Leave request not found'}), 404
    
    if leave_request.status != LeaveStatus.PENDING.value:
        return jsonify({'error': f'Cannot reject {leave_request.status} request'}), 400
    
    data = request.get_json()
    
    leave_request.status = LeaveStatus.REJECTED.value
    leave_request.rejection_reason = data.get('reason', '')
    leave_request.approved_by = user_id
    leave_request.approved_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Leave request rejected',
        'status': leave_request.status
    }), 200

@leaves_bp.route('/requests/<int:request_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_leave_request(request_id):
    """Cancel leave request (user can cancel own, admin can cancel any)"""
    user_id = int(get_jwt_identity())
    current_user = User.query.get(user_id)
    
    leave_request = LeaveRequest.query.get(request_id)
    if not leave_request:
        return jsonify({'error': 'Leave request not found'}), 404
    
    # Check authorization
    if leave_request.user_id != user_id and not current_user.is_admin:
        return jsonify({'error': 'Not authorized'}), 403
    
    if leave_request.status == LeaveStatus.CANCELLED.value:
        return jsonify({'error': 'Request already cancelled'}), 400
    
    # If approved, reverse the balance update
    if leave_request.status == LeaveStatus.APPROVED.value:
        balance = LeaveBalance.query.filter_by(
            user_id=leave_request.user_id,
            leave_type=leave_request.leave_type,
            year=leave_request.start_date.year
        ).first()
        
        if balance:
            balance.used_days -= leave_request.days_requested
            balance.remaining_days = balance.total_days - balance.used_days
    
    leave_request.status = LeaveStatus.CANCELLED.value
    db.session.commit()
    
    return jsonify({
        'message': 'Leave request cancelled',
        'status': leave_request.status
    }), 200
