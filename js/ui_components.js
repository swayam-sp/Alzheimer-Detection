export function createTestHistoryCard(item, onDownloadPDF) {
    const card = document.createElement('div');
    const isHighRisk = item.risk_level === 'High Risk';

    card.className = `bg-white p-6 rounded-xl shadow-sm flex items-center justify-between transition-transform hover:scale-[1.02] hover:shadow-md`;

    const riskColor = isHighRisk ? 'text-red-500' : 'text-green-500';
    const riskIcon = isHighRisk ? 'alert-triangle' : 'check-circle-2';
    const riskBg = isHighRisk ? 'bg-red-100' : 'bg-green-100';

    const probabilityText = item.probability !== undefined && item.probability !== null ? `<p class="text-sm text-slate-500">Probability: <span class="font-bold text-slate-800">${(item.probability * 100).toFixed(1)}%</span></p>` : '';

    card.innerHTML = `
        <div class="flex items-center gap-4">
            <div class="text-sm text-slate-500 text-center">
                <div class="font-bold text-slate-800">${new Date(item.created_at).toLocaleDateString('en-US', { month: 'short' })}</div>
                <div>${new Date(item.created_at).getDate()}</div>
            </div>
            <div class="w-px bg-slate-200 h-10"></div>
            <div>
                <p class="font-semibold text-lg">Test Result</p>
                <p class="text-sm text-slate-500">MMSE Score: <span class="font-bold text-slate-800">${item.mmse_score}</span></p>
                ${probabilityText}
            </div>
        </div>
        <div class="flex items-center gap-3">
            <div class="flex items-center gap-3 px-4 py-2 rounded-full ${riskBg}">
                <i data-lucide="${riskIcon}" class="w-5 h-5 ${riskColor}"></i>
                <span class="font-semibold ${riskColor}">${item.risk_level}</span>
            </div>
            <button class="download-pdf-btn px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2" data-test-id="${item.id}">
                <i data-lucide="download" class="w-4 h-4"></i>
                <span class="text-sm">PDF</span>
            </button>
        </div>
    `;

    // Add event listener for PDF download
    const downloadBtn = card.querySelector('.download-pdf-btn');
    if (downloadBtn && onDownloadPDF) {
        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onDownloadPDF(item);
        });
    }

    setTimeout(() => lucide.createIcons(), 0);
    return card;
}

export function createResultCard(result, errorMessage, answers = {}) {
    const card = document.createElement('div');
    const isError = result.risk_level === 'Error';
    const isHighRisk = result.risk_level === 'High Risk';

    let icon, colorClass, title, message, tips, motivationalMessage, keyFactors;

    if (isError) {
        icon = 'server-crash';
        colorClass = 'red';
        title = 'An Error Occurred';
        message = errorMessage || "We couldn't process your test. Please try again later.";
        tips = [];
        keyFactors = [];
        motivationalMessage = "Don't worry, technology can be unpredictable. Let's try again!";
    } else {
        // Determine personalized key factors based on answers
        keyFactors = getPersonalizedKeyFactors(answers);

        if (isHighRisk) {
            icon = 'alert-triangle';
            colorClass = 'red';
            title = 'High Risk Detected';
            message = "Your results indicate a potential risk. It's important to remember this is not a diagnosis. We strongly recommend consulting a healthcare professional to discuss your results.";
            tips = [
                "Schedule a Doctor's Appointment",
                "Keep a Health Journal",
                "Discuss Family History",
                "Maintain Healthy Lifestyle",
                "Consider Cognitive Exercises",
                "Stay Socially Active",
                "Schedule regular check-ups",
                "Monitor your health"
            ];
            motivationalMessage = "Knowledge is power. Taking this step shows you're proactive about your health!";
        } else if (result.risk_level === 'Low Risk') {
            icon = 'alert-circle';
            colorClass = 'yellow';
            title = 'Low Risk Detected';
            message = "Your results indicate a low risk based on the provided answers. Continue to monitor your cognitive health and consider retaking the test periodically.";
            tips = [
                "Schedule a Doctor's Appointment",
                "Keep a Health Journal",
                "Discuss Family History",
                "Maintain Healthy Lifestyle",
                "Consider Cognitive Exercises",
                "Stay Socially Active",
                "Schedule regular check-ups",
                "Monitor your health"
            ];
            motivationalMessage = "Great job! Your proactive approach to health is commendable.";
        } else {
            icon = 'check-circle-2';
            colorClass = 'green';
            title = 'No Risk Detected';
            message = "Your results indicate no significant risk based on the provided answers. Continue maintaining your healthy lifestyle to support cognitive health.";
            tips = [
                "Schedule a Doctor's Appointment",
                "Keep a Health Journal",
                "Discuss Family History",
                "Maintain Healthy Lifestyle",
                "Consider Cognitive Exercises",
                "Stay Socially Active",
                "Schedule regular check-ups",
                "Monitor your health"
            ];
            motivationalMessage = "Excellent! Your healthy habits are supporting your cognitive well-being and you are now counted among our healthy users.";
        }
    }

    const probabilityText = result.probability !== undefined && result.probability !== null ? `<p class="text-lg font-semibold text-slate-700 mb-4">Probability of Alzheimer's: <span class="text-${colorClass}-600 font-bold">${(result.probability * 100).toFixed(1)}%</span></p>` : '';

    const keyFactorsHtml = keyFactors.length > 0 ? `
        <div class="mt-6 w-full max-w-md">
            <h3 class="text-xl font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <i data-lucide="target" class="w-5 h-5 text-orange-500"></i>
                Key Factors to Focus On
            </h3>
            <div class="text-sm text-slate-600 space-y-3">
                ${keyFactors.map(factor => `
                    <div class="bg-slate-50 p-3 rounded-lg">
                        <h4 class="font-semibold text-slate-700 mb-1">${factor.category}</h4>
                        <ul class="space-y-1 text-xs">
                            ${factor.items.map(item => `<li>• <strong>${item.title}:</strong> ${item.description}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';

    const tipsHtml = tips.length > 0 ? `
        <div class="mt-6 w-full max-w-md">
            <h3 class="text-xl font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <i data-lucide="lightbulb" class="w-5 h-5 text-yellow-500"></i>
                Helpful Tips
            </h3>
            <ul class="space-y-2">
                ${tips.map(tip => `<li class="flex items-start gap-2 text-sm text-slate-600"><i data-lucide="check-circle" class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"></i>${tip}</li>`).join('')}
            </ul>
        </div>
    ` : '';

    card.className = `bg-white p-8 md:p-12 rounded-2xl shadow-lg flex flex-col items-center result-card-enter`;
    card.innerHTML = `
        <div class="w-24 h-24 rounded-full bg-${colorClass}-100 flex items-center justify-center mb-6 result-icon-bounce">
            <i data-lucide="${icon}" class="w-12 h-12 text-${colorClass}-500"></i>
        </div>
        <h2 class="text-3xl font-bold mb-3 text-${colorClass}-500">${title}</h2>
        ${probabilityText}
        <p class="text-slate-600 mb-6 max-w-sm text-center leading-relaxed">${message}</p>
        <div class="bg-${colorClass}-50 border border-${colorClass}-200 rounded-lg p-4 mb-6 max-w-sm">
            <p class="text-${colorClass}-800 font-medium text-center">${motivationalMessage}</p>
        </div>
        ${keyFactorsHtml}
        ${tipsHtml}
        <div class="flex gap-4 mt-6">
            <a href="dashboard.html" class="px-8 py-3 bg-violet-600 text-white font-semibold rounded-full hover:bg-violet-700 transition-all hover:scale-105 shadow-lg shadow-violet-200 flex items-center gap-2">
                <i data-lucide="bar-chart-3" class="w-5 h-5"></i>
                View Dashboard
            </a>
            <button onclick="window.location.reload()" class="px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-full hover:bg-slate-300 transition-all hover:scale-105 flex items-center gap-2">
                <i data-lucide="rotate-ccw" class="w-5 h-5"></i>
                Retake Test
            </button>
        </div>
    `;

    setTimeout(() => lucide.createIcons(), 0);
    return card;
}

export function generatePDFReportFromData(testData) {
    try {
        // Extract data from test record
        const answers = testData.answers || {};
        let result = {
            risk_level: testData.risk_level,
            probability: testData.probability,
            bad_habits_percentage: testData.bad_habits_percentage
        };

        // If probability is not available, calculate it from the answers
        if (result.probability === null || result.probability === undefined) {
            result.probability = calculateAlzheimersProbability(answers);
            // Recalculate risk level based on probability
            if (result.probability > 0.6) {
                result.risk_level = 'High Risk';
            } else if (result.probability > 0.3) {
                result.risk_level = 'Low Risk';
            } else {
                result.risk_level = 'No Risk';
            }
        }

        // If bad_habits_percentage is not available, calculate it
        if (result.bad_habits_percentage === null || result.bad_habits_percentage === undefined) {
            result.bad_habits_percentage = calculateBadHabitsPercentage(answers);
        }

        // Create PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Set up fonts and colors
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);

        // Header
        doc.text('CLARITY ALZHEIMER\'S RISK ASSESSMENT REPORT', 20, 30);

        // Date
        const date = new Date(testData.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Generated on: ${date}`, 20, 45);

        let yPosition = 65;

        // Assessment Results Section
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('ASSESSMENT RESULTS', 20, yPosition);
        yPosition += 15;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Risk Level: ${result.risk_level || 'N/A'}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Probability of Alzheimer's: ${result.probability != null ? (result.probability * 100).toFixed(1) + '%' : 'N/A'}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Risk Due to Bad Habits: ${result.bad_habits_percentage != null ? result.bad_habits_percentage.toFixed(1) + '%' : 'N/A'}`, 20, yPosition);
        yPosition += 8;
        doc.text(`MMSE Score: ${testData.mmse_score || 'N/A'}/30`, 20, yPosition);
        yPosition += 20;

        // Questionnaire Answers Section
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('QUESTIONNAIRE ANSWERS', 20, yPosition);
        yPosition += 15;

        // Demographic Information
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('DEMOGRAPHIC INFORMATION', 20, yPosition);
        yPosition += 12;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Age: ${answers.age || 'N/A'}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Gender: ${answers.gender || 'N/A'}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Ethnicity: ${answers.ethnicity || 'N/A'}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Education Level: ${answers.education_level || 'N/A'}`, 20, yPosition);
        yPosition += 8;
        doc.text(`BMI: ${answers.bmi ? answers.bmi.toFixed(1) : 'N/A'}`, 20, yPosition);
        yPosition += 20;

        // Check if we need a new page
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 30;
        }

        // Lifestyle Factors
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('LIFESTYLE FACTORS', 20, yPosition);
        yPosition += 12;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Smoking: ${answers.smoking ? 'Yes' : 'No'}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Alcohol Consumption: ${answers.alcohol_consumption || 'N/A'} drinks per week`, 20, yPosition);
        yPosition += 8;
        doc.text(`Physical Activity: ${answers.physical_activity || 'N/A'} hours per week`, 20, yPosition);
        yPosition += 8;
        doc.text(`Diet Quality: ${answers.diet_quality || 'N/A'}/10`, 20, yPosition);
        yPosition += 8;
        doc.text(`Sleep Quality: ${answers.sleep_quality || 'N/A'}/10`, 20, yPosition);
        yPosition += 20;

        // Check if we need a new page
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 30;
        }

        // Medical History
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('MEDICAL HISTORY', 20, yPosition);
        yPosition += 12;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Family History of Alzheimer's: ${answers.family_history_alzheimers ? 'Yes' : 'No'}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Cardiovascular Disease: ${answers.cardiovascular_disease ? 'Yes' : 'No'}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Diabetes: ${answers.diabetes ? 'Yes' : 'No'}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Depression: ${answers.depression ? 'Yes' : 'No'}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Head Injury: ${answers.head_injury ? 'Yes' : 'No'}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Hypertension: ${answers.hypertension ? 'Yes' : 'No'}`, 20, yPosition);
        yPosition += 20;

        // Check if we need a new page
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 30;
        }

        // Cognitive Assessment
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('COGNITIVE ASSESSMENT', 20, yPosition);
        yPosition += 12;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`MMSE Score: ${testData.mmse_score || 'N/A'}/30`, 20, yPosition);
        yPosition += 8;
        doc.text(`Memory Complaints: ${answers.memory_complaints ? 'Yes' : 'No'}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Behavioral Problems: ${answers.behavioral_problems ? 'Yes' : 'No'}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Confusion: ${answers.confusion ? 'Yes' : 'No'}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Disorientation: ${answers.disorientation ? 'Yes' : 'No'}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Personality Changes: ${answers.personality_changes ? 'Yes' : 'No'}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Difficulty Completing Tasks: ${answers.difficulty_completing_tasks ? 'Yes' : 'No'}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Forgetfulness: ${answers.forgetfulness || 'N/A'}`, 20, yPosition);
        yPosition += 20;

        // Check if we need a new page
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 30;
        }

        // Analysis & Recommendations
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('ANALYSIS & RECOMMENDATIONS', 20, yPosition);
        yPosition += 15;

        // Risk-specific analysis
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);

        if (result.risk_level === 'High Risk') {
            doc.setFont('helvetica', 'bold');
            doc.text('HIGH RISK DETECTED', 20, yPosition);
            yPosition += 10;
            doc.setFont('helvetica', 'normal');
            const highRiskText = doc.splitTextToSize('Your assessment indicates a high risk for Alzheimer\'s disease. This assessment is based on your responses and should not be considered a medical diagnosis.', 170);
            doc.text(highRiskText, 20, yPosition);
            yPosition += highRiskText.length * 5 + 10;

            doc.setFont('helvetica', 'bold');
            doc.text('GOOD POINTS:', 20, yPosition);
            yPosition += 8;
            doc.setFont('helvetica', 'normal');
            doc.text('• You have taken a proactive step by completing this assessment', 25, yPosition);
            yPosition += 6;
            doc.text('• Early awareness can lead to timely interventions', 25, yPosition);
            yPosition += 6;
            doc.text('• Many risk factors are modifiable with lifestyle changes', 25, yPosition);
            yPosition += 15;

            doc.setFont('helvetica', 'bold');
            doc.text('AREAS FOR IMPROVEMENT:', 20, yPosition);
            yPosition += 8;
            doc.setFont('helvetica', 'normal');
            doc.text('• Consider consulting a healthcare professional immediately', 25, yPosition);
            yPosition += 6;
            doc.text('• Address any modifiable risk factors identified above', 25, yPosition);
            yPosition += 6;
            doc.text('• Maintain regular health monitoring and follow-up assessments', 25, yPosition);
            yPosition += 15;
        } else if (result.risk_level === 'Low Risk') {
            doc.setFont('helvetica', 'bold');
            doc.text('LOW RISK DETECTED', 20, yPosition);
            yPosition += 10;
            doc.setFont('helvetica', 'normal');
            const lowRiskText = doc.splitTextToSize('Your assessment indicates a low risk for Alzheimer\'s disease based on your current responses.', 170);
            doc.text(lowRiskText, 20, yPosition);
            yPosition += lowRiskText.length * 5 + 10;

            doc.setFont('helvetica', 'bold');
            doc.text('GOOD POINTS:', 20, yPosition);
            yPosition += 8;
            doc.setFont('helvetica', 'normal');
            doc.text('• Your current lifestyle and health factors show positive indicators', 25, yPosition);
            yPosition += 6;
            doc.text('• Regular monitoring and healthy habits are being maintained', 25, yPosition);
            yPosition += 6;
            doc.text('• Proactive health management is evident', 25, yPosition);
            yPosition += 15;

            doc.setFont('helvetica', 'bold');
            doc.text('AREAS FOR IMPROVEMENT:', 20, yPosition);
            yPosition += 8;
            doc.setFont('helvetica', 'normal');
            doc.text('• Continue maintaining healthy lifestyle habits', 25, yPosition);
            yPosition += 6;
            doc.text('• Schedule regular health check-ups', 25, yPosition);
            yPosition += 6;
            doc.text('• Consider periodic reassessment to monitor changes', 25, yPosition);
            yPosition += 15;
        } else {
            doc.setFont('helvetica', 'bold');
            doc.text('NO SIGNIFICANT RISK DETECTED', 20, yPosition);
            yPosition += 10;
            doc.setFont('helvetica', 'normal');
            const noRiskText = doc.splitTextToSize('Your assessment indicates no significant risk for Alzheimer\'s disease based on your responses.', 170);
            doc.text(noRiskText, 20, yPosition);
            yPosition += noRiskText.length * 5 + 10;

            doc.setFont('helvetica', 'bold');
            doc.text('GOOD POINTS:', 20, yPosition);
            yPosition += 8;
            doc.setFont('helvetica', 'normal');
            doc.text('• Excellent lifestyle and health factor management', 25, yPosition);
            yPosition += 6;
            doc.text('• Strong preventive health practices', 25, yPosition);
            yPosition += 6;
            doc.text('• Low-risk profile across assessed categories', 25, yPosition);
            yPosition += 15;

            doc.setFont('helvetica', 'bold');
            doc.text('AREAS FOR IMPROVEMENT:', 20, yPosition);
            yPosition += 8;
            doc.setFont('helvetica', 'normal');
            doc.text('• Maintain current healthy habits', 25, yPosition);
            yPosition += 6;
            doc.text('• Continue regular health monitoring', 25, yPosition);
            yPosition += 6;
            doc.text('• Stay informed about cognitive health', 25, yPosition);
            yPosition += 15;
        }

        // Check if we need a new page
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 30;
        }

        // Key Factors to Focus On
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('KEY FACTORS TO FOCUS ON', 20, yPosition);
        yPosition += 15;

        let hasLifestyleFactors = false;
        let hasMedicalFactors = false;
        let hasCognitiveFactors = false;

        // Check if we have any lifestyle factors
        if (answers.physical_activity < 3 || answers.diet_quality < 5 || answers.sleep_quality < 5 ||
            answers.alcohol_consumption > 14 || answers.smoking) {
            hasLifestyleFactors = true;
        }

        // Check if we have any medical factors
        if (answers.cardiovascular_disease || answers.diabetes || answers.hypertension ||
            answers.depression || answers.head_injury) {
            hasMedicalFactors = true;
        }

        // Check if we have any cognitive factors
        if ((answers.memory_complaints || answers.behavioral_problems || answers.confusion ||
             answers.disorientation || answers.personality_changes || answers.difficulty_completing_tasks) ||
            testData.mmse_score < 24 || answers.family_history_alzheimers ||
            (answers.education_level === "No formal" || answers.education_level === "Primary")) {
            hasCognitiveFactors = true;
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);

        if (hasLifestyleFactors) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('LIFESTYLE FACTORS', 20, yPosition);
            yPosition += 12;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);

            if (answers.smoking) {
                doc.text('• Smoking Cessation: Quit smoking - smoking significantly increases Alzheimer\'s risk', 25, yPosition);
                yPosition += 8;
            }
            if (answers.physical_activity < 3) {
                doc.text('• Physical Activity: Increase physical activity to at least 3 hours per week', 25, yPosition);
                yPosition += 8;
            }
            if (answers.diet_quality < 5) {
                doc.text('• Diet Quality: Improve diet quality with Mediterranean-style eating', 25, yPosition);
                yPosition += 8;
            }
            if (answers.sleep_quality < 5) {
                doc.text('• Sleep Quality: Aim for 7-9 hours of quality sleep per night', 25, yPosition);
                yPosition += 8;
            }
            if (answers.alcohol_consumption > 14) {
                doc.text('• Alcohol Consumption: Reduce alcohol intake to no more than 1 drink per day', 25, yPosition);
                yPosition += 8;
            }
            yPosition += 10;
        }

        // Check if we need a new page
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 30;
        }

        if (hasMedicalFactors) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('MEDICAL FACTORS', 20, yPosition);
            yPosition += 12;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);

            if (answers.cardiovascular_disease) {
                doc.text('• Cardiovascular Health: Continue managing cardiovascular disease - heart health is closely linked to brain health', 25, yPosition);
                yPosition += 8;
            }
            if (answers.diabetes) {
                doc.text('• Diabetes Management: Maintain good blood sugar control - diabetes increases Alzheimer\'s risk', 25, yPosition);
                yPosition += 8;
            }
            if (answers.hypertension) {
                doc.text('• Hypertension Control: Keep blood pressure under control - high blood pressure affects brain health', 25, yPosition);
                yPosition += 8;
            }
            if (answers.depression) {
                doc.text('• Mental Health: Continue managing depression - mental health treatment can improve cognitive outcomes', 25, yPosition);
                yPosition += 8;
            }
            if (answers.head_injury) {
                doc.text('• Head Injury Monitoring: Monitor for any new symptoms - previous head injuries can increase Alzheimer\'s risk', 25, yPosition);
                yPosition += 8;
            }
            yPosition += 10;
        }

        // Check if we need a new page
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 30;
        }

        if (hasCognitiveFactors) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('COGNITIVE FACTORS', 20, yPosition);
            yPosition += 12;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);

            if (answers.memory_complaints || answers.behavioral_problems || answers.confusion ||
                answers.disorientation || answers.personality_changes || answers.difficulty_completing_tasks) {
                doc.text('• Cognitive Symptoms: Monitor cognitive symptoms closely and discuss with healthcare provider', 25, yPosition);
                yPosition += 8;
            }
            if (testData.mmse_score < 24) {
                doc.text('• MMSE Score: Low MMSE score suggests need for professional cognitive evaluation', 25, yPosition);
                yPosition += 8;
            }
            if (answers.family_history_alzheimers) {
                doc.text('• Family History: Family history increases risk - regular monitoring and early intervention are important', 25, yPosition);
                yPosition += 8;
            }
            if (answers.education_level === "No formal" || answers.education_level === "Primary") {
                doc.text('• Cognitive Reserve: Consider cognitive exercises and learning new skills to build cognitive reserve', 25, yPosition);
                yPosition += 8;
            }
            yPosition += 10;
        }

        if (!hasLifestyleFactors && !hasMedicalFactors && !hasCognitiveFactors) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('EXCELLENT PROFILE!', 20, yPosition);
            yPosition += 12;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            const excellentText = doc.splitTextToSize('Your responses indicate excellent health practices across all categories! Continue maintaining your healthy lifestyle to support cognitive well-being.', 170);
            doc.text(excellentText, 20, yPosition);
            yPosition += excellentText.length * 5 + 10;
        }

        // Check if we need a new page
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 30;
        }

        // Disclaimer
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('IMPORTANT DISCLAIMER', 20, yPosition);
        yPosition += 15;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const disclaimerText = doc.splitTextToSize('This report is generated for informational purposes only and should not replace professional medical advice. The Clarity assessment provides risk estimation based on established risk factors and your responses. It is not a diagnostic tool and cannot confirm or rule out Alzheimer\'s disease.', 170);
        doc.text(disclaimerText, 20, yPosition);
        yPosition += disclaimerText.length * 4 + 10;

        const disclaimerText2 = doc.splitTextToSize('We strongly recommend: • Consulting a healthcare professional for proper evaluation • Discussing your results with a qualified medical practitioner • Using this information as a starting point for health discussions', 170);
        doc.text(disclaimerText2, 20, yPosition);
        yPosition += disclaimerText2.length * 4 + 10;

        doc.text('For support and resources:', 20, yPosition);
        yPosition += 8;
        doc.text('• Alzheimer\'s and Related Disorders Society of India (ARDSI): 1800-11-6677', 25, yPosition);
        yPosition += 6;
        doc.text('• Indian Council of Medical Research (ICMR): icmr.gov.in', 25, yPosition);
        yPosition += 15;

        // Footer
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.text('Thank you for using Clarity to assess your cognitive health!', 20, yPosition);
        yPosition += 8;
        doc.text('Report generated by Clarity - Alzheimer\'s Risk Assessment Tool', 20, yPosition);

        // Save the PDF
        const fileName = `Clarity_Assessment_Report_${new Date(testData.created_at).toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

    } catch (error) {
        console.error('Error generating PDF report:', error);
        alert('An error occurred while generating the PDF report. Please try again.');
    }
}

function getPersonalizedKeyFactors(answers) {
    const factors = [];

    // Lifestyle Factors
    const lifestyleItems = [];
    if (answers.physical_activity < 3) {
        lifestyleItems.push({
            title: "Physical Activity",
            description: "Increase physical activity to at least 3 hours per week - regular exercise improves brain health and reduces Alzheimer's risk"
        });
    }
    if (answers.diet_quality < 5) {
        lifestyleItems.push({
            title: "Diet Quality",
            description: "Improve diet quality with Mediterranean-style eating rich in fruits, vegetables, and healthy fats"
        });
    }
    if (answers.sleep_quality < 5) {
        lifestyleItems.push({
            title: "Sleep Quality",
            description: "Aim for 7-9 hours of quality sleep per night - poor sleep affects cognitive function"
        });
    }
    if (answers.alcohol_consumption > 14) {
        lifestyleItems.push({
            title: "Alcohol Consumption",
            description: "Reduce alcohol intake to no more than 1 drink per day to protect brain health"
        });
    }
    if (answers.smoking) {
        lifestyleItems.push({
            title: "Smoking Cessation",
            description: "Quit smoking - smoking significantly increases Alzheimer's risk"
        });
    }

    if (lifestyleItems.length > 0) {
        factors.push({
            category: "Lifestyle Factors",
            items: lifestyleItems
        });
    }

    // Medical Factors
    const medicalItems = [];
    if (answers.cardiovascular_disease) {
        medicalItems.push({
            title: "Cardiovascular Health",
            description: "Continue managing cardiovascular disease - heart health is closely linked to brain health"
        });
    }
    if (answers.diabetes) {
        medicalItems.push({
            title: "Diabetes Management",
            description: "Maintain good blood sugar control - diabetes increases Alzheimer's risk"
        });
    }
    if (answers.hypertension) {
        medicalItems.push({
            title: "Hypertension Control",
            description: "Keep blood pressure under control - high blood pressure affects brain health"
        });
    }
    if (answers.depression) {
        medicalItems.push({
            title: "Mental Health",
            description: "Continue managing depression - mental health treatment can improve cognitive outcomes"
        });
    }
    if (answers.head_injury) {
        medicalItems.push({
            title: "Head Injury Monitoring",
            description: "Monitor for any new symptoms - previous head injuries can increase Alzheimer's risk"
        });
    }

    if (medicalItems.length > 0) {
        factors.push({
            category: "Medical Factors",
            items: medicalItems
        });
    }

    // Cognitive Factors
    const cognitiveItems = [];
    if (answers.memory_complaints || answers.behavioral_problems || answers.confusion || answers.disorientation || answers.personality_changes || answers.difficulty_completing_tasks) {
        cognitiveItems.push({
            title: "Cognitive Symptoms",
            description: "Monitor cognitive symptoms closely and discuss with healthcare provider"
        });
    }
    if (answers.mmse_score < 24) {
        cognitiveItems.push({
            title: "MMSE Score",
            description: "Low MMSE score suggests need for professional cognitive evaluation"
        });
    }
    if (answers.family_history_alzheimers) {
        cognitiveItems.push({
            title: "Family History",
            description: "Family history increases risk - regular monitoring and early intervention are important"
        });
    }
    if (answers.education_level === "No formal" || answers.education_level === "Primary") {
        cognitiveItems.push({
            title: "Cognitive Reserve",
            description: "Consider cognitive exercises and learning new skills to build cognitive reserve"
        });
    }

    if (cognitiveItems.length > 0) {
        factors.push({
            category: "Cognitive Factors",
            items: cognitiveItems
        });
    }

    // If no specific factors identified, show general recommendations
    if (factors.length === 0) {
        factors.push({
            category: "General Recommendations",
            items: [
                {
                    title: "Preventive Care",
                    description: "Continue healthy lifestyle habits to maintain cognitive health"
                },
                {
                    title: "Regular Monitoring",
                    description: "Schedule regular check-ups and cognitive assessments"
                }
            ]
        });
    }

    return factors;
}

function calculateAlzheimersProbability(testData) {
    // Simplified probability calculation based on risk factors
    // In a real application, this would use a trained machine learning model
    let riskScore = 0;

    // Age factor (higher age = higher risk)
    if (testData.age > 65) riskScore += 0.2;
    else if (testData.age > 50) riskScore += 0.1;

    // MMSE score (lower score = higher risk)
    if (testData.mmse_score < 24) riskScore += 0.3;
    else if (testData.mmse_score < 27) riskScore += 0.1;

    // Family history
    if (testData.family_history_alzheimers) riskScore += 0.15;

    // Medical conditions
    if (testData.cardiovascular_disease) riskScore += 0.1;
    if (testData.diabetes) riskScore += 0.08;
    if (testData.depression) riskScore += 0.08;
    if (testData.hypertension) riskScore += 0.08;
    if (testData.head_injury) riskScore += 0.1;

    // Lifestyle factors
    if (testData.smoking) riskScore += 0.05;
    if (testData.alcohol_consumption > 14) riskScore += 0.05; // More than 1 drink/day
    if (testData.physical_activity < 3) riskScore += 0.05; // Less than 3 hours/week
    if (testData.diet_quality < 5) riskScore += 0.05; // Poor diet
    if (testData.sleep_quality < 5) riskScore += 0.05; // Poor sleep

    // Cognitive symptoms
    if (testData.memory_complaints) riskScore += 0.15;
    if (testData.behavioral_problems) riskScore += 0.1;
    if (testData.confusion) riskScore += 0.1;

    // Education level (lower education = slightly higher risk)
    if (testData.education_level === "No formal") riskScore += 0.05;

    // Cap the probability at 0.95 and ensure minimum 0.01
    const probability = Math.max(0.01, Math.min(0.95, riskScore));

    return probability;
}

function calculateBadHabitsPercentage(testData) {
    // Calculate percentage of bad habits based on lifestyle factors
    let badHabits = 0;
    let totalHabits = 0;

    // Smoking
    totalHabits++;
    if (testData.smoking) badHabits++;

    // Alcohol consumption (more than 14 drinks/week is considered excessive)
    totalHabits++;
    if (testData.alcohol_consumption > 14) badHabits++;

    // Physical activity (less than 3 hours/week is insufficient)
    totalHabits++;
    if (testData.physical_activity < 3) badHabits++;

    // Diet quality (less than 5 is poor)
    totalHabits++;
    if (testData.diet_quality < 5) badHabits++;

    // Sleep quality (less than 5 is poor)
    totalHabits++;
    if (testData.sleep_quality < 5) badHabits++;

    // Calculate percentage
    const percentage = totalHabits > 0 ? (badHabits / totalHabits) * 100 : 0;
    return Math.round(percentage);
}

export function createQuestionElement(questionData, currentValue, onValueChange) {
    console.log('Creating question element for:', questionData.id, questionData.text);
    const container = document.createElement('div');
    container.className = 'w-full text-center';

    // Add category header if this is the first question in a category
    if (questionData.category) {
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'mb-6 pb-3 border-b-2 border-violet-200';

        const categoryTitle = document.createElement('h2');
        categoryTitle.className = 'text-2xl font-bold text-violet-600 capitalize flex items-center justify-center gap-3';

        // Map categories to attractive names
        const categoryNames = {
            'demographic': 'Demographic Information',
            'lifestyle': 'Lifestyle Factors',
            'medical': 'Medical History',
            'cognitive': 'Cognitive Assessment'
        };

        categoryTitle.textContent = categoryNames[questionData.category] || questionData.category;

        // Add category icon
        const categoryIcons = {
            'demographic': 'user',
            'lifestyle': 'heart',
            'medical': 'stethoscope',
            'cognitive': 'brain'
        };

        const icon = document.createElement('i');
        icon.className = 'w-6 h-6';
        icon.setAttribute('data-lucide', categoryIcons[questionData.category] || 'help-circle');

        categoryTitle.insertBefore(icon, categoryTitle.firstChild);
        categoryHeader.appendChild(categoryTitle);
        container.appendChild(categoryHeader);
    }

    let inputHtml = '';

    switch(questionData.type) {
        case 'slider':
            const value = currentValue !== undefined ? currentValue : null;
            const displayValue = value !== null ? value : '--';
            inputHtml = `
                <div class="w-full max-w-lg mx-auto">
                    <div class="text-center text-4xl font-bold text-violet-600 mb-4" id="slider-value-${questionData.id}">${displayValue}</div>
                    <input type="range" id="${questionData.id}" min="${questionData.min}" max="${questionData.max}" value="${value !== null ? value : questionData.min}" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer">
                </div>
            `;
            // Only set initial value if currentValue exists
            if (value !== null) {
                onValueChange(value);
            }
            setTimeout(() => {
                const slider = document.getElementById(questionData.id);
                const valueLabel = document.getElementById(`slider-value-${questionData.id}`);
                if (slider && valueLabel) {
                    slider.addEventListener('input', (e) => {
                        valueLabel.textContent = e.target.value;
                        onValueChange(e.target.value);
                    });
                }
            }, 0);
            break;

        case 'choice':
            inputHtml = `<div class="grid grid-cols-2 gap-4 mt-8 max-w-lg mx-auto">`;
            questionData.options.forEach(option => {
                const isSelected = currentValue === option;
                inputHtml += `<button data-value="${option}" class="choice-btn text-lg p-4 rounded-lg border-2 ${isSelected ? 'bg-violet-600 text-white border-violet-600 shadow-lg' : 'bg-white text-slate-700 border-slate-300 hover:border-violet-400 hover:bg-violet-50'} transition-all duration-200">${option}</button>`;
            });
            inputHtml += `</div>`;
            // Set initial value if available
            if (currentValue) {
                onValueChange(currentValue);
            }
            setTimeout(() => {
                document.querySelectorAll('.choice-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        // Reset all buttons to unselected state with hover
                        document.querySelectorAll('.choice-btn').forEach(b => {
                            b.classList.remove('bg-violet-600', 'text-white', 'border-violet-600', 'shadow-lg', 'hover:border-violet-400', 'hover:bg-violet-50');
                            b.classList.add('bg-white', 'text-slate-700', 'border-slate-300', 'hover:border-violet-400', 'hover:bg-violet-50');
                        });
                        // Set clicked button to selected state without hover
                        btn.classList.remove('bg-white', 'text-slate-700', 'border-slate-300', 'hover:border-violet-400', 'hover:bg-violet-50');
                        btn.classList.add('bg-violet-600', 'text-white', 'border-violet-600', 'shadow-lg');
                        onValueChange(btn.dataset.value);
                    });
                });
            }, 0);
            break;

        case 'boolean':
             inputHtml = `<div class="flex justify-center gap-4 mt-8">
                <button data-value="Yes" class="choice-btn flex items-center gap-2 text-lg p-4 px-8 rounded-lg border-2 ${currentValue === 'Yes' ? 'bg-violet-600 text-white border-violet-600 shadow-lg' : 'bg-white text-slate-700 border-slate-300 hover:border-violet-400 hover:bg-violet-50'} transition-all duration-200">
                    <i data-lucide="thumbs-up"></i> Yes
                </button>
                <button data-value="No" class="choice-btn flex items-center gap-2 text-lg p-4 px-8 rounded-lg border-2 ${currentValue === 'No' ? 'bg-violet-600 text-white border-violet-600 shadow-lg' : 'bg-white text-slate-700 border-slate-300 hover:border-violet-400 hover:bg-violet-50'} transition-all duration-200">
                    <i data-lucide="thumbs-down"></i> No
                </button>
             </div>`;
             // Set initial value if available
             if (currentValue) {
                 onValueChange(currentValue);
             }
             setTimeout(() => {
                document.querySelectorAll('.choice-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        // Reset all buttons to unselected state with hover
                        document.querySelectorAll('.choice-btn').forEach(b => {
                            b.classList.remove('bg-violet-600', 'text-white', 'border-violet-600', 'shadow-lg', 'hover:border-violet-400', 'hover:bg-violet-50');
                            b.classList.add('bg-white', 'text-slate-700', 'border-slate-300', 'hover:border-violet-400', 'hover:bg-violet-50');
                        });
                        // Set clicked button to selected state without hover
                        btn.classList.remove('bg-white', 'text-slate-700', 'border-slate-300', 'hover:border-violet-400', 'hover:bg-violet-50');
                        btn.classList.add('bg-violet-600', 'text-white', 'border-violet-600', 'shadow-lg');
                        onValueChange(btn.dataset.value);
                    });
                });
            }, 0);
            break;

        case 'bmi':
            const height = currentValue ? currentValue.height : '';
            const weight = currentValue ? currentValue.weight : '';
            const bmiValue = height && weight ? (weight / ((height / 100) ** 2)).toFixed(1) : '';
            let category = '';
            let suggestion = '';
            if (bmiValue) {
                const bmiNum = parseFloat(bmiValue);
                if (bmiNum < 18.5) {
                    category = 'Underweight';
                    suggestion = 'Consider consulting a healthcare provider for nutritional advice and consider increasing calorie intake with nutrient-rich foods.';
                } else if (bmiNum < 25) {
                    category = 'Normal';
                    suggestion = 'Great! Maintain a balanced diet and regular physical activity to keep your BMI in the healthy range.';
                } else if (bmiNum < 30) {
                    category = 'Overweight';
                    suggestion = 'Consider incorporating more physical activity and a balanced diet to help manage your weight.';
                } else {
                    category = 'Obese';
                    suggestion = 'Consult a healthcare provider for personalized weight management advice and consider lifestyle changes for better health.';
                }
            }
            inputHtml = `
                <div class="w-full max-w-lg mx-auto space-y-6">
                    <div class="text-center">
                        <div class="text-4xl font-bold text-violet-600 mb-2" id="bmi-value-${questionData.id}">${bmiValue || '--'}</div>
                        <p class="text-sm text-slate-500">BMI</p>
                        <p class="text-lg font-semibold text-slate-700 mt-2" id="bmi-category-${questionData.id}">${category}</p>
                        <p class="text-sm text-slate-600 mt-2 max-w-sm mx-auto" id="bmi-suggestion-${questionData.id}">${suggestion}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">Height (cm)</label>
                            <input type="number" id="height-${questionData.id}" value="${height}" min="50" max="250" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition" placeholder="e.g. 170">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">Weight (kg)</label>
                            <input type="number" id="weight-${questionData.id}" value="${weight}" min="20" max="300" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition" placeholder="e.g. 70">
                        </div>
                    </div>
                </div>
            `;
            setTimeout(() => {
                const heightInput = document.getElementById(`height-${questionData.id}`);
                const weightInput = document.getElementById(`weight-${questionData.id}`);
                const bmiLabel = document.getElementById(`bmi-value-${questionData.id}`);
                const categoryLabel = document.getElementById(`bmi-category-${questionData.id}`);
                const suggestionLabel = document.getElementById(`bmi-suggestion-${questionData.id}`);

                const calculateBMI = () => {
                    const h = parseFloat(heightInput.value);
                    const w = parseFloat(weightInput.value);
                    if (h && w && h > 0) {
                        const bmi = (w / ((h / 100) ** 2)).toFixed(1);
                        bmiLabel.textContent = bmi;
                        const bmiNum = parseFloat(bmi);
                        let cat = '';
                        let sugg = '';
                        if (bmiNum < 18.5) {
                            cat = 'Underweight';
                            sugg = 'Consider consulting a healthcare provider for nutritional advice and consider increasing calorie intake with nutrient-rich foods.';
                        } else if (bmiNum < 25) {
                            cat = 'Normal';
                            sugg = 'Great! Maintain a balanced diet and regular physical activity to keep your BMI in the healthy range.';
                        } else if (bmiNum < 30) {
                            cat = 'Overweight';
                            sugg = 'Consider incorporating more physical activity and a balanced diet to help manage your weight.';
                        } else {
                            cat = 'Obese';
                            sugg = 'Consult a healthcare provider for personalized weight management advice and consider lifestyle changes for better health.';
                        }
                        categoryLabel.textContent = cat;
                        suggestionLabel.textContent = sugg;
                        onValueChange({ height: h, weight: w, bmi: parseFloat(bmi) });
                    } else {
                        bmiLabel.textContent = '--';
                        categoryLabel.textContent = '';
                        suggestionLabel.textContent = '';
                        onValueChange(null);
                    }
                };

                heightInput.addEventListener('input', calculateBMI);
                weightInput.addEventListener('input', calculateBMI);

                // Set initial value if available
                if (height && weight) {
                    calculateBMI();
                } else if (currentValue) {
                    onValueChange(currentValue);
                }
            }, 0);
            break;
    }

    container.innerHTML = `
        <h2 class="text-3xl font-bold mb-4">${questionData.text}</h2>
        ${questionData.note ? `<p class="text-sm text-slate-500 mb-6">${questionData.note}</p>`: ''}
        ${inputHtml}
    `;
    console.log('Question element created:', container);
    return container;
}


export function createChatbot() {
    const chatbotToggle = document.createElement('button');
    chatbotToggle.id = 'chatbot-toggle';
    chatbotToggle.className = 'fixed bottom-6 right-6 w-20 h-20 bg-violet-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-violet-700 transition-transform hover:scale-110 z-50';
    chatbotToggle.innerHTML = `<i data-lucide="bot" class="w-8 h-8"></i>`;

    const chatWindow = document.createElement('div');
    chatWindow.id = 'chat-window';
    chatWindow.className = 'hidden fixed bottom-28 right-6 w-[calc(100%-3rem)] max-w-sm h-[70vh] max-h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden';
    
    chatWindow.innerHTML = `
        <div class="p-4 bg-violet-600 text-white flex items-center gap-3">
            <i data-lucide="bot" class="w-6 h-6"></i>
            <h3 class="font-semibold text-lg">Clarity Assistant</h3>
        </div>
        <div id="chat-body" class="flex-grow p-4 overflow-y-auto space-y-4">
            <!-- Messages here -->
        </div>
        <div class="p-4 border-t border-slate-200 flex gap-2">
            <input type="text" id="chat-input" placeholder="Ask a question..." class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition">
            <button id="chat-send" class="p-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-slate-400 transition-colors">
                <i data-lucide="send" class="w-5 h-5"></i>
            </button>
        </div>
    `;

    return {
        chatbotToggle,
        chatWindow,
        chatBody: chatWindow.querySelector('#chat-body'),
        chatInput: chatWindow.querySelector('#chat-input'),
        sendButton: chatWindow.querySelector('#chat-send'),
    };
}


export function createChatMessage(text, isUser) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex items-end gap-2 chatbot-bubble ${isUser ? 'justify-end' : ''}`;

    const bubbleClass = isUser
        ? 'bg-violet-600 text-white'
        : 'bg-slate-200 text-slate-800';

    const messageContent = `
        ${!isUser ? `<div class="w-10 h-10 flex-shrink-0 bg-slate-200 rounded-full flex items-center justify-center"><i data-lucide="bot" class="w-6 h-6 text-slate-500"></i></div>` : ''}
        <div class="max-w-[80%] p-3 rounded-lg ${bubbleClass}">
            <p>${text}</p>
        </div>
    `;

    wrapper.innerHTML = messageContent;

    setTimeout(() => lucide.createIcons(), 0);
    return wrapper;
}





export function createMiniGameCard(gameType, onPlay, bestData = null) {
    const gameData = {
        memory_match: { icon: 'brain', title: 'Memory Match', description: 'Match pairs of cards to test memory' },
        sequence_recall: { icon: 'list-ordered', title: 'Sequence Recall', description: 'Remember and repeat number sequences' },
        pattern_recognition: { icon: 'grid-3x3', title: 'Pattern Recognition', description: 'Identify and complete patterns' },
        sliding_puzzle: { icon: 'puzzle', title: 'Sliding Puzzle', description: 'Arrange tiles in numerical order' },
        memory_run_doors: { icon: 'door-open', title: 'Memory Run Doors', description: 'Memorize sequences and choose doors' }
    };

    const data = gameData[gameType] || { icon: 'gamepad-2', title: 'Brain Game', description: 'Challenge your cognitive skills' };

    const card = document.createElement('div');
    card.className = 'bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer';

    let bestScoreHtml = `
        <div class="flex items-center gap-2 mb-2">
            <i data-lucide="trophy" class="w-4 h-4 text-yellow-500"></i>
            <span class="text-sm font-medium text-slate-600">Best: --</span>
        </div>
    `;

    if (bestData && bestData.score !== null && bestData.score !== undefined) {
        const scoreText = bestData.score.toString();
        const timeText = bestData.time ? `${bestData.time}s` : '';
        const displayText = timeText ? `${scoreText} (${timeText})` : scoreText;

        bestScoreHtml = `
            <div class="flex items-center gap-2 mb-2">
                <i data-lucide="trophy" class="w-4 h-4 text-yellow-500"></i>
                <span class="text-sm font-medium text-slate-600">Best: ${displayText}</span>
            </div>
        `;
    } else if (bestData && bestData.time !== null && bestData.time !== undefined) {
        // For time-based games where score might not be the primary metric
        const timeText = `${bestData.time}s`;
        bestScoreHtml = `
            <div class="flex items-center gap-2 mb-2">
                <i data-lucide="trophy" class="w-4 h-4 text-yellow-500"></i>
                <span class="text-sm font-medium text-slate-600">Best: ${timeText}</span>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                <i data-lucide="${data.icon}" class="w-5 h-5 text-violet-600"></i>
            </div>
            <h3 class="font-semibold text-slate-800">${data.title}</h3>
        </div>
        ${bestScoreHtml}
        <p class="text-sm text-slate-500 mb-4">${data.description}</p>
        <button class="w-full px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center gap-2">
            <i data-lucide="play" class="w-4 h-4"></i>
            Play Game
        </button>
    `;

    card.addEventListener('click', () => onPlay(gameType));
    setTimeout(() => lucide.createIcons(), 0);
    return card;
}

export function createGamePerformanceCard(gameType, bestData = null, recentGames = []) {
    const gameData = {
        memory_match: { icon: 'brain', title: 'Memory Match', color: 'violet' },
        sequence_recall: { icon: 'list-ordered', title: 'Sequence Recall', color: 'violet' },
        pattern_recognition: { icon: 'grid-3x3', title: 'Pattern Recognition', color: 'violet' },
        sliding_puzzle: { icon: 'puzzle', title: 'Sliding Puzzle', color: 'violet' },
        memory_run_doors: { icon: 'door-open', title: 'Memory Run Doors', color: 'violet' }
    };

    const data = gameData[gameType] || { icon: 'gamepad-2', title: 'Brain Game', color: 'violet' };

    const card = document.createElement('div');
    card.className = 'bg-white p-6 rounded-xl shadow-sm';

    let bestScoreHtml = '';
    let recentScoresHtml = '';

    if (bestData && bestData.score !== null && bestData.score !== undefined) {
        const scoreText = bestData.score.toString();
        const timeText = bestData.time ? `${bestData.time}s` : '';
        const displayText = timeText ? `${scoreText} (${timeText})` : scoreText;

        bestScoreHtml = `
            <div class="flex items-center gap-2 mb-4">
                <i data-lucide="trophy" class="w-5 h-5 text-yellow-500"></i>
                <div>
                    <div class="text-sm text-slate-500">Best Score</div>
                    <div class="font-bold text-slate-800">${displayText}</div>
                </div>
            </div>
        `;
    } else if (bestData && bestData.time !== null && bestData.time !== undefined) {
        // For time-based games where time is the primary metric
        const timeText = `${bestData.time}s`;
        bestScoreHtml = `
            <div class="flex items-center gap-2 mb-4">
                <i data-lucide="trophy" class="w-5 h-5 text-yellow-500"></i>
                <div>
                    <div class="text-sm text-slate-500">Best Time</div>
                    <div class="font-bold text-slate-800">${timeText}</div>
                </div>
            </div>
        `;
    }

    if (recentGames && recentGames.length > 0) {
        const recentScores = recentGames.slice(0, 5).map(game => game.score).join(', ');
        recentScoresHtml = `
            <div class="mb-4">
                <div class="text-sm text-slate-500 mb-1">Recent Scores</div>
                <div class="text-sm text-slate-700">${recentScores}</div>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-${data.color}-100 flex items-center justify-center">
                <i data-lucide="${data.icon}" class="w-5 h-5 text-${data.color}-600"></i>
            </div>
            <h3 class="font-semibold text-slate-800">${data.title}</h3>
        </div>
        ${bestScoreHtml}
        ${recentScoresHtml}
        <div class="text-xs text-slate-400">
            Track your progress over time
        </div>
    `;

    setTimeout(() => lucide.createIcons(), 0);
    return card;
}
