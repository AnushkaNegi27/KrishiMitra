from flask import Blueprint, request, jsonify, current_app, g
from db import get_connection
import hashlib
import jwt
import datetime
from functools import wraps
from flask_mail import Message
from . import mail 

auth = Blueprint('auth', __name__)


# JWT token helper 
def token_required(f):
    """
    Decorator to protect routes that require a valid JWT token.
    Rejects the request if the token is missing or invalid.
    """
    @wraps(f)
    def decorator(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            bearer = request.headers.get('Authorization')
            token = bearer.split()[1] if len(bearer.split()) > 1 else None

        if not token:
            return jsonify({"error": "Token is missing!"}), 401

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            g.farmer_id = data['farmer_id']  # store farmer_id in Flask's g object
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired!"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token is invalid!"}), 401

        return f(*args, **kwargs)
    return decorator


# --- optional token ---
def token_optional(f):
    """
    Decorator that checks for a token, but does not reject the request.
    If a valid token is present, it sets g.farmer_id.
    If no token (or an invalid token) is present, it sets g.farmer_id to None.
    """
    @wraps(f)
    def decorator(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            bearer = request.headers.get('Authorization')
            token = bearer.split()[1] if len(bearer.split()) > 1 else None
            
            if token:
                try:
                    data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
                    g.farmer_id = data['farmer_id']  # Set farmer_id if token is valid
                except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
                    g.farmer_id = None # Token is bad, treat as guest
            else:
                g.farmer_id = None # Header malformed
        else:
            g.farmer_id = None # No token, treat as guest
            
        return f(*args, **kwargs) # Always continues
    return decorator



# Sign Up
@auth.route('/signup', methods=['POST'])
def signup():
    data = request.get_json(force=True)
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    city = data.get('city')

    if not all([name, email, password, city]):
        return jsonify({"error": "All fields are required"}), 400

    password_hash = hashlib.sha256(password.encode()).hexdigest()

    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO Farmers (name, email, password_hash, city) "
                "VALUES (%s, %s, %s, %s) RETURNING farmer_id",
                (name, email, password_hash, city)
            )
            farmer_id = cursor.fetchone()['farmer_id']
            conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"error": "Email already exists or DB error"}), 400
    finally:
        conn.close()

    token = jwt.encode({
        "farmer_id": farmer_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, current_app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({"message": "Signup successful", "token": token})


# Sign In
@auth.route('/signin', methods=['POST'])
def signin():
    data = request.get_json(force=True)
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({"error": "Email and password required"}), 400

    password_hash = hashlib.sha256(password.encode()).hexdigest()

    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT farmer_id, name, city FROM Farmers WHERE email=%s AND password_hash=%s",
                (email, password_hash)
            )
            result = cursor.fetchone()
    finally:
        conn.close()

    if not result:
        return jsonify({"error": "Invalid credentials"}), 401

    token = jwt.encode({
        "farmer_id": result['farmer_id'],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, current_app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({
        "message": "Signin successful",
        "token": token,
        "farmer": {"id": result['farmer_id'], "name": result['name'], "city": result['city']}
    })


# Forgot Password
@auth.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"message": "Email is required"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Farmers WHERE email = %s", (email,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({"message": "No account found with this email"}), 404

    token = jwt.encode(
        {'email': email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=30)},
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )
    
    reset_link = f"http://localhost:5173/reset-password?token={token}"

    msg = Message(
        subject='KrishiMitra Password Reset',
        sender=current_app.config['MAIL_USERNAME'],
        recipients=[email]
    )
    msg.body = f"Hello,\n\nClick the link below to reset your KrishiMitra password (expires in 30 minutes):\n{reset_link}"
    mail.send(msg)

    return jsonify({"message": "Password reset link sent to your email"}), 200



# Reset Password
@auth.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')

    if not all([token, new_password]):
        return jsonify({"message": "Token and new password are required"}), 400

    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        email = payload['email']
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token has expired"}), 400
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token"}), 400

    password_hash = hashlib.sha256(new_password.encode()).hexdigest()

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE Farmers SET password_hash = %s WHERE email = %s",
            (password_hash, email)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"message": "Database error"}), 500
    finally:
        conn.close()

    return jsonify({"message": "Password has been reset successfully"}), 200