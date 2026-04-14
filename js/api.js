import { supabase } from './supabase.js';

// Auth functions are now handled in auth.js directly with Supabase

export async function getTotalTests() {
    const response = await fetch('/api/total-tests');
    if (!response.ok) {
        throw new Error('Failed to fetch total tests data');
    }
    return await response.json();
}

export async function getEarlyDetections() {
    const { count, error } = await supabase
        .from('tests')
        .select('*', { count: 'exact', head: true })
        .eq('risk_level', 'High Risk');

    if (error) throw error;
    return { early_detections: count };
}

export async function getLowRiskCount() {
    const { count, error } = await supabase
        .from('tests')
        .select('*', { count: 'exact', head: true })
        .eq('risk_level', 'Low Risk');

    if (error) throw error;
    return { low_risk_count: count };
}

export async function getNoRiskCount() {
    const { count, error } = await supabase
        .from('tests')
        .select('*', { count: 'exact', head: true })
        .eq('risk_level', 'No Risk');

    if (error) throw error;
    return { no_risk_count: count };
}

export async function getTestHistory() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function retrainModel() {
    try {
        const response = await fetch('/api/retrain-model', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error retraining model:', error);
        throw error;
    }
}

export async function submitTest(testData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Use user-provided MMSE score
    const mmseScore = testData.mmse_score || 25; // default if not provided

    // Calculate probability using the trained ML model via server endpoint
    let probability, riskLevel, result = {};
    try {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        if (response.ok) {
            result = await response.json();
            probability = result.probability;
            riskLevel = result.risk_level;
        } else {
            // Fallback to simplified calculation if ML model fails
            console.warn('ML prediction failed, using fallback calculation');
            probability = calculateAlzheimersProbability(testData);
            if (probability > 0.6) {
                riskLevel = 'High Risk';
            } else if (probability > 0.3) {
                riskLevel = 'Low Risk';
            } else {
                riskLevel = 'No Risk';
            }
        }
    } catch (error) {
        console.error('Error calling ML prediction:', error);
        // Fallback to simplified calculation
        probability = calculateAlzheimersProbability(testData);
        if (probability > 0.6) {
            riskLevel = 'High Risk';
        } else if (probability > 0.3) {
            riskLevel = 'Low Risk';
        } else {
            riskLevel = 'No Risk';
        }
    }

    const insertData = {
        user_id: user.id,
        mmse_score: mmseScore,
        risk_level: riskLevel,
        answers: testData,
        age: testData.age,
        gender: testData.gender,
        ethnicity: testData.ethnicity,
        education_level: testData.education_level,
        smoking: testData.smoking,
        alcohol_consumption: testData.alcohol_consumption,
        physical_activity: testData.physical_activity,
        diet_quality: testData.diet_quality,
        sleep_quality: testData.sleep_quality,
        family_history_alzheimers: testData.family_history_alzheimers,
        cardiovascular_disease: testData.cardiovascular_disease,
        diabetes: testData.diabetes,
        depression: testData.depression,
        head_injury: testData.head_injury,
        hypertension: testData.hypertension,
        memory_complaints: testData.memory_complaints,
        behavioral_problems: testData.behavioral_problems,
        confusion: testData.confusion
    };

    // Only add probability if the column exists (to avoid schema errors)
    try {
        const { data: testColumns } = await supabase
            .from('tests')
            .select('probability')
            .limit(1);
        if (testColumns !== null) {
            insertData.probability = probability;
        }
    } catch (e) {
        // Column doesn't exist, skip probability
    }

    // Calculate bad habits percentage
    const badHabitsPercentage = calculateBadHabitsPercentage(testData);
    // Only add bad_habits_percentage if the column exists
    try {
        const { data: testColumns } = await supabase
            .from('tests')
            .select('bad_habits_percentage')
            .limit(1);
        if (testColumns !== null) {
            insertData.bad_habits_percentage = badHabitsPercentage;
        }
    } catch (e) {
        // Column doesn't exist, skip bad habits percentage
        console.warn('bad_habits_percentage column not found, skipping');
    }

    const { data, error } = await supabase
        .from('tests')
        .insert(insertData)
        .select()
        .single();

    if (error) throw error;



    return data;
}

function calculateMMSEScore(testData) {
    // Simplified MMSE score calculation based on cognitive symptoms
    // MMSE ranges from 0-30, with 30 being perfect cognitive function
    let score = 30; // Start with perfect score

    // Deduct points based on cognitive symptoms and risk factors
    if (testData.memory_complaints) score -= 3;
    if (testData.behavioral_problems) score -= 2;
    if (testData.confusion) score -= 3;
    if (testData.disorientation) score -= 5;
    if (testData.personality_changes) score -= 2;
    if (testData.difficulty_completing_tasks) score -= 3;

    // Age-related cognitive decline
    if (testData.age > 65) score -= 2;
    else if (testData.age > 50) score -= 1;

    // Education level impact
    if (testData.education_level === "No formal") score -= 2;
    else if (testData.education_level === "Primary") score -= 1;

    // Medical conditions affecting cognition
    if (testData.depression) score -= 2;
    if (testData.head_injury) score -= 3;
    if (testData.hypertension) score -= 1;
    if (testData.diabetes) score -= 1;

    // Lifestyle factors
    if (testData.sleep_quality < 5) score -= 1;
    if (testData.diet_quality < 5) score -= 1;
    if (testData.physical_activity < 3) score -= 1;

    // Ensure score stays within 0-30 range
    return Math.max(0, Math.min(30, score));
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





export async function getUserGames() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('user_games')
        .select('*')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(10);

    if (error) throw error;
    return data;
}

export async function getBestScores() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('user_best_scores')
            .select('game_type, best_score, best_time')
            .eq('user_id', user.id);

        if (error) {
            console.warn('Supabase error, falling back to local database:', error);
            return await getBestScoresLocal(user.id);
        }

        // Convert array to object for easier access
        const bestScores = {};
        data.forEach(item => {
            bestScores[item.game_type] = {
                score: item.best_score,
                time: item.best_time
            };
        });

        console.log('getBestScores result:', bestScores);
        return bestScores;
    } catch (error) {
        console.warn('Auth error, falling back to local database:', error);
        return await getBestScoresLocal('anonymous');
    }
}

async function getBestScoresLocal(userId) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('AlzheimersApp', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['userBestScores'], 'readonly');
            const store = transaction.objectStore('userBestScores');
            const index = store.index('user_game');
            const range = IDBKeyRange.only([userId]);

            const results = {};
            const cursorRequest = index.openCursor(range);

            cursorRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const record = cursor.value;
                    results[record.game_type] = {
                        score: record.best_score,
                        time: record.best_time
                    };
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            cursorRequest.onerror = () => reject(cursorRequest.error);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('userBestScores')) {
                const store = db.createObjectStore('userBestScores', { keyPath: 'id', autoIncrement: true });
                store.createIndex('user_game', ['user_id', 'game_type'], { unique: true });
            }
        };
    });
}

export async function submitGameScore(gameType, score, time = null) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // First, get the current best score for this game type
        const bestScores = await getBestScores();
        const currentBest = bestScores[gameType] || { score: 0, time: null };
        const isNewBest = score > currentBest.score || (score === currentBest.score && time !== null && (currentBest.time === null || time < currentBest.time));

        // Insert the game score into user_games
        const { data: gameData, error: gameError } = await supabase
            .from('user_games')
            .insert({
                user_id: user.id,
                game_type: gameType,
                score: score
            })
            .select()
            .single();

        if (gameError) throw gameError;

        // Update or insert the best score in user_best_scores
        const updateData = {
            user_id: user.id,
            game_type: gameType,
            best_score: Math.max(currentBest.score, score),
            updated_at: new Date().toISOString()
        };

        // Only update time if it's provided and represents a better performance
        if (time !== null) {
            const newBestScore = Math.max(currentBest.score, score);
            const shouldUpdateTime = newBestScore > currentBest.score ||
                                    (newBestScore === currentBest.score && (currentBest.time === null || time < currentBest.time));
            if (shouldUpdateTime) {
                updateData.best_time = time;
            } else {
                updateData.best_time = currentBest.time;
            }
        }

        const { data: bestData, error: bestError } = await supabase
            .from('user_best_scores')
            .upsert(updateData, {
                onConflict: 'user_id,game_type'
            })
            .select()
            .single();

        if (bestError) throw bestError;

        // Return the game data along with whether it's a new best and the best score/time
        return { ...gameData, isNewBest, bestScore: bestData.best_score, bestTime: bestData.best_time };
    } catch (error) {
        console.warn('Supabase error, falling back to local storage:', error);
        return await submitGameScoreLocal(gameType, score, time);
    }
}

async function submitGameScoreLocal(gameType, score, time = null) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('AlzheimersApp', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['userBestScores'], 'readwrite');
            const store = transaction.objectStore('userBestScores');
            const index = store.index('user_game');

            // Get current best
            const getRequest = index.get([ 'anonymous', gameType ]);

            getRequest.onsuccess = () => {
                const currentBest = getRequest.result || { score: 0, time: null };
                const isNewBest = score > currentBest.score || (score === currentBest.score && time !== null && (currentBest.time === null || time < currentBest.time));

                // Update best score
                const updateData = {
                    user_id: 'anonymous',
                    game_type: gameType,
                    best_score: Math.max(currentBest.score || 0, score),
                    best_time: time,
                    updated_at: new Date().toISOString()
                };

                if (time !== null) {
                    const newBestScore = Math.max(currentBest.score || 0, score);
                    const shouldUpdateTime = newBestScore > (currentBest.score || 0) ||
                                            (newBestScore === (currentBest.score || 0) && (currentBest.time === null || time < currentBest.time));
                    if (shouldUpdateTime) {
                        updateData.best_time = time;
                    } else {
                        updateData.best_time = currentBest.time;
                    }
                }

                const putRequest = store.put(updateData);
                putRequest.onsuccess = () => {
                    resolve({
                        id: putRequest.result,
                        isNewBest,
                        bestScore: updateData.best_score,
                        bestTime: updateData.best_time
                    });
                };
                putRequest.onerror = () => reject(putRequest.error);
            };

            getRequest.onerror = () => reject(getRequest.error);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('userBestScores')) {
                const store = db.createObjectStore('userBestScores', { keyPath: 'id', autoIncrement: true });
                store.createIndex('user_game', ['user_id', 'game_type'], { unique: true });
            }
        };
    });
}




