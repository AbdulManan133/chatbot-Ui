/**
 * Reusable Chatbot UI - JavaScript
 * A beautiful, reusable chatbot interface for modern websites
 * 
 * Features:
 * - Smooth animations and interactions
 * - Typing indicators
 * - Message history
 * - Customizable responses
 * - Mobile responsive
 * - Accessibility support
 */

class ReusableChatbot {
    constructor(options = {}) {
        // Default configuration
        this.config = {
            botName: 'AI Assistant',
            welcomeMessage: 'Hello! How can I help you today?',
            apiEndpoint: null,
            responses: {
                'hello': 'Hello there! How can I assist you today?',
                'hi': 'Hi! What can I help you with?',
                'help': 'I\'m here to help! You can ask me questions and I\'ll do my best to assist you.',
                'default': 'I understand you\'re saying "{message}". How can I help you with that?'
            },
            typingDelay: 1000,
            messageDelay: 500,
            autoOpen: false,
            theme: 'default',
            ...options
        };

        // State management
        this.isOpen = false;
        this.isTyping = false;
        this.messageHistory = [];
        this.currentUser = 'user';

        // DOM elements
        this.elements = {};
        
        // Initialize the chatbot
        this.init();
    }

    /**
     * Initialize the chatbot
     */
    init() {
        this.bindElements();
        this.bindEvents();
        this.loadMessageHistory();
        
        if (this.config.autoOpen) {
            setTimeout(() => this.openChat(), 1000);
        }

        // Add welcome message if no history
        if (this.messageHistory.length === 0) {
            this.addMessage('bot', this.config.welcomeMessage);
        }
    }

    /**
     * Bind DOM elements
     */
    bindElements() {
        this.elements = {
            chatbot: document.getElementById('reusable-chatbot'),
            toggle: document.getElementById('chatbot-toggle'),
            container: document.getElementById('chatbot-container'),
            messages: document.getElementById('chatbot-messages'),
            input: document.getElementById('message-input'),
            sendBtn: document.getElementById('send-btn'),
            refreshBtn: document.getElementById('refresh-btn'),
            closeBtn: document.getElementById('close-btn'),
            typingIndicator: document.getElementById('typing-indicator'),
            emojiBtn: document.getElementById('emoji-btn')
        };
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Toggle chatbot
        this.elements.toggle.addEventListener('click', () => this.toggleChat());

        // Send message
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Input events
        this.elements.input.addEventListener('input', () => this.updateSendButton());

        // Control buttons
        this.elements.refreshBtn.addEventListener('click', () => this.refreshChat());
        this.elements.closeBtn.addEventListener('click', () => this.closeChat());

        // Additional features
        this.elements.emojiBtn.addEventListener('click', () => this.toggleEmojiPicker());

        // Auto-resize input
        this.elements.input.addEventListener('input', () => this.autoResizeInput());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Click outside to close (optional)
        document.addEventListener('click', (e) => {
            if (!this.elements.chatbot.contains(e.target) && this.isOpen) {
                // Uncomment to enable click-outside-to-close
                // this.closeChat();
            }
        });
    }

    /**
     * Toggle chatbot open/close
     */
    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    /**
     * Open chatbot
     */
    openChat() {
        this.isOpen = true;
        this.elements.container.classList.add('show');
        this.elements.toggle.classList.add('active');
        
        // Focus input
        setTimeout(() => {
            this.elements.input.focus();
            this.scrollToBottom();
        }, 300);

        // Track event
        this.trackEvent('chatbot_opened');
    }

    /**
     * Close chatbot
     */
    closeChat() {
        this.isOpen = false;
        this.elements.container.classList.remove('show');
        this.elements.toggle.classList.remove('active');
        
        // Track event
        this.trackEvent('chatbot_closed');
    }

    /**
     * Refresh/Clear chat
     */
    refreshChat() {
        // Clear message history
        this.clearHistory();
        
        // Add animation to refresh button
        this.elements.refreshBtn.style.transform = 'rotate(360deg)';
        this.elements.refreshBtn.style.transition = 'transform 0.5s ease';
        
        // Reset animation after completion
        setTimeout(() => {
            this.elements.refreshBtn.style.transform = 'rotate(0deg)';
        }, 500);
        
        // Track event
        this.trackEvent('chatbot_refreshed');
    }



    /**
     * Send user message
     */
    async sendMessage() {
        const message = this.elements.input.value.trim();
        
        if (!message) return;

        // Clear input
        this.elements.input.value = '';
        this.updateSendButton();

        // Add user message
        this.addMessage('user', message);

        // Show typing indicator
        this.showTyping();

        // Get bot response
        try {
            const response = await this.getBotResponse(message);
            
            // Hide typing indicator
            this.hideTyping();
            
            // Add bot response with delay
            setTimeout(() => {
                this.addMessage('bot', response);
            }, this.config.messageDelay);

        } catch (error) {
            console.error('Error getting bot response:', error);
            this.hideTyping();
            
            setTimeout(() => {
                this.addMessage('bot', 'Sorry, I\'m having trouble responding right now. Please try again.');
            }, this.config.messageDelay);
        }

        // Track event
        this.trackEvent('message_sent', { message: message });
    }

    /**
     * Get bot response
     */
    async getBotResponse(message) {
        const lowerMessage = message.toLowerCase();

        // If API endpoint is configured, use it
        if (this.config.apiEndpoint) {
            try {
                const response = await fetch(this.config.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: message,
                        history: this.messageHistory.slice(-10) // Send last 10 messages
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.message || data.response || 'Sorry, I didn\'t understand that.';
                }
            } catch (error) {
                console.warn('API request failed, falling back to predefined responses:', error);
            }
        }

        // Fallback to predefined responses
        for (const [key, response] of Object.entries(this.config.responses)) {
            if (key !== 'default' && lowerMessage.includes(key)) {
                return response;
            }
        }

        // Default response
        return this.config.responses.default.replace('{message}', message);
    }

    /**
     * Add message to chat
     */
    addMessage(sender, content, timestamp = null) {
        const messageData = {
            sender,
            content,
            timestamp: timestamp || new Date(),
            id: this.generateMessageId()
        };

        // Add to history
        this.messageHistory.push(messageData);
        this.saveMessageHistory();

        // Create message element
        const messageElement = this.createMessageElement(messageData);
        
        // Add to DOM
        this.elements.messages.appendChild(messageElement);
        
        // Scroll to bottom
        this.scrollToBottom();

        // Update unread count if closed
        if (!this.isOpen) {
            this.updateUnreadCount();
        }
    }

    /**
     * Create message element
     */
    createMessageElement(messageData) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${messageData.sender}-message`;
        messageDiv.setAttribute('data-message-id', messageData.id);

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = messageData.sender === 'bot' ? '<i class="fas fa-brain"></i>' : '<i class="fas fa-user"></i>';

        const content = document.createElement('div');
        content.className = 'message-content';

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = messageData.content;

        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = this.formatTime(messageData.timestamp);

        content.appendChild(bubble);
        content.appendChild(time);

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);

        return messageDiv;
    }

    /**
     * Show typing indicator
     */
    showTyping() {
        this.isTyping = true;
        this.elements.typingIndicator.classList.add('show');
        this.scrollToBottom();
    }

    /**
     * Hide typing indicator
     */
    hideTyping() {
        this.isTyping = false;
        this.elements.typingIndicator.classList.remove('show');
    }

    /**
     * Update send button state
     */
    updateSendButton() {
        const hasText = this.elements.input.value.trim().length > 0;
        this.elements.sendBtn.disabled = !hasText;
        
        if (hasText) {
            this.elements.sendBtn.style.opacity = '1';
        } else {
            this.elements.sendBtn.style.opacity = '0.5';
        }
    }

    /**
     * Scroll messages to bottom
     */
    scrollToBottom() {
        setTimeout(() => {
            this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        }, 100);
    }

    /**
     * Auto-resize input
     */
    autoResizeInput() {
        const input = this.elements.input;
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Esc to close
        if (e.key === 'Escape' && this.isOpen) {
            this.closeChat();
        }

        // Ctrl/Cmd + K to open
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.toggleChat();
        }
    }

    /**
     * Toggle emoji picker (placeholder)
     */
    toggleEmojiPicker() {
        // This is a placeholder for emoji picker functionality
        // In a real implementation, you might integrate with an emoji picker library
        const emojis = ['😊', '😂', '🤔', '👍', '❤️', '🔥', '💯', '🎉'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        
        this.elements.input.value += randomEmoji;
        this.elements.input.focus();
        this.updateSendButton();
    }



    /**
     * Format timestamp
     */
    formatTime(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    /**
     * Generate unique message ID
     */
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Save message history to localStorage
     */
    saveMessageHistory() {
        try {
            const historyData = {
                messages: this.messageHistory.slice(-50), // Keep last 50 messages
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('reusable_chatbot_history', JSON.stringify(historyData));
        } catch (error) {
            console.warn('Could not save message history:', error);
        }
    }

    /**
     * Load message history from localStorage
     */
    loadMessageHistory() {
        try {
            const stored = localStorage.getItem('reusable_chatbot_history');
            if (stored) {
                const historyData = JSON.parse(stored);
                
                // Check if history is not too old (7 days)
                const storedDate = new Date(historyData.timestamp);
                const daysDiff = (new Date() - storedDate) / (1000 * 60 * 60 * 24);
                
                if (daysDiff < 7 && historyData.messages) {
                    this.messageHistory = historyData.messages;
                    this.renderMessageHistory();
                }
            }
        } catch (error) {
            console.warn('Could not load message history:', error);
        }
    }

    /**
     * Render message history
     */
    renderMessageHistory() {
        this.elements.messages.innerHTML = '';
        
        this.messageHistory.forEach(messageData => {
            const messageElement = this.createMessageElement(messageData);
            this.elements.messages.appendChild(messageElement);
        });
        
        this.scrollToBottom();
    }

    /**
     * Update unread count (placeholder)
     */
    updateUnreadCount() {
        // This could show a badge with unread message count
        // Implementation depends on specific requirements
    }

    /**
     * Track events (placeholder)
     */
    trackEvent(eventName, data = {}) {
        // This is a placeholder for analytics tracking
        // In a real implementation, you might send to Google Analytics, etc.
        console.log('Event tracked:', eventName, data);
    }

    /**
     * Clear chat history
     */
    clearHistory() {
        this.messageHistory = [];
        this.elements.messages.innerHTML = '';
        this.saveMessageHistory();
        
        // Add welcome message
        this.addMessage('bot', this.config.welcomeMessage);
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Destroy chatbot instance
     */
    destroy() {
        // Remove event listeners
        this.elements.toggle.removeEventListener('click', this.toggleChat);
        // ... remove other listeners
        
        // Remove from DOM
        if (this.elements.chatbot && this.elements.chatbot.parentNode) {
            this.elements.chatbot.parentNode.removeChild(this.elements.chatbot);
        }
    }

    /**
     * Get chatbot statistics
     */
    getStats() {
        const userMessages = this.messageHistory.filter(msg => msg.sender === 'user');
        const botMessages = this.messageHistory.filter(msg => msg.sender === 'bot');
        
        return {
            totalMessages: this.messageHistory.length,
            userMessages: userMessages.length,
            botMessages: botMessages.length,
            firstMessage: this.messageHistory[0]?.timestamp,
            lastMessage: this.messageHistory[this.messageHistory.length - 1]?.timestamp,
            isOpen: this.isOpen,
            isMinimized: this.isMinimized
        };
    }
}

// Auto-initialize if not using as module
if (typeof module === 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Only auto-initialize if chatbot elements exist
            if (document.getElementById('reusable-chatbot')) {
                window.reusableChatbot = new ReusableChatbot();
            }
        });
    } else {
        // DOM is already ready
        if (document.getElementById('reusable-chatbot')) {
            window.reusableChatbot = new ReusableChatbot();
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReusableChatbot;
}

// AMD support
if (typeof define === 'function' && define.amd) {
    define([], function() {
        return ReusableChatbot;
    });
}
