document.addEventListener('DOMContentLoaded', async () => {
  const chatMessages = document.getElementById('chatMessages');
  const userInput = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const suggestionsContainer = document.getElementById('suggestionsContainer');

  // Format current timestamp
  function getFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Instantiate the matching engine (BM25 threshold)
  const engine = new IntentEngine({
    threshold: 1.0,
    fallbackResponse: "I'm sorry, I couldn't find specific information for your query in the SDIT records. Try asking about:\n\n• Courses & Departments (CSE, ISE, AIML, ECE, ME, CE, Aero, MBA, MCA, M.Tech, PhD)\n• Admissions & Eligibility (BE, MBA, MCA, M.Tech, documents required)\n• Campus Facilities (hostel, labs, library, sports, canteen, transport)\n• Placements (statistics, top recruiters, TPO info, training)"
  });

  // Conversation restore state
  const SESSION_KEY = 'sdit_assist_session';
  const INITIAL_GREETING = 'Hello! How can I help you today? Ask me about courses, admissions, campus facilities, or placements.';
  let historyRestored = false;

  // Restore any previously stored conversation before the widget is ready
  restoreHistory();

  // Data files to load
  const dataFiles = [
    { name: 'college_info', path: 'data/college_info.json' },
    { name: 'departments', path: 'data/departments.json' },
    { name: 'admissions', path: 'data/admissions.json' },
    { name: 'campus', path: 'data/campus.json' },
    { name: 'placement', path: 'data/placement.json' }
  ];

  // Load datasets asynchronously at load time
  try {
    const loadPromises = dataFiles.map(async (file) => {
      const response = await fetch(file.path);
      if (!response.ok) {
        throw new Error(`Failed to load ${file.path}: ${response.status}`);
      }
      const data = await response.json();
      engine.addCategory(file.name, data);
    });

    await Promise.all(loadPromises);

    const contResponse = await fetch('data/continuations.json');
    if (contResponse.ok) {
      const cont = await contResponse.json();
      if (cont && typeof cont === 'object') {
        engine.affirmContinuations = cont.continuations || engine.affirmContinuations;
        if (cont.affirmNoTopic) engine.affirmNoTopicResponse = cont.affirmNoTopic;
        if (cont.decline) engine.declineResponse = cont.decline;
      }
    }

    engine.train();
  } catch (err) {
    console.error('Error loading chatbot dataset:', err);
    appendMessage('bot', 'Warning: Could not load full knowledge base. Matching may be limited.');
  }

  /**
   * Append a message bubble to the chat container
   * @param {'user'|'bot'} sender
   * @param {string} text
   */
  function appendMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';

    // Support basic multiline formatting
    if (text.includes('\n')) {
      const lines = text.split('\n');
      lines.forEach((line, idx) => {
        if (idx > 0) bubbleDiv.appendChild(document.createElement('br'));
        bubbleDiv.appendChild(document.createTextNode(line));
      });
    } else {
      bubbleDiv.textContent = text;
    }

    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = getFormattedTime();

    messageDiv.appendChild(bubbleDiv);
    messageDiv.appendChild(timeDiv);

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * Restore a previously stored conversation from sessionStorage, or show the
   * default greeting when no valid history exists.
   */
  function restoreHistory() {
    if (historyRestored) return;
    historyRestored = true;

    let state = null;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      state = raw ? JSON.parse(raw) : null;
    } catch (e) {
      state = null;
    }

    const history = state && Array.isArray(state.history) ? state.history : [];
    if (history.length === 0) {
      appendMessage('bot', INITIAL_GREETING);
      return;
    }

    history.forEach((entry) => {
      if (
        !entry ||
        (entry.role !== 'user' && entry.role !== 'bot') ||
        typeof entry.text !== 'string'
      ) {
        return;
      }
      appendMessage(entry.role, entry.text);
    });
  }

  /**
   * Process user query and generate response
   */
  function handleSendMessage(queryText) {
    const text = (queryText || userInput.value || '').trim();
    if (!text) return;

    // Display user message
    appendMessage('user', text);
    userInput.value = '';

    // Handle edge case: extremely long query
    const cleanedText = text.slice(0, 300);

    // Query matching engine
    const result = engine.query(cleanedText);

    // Add brief typing delay for conversational feel
    setTimeout(() => {
      appendMessage('bot', result.response);
    }, 150);
  }

  // Event Listeners
  sendBtn.addEventListener('click', () => handleSendMessage());

  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  });

  const chatOverlay = document.getElementById('chatOverlay');
  const openChatBtn = document.getElementById('openChatBtn');
  const closeChatBtn = document.getElementById('closeChatBtn');
  const floatingChatLabel = document.getElementById('floatingChatLabel');
  const openAssistantCtaBtn = document.getElementById('openAssistantCtaBtn');

  function openChatModal() {
    if (chatOverlay) {
      chatOverlay.classList.add('active');
      chatOverlay.setAttribute('aria-hidden', 'false');
      if (userInput) {
        setTimeout(() => userInput.focus(), 150);
      }
    }
  }

  function closeChatModal() {
    if (chatOverlay) {
      chatOverlay.classList.remove('active');
      chatOverlay.setAttribute('aria-hidden', 'true');
    }
  }

  if (openChatBtn) openChatBtn.addEventListener('click', openChatModal);
  if (floatingChatLabel) floatingChatLabel.addEventListener('click', openChatModal);
  if (openAssistantCtaBtn) openAssistantCtaBtn.addEventListener('click', openChatModal);
  if (closeChatBtn) closeChatBtn.addEventListener('click', closeChatModal);

  if (chatOverlay) {
    chatOverlay.addEventListener('click', (e) => {
      if (e.target === chatOverlay) {
        closeChatModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatOverlay && chatOverlay.classList.contains('active')) {
      closeChatModal();
    }
  });

  // Wire suggestion chips anywhere on the page
  document.addEventListener('click', (e) => {
    const target = e.target.closest('.suggestion-chip');
    if (target) {
      const query = target.getAttribute('data-query');
      if (query) {
        openChatModal();
        handleSendMessage(query);
      }
    }
  });
});
