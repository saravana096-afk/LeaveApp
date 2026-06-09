from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, LeaveBalance
from datetime import datetime

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users (admin only)"""
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    users = User.query.all()
    return jsonify({
        'users': [{
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'department': user.department,
            'is_admin': user.is_admin,
            'is_active': user.is_active
        } for user in users]
    }), 200

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get user details"""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'department': user.department,
        'is_admin': user.is_admin,
        'is_active': user.is_active
    }), 200

@users_bp.route('/<int:user_id>/leave-balance', methods=['GET'])
@jwt_required()
def get_leave_balance(user_id):
    """Get user leave balance"""
    balances = LeaveBalance.query.filter_by(user_id=user_id).all()
    
    return jsonify({
        'user_id': user_id,
        'balances': [{
            'id': balance.id,
            'leave_type': balance.leave_type,
            'total_days': balance.total_days,
            'used_days': balance.used_days,
            'remaining_days': balance.remaining_days,
            'year': balance.year
        } for balance in balances]
    }), 200

@users_bp.route('/<int:user_id>/leave-balance', methods=['POST'])
@jwt_required()
def set_leave_balance(user_id):
    """Set leave balance for a user (admin only)"""
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    balance = LeaveBalance.query.filter_by(
        user_id=user_id,
        leave_type=data.get('leave_type'),
        year=data.get('year', datetime.utcnow().year)
    ).first()
    
    if balance:
        balance.total_days = data.get('total_days', balance.total_days)
        balance.remaining_days = balance.total_days - balance.used_days
    else:
        balance = LeaveBalance(
            user_id=user_id,
            leave_type=data.get('leave_type'),
            total_days=data.get('total_days', 0),
            year=data.get('year', datetime.utcnow().year)
        )
        balance.remaining_days = balance.total_days
        db.session.add(balance)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Leave balance updated',
        'balance': {
            'id': balance.id,
            'leave_type': balance.leave_type,
            'total_days': balance.total_days,
            'remaining_days': balance.remaining_days
        }
    }), 201

@users_bp.route('/<int:user_id>/toggle-admin', methods=['POST'])
@jwt_required()
def toggle_admin(user_id):
    """Toggle admin status (admin only)"""
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.is_admin = not user.is_admin
    db.session.commit()
    
    return jsonify({
        'message': f"User {'promoted to' if user.is_admin else 'removed from'} admin",
        'is_admin': user.is_admin
    }), 200
