import io
import numpy as np
from PIL import Image
import tensorflow as tf
from flask import current_app
import requests
from db import get_connection


def get_weather(city_name):
    WEATHER_API_KEY = current_app.config['WEATHER_API_KEY']
    base_url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"q": city_name, "appid": WEATHER_API_KEY, "units": "metric"}
    try:
        response = requests.get(base_url, params=params)
        data = response.json()
        if data.get("cod") != 200:
            return None, None, None
        temp = data["main"]["temp"]
        hum = data["main"]["humidity"]
        rain = data.get("rain", {}).get("1h", 0)
        return temp, hum, rain
    except Exception:
        return None, None, None


def preprocess_image(file_storage):
    """Read and preprocess an image file for the disease model."""
    try:
        file_storage.stream.seek(0) 
        image = Image.open(io.BytesIO(file_storage.read())).convert('RGB')
        image = image.resize((128, 128))
        img_array = tf.keras.preprocessing.image.img_to_array(image)
        img_array = np.expand_dims(img_array, axis=0) / 255.0
        return img_array
    except Exception as e:
        print(f"Error in preprocess_image: {e}")
        raise

def get_disease_prediction(image_array):
    """Use the disease model to make a prediction."""
    model = current_app.disease_model
    class_names = current_app.config['DISEASE_CLASS_NAMES']

    predictions = model.predict(image_array)
    predicted_index = np.argmax(predictions[0])
    predicted_class = class_names[predicted_index]
    confidence = float(np.max(predictions[0]) * 100)

    return predicted_class, confidence


def get_crop_recommendation(data):
    """Use the loaded crop model to make a prediction, automatically fetch weather from city."""
    model = current_app.crop_model

    N = data.get("N")
    P = data.get("P")
    K = data.get("K")
    ph = data.get("ph")
    city = data.get("city")

    temp, hum, rain = get_weather(city)
    if temp is None:
        raise ValueError("City not found or weather API failed.")

    input_features = [N, P, K, temp, hum, ph, rain]
    prediction = model.predict([input_features])
    return prediction[0]


def generate_ai_description(prompt):
    """Gemini AI generate descriptive text."""
    gemini_model = current_app.gemini_model
    if not gemini_model:
        return "Generative AI model is not available."
    try:
        response = gemini_model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error during AI generation: {e}")
        return "Sorry, I couldn't generate a description at this time."


def log_crop_recommendation_db(farmer_id, recommended_crop, description):
    conn = get_connection()
    if conn:
        try:
            with conn.cursor() as cursor:
                query = """
                    INSERT INTO Prediction_Logs (farmer_id, log_date, type, result_value)
                    VALUES (%s, NOW(), 'Crop', %s)
                """
                result_text = f"{recommended_crop}: {description}"
                cursor.execute(query, (farmer_id, result_text))
                conn.commit()
        except Exception as e:
            print(f"Error logging crop recommendation: {e}")
        finally:
            conn.close()


def log_disease_detection_db(farmer_id, predicted_disease, description, confidence):
    conn = get_connection()
    if conn:
        try:
            with conn.cursor() as cursor:
                query = """
                    INSERT INTO Prediction_Logs (farmer_id, log_date, type, result_value)
                    VALUES (%s, NOW(), 'Disease', %s)
                """
                result_text = f"{predicted_disease}: {description} (Confidence: {confidence:.2f}%)"
                cursor.execute(query, (farmer_id, result_text))
                conn.commit()
        except Exception as e:
            print(f"Error logging disease detection: {e}")
        finally:
            conn.close()
