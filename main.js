// CyberSafe - Main JavaScript file
// Handles index.html, training.html, and threats.html functionality

// Backend configuration
const BASE_URL = "https://cybersafe-backend-zb49.onrender.com";

// Training page functionality
const TRAINING_KEY = 'cybersafe_training_progress_v1';

function getProgress() {
    try {
        return JSON.parse(localStorage.getItem(TRAINING_KEY)) || { 
            completedModules: [], 
            quizPassed: false, 
            name: '' 
        };
    } catch(e) {
        return { completedModules: [], quizPassed: false, name: '' };
    }
}

function setProgress(next) {
    localStorage.setItem(TRAINING_KEY, JSON.stringify(next));
}

function gradeQuiz() {
    let score = 0;
    if (document.querySelector('input[name="q1"]:checked')?.value === 'b') score++;
    if (document.querySelector('input[name="q2"]:checked')?.value === 'c') score++;
    if (document.querySelector('input[name="q3"]:checked')?.value === 'a') score++;
    
    const total = 3;
    const result = document.getElementById('quiz-result');
    const passed = score === total;
    result.textContent = 'Score: ' + score + ' / ' + total + (passed ? ' • Great job!' : ' • Keep practicing.');
    
    const p = getProgress();
    p.quizPassed = passed;
    setProgress(p);
    updateUIFromProgress();
}

function toggleModuleComplete(moduleId) {
    const p = getProgress();
    const idx = p.completedModules.indexOf(moduleId);
    if (idx === -1) {
        p.completedModules.push(moduleId);
    } else {
        p.completedModules.splice(idx, 1);
    }
    setProgress(p);
    updateUIFromProgress();
}

function computePercent() {
    const totalModules = document.querySelectorAll('[data-module-id]').length;
    const p = getProgress();
    const completed = p.completedModules.length;
    const percent = Math.round((completed / totalModules) * 100);
    return { 
        completed: completed, 
        total: totalModules, 
        percent: isNaN(percent) ? 0 : percent 
    };
}

function updateUIFromProgress() {
    const p = getProgress();
    
    // Module completion flags
    document.querySelectorAll('[data-module-id]').forEach(function(card) {
        const id = card.getAttribute('data-module-id');
        const done = p.completedModules.includes(id);
        const flag = card.querySelector('.completed-flag');
        const btn = card.querySelector('.complete-toggle');
        
        if (flag) flag.style.display = done ? 'inline' : 'none';
        if (btn) btn.textContent = done ? 'Mark Incomplete' : 'Mark Complete';
    });
    
    // Progress bar
    const stats = computePercent();
    const fill = document.querySelector('.progress-fill');
    const label = document.getElementById('progress-label');
    
    if (fill) fill.style.width = stats.percent + '%';
    if (label) label.textContent = 'Modules completed: ' + stats.completed + ' / ' + stats.total + ' (' + stats.percent + '%)';
    
    // Certificate gating
    const gate = document.getElementById('certificate-btn');
    const req = (stats.completed === stats.total) && p.quizPassed;
    if (gate) gate.disabled = !req;
    
    const gateMsg = document.getElementById('certificate-msg');
    if (gateMsg) {
        gateMsg.textContent = req 
            ? 'All requirements met. You can download your certificate.' 
            : 'Complete all modules and pass the quiz to unlock the certificate.';
    }
}

function openCertificate() {
    const name = (document.getElementById('cert-name')?.value || '').trim() || 'CyberSafe Trainee';
    const w = window.open('', '_blank');
    const date = new Date().toLocaleDateString();
    
    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Certificate of Completion</title>
    <style>
        body { display: flex; align-items: center; justify-content: center; height: 100vh; background: #f3f4f6; margin: 0; }
        .card { width: 800px; max-width: 92%; background: #fff; padding: 40px; border: 6px solid #2563eb; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.1); text-align: center; font-family: Segoe UI, Tahoma, Geneva, Verdana, sans-serif; }
        .h { color: #2563eb; margin: 0 0 6px; font-size: 36px; }
        .sub { color: #374151; margin: 0 0 30px; font-weight: 600; }
        .name { font-size: 28px; font-weight: 800; margin: 16px 0; }
        .meta { color: #6b7280; margin-top: 24px; }
        .btn { display: inline-block; margin-top: 20px; padding: 10px 18px; background: #2563eb; color: #fff; border-radius: 6px; text-decoration: none; }
    </style>
</head>
<body>
    <div class="card">
        <div class="h">Certificate of Completion</div>
        <div class="sub">Awarded by CyberSafe</div>
        <div>This certifies that</div>
        <div class="name">${name}</div>
        <div>has successfully completed the CyberSafe Security Training program.</div>
        <div class="meta">Date: ${date}</div>
        <a href="#" class="btn" onclick="window.print();return false;">Print / Save PDF</a>
    </div>
</body>
</html>`;
    
    w.document.write(html);
    w.document.close();
}

// Threat modal functions (threats.html)
function openThreatModal(threatType) {
    const modal = document.getElementById(threatType + '-modal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
    }
}

// AI Detector functionality (ai-detector.html)
function addMessage(message, sender) {
    const chatContainer = document.getElementById('chatContainer');
    if (!chatContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    messageElement.innerText = message;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function displayAnalysis(data) {
    const analysisResultDiv = document.getElementById('analysisResult');
    if (!analysisResultDiv) return;
    
    if (data.safe === undefined) {
        // show raw backend JSON if shape unknown
        analysisResultDiv.textContent = JSON.stringify(data, null, 2);
    } else {
        analysisResultDiv.textContent = data.safe
            ? "✅ Safe Content"
            : `⚠️ Suspicious: ${data.reason || 'Potential threat detected'}`;
    }
}

async function analyzeInput() {
    const userInputField = document.getElementById('userInput');
    const analysisResultDiv = document.getElementById('analysisResult');
    
    if (!userInputField || !analysisResultDiv) return;
    
    const userInput = userInputField.value.trim();
    if (!userInput) return;

    addMessage(userInput, 'user');
    analysisResultDiv.textContent = 'Checking…';

    try {
        const res = await fetch(`${BASE_URL}/api/ai/detect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: userInput })
        });
        const analysis = await res.json();
        displayAnalysis(analysis);
    } catch (err) {
        console.error(err);
        analysisResultDiv.textContent = 'Error contacting server';
    }
}

function performAIAnalysis(input) {
    // Convert input to lowercase for easier matching
    const lowerInput = input.toLowerCase();
    
    // Initialize scores
    let phishingScore = 0;
    let malwareScore = 0;
    let socialScore = 0;
    let fraudScore = 0;
    
    // Check for common phishing indicators (emails, SMS, social media)
    const phishingIndicators = [
        'urgent', 'immediately', 'account suspended', 'verify your account', 
        'password expired', 'dear customer', 'click here', 'bank', 'paypal',
        'security alert', 'login', 'credentials', 'won prize', 'lottery',
        'text stop', 'reply stop', 'unsubscribe', 'sms', 'text message',
        'your package', 'delivery failed', 'tracking number', 'fedex', 'ups',
        'amazon', 'netflix', 'spotify', 'apple', 'google', 'microsoft'
    ];
    
    phishingIndicators.forEach(indicator => {
        if (lowerInput.includes(indicator)) {
            phishingScore += 5 + (Math.random() * 5);
        }
    });
    
    // Check for malware indicators
    const malwareIndicators = [
        'download', 'attachment', 'install', 'file', 'software', 'update',
        'flash player', 'java', 'plugin', 'antivirus', 'security update'
    ];
    
    malwareIndicators.forEach(indicator => {
        if (lowerInput.includes(indicator)) {
            malwareScore += 5 + (Math.random() * 5);
        }
    });
    
    // Check for social engineering indicators
    const socialIndicators = [
        'trust me', 'friend', 'family', 'emergency', 'help', 'stranded',
        'grandchild', 'relative', 'need money', 'wire transfer', 'gift cards'
    ];
    
    socialIndicators.forEach(indicator => {
        if (lowerInput.includes(indicator)) {
            socialScore += 5 + (Math.random() * 5);
        }
    });
    
    // Check for fraud indicators (SMS scams, phone calls, etc.)
    const fraudIndicators = [
        'irs', 'tax', 'refund', 'social security', 'insurance', 'medicare',
        'investment', 'bitcoin', 'crypto', 'nigerian prince', 'inheritance',
        'gift card', 'itunes', 'google play', 'steam', 'prepaid',
        'call now', 'text back', 'reply yes', 'confirm', 'verify',
        'suspended', 'locked', 'expired', 'renew', 'reactivate',
        'congratulations', 'winner', 'selected', 'claim', 'prize'
    ];
    
    fraudIndicators.forEach(indicator => {
        if (lowerInput.includes(indicator)) {
            fraudScore += 5 + (Math.random() * 5);
        }
    });
    
    // Cap scores at 100%
    phishingScore = Math.min(100, phishingScore);
    malwareScore = Math.min(100, malwareScore);
    socialScore = Math.min(100, socialScore);
    fraudScore = Math.min(100, fraudScore);
    
    // Calculate overall threat level (average of all scores)
    const overallScore = (phishingScore + malwareScore + socialScore + fraudScore) / 4;
    
    return {
        phishingScore,
        malwareScore,
        socialScore,
        fraudScore,
        overallScore
    };
}

function displayResults(analysis) {
    // Update threat scores
    const phishingScoreEl = document.getElementById('phishingScore');
    const malwareScoreEl = document.getElementById('malwareScore');
    const socialScoreEl = document.getElementById('socialScore');
    const fraudScoreEl = document.getElementById('fraudScore');
    
    if (phishingScoreEl) phishingScoreEl.textContent = Math.round(analysis.phishingScore) + '%';
    if (malwareScoreEl) malwareScoreEl.textContent = Math.round(analysis.malwareScore) + '%';
    if (socialScoreEl) socialScoreEl.textContent = Math.round(analysis.socialScore) + '%';
    if (fraudScoreEl) fraudScoreEl.textContent = Math.round(analysis.fraudScore) + '%';
    
    // Update threat level indicator
    const threatLevel = document.getElementById('threatLevel');
    if (threatLevel) {
        threatLevel.classList.remove('risk-low', 'risk-medium', 'risk-high');
        
        if (analysis.overallScore < 30) {
            threatLevel.classList.add('risk-low');
            threatLevel.style.width = '20%';
            addMessage("This appears to be low risk. However, always exercise caution online.", 'ai');
        } else if (analysis.overallScore < 70) {
            threatLevel.classList.add('risk-medium');
            threatLevel.style.width = '50%';
            addMessage("This shows some suspicious characteristics. Please be cautious and verify the source.", 'ai');
        } else {
            threatLevel.classList.add('risk-high');
            threatLevel.style.width = '90%';
            addMessage("Warning! This exhibits multiple characteristics of a cyber threat. Do not engage further.", 'ai');
        }
    }
    
    // Generate recommendations
    let recommendations = "<h3>Recommendations:</h3><ul>";
    
    if (analysis.phishingScore > 50) {
        recommendations += "<li>Do not click any links in the message</li>";
        recommendations += "<li>Verify the sender's email address carefully</li>";
        recommendations += "<li>Contact the organization directly using official channels</li>";
    }
    
    if (analysis.malwareScore > 50) {
        recommendations += "<li>Do not download any attachments</li>";
        recommendations += "<li>Ensure your antivirus software is up to date</li>";
        recommendations += "<li>Scan your system for malware</li>";
    }
    
    if (analysis.socialScore > 50) {
        recommendations += "<li>Verify the identity of the person contacting you</li>";
        recommendations += "<li>Be cautious of emotional manipulation tactics</li>";
        recommendations += "<li>Never send money to unverified contacts</li>";
    }
    
    if (analysis.fraudScore > 50) {
        recommendations += "<li>Do not provide any personal or financial information</li>";
        recommendations += "<li>Report this to the appropriate authorities if applicable</li>";
        recommendations += "<li>Monitor your accounts for suspicious activity</li>";
    }
    
    if (analysis.overallScore < 30) {
        recommendations += "<li>While this appears safe, always practice good cyber hygiene</li>";
        recommendations += "<li>Keep your software updated</li>";
        recommendations += "<li>Use unique passwords for different accounts</li>";
    }
    
    recommendations += "</ul>";
    
    const analysisResult = document.getElementById('analysisResult');
    if (analysisResult) {
        analysisResult.innerHTML = recommendations;
    }
}

function analyzeInputLocal() {
    const userInputField = document.getElementById('userInput');
    if (!userInputField) return;
    
    const userInput = userInputField.value;
    if (!userInput.trim()) return;
    
    // Add user message to chat (truncate if too long)
    const displayText = userInput.length > 100 ? userInput.substring(0, 100) + '...' : userInput;
    addMessage(displayText, 'user');
    
    // Clear input
    userInputField.value = '';
    
    // Show analyzing message
    addMessage("Analyzing message for threats...", 'ai');
    
    // Simulate AI thinking
    setTimeout(() => {
        const analysis = performAIAnalysis(userInput);
        displayResults(analysis);
    }, 1500);
}

// Main initialization when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links (index.html)
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(href);
                if (targetSection) {
                    const headerHeight = document.getElementById('header').offsetHeight;
                    const targetPosition = targetSection.offsetTop - headerHeight;
                    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                }
            }
        });
    });

    // FAQ accordion (Threats) - index.html
    document.querySelectorAll('.threat-question').forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const plusSign = this.querySelector('span');
            if (!answer) return;
            answer.classList.toggle('active');
            if (plusSign) plusSign.textContent = answer.classList.contains('active') ? '-' : '+';
        });
    });

    // Training page functionality - training.html
    // Attach module completion handlers
    document.querySelectorAll('.complete-toggle').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const id = this.closest('[data-module-id]').getAttribute('data-module-id');
            toggleModuleComplete(id);
        });
    });
    
    // Attach quiz submit handler
    const quizSubmit = document.getElementById('quiz-submit');
    if (quizSubmit) {
        quizSubmit.addEventListener('click', gradeQuiz);
    }
    
    // Attach certificate handler
    const certBtn = document.getElementById('certificate-btn');
    if (certBtn) {
        certBtn.addEventListener('click', openCertificate);
    }
    
    // Highlight current page in navigation
    navLinks.forEach(function(link) {
        if (link.getAttribute('href') === 'training.html') {
            link.classList.add('active');
        }
    });
    
    // Initialize training UI state
    updateUIFromProgress();

    // AI Detector initialization (ai-detector.html)
    const userInputField = document.getElementById('userInput');
    if (userInputField) {
        // Add event listener for Enter key (Ctrl+Enter for textarea)
        userInputField.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                analyzeInputLocal();
            }
        });
    }

    // Category filtering functionality (threats.html)
    const categoryTabs = document.querySelectorAll('.category-tab');
    const threatCards = document.querySelectorAll('.threat-card');
    
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            categoryTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
            
            const category = tab.getAttribute('data-category');
            
            // Show/hide cards based on category
            threatCards.forEach(card => {
                if (category === 'all' || card.getAttribute('data-category') === category) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // Threat modal functionality (threats.html)
    // Close modals when clicking outside the modal content
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('threat-modal')) {
            e.target.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.threat-modal[style*="block"]');
            if (openModal) {
                openModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        }
    });

    // Mobile menu toggle (if needed)
    const menuToggle = document.createElement('div');
    menuToggle.classList.add('menu-toggle');
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    
    const navbar = document.getElementById('navbar');
    const navLinksContainer = document.querySelector('.nav-links');
    
    // Only add mobile menu if needed
    if (window.innerWidth <= 768) {
        navbar.appendChild(menuToggle);
        
        menuToggle.addEventListener('click', function() {
            navLinksContainer.classList.toggle('active');
        });
    }

    // Ensure Font Awesome is present (for safety when index is loaded standalone)
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        document.head.appendChild(fontAwesome);
    }
});