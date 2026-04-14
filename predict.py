import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import LabelEncoder

def load_model():
    """Load the trained model and preprocessing objects"""
    try:
        model_data = joblib.load('alzheimers_model.pkl')
        return model_data['model'], model_data['scaler'], model_data['label_encoders']
    except FileNotFoundError:
        print("Model file not found. Please train the model first.")
        return None, None, None

def preprocess_input(test_data):
    """Preprocess input data for prediction"""
    model, scaler, label_encoders = load_model()
    if model is None:
        return None

    # Convert to DataFrame
    df = pd.DataFrame([test_data])

    # Rename columns to match training data
    column_mapping = {
        'age': 'Age',
        'gender': 'Gender',
        'ethnicity': 'Ethnicity',
        'education_level': 'EducationLevel',
        'smoking': 'Smoking',
        'alcohol_consumption': 'AlcoholConsumption',
        'physical_activity': 'PhysicalActivity',
        'diet_quality': 'DietQuality',
        'sleep_quality': 'SleepQuality',
        'family_history_alzheimers': 'FamilyHistoryAlzheimers',
        'cardiovascular_disease': 'CardiovascularDisease',
        'diabetes': 'Diabetes',
        'depression': 'Depression',
        'head_injury': 'HeadInjury',
        'hypertension': 'Hypertension',
        'mmse_score': 'MMSE',
        'memory_complaints': 'MemoryComplaints',
        'behavioral_problems': 'BehavioralProblems',
        'confusion': 'Confusion',
        'disorientation': 'Disorientation',
        'personality_changes': 'PersonalityChanges',
        'difficulty_completing_tasks': 'DifficultyCompletingTasks',
        'forgetfulness': 'Forgetfulness'
    }

    df = df.rename(columns=column_mapping)

    # Extract BMI if in answers
    if 'answers' in df.columns and isinstance(df['answers'].iloc[0], dict):
        if 'bmi' in df['answers'].iloc[0]:
            df['BMI'] = df['answers'].iloc[0]['bmi']
        df = df.drop(columns=['answers'])

    # Encode categorical variables
    for col in ['Gender', 'Ethnicity', 'EducationLevel']:
        if col in df.columns and col in label_encoders:
            try:
                df[col] = label_encoders[col].transform(df[col])
            except ValueError as e:
                if 'unseen labels' in str(e):
                    # Handle unseen labels by assigning the first class (0)
                    df[col] = 0
                else:
                    raise

    # Ensure boolean columns are int
    boolean_columns = ['Smoking', 'FamilyHistoryAlzheimers', 'CardiovascularDisease',
                       'Diabetes', 'Depression', 'HeadInjury', 'Hypertension',
                       'MemoryComplaints', 'BehavioralProblems', 'Confusion',
                       'Disorientation', 'PersonalityChanges', 'DifficultyCompletingTasks']

    for col in boolean_columns:
        if col in df.columns:
            df[col] = df[col].astype(int)

    # Handle Forgetfulness separately (convert to boolean)
    if 'Forgetfulness' in df.columns:
        df['Forgetfulness'] = df['Forgetfulness'].apply(lambda x: 1 if str(x).lower() in ['frequently', 'often', 'yes'] else 0)

    # Fill missing BMI with median (simplified)
    if 'BMI' not in df.columns:
        df['BMI'] = 25.0  # default

    # Select feature columns (matching training data)
    feature_columns = ['Age', 'Gender', 'Ethnicity', 'EducationLevel', 'BMI', 'Smoking',
                       'AlcoholConsumption', 'PhysicalActivity', 'DietQuality', 'SleepQuality',
                       'FamilyHistoryAlzheimers', 'CardiovascularDisease', 'Diabetes', 'Depression',
                       'HeadInjury', 'Hypertension', 'MMSE', 'MemoryComplaints', 'BehavioralProblems',
                       'Confusion']

    # Ensure all columns exist, fill missing with 0 or median
    for col in feature_columns:
        if col not in df.columns:
            if col in ['Age', 'BMI', 'MMSE']:
                df[col] = 25.0 if col == 'BMI' else 65.0 if col == 'Age' else 25.0
            else:
                df[col] = 0

    X = df[feature_columns]

    # Scale
    X_scaled = scaler.transform(X)

    return X_scaled

def calculate_bad_habits_percentage(test_data):
    """Calculate bad habits percentage based on questionnaire answers"""
    badHabitsCount = 0

    if test_data.get('smoking', False):
        badHabitsCount += 1
    if test_data.get('physical_activity', 0) < 3:
        badHabitsCount += 1
    if test_data.get('diet_quality', 0) < 5:
        badHabitsCount += 1
    if test_data.get('sleep_quality', 0) < 5:
        badHabitsCount += 1
    if test_data.get('alcohol_consumption', 0) > 14:
        badHabitsCount += 1

    return (badHabitsCount / 5) * 100

def predict(test_data):
    """Make prediction using the trained model"""
    X_scaled = preprocess_input(test_data)
    if X_scaled is None:
        return None

    model, _, _ = load_model()
    probability = model.predict_proba(X_scaled)[0][1]  # Probability of positive class (Diagnosis=1)

    # Calculate bad habits percentage based on questionnaire answers
    bad_habits_percentage = calculate_bad_habits_percentage(test_data)

    if probability > 0.6:
        risk_level = 'High Risk'
    elif probability > 0.3:
        risk_level = 'Low Risk'
    else:
        risk_level = 'No Risk'

    return {
        'probability': probability,
        'bad_habits_percentage': bad_habits_percentage,
        'bad_habits_display': f"Due to Bad Habits: {int(bad_habits_percentage)}%",
        'risk_level': risk_level
    }

if __name__ == "__main__":
    import sys
    import json

    if len(sys.argv) > 1:
        test_data = json.loads(sys.argv[1])
        result = predict(test_data)
        if result:
            print(json.dumps(result))
        else:
            print(json.dumps({'error': 'Model not available'}))
    else:
        print("Usage: python predict.py '<json_test_data>'")
