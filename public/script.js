const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const submitButton = form.querySelector('button');

// Stores conversation history for multi-turn chat:
// [{ role: 'user', text: '...' }, { role: 'model', text: '...' }]
const conversation = [];

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // 1. Add user's message to the chat box
  appendMessage('user', userMessage);
  input.value = '';

  // Prevent double submissions while waiting
  input.disabled = true;
  if (submitButton) submitButton.disabled = true;

  // 2. Show temporary "Thinking..." bot message with spinner
  const botMessageElement = appendMessage('bot', 'Thinking...');
  botMessageElement.classList.add('thinking');

  // 3. Track user turn in conversation history
  conversation.push({ role: 'user', text: userMessage });

  try {
    // 4. Send POST request to /api/chat
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ conversation })
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();

    // 5. Replace "Thinking..." with formatted AI reply
    botMessageElement.classList.remove('thinking');

    if (data && data.result) {
      botMessageElement.innerHTML = renderMarkdown(data.result);
      conversation.push({ role: 'model', text: data.result });
    } else {
      botMessageElement.textContent = 'Sorry, no response received.';
      conversation.pop(); // Revert user message from history on missing response
    }
  } catch (error) {
    console.error('Chat error:', error);
    botMessageElement.classList.remove('thinking');
    botMessageElement.textContent = 'Failed to get response from server.';
    conversation.pop(); // Revert user message from history on request failure
  } finally {
    // 6. Re-enable form controls, focus input, and scroll to bottom
    input.disabled = false;
    if (submitButton) submitButton.disabled = false;
    input.focus();
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

/**
 * Parses markdown text into formatted HTML.
 * Uses marked.js if available, with a regex fallback.
 * @param {string} text - Raw markdown text from AI
 * @returns {string} - Formatted HTML
 */
function renderMarkdown(text) {
  if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
    return marked.parse(text);
  }

  // Fallback lightweight markdown parser
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (```code```)
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold (**text**)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic (*text*)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // Headers (###, ##, #)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  // Blockquotes (> text)
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');
  // Lists (- or *)
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>');
  // Paragraphs & Line breaks
  html = html.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

  return html;
}

/**
 * Appends a chat bubble to the chat container.
 * @param {'user' | 'bot'} sender - The sender role
 * @param {string} text - Message text
 * @returns {HTMLDivElement} - The created message DOM node
 */
function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}
