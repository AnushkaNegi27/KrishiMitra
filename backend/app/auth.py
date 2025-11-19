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

    result = None
    try:
        with conn.cursor() as cursor:
            # check if email_verified column exists
            try:
                cursor.execute(
                    "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='farmers' AND column_name='email_verified') AS exists"
                )
                exists_row = cursor.fetchone()
                if isinstance(exists_row, dict):
                    has_email_verified = bool(exists_row.get('exists', False))
                else:
                    has_email_verified = bool(exists_row[0])
            except Exception:
                has_email_verified = False

            if has_email_verified:
                cursor.execute(
                    "SELECT farmer_id, name, city, email_verified FROM Farmers WHERE email=%s AND password_hash=%s",
                    (email, password_hash)
                )
            else:
                cursor.execute(
                    "SELECT farmer_id, name, city FROM Farmers WHERE email=%s AND password_hash=%s",
                    (email, password_hash)
                )
            result = cursor.fetchone()
    except Exception:
        try:
            conn.rollback()
        except Exception:
            pass
        conn.close()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        try:
            conn.close()
        except Exception:
            pass

    if not result:
        return jsonify({"error": "Invalid credentials"}), 401

    token = jwt.encode({
        "farmer_id": result['farmer_id'],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, current_app.config['SECRET_KEY'], algorithm="HS256")

    # safe extraction of email_verified
    try:
        email_verified = bool(result['email_verified']) if isinstance(result, dict) and 'email_verified' in result else False
    except Exception:
        try:
            email_verified = bool(result[3])
        except Exception:
            email_verified = False

    return jsonify({
        "message": "Signin successful",
        "token": token,
        "farmer": {"id": result['farmer_id'] if isinstance(result, dict) else result[0], "name": result['name'] if isinstance(result, dict) else result[1], "city": result['city'] if isinstance(result, dict) else result[2], "email_verified": email_verified}
    })


@auth.route('/send-verify-otp', methods=['POST'])
def send_verify_otp():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"message": "Email is required"}), 400

    conn = get_connection()
    if not conn:
        return jsonify({"message": "Database connection failed"}), 500

    try:
        with conn.cursor() as cursor:
            # ensure user exists
            cursor.execute("SELECT farmer_id FROM Farmers WHERE email = %s", (email,))
            user = cursor.fetchone()
            if not user:
                return jsonify({"message": "No account found with this email"}), 404

            # ensure verification table exists
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS EmailVerifications (
                    email TEXT PRIMARY KEY,
                    otp_hash TEXT NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    last_sent TIMESTAMP
                )
                """
            )

            # If the table existed from an older deploy it might be missing the last_sent column
            # Ensure the column exists to avoid UndefinedColumn errors when we query it.
            try:
                cursor.execute("ALTER TABLE EmailVerifications ADD COLUMN IF NOT EXISTS last_sent TIMESTAMP")
            except Exception:
                # best-effort: if ALTER fails (older Postgres versions), continue and handle missing column later
                pass

            # rate-limit: check last_sent
            cursor.execute("SELECT last_sent FROM EmailVerifications WHERE email = %s", (email,))
            prev = cursor.fetchone()
            import datetime as _dt, random, hashlib
            now = _dt.datetime.utcnow()
            if prev:
                last_sent = prev['last_sent'] if isinstance(prev, dict) and 'last_sent' in prev else prev[0]
                if last_sent and (now - last_sent).total_seconds() < 60:
                    return jsonify({"message": "Too many requests, try again later"}), 429

            otp = f"{random.randint(0, 999999):06d}"
            otp_hash = hashlib.sha256(otp.encode()).hexdigest()
            expires = now + _dt.timedelta(minutes=15)

            cursor.execute(
                "INSERT INTO EmailVerifications (email, otp_hash, expires_at, last_sent) VALUES (%s,%s,%s,%s) ON CONFLICT (email) DO UPDATE SET otp_hash = EXCLUDED.otp_hash, expires_at = EXCLUDED.expires_at, last_sent = EXCLUDED.last_sent",
                (email, otp_hash, expires, now)
            )
            conn.commit()

            # send OTP
            try:
                msg = Message(subject='KrishiMitra Email Verification OTP', sender=current_app.config.get('MAIL_USERNAME'), recipients=[email])
                msg.body = f"Your KrishiMitra verification code is: {otp}\nThis code will expire in 15 minutes."
                mail.send(msg)
            except Exception as e:
                current_app.logger.exception("Failed to send verification OTP email")
                conn.rollback()
                return jsonify({"message": "Failed to send verification email"}), 500
    except Exception as e:
        conn.rollback()
        current_app.logger.exception("Error in send_verify_otp")
        return jsonify({"message": "Internal server error"}), 500
    finally:
        try:
            conn.close()
        except Exception:
            pass

    return jsonify({"message": "Verification code sent"}), 200


@auth.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    email = data.get('email')
    otp = data.get('otp')

    if not all([email, otp]):
        return jsonify({"message": "Email and OTP are required"}), 400

    conn = get_connection()
    if not conn:
        return jsonify({"message": "Database connection failed"}), 500

    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT otp_hash, expires_at FROM EmailVerifications WHERE email = %s", (email,))
            row = cursor.fetchone()
            if not row:
                return jsonify({"message": "No verification request found"}), 404

            otp_hash_stored = row['otp_hash'] if isinstance(row, dict) and 'otp_hash' in row else row[0]
            expires_at = row['expires_at'] if isinstance(row, dict) and 'expires_at' in row else row[1]

            import hashlib, datetime as _dt
            if _dt.datetime.utcnow() > expires_at:
                cursor.execute("DELETE FROM EmailVerifications WHERE email = %s", (email,))
                conn.commit()
                return jsonify({"message": "OTP expired"}), 400

            if hashlib.sha256(otp.encode()).hexdigest() != otp_hash_stored:
                return jsonify({"message": "Invalid OTP"}), 400

            # mark user verified; add column if missing
            try:
                cursor.execute("ALTER TABLE Farmers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE")
            except Exception:
                # best effort; ignore
                pass

            cursor.execute("UPDATE Farmers SET email_verified = TRUE WHERE email = %s", (email,))
            cursor.execute("DELETE FROM EmailVerifications WHERE email = %s", (email,))
            conn.commit()
    except Exception as e:
        conn.rollback()
        current_app.logger.exception("Error in verify_otp")
        return jsonify({"message": "Internal server error"}), 500
    finally:
        try:
            conn.close()
        except Exception:
            pass

    return jsonify({"message": "Email verified"}), 200


@auth.route('/me', methods=['GET'])
@token_required
def me():
    farmer_id = g.get('farmer_id')
    if not farmer_id:
        return jsonify({"message": "Unauthorized"}), 401

    conn = get_connection()
    if not conn:
        return jsonify({"message": "Database connection failed"}), 500

    try:
        with conn.cursor() as cursor:
            # check if email_verified exists
            try:
                cursor.execute(
                    "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='farmers' AND column_name='email_verified') AS exists"
                )
                exists_row = cursor.fetchone()
                if isinstance(exists_row, dict):
                    has_email_verified = bool(exists_row.get('exists', False))
                else:
                    has_email_verified = bool(exists_row[0])
            except Exception:
                has_email_verified = False

            if has_email_verified:
                cursor.execute("SELECT farmer_id, name, city, email, email_verified FROM Farmers WHERE farmer_id = %s", (farmer_id,))
            else:
                cursor.execute("SELECT farmer_id, name, city, email FROM Farmers WHERE farmer_id = %s", (farmer_id,))
            row = cursor.fetchone()
    finally:
        try:
            conn.close()
        except Exception:
            pass

    if not row:
        return jsonify({"message": "User not found"}), 404

    user = {}
    if isinstance(row, dict):
        user = {
            "id": row.get('farmer_id'),
            "name": row.get('name'),
            "city": row.get('city'),
            "email": row.get('email'),
            "email_verified": bool(row.get('email_verified', False))
        }
    else:
        try:
            user = {"id": row[0], "name": row[1], "city": row[2], "email": row[3], "email_verified": bool(row[4])}
        except Exception:
            user = {"id": row[0], "name": row[1], "city": row[2], "email": row[3], "email_verified": False}

    return jsonify({"user": user}), 200


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