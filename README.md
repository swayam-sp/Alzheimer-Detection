# 🧠 Alzheimer Detection System

## 📖 Overview

The **Alzheimer Detection System** is a full-stack web application that predicts the likelihood of Alzheimer’s disease using machine learning.

It combines:

- 🧠 Machine Learning (Python)
- 🌐 Web Interface (HTML, CSS, JavaScript)
- ☁️ Backend & Authentication (Supabase)

The system allows users to:

- Answer cognitive questionnaires
- Get risk prediction (Low / High)
- View interactive dashboard insights

---

## 🚀 Features

### 👤 User Features

- Secure Authentication (Login / Signup)
- Interactive Questionnaire
- Real-time Alzheimer Risk Prediction
- Multi-language Support 🌍
- Dashboard with user insights
- AI Chatbot support 🤖
- Mini-games for cognitive engagement 🎮

---

### 🧠 Machine Learning Features

- Data preprocessing and cleaning
- Model training using Alzheimer dataset
- Prediction using trained ML model
- Risk classification (Low / High)

---

### 🌐 Frontend Features

- Responsive UI with modern design
- Smooth animations and transitions
- Skeleton loading screens
- Multi-language support (EN, FR, ES, DE, ZH)

---

### 🔐 Backend Features

- Supabase integration
- User authentication & session management
- API communication with ML model

---

## 🛠️ Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend

- Node.js
- Supabase

### Machine Learning

- Python
- Pandas
- NumPy
- Scikit-learn

---

## 📂 Project Structure

```
Alzheimer-Detection/
│
├── index.html
├── dashboard.html
├── auth.html
├── test.html
│
├── css/
│   ├── style.css
│   ├── input.css
│   └── animations & UI styles
│
├── js/
│   ├── main.js
│   ├── api.js
│   ├── auth.js
│   ├── chatbot.js
│   ├── dashboard.js
│   ├── questionnaire.js
│   └── supabase.js
│
├── locales/
│   ├── en.json
│   ├── fr.json
│   ├── es.json
│   ├── de.json
│   └── zh.json
│
├── predict.py
├── train_ml_model.py
├── dataset.csv
│
├── .gitignore
└── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/Alzheimer-Detection.git
cd Alzheimer-Detection
```

---

### 2️⃣ Install Dependencies

#### For Python (ML)

```bash
pip install -r requirements.txt
```

#### For Node.js (if backend used)

```bash
npm install
```

---

### 3️⃣ Setup Environment Variables

Create a `.env` file:

```
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
```

---

### 4️⃣ Run the Project

#### Start Backend

```bash
node server.js
```

#### Run ML Prediction

```bash
python predict.py
```

---

## ▶️ Usage

1. Open `index.html`
2. Login / Signup
3. Complete questionnaire
4. View Alzheimer risk result
5. Access dashboard

---

## 📊 Output

- Risk classification:
  - ✅ Low Risk
  - ⚠️ High Risk

- Dashboard visualization

- Personalized user feedback

(Add screenshots here for better presentation)

---

## 🌍 Supported Languages

- English 🇺🇸
- French 🇫🇷
- Spanish 🇪🇸
- German 🇩🇪
- Chinese 🇨🇳

---

## 📌 Future Enhancements

- Deploy as a full web app (Cloud)
- Improve ML accuracy with deep learning
- Add real-time doctor consultation
- Mobile app integration

---

## 👨‍💻 Author

**Swayam**

---

## ⭐ Acknowledgements

- Alzheimer dataset sources
- Open-source libraries

---

## ⚠️ Disclaimer

This project is for educational purposes only and should not be used as a medical diagnosis tool.
