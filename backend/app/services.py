import io
import numpy as np
from PIL import Image
import tensorflow as tf
from flask import current_app

def preprocess_image(file_storage):
    """Read and preprocess an image file for the disease model """
    img = Image.open(io.BytesIO(file_storage.read())).convert('RGB')
    img = img.resize((128, 128))
    img_array = tf.keras.preprocessing.image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0) / 255.0
    return img_array

def get_disease_prediction(image_array):
    """Use the disease model to make a prediction """
    model = current_app.disease_model
    class_names = current_app.config['DISEASE_CLASS_NAMES']
    
    predictions = model.predict(image_array)
    predicted_index = np.argmax(predictions[0])
    predicted_class = class_names[predicted_index]
    confidence = np.max(predictions[0]) * 100
    
    return predicted_class, confidence

def get_crop_recommendation(data):
    """Use the loaded crop model to make a prediction """
    model = current_app.crop_model
    required_keys = ['n', 'p', 'k', 'temp', 'humidity', 'phvalue', 'rainfall']
    input_features = [data[key] for key in required_keys]
    prediction = model.predict([input_features])
    return prediction[0]

def generate_ai_description(prompt):
    """Gemini AI generate descriptive text """
    gemini_model = current_app.gemini_model
    if not gemini_model:
        return "Generative AI model is not available."
    try:
        response = gemini_model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error during AI generation: {e}")
        return "Sorry, I couldn't generate a description at this time."