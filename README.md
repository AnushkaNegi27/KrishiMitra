# KrishiMitra: AI-Powered Farming Assistant 
Krishi Mitra is an intelligent farming assistant designed to empower farmers by leveraging machine learning and generative AI. This application provides data-driven recommendations for crop selection and offers instant diagnostic support for plant diseases.

##  Key Features

- **Intelligent Crop Recommendation**: Recommends the most suitable crop to grow based on soil nutrient levels (N, P, K), pH, and the farmer’s city (for local weather data).
    
- **AI-Powered Disease Detection**: Identifies plant diseases by analyzing images of plant leaves.
    

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
```

3. Set Up Environment Variables

The application requires API keys which are stored in an .env file.
In the `backend/` directory, create a new file named `.env` and add the following content.

```
# In backend/.env

GOOGLE_API_KEY="YOUR_GOOGLE_AI_API_KEY_HERE"
SECRET_KEY="YOUR_RANDOMLY_GENERATED_SECRET_KEY_HERE"
OPENWEATHER_API_KEY="YOUR_OPENWEATHER_API_KEY_HERE"

# PostgreSQL Database Config
DB_HOST=localhost
DB_PORT=5432
DB_USER=<your_postgres_user>
DB_PASSWORD=<your_postgres_password>
DB_NAME=krishimitra

```

- You can get a `GOOGLE_API_KEY` from [Google AI Studio](https://makersuite.google.com/app/apikey).
- Generate a `SECRET_KEY` by running this in your terminal: `python -c 'import secrets; print(secrets.token_hex(24))'`
- You can get an OPENWEATHER_API_KEY from [OpenWeatherMap](https://openweathermap.org/appid)
- Do not commit the .env file to GitHub.
- Ensure PostgreSQL is running locally or remotely.
- Replace placeholders (<your_postgres_user> etc.) with your actual credentials.
  
4. Run the Development Server
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


