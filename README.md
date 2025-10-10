# KrishiMitra: AI-Powered Farming Assistant 
Krishi Mitra is an intelligent farming assistant designed to empower farmers by leveraging machine learning and generative AI. This application provides data-driven recommendations for crop selection and offers instant diagnostic support for plant diseases.

##  Key Features

- **Intelligent Crop Recommendation**: Recommends the most suitable crop to grow based on soil conditions and environmental factors (N, P, K, temperature, humidity, pH, and rainfall).
    
- **AI-Powered Disease Detection**: Identifies plant diseases by analyzing images of plant leaves.
    

## Technology Stack

- **Machine Learning**: Scikit-learn, TensorFlow (Keras)
- **Backend**: Flask
- **Generative AI**: Google Gemini
- **Frontend**: React.js (planned)

##  Project Setup and Configuration

Follow these steps to set up and run the AI backend server locally.

**Prerequisites:**
- Git and Git LFS
- Conda / Miniconda

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
```

- You can get a `GOOGLE_API_KEY` from [Google AI Studio](https://makersuite.google.com/app/apikey).
- Generate a `SECRET_KEY` by running this in your terminal: `python -c 'import secrets; print(secrets.token_hex(24))'`

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
        "temp": 20.8,
        "humidity": 82.1,
        "phvalue": 6.5,
        "rainfall": 202.9
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
