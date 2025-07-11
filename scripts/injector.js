/**
 * Smart Driving Test Manual Helper
 * Handles duplicate questions, highlights correct answers
 * Manual processing only - no auto-detection
 */

(function() {
    'use strict';
    
    // Check if extension is already running
    if (window.drivingTestHelper) {
        console.log('🔄 Driving Test Helper already running - cleaning up previous instance...');
        window.drivingTestHelper.cleanup();
    }

    // Load questions database from JSON file
    async function loadQuestions() {
        try {
            const response = await fetch(chrome.runtime.getURL('questions.json'));
            const questions = await response.json();
            console.log(`✅ Loaded ${questions.length} questions from database`);
            return questions;
        } catch (error) {
            console.error('❌ Failed to load questions:', error);
            return [];
        }
    }

    // Enhanced text normalization for better matching
    function normalizeText(text) {
        if (!text) return '';
        return text
            .trim()
            .toLowerCase()
            .replace(/["""''„"]/g, '"')     // Normalize quotes
            .replace(/[–—]/g, '-')          // Normalize dashes  
            .replace(/\s+/g, ' ')           // Normalize whitespace
            .replace(/[^\w\s\-\."]/g, '')   // Remove most punctuation but keep essential chars
            .trim();
    }

    // Find element containing specific text
    function findElementByText(textMatcher) {
        const selectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'td', 'th', 'li'];
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
                const text = el.innerText || el.textContent || '';
                if (textMatcher(text)) {
                    return el;
                }
            }
        }
        return null;
    }

    // Find all clickable elements (buttons, links, divs with click handlers)
    function findAllClickableElements() {
        const clickableElements = [];
        
        // Find all potentially clickable elements
        const selectors = ['button', 'a', 'div[onclick]', 'span[onclick]', 'div[role="button"]', 'span[role="button"]', 'li', 'td'];
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
                const text = el.innerText || el.textContent || '';
                if (text.trim().length > 0) {
                    clickableElements.push({
                        element: el,
                        rawText: text,
                        normalizedText: normalizeText(text),
                        tagName: el.tagName.toLowerCase(),
                        className: el.className,
                        id: el.id || 'no-id'
                    });
                }
            }
        }
        
        return clickableElements;
    }

    // Show subtle indicator on correct answer element
    function showCorrectAnswerIndicator(element, answerText) {
        console.log(`✨ Showing indicator for correct answer: "${answerText}"`);
        
        // Create indicator element
        const indicator = document.createElement('div');
        indicator.className = 'driving-helper-indicator';
        indicator.innerHTML = '✅';
        
        // Style the indicator
        indicator.style.cssText = `
            position: absolute;
            top: -4px;
            right: -4px;
            width: 14px;
            height: 14px;
            background: #10b981;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            font-weight: bold;
            box-shadow: 0 1px 4px rgba(16, 185, 129, 0.4);
            z-index: 10000;
            animation: drivingHelperPulse 0.3s ease-out;
            pointer-events: none;
        `;
        
        // Add pulse animation
        if (!document.getElementById('driving-helper-styles')) {
            const style = document.createElement('style');
            style.id = 'driving-helper-styles';
            style.textContent = `
                @keyframes drivingHelperPulse {
                    0% { transform: scale(0) rotate(0deg); opacity: 0; }
                    50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
                    100% { transform: scale(1) rotate(360deg); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Ensure parent has relative positioning for absolute positioning to work
        const originalPosition = element.style.position;
        if (!originalPosition || originalPosition === 'static') {
            element.style.position = 'relative';
        }
        
        // Add indicator to button
        element.appendChild(indicator);
        
        console.log(`🎉 Indicator shown! Element: [${element.tagName}] "${answerText}"`);
        
        // Remove indicator after 0.5 seconds
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
                
                // Restore original position if we changed it
                if (!originalPosition || originalPosition === 'static') {
                    element.style.position = originalPosition;
                }
                
                console.log(`✨ Indicator removed from: "${answerText}"`);
            }
        }, 500);
    }

    // Smart question matching: handles duplicate questions by comparing answer sets
    function findMatchingQuestion(questions, questionText, pageAnswers) {
        // Find all questions with matching text
        const matchingQuestions = questions.filter(q => normalizeText(q.question) === questionText);
        
        console.log(`🔍 Found ${matchingQuestions.length} questions with matching text`);
        
        if (matchingQuestions.length === 0) {
            return null;
        }
        
        if (matchingQuestions.length === 1) {
            console.log(`✅ Single question match - using it directly`);
            return matchingQuestions[0];
        }
        
        // Multiple matches - need to find the BEST match, not just first acceptable
        console.log(`🔍 Multiple question matches found - finding best match...`);
        
        const pageAnswerTexts = pageAnswers.map(item => item.normalizedText);
        console.log(`📝 Page answer options (${pageAnswerTexts.length}): [${pageAnswerTexts.join(', ')}]`);
        
        let bestMatch = null;
        let highestScore = 0;
        let bestPercentage = 0;
        
        for (let i = 0; i < matchingQuestions.length; i++) {
            const question = matchingQuestions[i];
            const jsonAnswers = Object.values(question.answers).map(normalizeText);
            
            console.log(`📋 Question ${i + 1} answers (${jsonAnswers.length}): [${jsonAnswers.join(', ')}]`);
            
            // Count how many JSON answers match page answers
            const matchingAnswers = jsonAnswers.filter(jsonAnswer => 
                pageAnswerTexts.some(pageAnswer => pageAnswer === jsonAnswer)
            );
            
            const matchScore = matchingAnswers.length;
            const matchPercentage = matchScore / jsonAnswers.length;
            
            console.log(`🎯 Question ${i + 1}: ${matchScore}/${jsonAnswers.length} answers match (${(matchPercentage * 100).toFixed(1)}%)`);
            console.log(`🎯 Matching answers: [${matchingAnswers.join(', ')}]`);
            
            // Check if this is better than our current best match
            if (matchScore > highestScore && (matchScore >= 2 || matchPercentage >= 0.6)) {
                highestScore = matchScore;
                bestPercentage = matchPercentage;
                bestMatch = question;
                console.log(`🏆 New best match: Question ${i + 1} with ${matchScore} matches (${(matchPercentage * 100).toFixed(1)}%)`);
            }
        }
        
        if (bestMatch) {
            console.log(`✅ Final best match: ${highestScore} matching answers (${(bestPercentage * 100).toFixed(1)}%)`);
            return bestMatch;
        }
        
        console.log(`❌ No question found with sufficient matching answer set (need ≥2 matches or ≥60%)`);
        return null;
    }

    // Manual processing function
    async function processManual() {
        try {
            console.log('🎯 Starting manual question processing...');
            
            const questions = await loadQuestions();
            if (questions.length === 0) {
                console.log('❌ No questions loaded, stopping.');
                return;
            }

            // Find question text on the page - look for text ending with '?' or ':'
            const questionElement = findElementByText((text) => {
                const trimmed = text.trim();
                return trimmed.length >= 20 && (trimmed.endsWith('?') || trimmed.endsWith(':'));
            });

            if (!questionElement) {
                console.log('❌ No question found on page');
                return;
            }

            const questionText = normalizeText(questionElement.textContent);
            const questionPreview = questionText.substring(0, 100);
            console.log(`📝 Found question: "${questionPreview}..."`);

            // Find all clickable elements (potential answers)
            const clickableElements = findAllClickableElements();
            console.log(`🔍 Found ${clickableElements.length} clickable elements on page`);

            // Smart matching: find the right question considering answer sets
            const matchedQuestion = findMatchingQuestion(questions, questionText, clickableElements);
            
            if (!matchedQuestion) {
                console.log('❌ No matching question found in database');
                return;
            }

            console.log(`✅ Found matching question with answer ID: ${matchedQuestion.answer}`);
            
            // Get the correct answer text
            const correctAnswerText = matchedQuestion.answers[matchedQuestion.answer];
            if (!correctAnswerText) {
                console.log(`❌ No answer text found for ID: ${matchedQuestion.answer}`);
                return;
            }

            console.log(`🎯 Looking for answer: "${correctAnswerText}"`);

            // Find the correct answer button
            const normalizedCorrectAnswer = normalizeText(correctAnswerText);
            
            // Look for exact match
            const exactMatch = clickableElements.find(item => item.normalizedText === normalizedCorrectAnswer);
            
            if (exactMatch) {
                console.log(`✅ Found EXACT match:`, exactMatch);
                // Highlight the correct answer
                showCorrectAnswerIndicator(exactMatch.element, exactMatch.rawText);
            } else {
                console.log(`❌ No exact match found for: "${correctAnswerText}"`);
            }

        } catch (error) {
            console.error('❌ Error in processManual:', error);
        }
    }

    // Keyboard shortcut handler - fixed version
    function handleKeyboardShortcut(event) {
        // Ctrl + > for manual processing (Period key + Shift = >)
        if (event.ctrlKey && event.shiftKey && (event.code === 'Period' || event.keyCode === 190 || event.key === '>')) {
            event.preventDefault();
            event.stopPropagation();
            console.log(`⌨️ Keyboard shortcut triggered: Ctrl + >`);
            processManual();
        }
    }

    // Add keyboard shortcut listener
    document.addEventListener('keydown', handleKeyboardShortcut, true);

    // Cleanup function
    function cleanup() {
        console.log('🧹 Cleaning up Driving Test Helper...');
        document.removeEventListener('keydown', handleKeyboardShortcut, true);
        
        // Remove any existing indicators
        const indicators = document.querySelectorAll('.driving-helper-indicator');
        indicators.forEach(indicator => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        });
        
        // Remove styles
        const styles = document.getElementById('driving-helper-styles');
        if (styles) {
            styles.remove();
        }
        
        console.log('✅ Cleanup completed');
    }

    // Create global interface for external control
    window.drivingTestHelper = {
        processManual: processManual,
        cleanup: cleanup
    };

    // Initialize - just load the helper
    console.log(`🔧 Driving Test Helper loaded - manual mode only`);
    console.log(`⌨️ Keyboard shortcut: Ctrl + > for manual processing`);

})();