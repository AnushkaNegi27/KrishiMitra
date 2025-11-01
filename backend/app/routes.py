from flask import Blueprint, request, jsonify, g
from db import get_connection
from . import services
from .auth import token_required 
import datetime

api = Blueprint('api', __name__)

# ------------------------------
# Crop Recommendation Endpoint
# ------------------------------
@api.route('/ai/crop-recommendation', methods=['POST'])
@token_required
def crop_recommendation_endpoint():
    try:
        # data = request.get_json(force=True)
        farmer_id = g.farmer_id
        
        # Fetch city from DB
        conn = get_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        with conn.cursor() as cursor:
            cursor.execute("SELECT city FROM farmers WHERE farmer_id=%s", (farmer_id,))
            result = cursor.fetchone()
        # conn.close()

        if not result:
            # conn.close()
            return jsonify({"error": "Farmer not found"}), 404

        city = result['city']
        data = request.get_json(force=True)
        data['city'] = city  # automatically set city

        predicted_crop = services.get_crop_recommendation(data)

        prompt = f"""
        Based on agricultural data where a model recommended '{predicted_crop}', 
        provide a concise, helpful recommendation for a farmer in India. 
        Include why '{predicted_crop}' is suitable and 1-2 important cultivation tips. 
        Keep it to 3-4 sentences. Data: {data}
        """

        description = services.generate_ai_description(prompt)

        # ✅ store the result in DB before closing connection
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO croprecommendations (farmer_id, nitrogen, phosphorus, potassium, ph_value, recommended_crop, description, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            """, (farmer_id, data['N'], data['P'], data['K'], data['ph'], predicted_crop, description))
            conn.commit()

        

        return jsonify({
            "recommended_crop": predicted_crop,
            "description": description
        })
    
    except Exception as e:
        print(f"Error in crop recommendation endpoint: {e}")
        return jsonify({"error": "An internal error occurred."}), 500
    
    finally:
        if conn:
            conn.close()


# ------------------------------
# Disease Detection Endpoint
# ------------------------------
@api.route('/ai/disease-detection', methods=['POST'])
@token_required
def disease_detection_endpoint():
    try:
        farmer_id = g.farmer_id  # 🔹 Fetch farmer_id from JWT

        if 'file' not in request.files:
            return jsonify({"error": "No image file provided."}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No image selected."}), 400
        
        # 1️⃣ Save the image locally (you can change to Cloudinary later)
        image_path = f"uploads/{file.filename}"
        file.save(image_path)

         # 2️⃣ Run ML prediction
        image_array = services.preprocess_image(file)
        predicted_disease, confidence = services.get_disease_prediction(image_array)
        
        formatted_disease = predicted_disease.replace("___", " - ").replace("_", " ")

        # 3️⃣ Generate AI description
        prompt = f"""
        A plant leaf is identified as having '{formatted_disease}'. 
        Provide a practical guide for a farmer in India. 
        Include a simple description and 2-3 actionable treatment steps (organic and chemical).
        """

        description = services.generate_ai_description(prompt)

        # 4️⃣ Save result in DB
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO diseasedetections 
                (farmer_id, image_url, predicted_disease, confidence, description, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (farmer_id, image_path, formatted_disease, confidence, description, datetime.datetime.now()))
            conn.commit()
        conn.close()

        # 5️⃣ Return response
        return jsonify({
            "predicted_disease": formatted_disease,
            "description": description,
            "confidence": f"{confidence:.2f}%"
        })
    except Exception as e:
        print(f"Error in disease detection endpoint: {e}")
        return jsonify({"error": "An internal error occurred."}), 500

# ------------------------------
# Test DB Route
# ------------------------------
test_bp = Blueprint('test', __name__)

@test_bp.route('/test-db', methods=['GET'])
def test_db_connection():
    conn = get_connection()
    if conn:
        with conn.cursor() as cur:
            cur.execute("SELECT version();")
            version = cur.fetchone()
        conn.close()
        return jsonify({"status": "success", "postgres_version": version['version']})
    else:
        return jsonify({"status": "error", "message": "Could not connect to database"}), 500
    

# ------------------------------
# Dashboard Stats Endpoint
# ------------------------------
@api.route('/dashboard', methods=['GET'])
@token_required
def get_dashboard():
    try:
        farmer_id = g.farmer_id
        print("Fetching dashboard data for farmer:", farmer_id)

        conn = get_connection()
        cur = conn.cursor()

        # ✅ Fetch crop recommendations
        cur.execute("""
            SELECT COUNT(*) AS count FROM croprecommendations WHERE farmer_id = %s
        """, (farmer_id,))
        crop_reco_count = cur.fetchone()['count']

        # ✅ Fetch disease detections
        cur.execute("""
            SELECT COUNT(*) AS count FROM diseasedetections WHERE farmer_id = %s
        """, (farmer_id,))
        disease_detect_count = cur.fetchone()['count']

        # ✅ Calculate total predictions
        total_predictions = crop_reco_count + disease_detect_count

        # ✅ Example success rate
        success_rate = 100 if total_predictions == 0 else round(90 + (10 * (crop_reco_count / max(1, total_predictions))), 2)

        # ✅ Fetch recent activities
        cur.execute("""
            SELECT 'Crop Recommendation' AS type, recommended_crop AS result, created_at
            FROM croprecommendations
            WHERE farmer_id = %s
            UNION ALL
            SELECT 'Disease Detection' AS type, predicted_disease AS result, created_at
            FROM diseasedetections
            WHERE farmer_id = %s
            ORDER BY created_at DESC
            LIMIT 10
        """, (farmer_id, farmer_id))

        rows = cur.fetchall()

        recent_activities = []
        for row in rows:
            recent_activities.append({
                "type": row['type'],
                "result": row['result'],
                "created_at": row['created_at'].isoformat()
            })

        cur.close()
        conn.close()

        return jsonify({
            "totalPredictions": total_predictions,
            "cropRecommendations": crop_reco_count,
            "diseaseDetections": disease_detect_count,
            "successRate": success_rate,
            "recentActivities": recent_activities
        }), 200

    except Exception as e:
        import traceback
        print("Error in /dashboard route:", traceback.format_exc())
        return jsonify({"error": "Failed to fetch dashboard data"}), 500
