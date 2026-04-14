// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Built-in FAQ for basic questions
const faq = {
    "what is mmse": "The Mini-Mental State Examination (MMSE) is a 30-point questionnaire that is used extensively in clinical and research settings to measure cognitive impairment. It is commonly used to screen for dementia.",
    "how to take the test?": "To take the test, click the 'Start The Test Now' button. You'll be guided through a series of questions. Answer each one to the best of your ability. Your results will be provided at the end.",
    "what do results mean?": "The results provide a risk assessment ('Low Risk' or 'High Risk') based on your answers. 'High Risk' suggests that some of your answers align with early indicators of cognitive decline. This is not a diagnosis. We strongly recommend discussing your results with a healthcare professional.",
    "is this a diagnosis?": "No, this is not a medical diagnosis. This tool is for informational purposes only and provides a risk assessment based on common factors. Please consult a doctor for a proper diagnosis.",
    "what is alzheimer's disease?": "Alzheimer's disease is a progressive neurodegenerative disorder that affects memory, thinking, and behavior. It is the most common cause of dementia in older adults.",
    "what are the symptoms of alzheimer's?": "Early symptoms include memory loss, confusion, difficulty with familiar tasks, mood changes, and challenges with problem-solving. As it progresses, symptoms worsen to include severe memory impairment and loss of ability to carry out daily activities.",
    "what are risk factors for alzheimer's?": "Risk factors include age (over 65), family history, cardiovascular disease, diabetes, depression, head injury, hypertension, smoking, excessive alcohol consumption, low physical activity, poor diet, poor sleep, low education level, and certain genetic factors.",
    "how can i prevent alzheimer's?": "While there's no guaranteed prevention, healthy lifestyle choices can help reduce risk: regular physical exercise, balanced diet, mental stimulation, social engagement, quality sleep, managing cardiovascular health, and avoiding smoking and excessive alcohol.",
    "what is dementia?": "Dementia is a syndrome characterized by a decline in cognitive function severe enough to interfere with daily life. Alzheimer's disease is the most common type of dementia.",
    "how is alzheimer's diagnosed?": "Diagnosis involves medical history review, physical and neurological exams, cognitive tests like MMSE, brain imaging, and sometimes blood tests. A definitive diagnosis can only be confirmed by examining brain tissue after death.",
    "what is the difference between alzheimer's and normal aging?": "Normal aging may involve minor forgetfulness, but Alzheimer's causes significant memory loss, confusion, and impairment in daily activities that progressively worsen over time.",
    "can alzheimer's be cured?": "Currently, there is no cure for Alzheimer's disease. Treatment focuses on managing symptoms, slowing progression, and supporting quality of life through medications, therapies, and lifestyle interventions.",
    "what is cognitive impairment?": "Cognitive impairment refers to difficulties with thinking, learning, memory, problem-solving, or decision-making that are more severe than expected for a person's age.",
    "how does the clarity test work?": "The Clarity test assesses Alzheimer's risk through a comprehensive questionnaire covering demographics, lifestyle, medical history, and cognitive symptoms. It uses machine learning to analyze responses and provide a risk assessment.",
    "what does low risk mean?": "Low Risk indicates that your responses do not strongly align with common Alzheimer's risk factors. However, this is not a guarantee against developing the disease, and regular health check-ups are still important.",
    "what does high risk mean?": "High Risk suggests that some of your answers align with early indicators of cognitive decline. This is not a diagnosis and should prompt consultation with a healthcare professional for further evaluation.",
    "how accurate is the test?": "The test provides a risk assessment based on established risk factors and research data. It is not 100% accurate and should be used as a screening tool, not a diagnostic instrument.",
    "can i retake the test?": "Yes, you can retake the test as often as you'd like. Tracking changes over time can be valuable for monitoring cognitive health.",
    "what should i do if i get high risk?": "If you receive a High Risk result, we strongly recommend discussing your results with a healthcare professional. They can provide proper evaluation, guidance, and any necessary follow-up care.",
    "how can i improve my brain health?": "Maintain brain health through regular exercise, healthy eating, mental stimulation (reading, puzzles), social activities, quality sleep, stress management, and regular medical check-ups.",
    "what is mild cognitive impairment?": "Mild Cognitive Impairment (MCI) is a condition characterized by cognitive changes that are more pronounced than normal aging but less severe than dementia. Not everyone with MCI develops Alzheimer's.",
    "how does family history affect risk?": "Having a close family member with Alzheimer's increases your risk, especially if multiple family members are affected or if the disease developed at a younger age. However, family history is just one risk factor among many.",
    "what role does diet play?": "A healthy diet rich in fruits, vegetables, whole grains, lean proteins, and healthy fats (like the Mediterranean diet) is associated with lower Alzheimer's risk. Foods high in antioxidants and omega-3 fatty acids may be particularly beneficial.",
    "how does exercise help?": "Regular physical exercise improves blood flow to the brain, promotes neurogenesis (new brain cell formation), reduces inflammation, and helps maintain cognitive function. Both aerobic exercise and strength training are beneficial."
};

// Function to extract keywords from message
function extractKeywords(text) {
  const stopWords = ['what', 'is', 'are', 'how', 'can', 'do', 'does', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'i', 'you', 'it', 'this', 'that', 'these', 'those'];
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  return words.filter(word => word.length > 2 && !stopWords.includes(word));
}

// Function to find best FAQ match based on keywords
function findFAQMatch(message) {
  const messageKeywords = extractKeywords(message);
  let bestMatch = null;
  let bestScore = 0;

  for (const [key, value] of Object.entries(faq)) {
    const keyKeywords = extractKeywords(key);
    let score = 0;

    // Check for exact keyword matches
    const commonKeywords = messageKeywords.filter(kw => keyKeywords.some(k => k.includes(kw) || kw.includes(k)));
    score += commonKeywords.length * 2; // Weight exact matches higher

    // Check for partial word matches (e.g., "alzheimers" matches "alzheimer's")
    const partialMatches = messageKeywords.filter(kw =>
      keyKeywords.some(k => {
        const minLength = Math.min(kw.length, k.length);
        const prefixLength = Math.min(4, minLength);
        return k.includes(kw.slice(0, prefixLength)) || kw.includes(k.slice(0, prefixLength));
      })
    );
    score += partialMatches.length; // Weight partial matches lower

    if (score > bestScore && score >= 1) { // At least 1 matching keyword or partial match
      bestMatch = value;
      bestScore = score;
    }
  }

  return bestMatch;
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userData, conversationHistory } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }

    const normalizedMessage = message.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    let reply = faq[normalizedMessage];

    if (!reply) {
      reply = findFAQMatch(message);
    }

    if (!reply) {
      // Enhanced fallback responses based on message content
      const lowerMessage = message.toLowerCase();

      // Check for greetings first
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || lowerMessage.includes('good morning') || lowerMessage.includes('good afternoon') || lowerMessage.includes('good evening')) {
        reply = "Hello! I'm the Clarity assistant, here to help you with questions about Alzheimer's disease, cognitive health, and our assessment tool. What would you like to know?";
      }
      // Check for thanks
      else if (lowerMessage.includes('thank') || lowerMessage.includes('thanks') || lowerMessage.includes('appreciate')) {
        reply = "You're welcome! I'm here whenever you need information about Alzheimer's, cognitive health, or our assessment tool. Feel free to ask me anything!";
      }
      // Check for help requests
      else if (lowerMessage.includes('help') || lowerMessage.includes('assist') || lowerMessage.includes('support')) {
        reply = "I can help you with information about Alzheimer's disease, risk factors, symptoms, prevention strategies, and how to interpret your Clarity test results. You can ask me questions like:\n• What is Alzheimer's disease?\n• What are the risk factors?\n• How can I prevent Alzheimer's?\n• What do my test results mean?\n• How does the MMSE work?\n\nWhat specific topic would you like to know more about?";
      }
      // Check for farewells
      else if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('see you') || lowerMessage.includes('farewell')) {
        reply = "Goodbye! Remember to take care of your cognitive health. If you have more questions later, I'll be here to help. Stay healthy!";
      }
      // Check for personal test results queries
      else if (lowerMessage.includes('my result') || lowerMessage.includes('my score') || lowerMessage.includes('my test') || lowerMessage.includes('last test') || lowerMessage.includes('my assessment') || lowerMessage.includes('my risk')) {
        if (userData && userData.length > 0) {
          const lastTest = userData[0];
          const riskLevel = lastTest.risk_level || 'Unknown';
          const mmseScore = lastTest.mmse_score || 'N/A';
          const testDate = new Date(lastTest.created_at).toLocaleDateString();

          if (riskLevel === 'Low Risk') {
            reply = `Great news! Based on your last test taken on ${testDate}, your MMSE score was ${mmseScore}/30 and your risk assessment was "${riskLevel}". This suggests your current responses don't strongly align with common Alzheimer's risk factors. However, maintaining healthy lifestyle habits is still important for long-term cognitive health. Would you like some tips on brain-boosting activities or general wellness advice?`;
          } else if (riskLevel === 'Medium Risk') {
            reply = `Based on your last test taken on ${testDate}, your MMSE score was ${mmseScore}/30 and your risk assessment was "${riskLevel}". This suggests some of your answers align with moderate risk indicators. While this isn't a diagnosis, it might be worth discussing with a healthcare professional. Would you like information on lifestyle changes that could help reduce your risk factors?`;
          } else if (riskLevel === 'High Risk') {
            reply = `Based on your last test taken on ${testDate}, your MMSE score was ${mmseScore}/30 and your risk assessment was "${riskLevel}". This indicates some alignment with Alzheimer's risk factors. Remember, this is not a medical diagnosis and should prompt consultation with a healthcare professional for proper evaluation. Would you like information on next steps or resources for professional consultation?`;
          } else {
            reply = `Based on your last test taken on ${testDate}, your MMSE score was ${mmseScore}/30 and your risk assessment was "${riskLevel}". Remember, this is not a medical diagnosis - please consult a healthcare professional for personalized advice. Would you like me to explain what these results might mean or provide prevention tips?`;
          }
        } else {
          reply = "I don't see any test results for you yet. Have you taken the Clarity assessment? It's a comprehensive questionnaire that evaluates Alzheimer's risk factors. Would you like me to explain how the test works or what it covers?";
        }
      }
      // Check for test history queries
      else if (lowerMessage.includes('how many tests') || lowerMessage.includes('test history') || lowerMessage.includes('how many times') || lowerMessage.includes('taken test')) {
        if (userData && userData.length > 0) {
          reply = `You've taken ${userData.length} test${userData.length !== 1 ? 's' : ''} so far. Tracking your cognitive health over time can be valuable for monitoring changes. Would you like me to help you understand your progress or provide tips for maintaining brain health?`;
        } else {
          reply = "You haven't taken any tests yet. The Clarity assessment is a great way to evaluate your Alzheimer's risk factors. Would you like me to explain what the test covers or how to get started?";
        }
      }
      // Check for risk factors questions
      else if (lowerMessage.includes('risk factors') || lowerMessage.includes('what causes') || lowerMessage.includes('causes alzheimer') || lowerMessage.includes('why alzheimer') || lowerMessage.includes('alzheimer causes')) {
        reply = "Alzheimer's risk factors include both modifiable and non-modifiable factors. Non-modifiable factors are age (65+), family history, and genetics. Modifiable factors include cardiovascular disease, diabetes, hypertension, smoking, excessive alcohol consumption, physical inactivity, poor diet, poor sleep quality, depression, and head injuries. The good news is that many of these modifiable factors can be addressed through lifestyle changes. Would you like specific advice on any of these factors?";
      }
      // Check for prevention questions
      else if (lowerMessage.includes('prevention') || lowerMessage.includes('prevent') || lowerMessage.includes('avoid alzheimer') || lowerMessage.includes('reduce risk') || lowerMessage.includes('lower risk')) {
        reply = "While there's no guaranteed way to prevent Alzheimer's, research shows several strategies can help reduce risk:\n\n• Regular physical exercise (150 minutes/week)\n• Mediterranean-style diet rich in fruits, vegetables, and healthy fats\n• Mental stimulation through reading, puzzles, or learning new skills\n• Quality sleep (7-9 hours/night)\n• Social engagement and strong relationships\n• Managing cardiovascular health, blood pressure, and cholesterol\n• Avoiding smoking and limiting alcohol\n\nWould you like more details on any of these prevention strategies?";
      }
      // Check for symptoms questions
      else if (lowerMessage.includes('symptoms') || lowerMessage.includes('signs') || lowerMessage.includes('symptom') || lowerMessage.includes('early signs') || lowerMessage.includes('warning signs')) {
        reply = "Early Alzheimer's symptoms often include:\n• Memory loss that affects daily activities\n• Difficulty completing familiar tasks\n• Confusion about time or place\n• Problems with visual images and spatial relationships\n• New problems with words in speaking or writing\n• Misplacing things and losing the ability to retrace steps\n• Decreased or poor judgment\n• Withdrawal from work or social activities\n• Changes in mood and behavior\n\nThese symptoms usually develop slowly and worsen over time. If you're experiencing these symptoms, it's important to consult a healthcare professional for proper evaluation. Would you like information on when to see a doctor?";
      }
      // Check for diagnosis questions
      else if (lowerMessage.includes('diagnosis') || lowerMessage.includes('diagnosed') || lowerMessage.includes('how diagnosed') || lowerMessage.includes('diagnostic')) {
        reply = "Alzheimer's diagnosis involves several steps:\n\n1. Medical history review and physical exam\n2. Cognitive tests like the MMSE\n3. Neurological exam\n4. Brain imaging (MRI, CT scans)\n5. Blood tests to rule out other conditions\n6. Sometimes cerebrospinal fluid analysis\n\nA definitive diagnosis can only be confirmed by examining brain tissue after death, but doctors can make a probable diagnosis with high accuracy using these methods. Early diagnosis is important as it allows for better planning and treatment. Would you like information on what to expect during the diagnostic process?";
      }
      // Check for treatment questions
      else if (lowerMessage.includes('treatment') || lowerMessage.includes('cure') || lowerMessage.includes('treatments') || lowerMessage.includes('medication') || lowerMessage.includes('drugs')) {
        reply = "Currently, there is no cure for Alzheimer's disease, but there are treatments that can help manage symptoms and potentially slow progression:\n\n• Medications: Cholinesterase inhibitors and memantine can help with cognitive symptoms\n• Lifestyle interventions: Exercise, diet, and cognitive stimulation\n• Supportive care: Occupational therapy, counseling, and support groups\n• Research treatments: Some promising drugs are in clinical trials\n\nTreatment plans are individualized and focus on maintaining quality of life. Would you like information on supportive care options or current research developments?";
      }
      // Check for caregiver questions
      else if (lowerMessage.includes('caregiver') || lowerMessage.includes('caring for') || lowerMessage.includes('care for') || lowerMessage.includes('taking care') || lowerMessage.includes('support someone')) {
        reply = "Caring for someone with Alzheimer's requires patience, education, and support. Key aspects include:\n\n• Education about the disease and its progression\n• Creating a safe environment\n• Establishing routines and using reminders\n• Managing behavioral symptoms\n• Taking care of your own health\n• Accessing community resources and support groups\n• Planning for the future\n\nCaregiving can be challenging but rewarding. Organizations like the Alzheimer's Association provide excellent resources and support. Would you like information on specific caregiving strategies or local support resources?";
      }
      // Check for research questions
      else if (lowerMessage.includes('research') || lowerMessage.includes('new treatments') || lowerMessage.includes('clinical trials') || lowerMessage.includes('studies') || lowerMessage.includes('advances')) {
        reply = "Alzheimer's research is very active with promising developments:\n\n• New drug therapies targeting beta-amyloid and tau proteins\n• Immunotherapy approaches\n• Lifestyle interventions and prevention studies\n• Early detection methods using biomarkers\n• Genetic research for personalized treatments\n• Brain stimulation techniques\n\nClinical trials are ongoing for many potential treatments. Participating in research can provide access to cutting-edge treatments and help advance knowledge. Would you like information on how to find clinical trials or learn more about specific research areas?";
      }
      // Check for general questions about Alzheimer's
      else if (lowerMessage.includes('what is alzheimer') || lowerMessage.includes('alzheimer disease') || lowerMessage.includes('tell me about alzheimer')) {
        reply = "Alzheimer's disease is a progressive neurodegenerative disorder that affects memory, thinking, and behavior. It is the most common cause of dementia in older adults, accounting for 60-80% of dementia cases. The disease destroys brain cells, leading to memory loss, confusion, and eventually the inability to perform basic daily activities. While the exact cause is unknown, it's believed to involve a combination of genetic, environmental, and lifestyle factors. Early diagnosis and management can help maintain quality of life. Would you like to know more about symptoms, risk factors, or prevention?";
      }
      // Check for questions about the test/tool
      else if (lowerMessage.includes('how does the test work') || lowerMessage.includes('test work') || lowerMessage.includes('how clarity works') || lowerMessage.includes('assessment work')) {
        reply = "The Clarity test assesses Alzheimer's risk through a comprehensive questionnaire covering demographics, lifestyle, medical history, and cognitive symptoms. It uses machine learning to analyze responses and provide a risk assessment. The test includes questions about your age, family history, lifestyle factors (diet, exercise, smoking), medical conditions, and cognitive symptoms. Your answers are processed to give you a risk level (Low, Medium, or High Risk) along with specific recommendations. Remember, this is a screening tool, not a diagnostic test. Would you like me to explain any specific part of the assessment?";
      }
      // Check for questions about MMSE
      else if (lowerMessage.includes('mmse') || lowerMessage.includes('mini mental') || lowerMessage.includes('cognitive test')) {
        reply = "The Mini-Mental State Examination (MMSE) is a 30-point questionnaire used to measure cognitive impairment and screen for dementia. It tests various cognitive functions including:\n\n• Orientation (time and place)\n• Registration (immediate memory)\n• Attention and calculation\n• Recall (short-term memory)\n• Language skills\n• Visual-spatial abilities\n\nScores below 24 typically suggest cognitive impairment, though this varies by age and education level. The MMSE is one of several tools used in Alzheimer's assessment. Would you like to know more about how cognitive testing works or what different scores might mean?";
      }
      // Check for lifestyle questions
      else if (lowerMessage.includes('exercise') || lowerMessage.includes('physical activity') || lowerMessage.includes('diet') || lowerMessage.includes('food') || lowerMessage.includes('nutrition') || lowerMessage.includes('lifestyle')) {
        reply = "Lifestyle factors play a crucial role in cognitive health. Research shows that:\n\n• Regular exercise improves blood flow to the brain and promotes neurogenesis\n• A Mediterranean-style diet rich in antioxidants may reduce Alzheimer's risk by up to 30%\n• Mental stimulation through learning new skills helps build cognitive reserve\n• Quality sleep allows the brain to clear toxins and consolidate memories\n• Social engagement reduces isolation and depression risk\n\nSmall daily changes can make a big difference. Would you like specific recommendations for exercise, diet, or other lifestyle factors?";
      }
      // General fallback with more engaging response
      else {
        const engagingTopics = [
          "I can tell you about Alzheimer's symptoms and risk factors",
          "I can explain how the Clarity assessment works",
          "I can provide prevention strategies and lifestyle tips",
          "I can help interpret your test results",
          "I can share information about diagnosis and treatment options"
        ];
        const randomTopic = engagingTopics[Math.floor(Math.random() * engagingTopics.length)];

        reply = `I'm here to help with questions about Alzheimer's disease, cognitive health, and the Clarity assessment tool. ${randomTopic}. What specific topic would you like to know more about?`;
      }
    }



    console.log("Response generated, length:", reply.length);
    res.json({ response: reply });
  } catch (err) {
    console.error("Chat processing error:", err);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

// API endpoint for total tests count and community impact
app.get('/api/total-tests', async (req, res) => {
  try {
    // Get total tests count
    const { count: totalTests, error: totalError } = await supabase
      .from('tests')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Get early detections (High Risk)
    const { count: earlyDetections, error: detectionsError } = await supabase
      .from('tests')
      .select('*', { count: 'exact', head: true })
      .eq('risk_level', 'High Risk');

    if (detectionsError) throw detectionsError;

    // Get low risk count
    const { count: lowRiskCount, error: lowRiskError } = await supabase
      .from('tests')
      .select('*', { count: 'exact', head: true })
      .eq('risk_level', 'Low Risk');

    if (lowRiskError) throw lowRiskError;

    // Get no risk count
    const { count: noRiskCount, error: noRiskError } = await supabase
      .from('tests')
      .select('*', { count: 'exact', head: true })
      .eq('risk_level', 'No Risk');

    if (noRiskError) throw noRiskError;

    // Calculate healthy users (Low Risk + No Risk)
    const healthyUsers = lowRiskCount + noRiskCount;

    res.json({
      total_tests: totalTests,
      early_detections: earlyDetections,
      healthy_users: healthyUsers,
      low_risk_count: lowRiskCount,
      no_risk_count: noRiskCount
    });
  } catch (error) {
    console.error('Error fetching community impact data:', error);
    res.status(500).json({ error: 'Failed to fetch community impact data' });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ML Prediction endpoint
app.post('/api/predict', async (req, res) => {
  try {
    const testData = req.body;

    // Spawn Python process to run prediction
    const pythonProcess = spawn('python', ['predict.py', JSON.stringify(testData)], {
      cwd: __dirname
    });

    let result = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const prediction = JSON.parse(result.trim());
          res.json(prediction);
        } catch (parseError) {
          console.error('Error parsing prediction result:', parseError);
          res.status(500).json({ error: 'Failed to parse prediction result' });
        }
      } else {
        console.error('Python process failed:', errorOutput);
        res.status(500).json({ error: 'Prediction failed', details: errorOutput });
      }
    });

  } catch (error) {
    console.error('Prediction endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ML Model Retraining endpoint
app.post('/api/retrain-model', async (req, res) => {
  try {
    console.log('Starting model retraining...');

    // Spawn Python process to retrain the model
    const pythonProcess = spawn('python', ['retrain_model.py'], {
      cwd: __dirname
    });

    let result = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Model retraining completed successfully');
        res.json({
          success: true,
          message: 'Model retrained successfully with accumulated test data',
          output: result
        });
      } else {
        console.error('Model retraining failed:', errorOutput);
        res.status(500).json({
          success: false,
          error: 'Model retraining failed',
          details: errorOutput
        });
      }
    });

  } catch (error) {
    console.error('Retraining endpoint error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
