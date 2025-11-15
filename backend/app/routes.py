from flask import Blueprint, request, jsonify, g
from db import get_connection
from . import services
# importing both decorators now for vapi ai to work 
from .auth import token_required, token_optional 
import datetime
import os
import uuid
import requests
import io
from werkzeug.utils import secure_filename
from flask import send_from_directory, current_app
import traceback
import json


api = Blueprint('api', __name__)


@api.route('/ai/crop-recommendation', methods=['POST'])
@token_required
def crop_recommendation_endpoint():
    try:
        farmer_id = g.farmer_id
        
        conn = get_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        with conn.cursor() as cursor:
            cursor.execute("SELECT city FROM farmers WHERE farmer_id=%s", (farmer_id,))
            result = cursor.fetchone()        

        if not result:
            return jsonify({"error": "Farmer not found"}), 404

        city = result['city']
        data = request.get_json(force=True)
        data['city'] = city 

        predicted_crop = services.get_crop_recommendation(data)

        prompt = f"""
        Based on agricultural data where a model recommended '{predicted_crop}', 
        provide a concise, helpful recommendation for a farmer in India. 
        Include why '{predicted_crop}' is suitable and 1-2 important cultivation tips. 
        Keep it to 3-4 sentences. Data: {data}
        """

        description = services.generate_ai_description(prompt)

        # store the result in DB before closing connection
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


@api.route('/ai/disease-detection', methods=['POST'])
@token_required
def disease_detection_endpoint():
    try:
        farmer_id = g.farmer_id  # Fetch farmer_id from JWT

        if 'file' not in request.files:
            return jsonify({"error": "No image file provided."}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No image selected."}), 400
        
        # Save the image locally (you can change to Cloudinary later)
        image_path = f"uploads/{file.filename}"
        file.save(image_path)

        # Run ML prediction
        image_array = services.preprocess_image(file)
        predicted_disease, confidence = services.get_disease_prediction(image_array)

        # FIX: Convert numpy type to Python float
        confidence = float(confidence)

        formatted_disease = predicted_disease.replace("___", " - ").replace("_", " ")

        # Generating AI description
        prompt = f"""
        A plant leaf is identified as having '{formatted_disease}'. 
        Provide a practical guide for a farmer in India. 
        Include a simple description and 2-3 actionable treatment steps (organic and chemical).
        """
        description = services.generate_ai_description(prompt)

        # Save result in DB
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO diseasedetections 
                (farmer_id, image_url, predicted_disease, confidence, description, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (farmer_id, image_path, formatted_disease, confidence, description, datetime.datetime.now()))
            conn.commit()
        conn.close()

        # Return response
        return jsonify({
            "predicted_disease": formatted_disease,
            "description": description,
            "confidence": f"{confidence:.2f}%"
        })
    except Exception as e:
        print(f"Error in disease detection endpoint: {e}")
        return jsonify({"error": "An internal error occurred."}), 500


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
    

@api.route('/dashboard', methods=['GET'])
@token_required
def get_dashboard():
    try:
        farmer_id = g.farmer_id
        print("Fetching dashboard data for farmer:", farmer_id)

        conn = get_connection()
        cur = conn.cursor()

        # Fetch crop recommendations
        cur.execute("""
            SELECT COUNT(*) AS count FROM croprecommendations WHERE farmer_id = %s
        """, (farmer_id,))
        crop_reco_count = cur.fetchone()['count']

        # Fetch disease detections
        cur.execute("""
            SELECT COUNT(*) AS count FROM diseasedetections WHERE farmer_id = %s
        """, (farmer_id,))
        disease_detect_count = cur.fetchone()['count']

        # Calculate total predictions
        total_predictions = crop_reco_count + disease_detect_count

        # Example success rate
        success_rate = 100 if total_predictions == 0 else round(90 + (10 * (crop_reco_count / max(1, total_predictions))), 2)

        # Fetch recent activities
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


#this end point is for vapi
@api.route('/vapi-webhook', methods=['POST'])
@token_optional # Use the optional decorator this was added because duing configuration 
#in vapi i was not able to pass the dynamic token (jwt) of the user
def vapi_webhook():
    
    print("\n [VAPI WEBHOOK CALLED (HYBRID AUTH)] ")
    payload = request.json
    print(f"1. RECEIVED PAYLOAD: {payload}")

    # g.farmer_id was set (or not set) by our @token_optional decorator
    farmer_id = getattr(g, 'farmer_id', None) 
    
    if 'message' in payload and payload['message'].get('type') == 'tool-calls':
        print("2. Detected 'tool-calls' message.")
        
        tool_calls = payload['message'].get('toolCalls', [])
        
        if not tool_calls:
            print("!!! ERROR: 'tool-calls' was empty.")
            return jsonify({"error": "Empty tool calls"}), 400
            
        function_call = tool_calls[0]
        name = function_call['function'].get('name')
        parameters = function_call['function'].get('arguments', {})
        tool_call_id = function_call.get("id") 

        print(f"3. FUNCTION CALL: {name}")
        print(f"4. PARAMETERS: {parameters}")

        conn = get_connection()
        if not conn:
            print("!!! ERROR: Database connection failed.")
            return jsonify({"error": "Database connection failed"}), 500
            
        try:
            if name == 'getCropRecommendation':
                
                # This is dynamic logic 
                if farmer_id:
                    # if user is authenticated then get city from DB
                    # todo: this will mainly not be called for the time being , we can fix this later on 
                    print("INFO: User is Authenticated. Fetching city from DB.")
                    with conn.cursor() as cursor:
                        cursor.execute("SELECT city FROM farmers WHERE farmer_id=%s", (farmer_id,))
                        result = cursor.fetchone()
                    
                    if not result:
                        print("!!! ERROR: Farmer not found.")
                        return jsonify({"error": "Farmer not found"}), 404
                    city = result['city']
                else:
                    # assuming other user that does not have token  as guest
                    # Get city from vapi's parameters
                    print("INFO: User is a Guest. Getting city from parameters.")
                    city = parameters.get('city')
                    if not city:
                        print("!!! ERROR: Guest user did not provide a city.")
                        return jsonify({"error": "City parameter is missing"}), 400
                #end of the dynamic logic

                data = {
                    "N": parameters.get('N'),
                    "P": parameters.get('P'),
                    "K": parameters.get('K'),
                    "ph": parameters.get('ph'),
                    "city": city 
                }

                print(f"5. DATA FOR SERVICE: {data}")
                predicted_crop = services.get_crop_recommendation(data)
                print(f"6. SERVICE RETURNED CROP: {predicted_crop}")

                prompt = f"Based on agricultural data where a model recommended '{predicted_crop}', provide a concise, helpful recommendation for a farmer in India. Keep it to 3-4 sentences."
                description = services.generate_ai_description(prompt)
                
                # this will be dynamically locic for saving as well 
                if farmer_id:
                    print("INFO: Saving recommendation to DB for farmer_id:", farmer_id)
                    with conn.cursor() as cursor:
                        cursor.execute("""
                            INSERT INTO croprecommendations (farmer_id, nitrogen, phosphorus, potassium, ph_value, recommended_crop, description, created_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                        """, (farmer_id, data['N'], data['P'], data['K'], data['ph'], predicted_crop, description))
                        conn.commit()
                else:
                    print("INFO: Guest user. Skipping database save.")
                # end of dynamic logic for the saving to the db

                result_data = {
                    "recommended_crop": predicted_crop,
                    "description": description
                }
                
                result_string = json.dumps(result_data)
                print(f"7. SUCCESS: Returning result to Vapi: {result_string}")
                print("--- [END VAPI WEBHOOK] ---\n")
                
                response_data = {
                    "results": [
                        {
                            "toolCallId": tool_call_id,
                            "result": result_string
                        }
                    ]
                }
                return jsonify(response_data)

        except Exception as e:
            print(f"!!! 5. CRITICAL ERROR in Vapi webhook: {e}")
            print(traceback.format_exc()) 
            print("--- [END VAPI WEBHOOK] ---\n")
            error_response = {
                "results": [
                    {
                        "toolCallId": tool_call_id,
                        "error": str(e)
                    }
                ]
            }
            return jsonify(error_response), 200
        finally:
            if conn:
                conn.close()

    print("[END VAPI WEBHOOK]\n")
    return jsonify({"status": "ok"})


# end point vapi calls to get weather info about the city

@api.route('/vapi-weather', methods=['POST'])
def vapi_weather():
    
    print("\nvapi weather webhook called")
    payload = request.json
    print(f"payload receive : {payload}")

    # Default error response format 
    error_response = lambda msg, tool_id: jsonify({
        "results": [{"toolCallId": tool_id, "error": str(msg)}]
    }), 200 

    if 'message' in payload and payload['message'].get('type') == 'tool-calls':
        print("2. Detected 'tool-calls' message.")
        
        try:
            function_call = payload['message']['toolCalls'][0]
            name = function_call['function'].get('name')
            parameters = function_call['function'].get('arguments', {})
            tool_call_id = function_call.get("id")

            if name != 'get_weather':
                return error_response("Wrong tool called", tool_call_id)

            city = parameters.get('city')
            if not city:
                return error_response("City parameter is missing", tool_call_id)
            
            print(f"3. FUNCTION CALL: {name} for city: {city}")

            WEATHER_API_KEY = current_app.config['WEATHER_API_KEY']
            if not WEATHER_API_KEY:
                return error_response("Server is missing weather API key", tool_call_id)

            # Call the OpenWeatherMap API
            weather_url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_API_KEY}&units=metric"
            
            weather_response = requests.get(weather_url)
            weather_data = weather_response.json()

            if weather_response.status_code != 200:
                return error_response(weather_data.get('message', 'Weather API error'), tool_call_id)

            # Extract the data
            result_data = {
                "city": weather_data.get('name'),
                "temperature": weather_data['main'].get('temp'),
                "humidity": weather_data['main'].get('humidity'),
                "condition": weather_data['weather'][0].get('description'),
                "wind_speed": weather_data['wind'].get('speed')
            }

            # the 'result' must be a single-line STRING
            result_string = json.dumps(result_data)

            print(f"4. success returning weather data; {result_string}")
            print("end of vapi webhook\n")
            
            #building the final respolnse to send to vapi
            response_data = {
                "results": [
                    {
                        "toolCallId": tool_call_id,
                        "result": result_string
                    }
                ]
            }
            return jsonify(response_data)

        except Exception as e:
            print(f"critical error in weatehr webhook {e}")
            print(traceback.format_exc())
            return error_response(str(e), tool_call_id)

    return jsonify({"status": "ok"})

@api.route('/history', methods=['GET'])
@token_required
def get_history():
    try:
        farmer_id = g.farmer_id

        conn = get_connection()
        cur = conn.cursor()

        # Combine 2 tables INCLUDING IMAGE URL
        cur.execute("""
            SELECT 
                'Crop Recommendation' AS type,
                recommended_crop AS result,
                description AS gemini_response,
                NULL AS image_url,
                created_at
            FROM croprecommendations
            WHERE farmer_id = %s
            
            UNION ALL

            SELECT 
                'Disease Detection' AS type,
                predicted_disease AS result,
                description AS gemini_response,
                image_url,
                created_at
            FROM diseasedetections
            WHERE farmer_id = %s

            ORDER BY created_at DESC
        """, (farmer_id, farmer_id))

        rows = cur.fetchall()

        history = []
        for row in rows:
            history.append({
                "type": row["type"],
                "result": row["result"],
                "gemini_response": row["gemini_response"],
                "image_url": row["image_url"],   # <-- IMPORTANT
                "created_at": row["created_at"].isoformat()
            })

        cur.close()
        conn.close()

        return jsonify({"history": history}), 200

    except Exception as e:
        print("Error in /history:", e)
        return jsonify({"error": "Failed to fetch history"}), 500



@api.route('/uploads/<path:filename>')
def serve_uploads(filename):
    upload_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads')
    return send_from_directory(upload_folder, filename)
