/**
 * DOM Helper utilities for the driving test extension
 */

// Normalize text for comparison (remove extra whitespace, normalize chars)
function normalizeText(text) {
    if (!text) return '';
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Extract clean filename from full path or URL
function extractFilename(src) {
    if (!src) return '';
    
    // Remove query parameters and anchors
    const cleanSrc = src.split('?')[0].split('#')[0];
    
    // Extract filename from path
    const parts = cleanSrc.split('/');
    return parts[parts.length - 1];
}

// Calculate similarity between two strings using Levenshtein distance
function calculateSimilarity(str1, str2) {
    const s1 = normalizeText(str1);
    const s2 = normalizeText(str2);
    
    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;
    
    const matrix = [];
    
    // Initialize matrix
    for (let i = 0; i <= s2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= s1.length; j++) {
        matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= s2.length; i++) {
        for (let j = 1; j <= s1.length; j++) {
            if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    
    const maxLength = Math.max(s1.length, s2.length);
    return (maxLength - matrix[s2.length][s1.length]) / maxLength;
}

// Find all images on the page
function findImages() {
    const images = [];
    const imgElements = document.querySelectorAll('img');
    
    imgElements.forEach(img => {
        if (img.src) {
            const filename = extractFilename(img.src);
            images.push({
                element: img,
                src: img.src,
                filename: filename,
                alt: img.alt || '',
                title: img.title || ''
            });
        }
    });
    
    return images;
}

// Find text content that might be questions
function findQuestionTexts() {
    const questionTexts = [];
    const selectors = [
        'p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        '.question', '.quiz-question', '[class*="question"]',
        '[class*="quiz"]', '[class*="test"]'
    ];
    
    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            const text = el.innerText || el.textContent;
            if (text && text.length > 10 && text.includes('?')) {
                questionTexts.push({
                    element: el,
                    text: text,
                    normalizedText: normalizeText(text)
                });
            }
        });
    });
    
    return questionTexts;
}

// Find answer buttons/inputs on the page
function findAnswerElements() {
    const answers = [];
    
    // Look for radio buttons, checkboxes, and buttons
    const inputElements = document.querySelectorAll('input[type="radio"], input[type="checkbox"], button, [role="button"]');
    
    inputElements.forEach(el => {
        let answerText = '';
        let answerValue = el.value || '';
        
        // Try to get answer text from various sources
        if (el.innerText) {
            answerText = el.innerText;
        } else if (el.textContent) {
            answerText = el.textContent;
        } else if (el.nextElementSibling && el.nextElementSibling.innerText) {
            answerText = el.nextElementSibling.innerText;
        } else if (el.parentElement && el.parentElement.innerText) {
            answerText = el.parentElement.innerText;
        }
        
        // Look for labels associated with inputs
        if (el.id) {
            const label = document.querySelector(`label[for="${el.id}"]`);
            if (label) {
                answerText = label.innerText || label.textContent;
            }
        }
        
        if (answerText.trim()) {
            answers.push({
                element: el,
                text: answerText.trim(),
                value: answerValue,
                normalizedText: normalizeText(answerText)
            });
        }
    });
    
    return answers;
}

// Click an element safely
function clickElement(element) {
    try {
        // Try multiple click methods
        if (element.click) {
            element.click();
            return true;
        }
        
        // Dispatch click event
        const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(clickEvent);
        return true;
        
    } catch (error) {
        console.error('Error clicking element:', error);
        return false;
    }
}

// Scroll element into view
function scrollToElement(element) {
    try {
        element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    } catch (error) {
        console.error('Error scrolling to element:', error);
    }
}

// Highlight element with visual feedback
function highlightElement(element, duration = 2000) {
    const originalStyle = element.style.cssText;
    
    element.style.cssText += `
        border: 3px solid #ff6b6b !important;
        background-color: rgba(255, 107, 107, 0.1) !important;
        box-shadow: 0 0 10px rgba(255, 107, 107, 0.5) !important;
        transition: all 0.3s ease !important;
    `;
    
    setTimeout(() => {
        element.style.cssText = originalStyle;
    }, duration);
}

// Find element containing specific text
function findElementByText(textMatcher) {
    const selectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'td', 'th', 'li', 'button', 'a'];
    
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

// Find all elements matching text criteria
function findElementsByText(textMatcher) {
    const selectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'td', 'th', 'li', 'button', 'a'];
    const matches = [];
    
    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
            const text = el.innerText || el.textContent || '';
            if (textMatcher(text)) {
                matches.push(el);
            }
        }
    }
    return matches;
}

// Wait for element to appear
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver((mutations) => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, timeout);
    });
} 