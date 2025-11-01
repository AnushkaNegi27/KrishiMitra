from flask import Flask
from flask_cors import CORS
import joblib
import tensorflow as tf
import google.generativeai as genai
from config import Config
from flask_mail import Mail
import os

# Initialize Mail globally so it can be imported in auth.py
mail = Mail()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # -------------------------------
    # Initialize Flask extensions
    # -------------------------------
    CORS(app)

    # Flask-Mail configuration (values come from environment variables)
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 465
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_USE_TLS'] = False
    app.config['MAIL_USE_SSL'] = True
    mail.init_app(app)

    # -------------------------------
    # Load AI Models
    # -------------------------------
    with app.app_context():
        try:
            app.disease_model = tf.keras.models.load_model(app.config['DISEASE_MODEL_PATH'])
            app.crop_model = joblib.load(app.config['CROP_MODEL_PATH'])
            print("✅ AI models loaded successfully.")
        except Exception as e:
            print(f"❌ Error loading models: {e}")
            app.disease_model = None
            app.crop_model = None

        try:
            genai.configure(api_key=app.config['GOOGLE_API_KEY'])
            app.gemini_model = genai.GenerativeModel("gemini-2.0-flash")
            print("✅ Gemini AI configured successfully.")
        except Exception as e:
            print(f"❌ Error configuring Gemini AI: {e}")
            app.gemini_model = None

    # -------------------------------
    # Register Blueprints
    # -------------------------------
    from .routes import api as api_blueprint, test_bp as test_blueprint
    from .auth import auth as auth_blueprint

    app.register_blueprint(api_blueprint, url_prefix='/api')
    app.register_blueprint(auth_blueprint, url_prefix='/auth')
    app.register_blueprint(test_blueprint, url_prefix='/test')

    return app
