from flask import Blueprint, request, jsonify, current_app
from db import get_connection
import hashlib
import jwt
import datetime
from functools import wraps

auth = Blueprint('auth', __name__)

# -----------------------
# JWT token helper
# -----------------------
def token_required(f):
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
            request.farmer_id = data['farmer_id']
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired!"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token is invalid!"}), 401

        return f(*args, **kwargs)

    return decorator

# -------------------
# Sign Up
# -------------------
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
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1)
    }, current_app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({"message": "Signup successful", "token": token})

# -------------------
# Sign In
# -------------------
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
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1)
    }, current_app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({
        "message": "Signin successful",
        "token": token,
        "farmer": {"id": result['farmer_id'], "name": result['name'], "city": result['city']}
    })
