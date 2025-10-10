from flask import Flask
from flask_cors import CORS
import joblib
import tensorflow as tf
import google.generativeai as genai
from config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # initialize extension
    CORS(app)

    # Load models and configure AI within the application context
    with app.app_context():
        try:
            app.disease_model = tf.keras.models.load_model(app.config['DISEASE_MODEL_PATH'])
            app.crop_model = joblib.load(app.config['CROP_MODEL_PATH'])
            print("AI models loaded successfully.")
        except Exception as e:
            print(f"Error loading models: {e}")
            app.disease_model = None
            app.crop_model = None

        try:
            genai.configure(api_key=app.config['GOOGLE_API_KEY'])
            app.gemini_model = genai.GenerativeModel("gemini-2.0-flash")
            print("Gemini AI configured successfully.")
        except Exception as e:
            print(f"Error configuring Gemini AI: {e}")
            app.gemini_model = None

    # register blueprints
    from .routes import api as api_blueprint
    app.register_blueprint(api_blueprint, url_prefix='/api')

    return app