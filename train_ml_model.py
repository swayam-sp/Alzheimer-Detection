import pandas as pd
import numpy as np
from supabase import create_client, Client
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

# Supabase configuration
supabase_url = 'https://ismdncztwtubmgplzmim.supabase.co'
supabase_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzbWRuY3p0d3R1Ym1ncGx6bWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0Mzg1MjEsImV4cCI6MjA3NjAxNDUyMX0.pGP3b0T5FYJK2HPJU7aBz6ZY73fWnC728u03KKDGFSs'

supabase: Client = create_client(supabase_url, supabase_key)

def fetch_training_data():
    """Fetch all data from both alzheimers_dataset and tests tables"""
    print("Fetching training data from Supabase...")

    # Fetch original dataset
    try:
        result = supabase.table('alzheimers_dataset').select('*').execute()
        original_data = pd.DataFrame(result.data)
        print(f"Fetched {len(original_data)} records from alzheimers_dataset")
    except Exception as e:
        print(f"Error fetching alzheimers_dataset: {e}")
        original_data = pd.DataFrame()

    # Fetch user test data
    try:
        result = supabase.table('tests').select('*').execute()
        test_data = pd.DataFrame(result.data)
        print(f"Fetched {len(test_data)} records from tests")
    except Exception as e:
        print(f"Error fetching tests: {e}")
        test_data = pd.DataFrame()

    return original_data, test_data

def preprocess_test_data(test_data):
    """Convert test data to match the format of alzheimers_dataset"""
    if test_data.empty:
        return pd.DataFrame()

    # Map test data columns to dataset columns
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

    processed_data = test_data.rename(columns=column_mapping)

    # Extract BMI from answers if available
    if 'answers' in processed_data.columns:
        def extract_bmi(row):
            if isinstance(row['answers'], dict) and 'bmi' in row['answers']:
                return row['answers']['bmi']
            return None

        processed_data['BMI'] = processed_data.apply(extract_bmi, axis=1)

    # Use risk_level to determine Diagnosis (1 for High Risk, 0 for Low Risk)
    processed_data['Diagnosis'] = processed_data['risk_level'].map({'High Risk': 1, 'Low Risk': 0})

    # Select only columns that exist in the original dataset
    original_columns = [
        'Age', 'Gender', 'Ethnicity', 'EducationLevel', 'BMI', 'Smoking',
        'AlcoholConsumption', 'PhysicalActivity', 'DietQuality', 'SleepQuality',
        'FamilyHistoryAlzheimers', 'CardiovascularDisease', 'Diabetes', 'Depression',
        'HeadInjury', 'Hypertension', 'MMSE', 'MemoryComplaints', 'BehavioralProblems',
        'Confusion', 'Disorientation', 'PersonalityChanges', 'DifficultyCompletingTasks',
        'Forgetfulness', 'Diagnosis'
    ]

    # Keep only existing columns
    existing_columns = [col for col in original_columns if col in processed_data.columns]
    processed_data = processed_data[existing_columns]

    return processed_data

def preprocess_data(df):
    """Preprocess the combined dataset for ML training"""
    print(f"Preprocessing {len(df)} records...")

    # Handle missing values
    df = df.dropna()

    # Encode categorical variables
    label_encoders = {}
    categorical_columns = ['Gender', 'Ethnicity', 'EducationLevel']

    for col in categorical_columns:
        if col in df.columns:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col])
            label_encoders[col] = le

    # Ensure boolean columns are properly typed
    boolean_columns = ['Smoking', 'FamilyHistoryAlzheimers', 'CardiovascularDisease',
                       'Diabetes', 'Depression', 'HeadInjury', 'Hypertension',
                       'MemoryComplaints', 'BehavioralProblems', 'Confusion',
                       'Disorientation', 'PersonalityChanges', 'DifficultyCompletingTasks', 'Forgetfulness']

    for col in boolean_columns:
        if col in df.columns:
            df[col] = df[col].astype(int)

    # Fill missing BMI values with median if any
    if 'BMI' in df.columns:
        df['BMI'] = df['BMI'].fillna(df['BMI'].median())

    return df, label_encoders

def train_model(X, y):
    """Train the ML model"""
    print("Training Random Forest model...")

    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Scale the features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train Random Forest model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train_scaled, y_train)

    # Evaluate the model
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy: {accuracy:.4f}")
    print("Classification Report:")
    print(classification_report(y_test, y_pred))

    return model, scaler

def save_model(model, scaler, label_encoders, filename='alzheimers_model.pkl'):
    """Save the trained model and preprocessing objects"""
    model_data = {
        'model': model,
        'scaler': scaler,
        'label_encoders': label_encoders
    }

    joblib.dump(model_data, filename)
    print(f"Model saved to {filename}")

def main():
    # Fetch data from Supabase
    original_data, test_data = fetch_training_data()

    # Preprocess test data
    processed_test_data = preprocess_test_data(test_data)

    # Combine datasets
    if not original_data.empty and not processed_test_data.empty:
        combined_data = pd.concat([original_data, processed_test_data], ignore_index=True)
    elif not original_data.empty:
        combined_data = original_data
    elif not processed_test_data.empty:
        combined_data = processed_test_data
    else:
        print("No data available for training")
        return

    print(f"Combined dataset has {len(combined_data)} records")

    # Preprocess combined data
    processed_data, label_encoders = preprocess_data(combined_data)

    # Prepare features and target
    feature_columns = [col for col in processed_data.columns if col != 'Diagnosis']
    X = processed_data[feature_columns]
    y = processed_data['Diagnosis']

    print(f"Training with {len(feature_columns)} features: {feature_columns}")

    # Train the model
    model, scaler = train_model(X, y)

    # Save the model
    save_model(model, scaler, label_encoders)

    print("ML model training completed successfully!")

if __name__ == "__main__":
    main()
