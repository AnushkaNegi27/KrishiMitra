from flask import Blueprint, request, jsonify
from . import services


api = Blueprint('api', __name__)


@api.route('/ai/crop-recommendation', methods=['POST'])
def crop_recommendation_endpoint():
    try:
        data = request.get_json(force=True)
        predicted_crop = services.get_crop_recommendation(data)
        
        prompt = f"""
        Based on agricultural data where a model recommended '{predicted_crop}', 
        provide a concise, helpful recommendation for a farmer in India. 
        Include why '{predicted_crop}' is suitable and 1-2 important cultivation tips. 
        Keep it to 3-4 sentences. Data: {data}
        """
        
        description = services.generate_ai_description(prompt)
        
        return jsonify({
            "recommended_crop": predicted_crop,
            "description": description
        })
    except Exception as e:
        print(f"Error in crop recommendation endpoint: {e}")
        return jsonify({"error": "An internal error occurred."}), 500


@api.route('/ai/disease-detection', methods=['POST'])
def disease_detection_endpoint():
    if 'file' not in request.files:
        return jsonify({"error": "No image file provided."}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No image selected."}), 400
    
    try:
        image_array = services.preprocess_image(file)
        predicted_disease, confidence = services.get_disease_prediction(image_array)
        
        formatted_disease = predicted_disease.replace("___", " - ").replace("_", " ")
        
        prompt = f"""
        A plant leaf is identified as having '{formatted_disease}'. 
        Provide a practical guide for a farmer in India. 
        Include a simple description and 2-3 actionable treatment steps (organic and chemical).
        """
        
        description = services.generate_ai_description(prompt)
        
        return jsonify({
            "predicted_disease": formatted_disease,
            "description": description,
            "confidence": f"{confidence:.2f}%"
        })
    except Exception as e:
        print(f"Error in disease detection endpoint: {e}")
        return jsonify({"error": "An internal error occurred."}), 500