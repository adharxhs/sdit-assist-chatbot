/**
 * BM25 + Session Context Tracking Matching Engine
 * Fully client-side, zero runtime external dependencies.
 * Compatible with Browser script tags, ESM, and Node.js CommonJS.
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.IntentEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  var DEFAULT_STOP_WORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
    'any', 'are', "aren't", 'as', 'at', 'because', 'been', 'before', 'being',
    'below', 'between', 'both', 'but', 'by', 'can', "can't", 'cannot', 'could',
    'did', 'do', 'does', 'doing', "don't", 'down', 'during', 'each', 'few', 'for',
    'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers',
    'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it',
    'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor',
    'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours',
    'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some',
    'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
    'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under',
    'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which',
    'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours',
    'yourself', 'yourselves',
    'tell', 'please', 'know', 'want', 'like', 'could', 'would', 'give',
    'need', 'looking', 'interested', 'wondering', 'really', 'actually',
    'also', 'get', 'got', 'let', 'right', 'well', 'think', 'something'
  ]);

  var ABBREVIATION_MAP = {
    'info': 'information college about sdit intro overview',
    'be': 'bachelor engineering degree',
    'b.e': 'bachelor engineering degree',
    'b.e.': 'bachelor engineering degree',
    'btech': 'bachelor engineering degree',
    'b.tech': 'bachelor engineering degree',
    'cse': 'computer science engineering',
    'cs': 'computer science',
    'aiml': 'artificial intelligence machine learning',
    'ai': 'artificial intelligence',
    'ml': 'machine learning',
    'aids': 'artificial intelligence data science',
    'ai&ds': 'artificial intelligence data science',
    'ds': 'data science',
    'ise': 'information science engineering',
    'ec': 'electronics communication',
    'me': 'mechanical engineering',
    'mech': 'mechanical engineering',
    'ce': 'civil engineering',
    'aero': 'aeronautical engineering',
    'mba': 'master business administration management',
    'mca': 'master computer application',
    'mtech': 'master technology construction',
    'm.tech': 'master technology construction',
    'phd': 'research doctorate philosophy',
    'ph.d': 'research doctorate philosophy',
    'vtu': 'visvesvaraya technological university',
    'aicte': 'recognition approval council technical education',
    'tpo': 'training placement officer',
    'sdit': 'shree devi institute technology college',
    'puc': 'pre university certificate',
    'sslc': 'secondary school leaving certificate',
    'cet': 'common entrance test code',
    'pgcet': 'post graduate common entrance test',
    'gate': 'graduate aptitude test engineering',
    'cat': 'common admission test management',
    'gmat': 'graduate management admission test',
    'hr': 'human resources',
    'it': 'information technology',
    'hcl': 'hcltech',
    'pdp': 'personality development program'
  };

  var GREETING_WORDS = new Set([
    'hi', 'hello', 'hey', 'hii', 'hiii', 'helo', 'hola', 'howdy',
    'greetings', 'sup', 'yo', 'namaste', 'namaskar'
  ]);

  var GREETING_PHRASES = [
    'good morning', 'good afternoon', 'good evening', 'good day'
  ];

  var THANKS_WORDS = new Set([
    'thanks', 'thank', 'thankyou', 'thx', 'ty', 'thnx', 'thnks', 'thanku'
  ]);

  var THANKS_PHRASES = [
    'thank you', 'thanks a lot', 'much appreciated'
  ];

  var BYE_WORDS = new Set([
    'bye', 'goodbye', 'byebye', 'cya', 'later', 'tata'
  ]);

  var BYE_PHRASES = [
    'see you', 'see ya', 'good bye', 'bye bye', 'catch you later'
  ];

  function stemWord(word) {
    if (word.length <= 3) return word;
    var w = word.toLowerCase();
    if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
    if (w.endsWith('es') && w.length > 4) w = w.slice(0, -2);
    else if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) w = w.slice(0, -1);
    if (w.endsWith('ing') && w.length > 5) {
      w = w.slice(0, -3);
      if (w.endsWith('at') || w.endsWith('iz') || w.endsWith('bl')) w += 'e';
    } else if (w.endsWith('ed') && w.length > 4) {
      w = w.slice(0, -2);
    }
    if (w.endsWith('ment') && w.length > 6) w = w.slice(0, -4);
    if (w.endsWith('tion') && w.length > 6) w = w.slice(0, -4);
    if (w.endsWith('ability') && w.length > 7) w = w.slice(0, -7);
    if (w.endsWith('able') && w.length > 6) w = w.slice(0, -4);
    return w;
  }

  function normalizeInput(text) {
    if (!text || typeof text !== 'string') return '';
    var t = text.toLowerCase().trim();
    t = t.replace(/\b(b\.?\s*e\.?)\b/gi, 'be');
    t = t.replace(/\b(m\.?\s*tech\.?)\b/gi, 'mtech');
    t = t.replace(/\b(m\.?\s*b\.?\s*a\.?)\b/gi, 'mba');
    t = t.replace(/\b(m\.?\s*c\.?\s*a\.?)\b/gi, 'mca');
    t = t.replace(/\b(ph\.?\s*d\.?)\b/gi, 'phd');
    t = t.replace(/\b(b\.?\s*tech\.?)\b/gi, 'btech');
    t = t.replace(/\b(ai\s*&?\s*ml)\b/gi, 'aiml');
    t = t.replace(/\b(ai\s*&?\s*ds)\b/gi, 'aids');
    t = t.replace(/\b(c\.?\s*s\.?\s*e\.?)\b/gi, 'cse');
    t = t.replace(/\b(i\.?\s*s\.?\s*e\.?)\b/gi, 'ise');
    t = t.replace(/\b(e\.?\s*c\.?\s*e\.?)\b/gi, 'ece');
    t = t.replace(/\b(s\.?\s*d\.?\s*i\.?\s*t\.?)\b/gi, 'sdit');
    t = t.replace(/\b(v\.?\s*t\.?\s*u\.?)\b/gi, 'vtu');
    t = t.replace(/\b(t\.?\s*p\.?\s*o\.?)\b/gi, 'tpo');
    return t;
  }

  function expandAbbreviations(normalizedText) {
    var words = normalizedText.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
    var expanded = [];
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      expanded.push(w);
      if (ABBREVIATION_MAP[w]) {
        expanded.push(ABBREVIATION_MAP[w]);
      }
    }
    return expanded.join(' ');
  }

  function matchesAnyPhrase(text, phrases) {
    for (var i = 0; i < phrases.length; i++) {
      if (text.indexOf(phrases[i]) !== -1) return true;
    }
    return false;
  }

  function matchesAnyWord(words, wordSet) {
    for (var i = 0; i < words.length; i++) {
      if (wordSet.has(words[i])) return true;
    }
    return false;
  }

  var SESSION_KEY = 'sdit_assist_session';

  class IntentEngine {
    constructor(config) {
      config = config || {};
      this.threshold = typeof config.threshold === 'number' ? config.threshold : 5.0;
      this.fallbackResponse = config.fallbackResponse || "I'm sorry, I couldn't find specific information for your query. You can ask me about: college info, departments (CSE, ISE, AIML, ECE, ME, CE, Aero, MBA, MCA, M.Tech, PhD), admissions & eligibility, campus facilities, or placements.";
      this.stopWords = config.stopWords || DEFAULT_STOP_WORDS;
      this.indexResponse = config.indexResponse !== undefined ? config.indexResponse : true;
      this.responseWeight = typeof config.responseWeight === 'number' ? config.responseWeight : 0.3;
      this.greetingResponse = config.greetingResponse || "Hello! Welcome to SDIT Assist. I can help you with information about Shree Devi Institute of Technology. Ask me about courses & departments, admissions & eligibility, campus facilities, placements, or general college info!";
      this.thanksResponse = config.thanksResponse || "You're welcome! Feel free to ask if you have more questions about SDIT.";
      this.byeResponse = config.byeResponse || "Goodbye! Thank you for using SDIT Assist. Have a great day!";
      this.k1 = typeof config.k1 === 'number' ? config.k1 : 1.5;
      this.b = typeof config.b === 'number' ? config.b : 0.75;
      this.documents = [];
      this.docFreqs = {};
      this.docLengths = [];
      this.avgDocLength = 0;
      this.numDocs = 0;
      this.isTrained = false;
    }

    preprocess(text) {
      if (!text || typeof text !== 'string') return [];
      var cleanText = text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (!cleanText) return [];
      var rawTokens = cleanText.split(' ');
      var tokens = [];
      for (var i = 0; i < rawTokens.length; i++) {
        var token = rawTokens[i];
        if (token.length > 0 && !this.stopWords.has(token)) {
          tokens.push(stemWord(token));
        }
      }
      return tokens;
    }

    addCategory(categoryName, items) {
      if (!Array.isArray(items)) return;
      for (var j = 0; j < items.length; j++) {
        var item = items[j];
        if (!item || !item.tag || !Array.isArray(item.patterns)) continue;
        this.documents.push({
          tag: item.tag,
          category: categoryName || item.category || 'general',
          patterns: item.patterns,
          response: item.response || '',
          rawItem: item
        });
      }
      this.isTrained = false;
    }

    train() {
      if (this.documents.length === 0) {
        this.isTrained = true;
        return;
      }
      this.numDocs = this.documents.length;
      this.docFreqs = {};
      this.docLengths = [];
      var totalLength = 0;

      for (var d = 0; d < this.numDocs; d++) {
        var doc = this.documents[d];
        var tf = {};
        var docLen = 0;
        for (var p = 0; p < doc.patterns.length; p++) {
          var expanded = expandAbbreviations(normalizeInput(doc.patterns[p]));
          var patternTokens = this.preprocess(expanded);
          for (var t = 0; t < patternTokens.length; t++) {
            var term = patternTokens[t];
            tf[term] = (tf[term] || 0) + 1;
            docLen++;
          }
        }
        if (this.indexResponse && doc.response) {
          var expanded2 = expandAbbreviations(normalizeInput(doc.response));
          var responseTokens = this.preprocess(expanded2);
          for (var t2 = 0; t2 < responseTokens.length; t2++) {
            var term2 = responseTokens[t2];
            tf[term2] = (tf[term2] || 0) + this.responseWeight;
            docLen += this.responseWeight;
          }
        }
        this.documents[d].tf = tf;
        this.documents[d].docLen = docLen;
        this.docLengths.push(docLen);
        totalLength += docLen;
        for (var term3 in tf) {
          this.docFreqs[term3] = (this.docFreqs[term3] || 0) + 1;
        }
      }
      this.avgDocLength = totalLength / this.numDocs;
      this.isTrained = true;
    }

    bm25Score(queryTf, doc) {
      var score = 0;
      for (var term in queryTf) {
        var df = this.docFreqs[term] || 0;
        var idf = Math.log((this.numDocs - df + 0.5) / (df + 0.5) + 1);
        var tf = doc.tf[term] || 0;
        var numerator = tf * (this.k1 + 1);
        var denominator = tf + this.k1 * (1 - this.b + this.b * doc.docLen / this.avgDocLength);
        score += idf * (numerator / denominator);
      }
      return score;
    }

    _getSessionState() {
      try {
        var raw = sessionStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : { history: [], lastTopic: null };
      } catch (e) {
        return { history: [], lastTopic: null };
      }
    }

    _setSessionState(state) {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
      } catch (e) {}
    }

    _matchCategoryScoped(queryTf, category) {
      var bestScore = 0;
      var bestDoc = null;
      for (var d = 0; d < this.numDocs; d++) {
        var doc = this.documents[d];
        if (doc.category !== category) continue;
        var score = this.bm25Score(queryTf, doc);
        if (score > bestScore) {
          bestScore = score;
          bestDoc = doc;
        }
      }
      return { score: bestScore, doc: bestDoc };
    }

    query(userQuery) {
      if (!this.isTrained) {
        this.train();
      }

      var normalized = normalizeInput(userQuery);
      var cleanWords = normalized.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(function(w) { return w.length > 0; });

      if (cleanWords.length === 0) {
        return { match: false, intent: null, score: 0, category: 'none', response: this.fallbackResponse };
      }

      if (matchesAnyWord(cleanWords, GREETING_WORDS) || matchesAnyPhrase(normalized, GREETING_PHRASES)) {
        var hasContentWords = false;
        for (var g = 0; g < cleanWords.length; g++) {
          if (!GREETING_WORDS.has(cleanWords[g]) && cleanWords[g] !== 'good' && cleanWords[g] !== 'morning' && cleanWords[g] !== 'afternoon' && cleanWords[g] !== 'evening' && cleanWords[g] !== 'day') {
            hasContentWords = true;
            break;
          }
        }
        if (!hasContentWords) {
          var sessionState = this._getSessionState();
          sessionState.lastTopic = 'greeting';
          sessionState.history.push({ role: 'user', text: userQuery }, { role: 'bot', text: this.greetingResponse });
          this._setSessionState(sessionState);
          return { match: true, intent: { tag: 'greeting' }, score: 1, category: 'greeting', response: this.greetingResponse };
        }
      }

      if (matchesAnyWord(cleanWords, THANKS_WORDS) || matchesAnyPhrase(normalized, THANKS_PHRASES)) {
        var hasThanksContent = false;
        for (var th = 0; th < cleanWords.length; th++) {
          if (!THANKS_WORDS.has(cleanWords[th]) && cleanWords[th] !== 'you' && cleanWords[th] !== 'lot' && cleanWords[th] !== 'much' && cleanWords[th] !== 'very' && cleanWords[th] !== 'so' && cleanWords[th] !== 'a') {
            hasThanksContent = true;
            break;
          }
        }
        if (!hasThanksContent) {
          var sessionState2 = this._getSessionState();
          sessionState2.history.push({ role: 'user', text: userQuery }, { role: 'bot', text: this.thanksResponse });
          this._setSessionState(sessionState2);
          return { match: true, intent: { tag: 'thanks' }, score: 1, category: 'thanks', response: this.thanksResponse };
        }
      }

      if (matchesAnyWord(cleanWords, BYE_WORDS) || matchesAnyPhrase(normalized, BYE_PHRASES)) {
        var hasByeContent = false;
        for (var b = 0; b < cleanWords.length; b++) {
          if (!BYE_WORDS.has(cleanWords[b]) && cleanWords[b] !== 'see' && cleanWords[b] !== 'you' && cleanWords[b] !== 'ya' && cleanWords[b] !== 'good' && cleanWords[b] !== 'catch') {
            hasByeContent = true;
            break;
          }
        }
        if (!hasByeContent) {
          var sessionState3 = this._getSessionState();
          sessionState3.history.push({ role: 'user', text: userQuery }, { role: 'bot', text: this.byeResponse });
          this._setSessionState(sessionState3);
          return { match: true, intent: { tag: 'bye' }, score: 1, category: 'bye', response: this.byeResponse };
        }
      }

      var expandedQuery = expandAbbreviations(normalized);
      var queryTokens = this.preprocess(expandedQuery);

      if (queryTokens.length === 0) {
        return { match: false, intent: null, score: 0, category: 'none', response: this.fallbackResponse };
      }

      var queryTf = {};
      for (var i = 0; i < queryTokens.length; i++) {
        queryTf[queryTokens[i]] = (queryTf[queryTokens[i]] || 0) + 1;
      }

      var bestMatch = null;
      var highestScore = 0;

      for (var d3 = 0; d3 < this.numDocs; d3++) {
        var doc3 = this.documents[d3];
        var score = this.bm25Score(queryTf, doc3);
        if (score > highestScore) {
          highestScore = score;
          bestMatch = doc3;
        }
      }

      var isMatch = highestScore >= this.threshold && bestMatch !== null;
      var contextUsed = false;

      if (!isMatch && queryTokens.length <= 4) {
        var sessionState4 = this._getSessionState();
        if (sessionState4.lastTopic) {
          var scopedResult = this._matchCategoryScoped(queryTf, sessionState4.lastTopic);
          if (scopedResult.score >= this.threshold && scopedResult.doc) {
            highestScore = scopedResult.score;
            bestMatch = scopedResult.doc;
            isMatch = true;
            contextUsed = true;
          }
        }
      }

      var responseText = isMatch ? bestMatch.response : this.fallbackResponse;
      var sessionState5 = this._getSessionState();
      if (isMatch) {
        sessionState5.lastTopic = bestMatch.category;
      } else {
        sessionState5.lastTopic = null;
      }
      sessionState5.history.push({ role: 'user', text: userQuery }, { role: 'bot', text: responseText });
      this._setSessionState(sessionState5);

      return {
        match: isMatch,
        intent: isMatch ? bestMatch.rawItem : null,
        score: Math.round(highestScore * 1000) / 1000,
        category: isMatch ? bestMatch.category : 'none',
        contextUsed: contextUsed,
        response: responseText
      };
    }
  }

  return IntentEngine;
}));
