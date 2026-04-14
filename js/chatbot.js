import { createChatbot, createChatMessage } from './ui_components.js';
import { supabase } from './supabase.js';
import { getTestHistory } from './api.js';

let userData = [];
let conversationHistory = [];

const personalizedKeywords = ['my', 'last', 'test', 'result', 'score', 'risk', 'level', 'mmse', 'how many', 'total', 'tests'];

function isPersonalizedQuery(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    return personalizedKeywords.some(keyword => lowerPrompt.includes(keyword));
}

async function loadUserData() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            userData = await getTestHistory();
        } else {
            userData = [];
        }
    } catch (error) {
        console.error('Failed to load user data:', error);
        userData = [];
    }
}

async function generateAIResponse(prompt) {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: prompt,
                userData: userData,
                conversationHistory: conversationHistory
            })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error("Error fetching AI response:", error);
        return "I'm sorry, but I'm having trouble connecting to my brain right now. Please try again in a moment.";
    }
}

const faq = {
    "what is mmse?": "The Mini-Mental State Examination (MMSE) is a 30-point questionnaire that is used extensively in clinical and research settings to measure cognitive impairment. It is commonly used to screen for dementia.",
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

export async function initChatbot(container) {
    await loadUserData();

    const { chatbotToggle, chatWindow, chatBody, chatInput, sendButton } = createChatbot();

    container.appendChild(chatbotToggle);
    container.appendChild(chatWindow);

    const toggleChat = () => {
        chatWindow.classList.toggle('hidden');
        if (!chatWindow.classList.contains('hidden')) {
            chatInput.focus();
            chatbotToggle.innerHTML = `<i data-lucide="x" class="w-8 h-8"></i>`;
        } else {
            chatbotToggle.innerHTML = `<i data-lucide="bot" class="w-8 h-8"></i>`;
        }
        lucide.createIcons();
    };

    chatbotToggle.addEventListener('click', toggleChat);

    const addMessage = (text, isUser = false) => {
        const messageEl = createChatMessage(text, isUser);
        chatBody.appendChild(messageEl);
        chatBody.scrollTop = chatBody.scrollHeight;
        conversationHistory.push({ text, isUser });
    };

    const showTypingIndicator = () => {
        const typingEl = document.createElement('div');
        typingEl.id = 'typing-indicator';
        typingEl.className = 'flex items-center space-x-1 p-3';
        typingEl.innerHTML = `
            <div class="w-10 h-10 flex-shrink-0 bg-slate-200 rounded-full flex items-center justify-center"><i data-lucide="bot" class="w-6 h-6 text-slate-500"></i></div>
            <div class="bg-slate-200 rounded-lg px-4 py-3 typing-indicator">
                <span class="inline-block w-2 h-2 bg-slate-500 rounded-full"></span>
                <span class="inline-block w-2 h-2 bg-slate-500 rounded-full"></span>
                <span class="inline-block w-2 h-2 bg-slate-500 rounded-full"></span>
            </div>`;
        chatBody.appendChild(typingEl);
        lucide.createIcons();
        chatBody.scrollTop = chatBody.scrollHeight;
        return typingEl;
    };

    const handleSend = async () => {
        const userText = chatInput.value.trim();
        if (!userText) return;

        addMessage(userText, true);
        chatInput.value = '';
        sendButton.disabled = true;

        const typingIndicator = showTypingIndicator();

        const faqAnswer = faq[userText.toLowerCase().replace(/[^a-z0-9\s]/g, '')];
        let botResponse;

        if (faqAnswer) {
            botResponse = faqAnswer;
        } else {
            botResponse = await generateAIResponse(userText);
        }

        setTimeout(() => {
            typingIndicator.remove();
            addMessage(botResponse);
            sendButton.disabled = false;
        }, 1000);
    };

    sendButton.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    });

    const { data: { user } } = await supabase.auth.getUser();
    const greeting = user
        ? `Hello! I'm the Clarity assistant. I can see you've taken ${userData.length} test${userData.length !== 1 ? 's' : ''}. How can I help you today?`
        : "Hello! I'm the Clarity assistant. How can I help you today? You can ask me things like 'What is MMSE?' or 'How to take the test?'.";

    setTimeout(() => {
        addMessage(greeting);
    }, 1000);
}
