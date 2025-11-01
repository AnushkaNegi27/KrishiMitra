# KrishiMitra: AI-Powered Farming Assistant 
Krishi Mitra is an intelligent farming assistant designed to empower farmers by leveraging machine learning and generative AI. This application provides data-driven recommendations for crop selection and offers instant diagnostic support for plant diseases.

##  Key Features

- **Intelligent Crop Recommendation**: Suggests the most suitable crop based on soil nutrients (N, P, K), pH, and farmer’s city (for local weather data).
- **AI-Powered Disease Detection**: Identifies plant diseases using uploaded leaf images.
- **Farmer Authentication (JWT)**: Secure login and signup for farmers, with data linked to their individual profiles.
- **Personalized Dashboard**: Displays real-time stats such as total predictions, crop recommendations, disease detections, and recent activities — all specific to the logged-in farmer.
- **PostgreSQL Integration**: All user activities (crop recommendations, disease detections) are saved and retrieved from a central database.
- **Gemini AI Integration**: Provides smart, natural-language insights and cultivation tips for farmers.
- Voice Input/Output using Web Speech API (SpeechRecognition + SpeechSynthesis)

    
## Technology Stack

- **Machine Learning**: Scikit-learn, TensorFlow (Keras)
- **Backend**: Flask
- **Database**: PostgreSQL (for farmer profiles, crop data, and activity logs)
- **Generative AI**: Google Gemini
- **Frontend**: React.js (planned)

##  Project Setup and Configuration

Follow these steps to set up and run the AI backend server locally.

**Prerequisites:**
- Git and Git LFS
- Conda / Miniconda
- PostgreSQL installed and running

1. Clone the Repository
First, ensure Git LFS is installed on your system (sudo apt-get install git-lfs or brew install git-lfs). Then, clone the repository.
Bash
```
git lfs install
git clone https://github.com/AnushkaNegi27/KrishiMitra.git
cd KrishiMitra/
```

2. Create and Configure the Conda Environment
This two-step installation process is crucial to ensure all complex dependencies are installed correctly and avoid conflicts.
Bash
```
# Create and activate a new conda environment
conda create --name krishimitra python=3.11 -y
conda activate krishimitra

# Navigate to the backend directory
cd backend

# 1. Install heavy scientific packages with conda (for stable dependencies)
conda install pandas scikit-learn tensorflow pillow joblib

# 2. Install the remaining packages with pip from the requirements file
pip install -r requirements.txt

#3. Create a folder named as uploads in the backend root directory
mkdir uploads
```

3. Set Up Environment Variables

The application requires API keys which are stored in an .env file.
In the `backend/` directory, create a new file named `.env` and add the following content.

```
# In backend/.env

# General Config
SECRET_KEY="your_generated_secret_key_here"

# API Keys
GOOGLE_API_KEY="your_google_ai_api_key_here"
OPENWEATHER_API_KEY="your_openweather_api_key_here"

# PostgreSQL Database Config
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_NAME=krishimitra

# Email Configuration (for password reset)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

```

- You can get a `GOOGLE_API_KEY` from [Google AI Studio](https://makersuite.google.com/app/apikey).
- Generate a `SECRET_KEY` by running this in your terminal:  
  `python -c "import secrets; print(secrets.token_hex(24))"`
- You can get an `OPENWEATHER_API_KEY` from [OpenWeatherMap](https://openweathermap.org/appid).
- For sending password reset emails:
  - Use your Gmail ID in `MAIL_USERNAME`.
  - Generate a **16-character App Password** from your Google Account  
    → Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)  
    → Select “Mail” and “Windows Computer,” then copy the generated password.
  - Paste that App Password in your `.env` file as `MAIL_PASSWORD`.
- Do **not** use your real Gmail password — use only the App Password.
- Do not commit the `.env` file to GitHub.
- Ensure PostgreSQL is running locally or remotely.
- Replace placeholders like `<your_postgres_user>` with your actual database credentials.

4. Database Setup (PostgreSQL)

   #1. Open PostgreSQL Shell (psql) After installing PostgreSQL, open the SQL Shell (psql):
       On Windows → search for “SQL Shell (psql)” in Start Menu On macOS/Linux → open terminal and type:
   
       psql -U postgres (replace postgres with your username if different)

   #2. Create Database Once inside the shell:
       
       CREATE DATABASE krishimitra;
       \c krishimitra

   #3. Create Tables Run these queries to create the required tables:

       CREATE TABLE farmers (farmer_id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(100) UNIQUE NOT NULL, password_hash VARCHAR(64) NOT NULL, city VARCHAR(100) NOT NULL);

       CREATE TABLE croprecommendations (id SERIAL PRIMARY KEY, farmer_id INT REFERENCES farmers(farmer_id) ON DELETE CASCADE, nitrogen DOUBLE PRECISION NOT NULL, phosphorus DOUBLE PRECISION NOT NULL, potassium DOUBLE PRECISION NOT NULL, ph_value DOUBLE PRECISION NOT NULL, recommended_crop VARCHAR(100) NOT NULL, description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP );

       CREATE TABLE diseasedetections (id SERIAL PRIMARY KEY, farmer_id INT REFERENCES farmers(farmer_id) ON DELETE CASCADE, image_url TEXT NOT NULL, predicted_disease VARCHAR(100) NOT NULL, confidence VARCHAR(20), description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP );


6. Run the Development Server
Make sure you are in the backend/ directory.

Bash
```
python run.py
```

The server will now be running at `http://127.0.0.1:5000`.

##  API Documentation

The backend exposes the following API endpoints.
**Base URL:** `http://127.0.0.1:5000/api`

---
### **1. Crop Recommendation**

`POST /ai/crop-recommendation`

Predicts the best crop to grow and provides a descriptive recommendation.
- **Headers:**
    - `Content-Type: application/json`
- **Request Body (JSON):**
    JSON
    
    ```
    {
        "n": 90,
        "p": 42,
        "k": 43,
        "phvalue": 6.5,
        "city": "Delhi"
    }
    ```
    
- **Success Response (200 OK):**
    JSON
    
    ```
    {
        "recommended_crop": "rice",
        "description": "Based on the provided data, rice is an excellent choice... (AI-generated text)"
    }
    ```
    

---

### **2. Plant Disease Detection**

`POST /ai/disease-detection`

Analyzes a plant leaf image, identifies the disease, and provides a description with treatment advice.
- **Headers:**
    - `Content-Type: multipart/form-data`
- **Request Body (Form Data):**
    - **key:** `file`
    - **value:** The image file to be uploaded (e.g., `leaf_image.jpg`).
- **Success Response (200 OK):**
    JSON
    
    ```
    {
        "predicted_disease": "Apple - Apple scab",
        "description": "Apple Scab is a common fungal disease... (AI-generated text)",
        "confidence": "98.75%"
    }

***

To set up the frontend for KrishiMitra, follow these additional steps after completing the backend configuration.

---

### **3. Farmer Dashboard**

`GET /dashboard`

Returns personalized stats and recent activity for the authenticated farmer.

- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`

- **Success Response (200 OK):**
```json
{
  "totalPredictions": 5,
  "cropRecommendations": 3,
  "diseaseDetections": 2,
  "successRate": 96.5,
  "recentActivities": [
    {
      "type": "Crop Recommendation",
      "result": "Grapes",
      "created_at": "2025-10-28T23:17:53.609Z"
    }
  ]
}

---

***

## Frontend Setup and Configuration

1. **Navigate to the Frontend Directory**

   Change to the `frontend` directory in your project.

   ```bash
   cd ./frontend
   ```

2. **Install Dependencies**

   Install the required Node.js packages.

   ```bash
   npm install
   ```

3. **Configure Environment Variables**

   Create a `.env` file in the `frontend/` directory, using the provided `.env.example` as a template. You can copy the example and edit as needed:

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with the following content:

   ```
   VITE_API_BASE_URL=http://127.0.0.1:5000/api
   VITE_CLERK_PUBLISHABLE_KEY=<your_clerk_publishable_key>
   ```

   - Replace `<your_clerk_publishable_key>` with your actual Clerk publishable key.

4. **Start the Frontend Development Server**

   Finally, run the frontend development server:

   ```bash
   npm run dev
   ```

Your frontend application will now be running at `http://localhost:5173`( and can interact with the backend at `http://127.0.0.1:5000/api`.

Now your KrishiMitra assistant is ready with both backend and frontend running locally.


