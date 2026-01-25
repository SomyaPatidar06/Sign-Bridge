import React, { useState, useRef, useEffect } from 'react';
import CameraManager from './components/CameraManager';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const OnboardingModal = ({ onSelect }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h1 className="big-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Welcome to Sign-Bridge</h1>
        <p style={{ color: 'var(--text-muted)' }}>Please select the profile that best describes you to customize your experience.</p>

        <div className="profile-grid">
          {/* Option 1 */}
          <div className="profile-card" onClick={() => onSelect('deaf')}>
            <h3>Deaf from Birth <span className="profile-badge">Visual Priority</span></h3>
            <p>I communicate primarily using Sign Language.</p>
            <ul>
              <li>Auto-starts Sign Translation</li>
              <li>Converts incoming speech to text</li>
              <li>Optimized for visual feedback</li>
            </ul>
          </div>

          {/* Option 2 */}
          <div className="profile-card" onClick={() => onSelect('hard_of_hearing')}>
            <h3>Hard of Hearing <span className="profile-badge" style={{ background: '#10b981' }}>Audio Assist</span></h3>
            <p>I can speak but need captions for clarity.</p>
            <ul>
              <li>Auto-starts Speech Captions</li>
              <li>Sign Translation available</li>
              <li>Hybrid audio/visual mode</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Enhancements --- //

const SUGGESTIONS = {
  'Hello': ['How are you?', 'Friend', 'Good Morning'],
  'Thanks': ['You are welcome', 'A lot'],
  'Please': ['Help me', 'Give me'],
  'Yes': ['I agree', 'Confirm'],
  'No': ['I disagree', 'Stop'],
  'Help': ['Emergency', 'Call Police', 'I am hurt'],
};

const PanicSidebar = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [flashing, setFlashing] = useState(false);

  const triggerPanic = (msg) => {
    // 1. Speak loudly
    const u = new SpeechSynthesisUtterance(msg);
    u.rate = 0.9;
    u.pitch = 1.1;
    u.volume = 1.0;
    window.speechSynthesis.speak(u);

    // 2. Flash Screen
    setFlashing(true);
    setTimeout(() => setFlashing(false), 2000);
  };

  return (
    <>
      <div className={`panic-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="panic-toggle" onClick={() => setCollapsed(!collapsed)}>
          <span>🆘</span>
        </div>
        <h3 className="text-red-500 font-bold text-center uppercase text-sm tracking-widest">Emergency</h3>
        <button className="panic-btn" onClick={() => triggerPanic("I need help! Please assist me.")}>HELP ME</button>
        <button className="panic-btn" onClick={() => triggerPanic("Call the police immediately!")}>POLICE</button>
        <button className="panic-btn" onClick={() => triggerPanic("I need a doctor. Medical emergency.")}>DOCTOR</button>
        <button className="panic-btn" style={{ background: '#333', borderColor: '#555' }} onClick={() => {
          const u = new SpeechSynthesisUtterance("I am deaf. I communicate using this app.");
          window.speechSynthesis.speak(u);
        }}>I AM DEAF</button>
      </div>
      {flashing && <div className="fixed inset-0 bg-red-500/50 z-[9999] panic-flash pointer-events-none"></div>}
    </>
  );
};

const ManageModal = ({ onClose }) => {
  const [signs, setSigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/signs`)
      .then(res => res.json())
      .then(data => {
        setSigns(data.signs || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setSigns([]);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (label) => {
    if (!window.confirm(`Delete all samples for "${label}"?`)) return;
    try {
      await fetch(`${API_URL}/delete_sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label })
      });
      setSigns(prev => prev.filter(s => s !== label));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Manage Dictionary</h2>
          <button className="btn-icon" onClick={onClose}>❌</button>
        </div>

        {loading ? <p>Loading...</p> : (
          <div className="manage-list">
            {signs.length === 0 && <p style={{ opacity: 0.5 }}>No signs learned yet.</p>}
            {signs.map(sign => (
              <div key={sign} className="manage-item">
                <span>{sign}</span>
                <button className="btn-delete-sm" onClick={() => handleDelete(sign)}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const cameraRef = useRef();
  const [mode, setMode] = useState('translate'); // 'teach' | 'translate'
  const [userProfile, setUserProfile] = useState(localStorage.getItem('userProfile'));
  const [inputLabel, setInputLabel] = useState('');
  const [prediction, setPrediction] = useState({ label: 'Waiting...', confidence: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // New State for Sentence Builder
  const [sentence, setSentence] = useState([]);
  const [showManage, setShowManage] = useState(false);

  // Speech to Text State
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const recognitionRef = useRef(null);
  const lastSpokenRef = useRef(null); // Track last spoken to prevent spam
  const shouldListenRef = useRef(false); // Track intended state to auto-restart

  // Smart Voice Replies State
  const [voiceSuggestions, setVoiceSuggestions] = useState([]);

  // Smart Reply Dictionary (Question Keywords -> Suggested Answers)
  const VOICE_REPLIES = {
    'eat': ['I am hungry', 'I already ate', 'Not yet'],
    'food': ['I am hungry', 'I already ate', 'Let\'s eat'],
    'hungry': ['Yes, very hungry', 'No, I am full'],
    'drink': ['I need water', 'Coffee please', 'No thanks'],
    'water': ['Yes, please', 'No, I am good'],
    'how are you': ['I am good', 'I am tired', 'I am happy'],
    'name': ['My name is [User]', 'I am using Sign-Bridge'],
    'help': ['Call for help', 'I need a doctor', 'Emergency'],
    'time': ['What time is it?', 'It is late'],
    'go': ['Where are we going?', 'I want to go home'],
    'stop': ['Please stop', 'Wait'],
    'bathroom': ['Where is the restroom?', 'I need to go'],
  };

  useEffect(() => {
    if (!speechText) {
      setVoiceSuggestions([]);
      return;
    }
    const lowerText = speechText.toLowerCase();
    let matches = [];
    Object.keys(VOICE_REPLIES).forEach(keyword => {
      if (lowerText.includes(keyword)) {
        matches = [...matches, ...VOICE_REPLIES[keyword]];
      }
    });
    // Deduplicate and limit
    setVoiceSuggestions([...new Set(matches)].slice(0, 6));
  }, [speechText]);

  // Motion Detection State
  const frameBuffer = useRef([]); // For translation (Sliding Window)
  const recordingBuffer = useRef([]); // For teaching (Fixed Sequence)
  const isRecordingRef = useRef(false);
  const [recordingProgress, setRecordingProgress] = useState(0);

  // Helper: Normalize to make position-invariant
  // Centers the hand at the wrist (0,0,0) so it works even if you move around the screen
  // Helper: Normalize to make position-invariant
  // Centers the hand at the wrist (0,0,0) so it works even if you move around the screen
  // NOTE: CameraManager now handles normalization! 
  // We just receive the FLAT array (63 floats).

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      // Set to Indian English (Best for Hinglish/Indian accents)
      recognitionRef.current.lang = 'en-IN';
      // Note: For pure Hindi, use 'hi-IN'. 
      // Browsers often auto-detect if you speak Hindi in 'en-IN' mode mostly works for Hinglish.

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setSpeechText(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech Error:", event.error);
        // Don't kill state on "no-speech" error (common in silence)
        if (event.error === 'not-allowed') setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        // Auto-restart if intended
        if (shouldListenRef.current) {
          console.log("Speech Service: Auto-restarting in 200ms...");
          setTimeout(() => {
            if (!shouldListenRef.current) return; // check again
            try {
              recognitionRef.current.start();
            } catch (e) { console.log("Restart failed", e); }
          }, 200);
        } else {
          setIsListening(false);
        }
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      shouldListenRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setSpeechText('');
      shouldListenRef.current = true;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Translation Loop (Motion Mode)
  useEffect(() => {
    let interval;
    if (mode === 'translate') {
      // console.log("Starting Translate Interval");
      interval = setInterval(async () => {
        if (cameraRef.current) {
          const rawLandmarks = cameraRef.current.getLandmarks();
          if (rawLandmarks) {
            // Already normalized by CameraManager
            const landmarks = rawLandmarks;

            // Push to buffer
            frameBuffer.current.push(landmarks);

            // Keep size at 30
            if (frameBuffer.current.length > 30) {
              frameBuffer.current.shift();
            }

            // Only predict if we have full motion history (30 frames)
            // And limit prediction rate to avoid spamming API (e.g. every 5th frame)
            if (frameBuffer.current.length === 30 && frameBuffer.current.length % 5 === 0) {
              try {
                // Flatten buffer: [ [x,y..], [x,y..] ] -> [x,y,x,y...]
                // Buffer contains normalized FLAT arrays [x,y,z...]. 
                // Just flatten the buffer of frames.
                const flatLandmarks = frameBuffer.current.flat();

                // console.log("Sending Predict Request, len:", flatLandmarks.length);

                const res = await fetch(`${API_URL}/predict_sign`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ landmarks: flatLandmarks })
                });
                const data = await res.json();
                console.log("Prediction Result:", data); // FORCE LOG
                const conf = typeof data.confidence === 'number' ? data.confidence : 0;

                if (conf > 0.65) {
                  setPrediction({ label: data.label, confidence: conf });

                  // Auto-Speak Logic
                  if (conf > 0.85 && data.label !== lastSpokenRef.current) {
                    speak(data.label);
                    setSentence(prev => [...prev, data.label]);
                    lastSpokenRef.current = data.label;
                  }
                } else {
                  setPrediction({ label: '...', confidence: conf });
                  if (conf < 0.5) {
                    lastSpokenRef.current = null;
                  }
                }
              } catch (e) {
                console.error(e);
              }
            }
          }
        }
      }, 50); // 50ms = 20 FPS. 30 frames = 1.5 seconds history.
    }
    return () => clearInterval(interval);
  }, [mode]);

  const handleTeach = async () => {
    if (isRecordingRef.current) return;
    if (!inputLabel) {
      setStatusMsg("Please enter a label first!");
      return;
    }

    isRecordingRef.current = true;
    setIsRecording(true);
    setStatusMsg("Get ready...");
    recordingBuffer.current = [];
    setRecordingProgress(0);

    // Countdown
    setTimeout(() => {
      setStatusMsg("Recording...");
      let frames = 0;
      const recInterval = setInterval(async () => {
        // 1. Capture Frame
        if (cameraRef.current) {
          const rawLm = cameraRef.current.getLandmarks();
          // Add landmark or zero-pad if lost tracking
          if (rawLm) {
            recordingBuffer.current.push(rawLm);
          } else {
            recordingBuffer.current.push(new Array(63).fill(0.0));
          }
        }

        frames++;
        setRecordingProgress(Math.round((frames / 30) * 100));

        // 2. Stop condition
        if (frames >= 30) {
          clearInterval(recInterval);
          setStatusMsg("Processing...");

          // Send Data
          try {
            const flatLandmarks = recordingBuffer.current.flat();
            await fetch(`${API_URL}/save_sign`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ label: inputLabel, landmarks: flatLandmarks })
            });
            setStatusMsg(`Saved "${inputLabel}"!`);
            setInputLabel('');
          } catch (e) {
            setStatusMsg("Error saving sign.");
          }

          setIsRecording(false);
          isRecordingRef.current = false;
          setRecordingProgress(0);
          recordingBuffer.current = []; // Clear
        }
      }, 50); // 50ms interval = 1.5 seconds total for 30 frames
    }, 1000);
  };

  // Profile-based Auto-Configuration
  useEffect(() => {
    if (userProfile === 'deaf') {
      // Default: Translate Mode, visuals prioritized
      setMode('translate');
      // Ideally start mic for them to see what others say
      if (!isListening) {
        // Note: Autostarting audio might require user interaction first due to browser policy,
        // but since they clicked the modal, it might work.
        // We will leave it manual for now or try to trigger.
      }
    } else if (userProfile === 'hard_of_hearing') {
      // Default: Translate Mode
      setMode('translate');
      // Auto-click mic if possible? 
      // Let's just encourage it via UI.
    }
  }, [userProfile]);

  const handleProfileSelect = (profile) => {
    setUserProfile(profile);
    localStorage.setItem('userProfile', profile);

    // Auto-configure immediately
    if (profile === 'hard_of_hearing') {
      // We can try to auto-start mic here since it's a direct user interaction
      if (!isListening && recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) { console.error(e); }
      }
    } else if (profile === 'deaf') {
      // Also helpful for deaf users to see captions immediately
      if (!isListening && recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) { console.error(e); }
      }
    }
  };

  // Helper: Speak
  const speak = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(u);
  };

  const addToSentence = (word) => {
    setSentence(prev => [...prev, word]);
  };

  return (
    <div className="app-container">
      <PanicSidebar />
      {!userProfile && <OnboardingModal onSelect={handleProfileSelect} />}
      {showManage && <ManageModal onClose={() => setShowManage(false)} />}

      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <h1>Sign-Bridge</h1>
          <p>Real-time Recognition & Translation</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {userProfile && (
            <span
              className="profile-badge"
              style={{ cursor: 'pointer', opacity: 0.7 }}
              onClick={() => { setUserProfile(null); localStorage.removeItem('userProfile'); }}
              title="Click to change profile"
            >
              {userProfile === 'deaf' ? 'Visual Mode' : 'Audio Assist'}
            </span>
          )}

          <div className="mode-toggle">
            <button
              onClick={() => setMode('translate')}
              className={`btn-mode ${mode === 'translate' ? 'active' : ''}`}
            >
              Translate
            </button>
            <button
              onClick={() => setMode('teach')}
              className={`btn-mode ${mode === 'teach' ? 'active' : ''}`}
            >
              Teach
            </button>
          </div>
        </div>
      </header>

      <div className="main-grid">

        {/* Left Column: Camera */}
        <div className="camera-section">
          <div className="camera-card">
            <CameraManager ref={cameraRef} />
            <div className="live-badge">
              {mode === 'translate' ? '● Live' : '● Rec'}
            </div>
          </div>
        </div>

        {/* Right Column: Controls */}
        <div className="controls-container">

          {/* Main Card */}
          {/* Main Card */}
          <div className="card">
            {mode === 'translate' ? (
              <>
                {/* Sentence Builder Bar */}
                <div className="sentence-bar">
                  <div className="sentence-text">
                    {sentence.join(" ") || <span style={{ opacity: 0.3 }}>Sentence builds here...</span>}
                  </div>
                  <div className="sentence-controls">
                    <button className="btn-icon" onClick={() => setSentence([])} title="Clear">❌</button>
                    <button className="btn-icon btn-speak-main" onClick={() => speak(sentence.join(" "))} title="Speak Sentence">🔊</button>
                  </div>
                </div>

                <span className="card-label">Detected Sign</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
                  <p className="big-text">{prediction.label}</p>
                  {prediction.label !== 'Waiting...' && (
                    <button className="btn-icon" onClick={() => speak(prediction.label)}>🔊</button>
                  )}
                </div>

                <div className="confidence-tag">
                  {Math.round(prediction.confidence * 100)}% Confidence
                </div>

                {/* Smart Suggestions */}
                {prediction.label !== 'Waiting...' && (
                  <div className="suggestions-container">
                    <button className="chip chip-primary" onClick={() => addToSentence(prediction.label)}>
                      + Add "{prediction.label}"
                    </button>
                    {SUGGESTIONS[prediction.label]?.map(s => (
                      <button key={s} className="chip" onClick={() => addToSentence(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ width: '100%', maxWidth: '300px' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Teach New Sign</h2>

                <div className="input-group">
                  <label className="card-label" style={{ display: 'block' }}>Name of Sign</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Hello"
                    value={inputLabel}
                    onChange={(e) => setInputLabel(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleTeach}
                  disabled={isRecording}
                  className="btn btn-primary"
                  style={{ marginTop: '1rem' }}
                >
                  {isRecording ? `Recording... ${recordingProgress}%` : "Record Motion (2s)"}
                </button>

                {isRecording && (
                  <div style={{ width: '100%', height: '4px', background: '#333', marginTop: '0.5rem', borderRadius: '2px' }}>
                    <div style={{ width: `${recordingProgress}%`, height: '100%', background: '#00ff88', transition: 'width 0.05s linear' }}></div>
                  </div>
                )}

                {statusMsg && (
                  <p style={{ color: '#fbbf24', marginTop: '1rem', fontSize: '0.9rem' }}>
                    {statusMsg}
                  </p>
                )}

                <button
                  className="btn btn-danger"
                  onClick={async () => {
                    if (window.confirm("Clear all data?\nThis cannot be undone.")) {
                      try {
                        const res = await fetch(`${API_URL}/reset_memory`, { method: 'POST' });
                        if (res.ok) {
                          setStatusMsg("Memory cleared successfully.");
                          alert("Memory cleared!");
                        } else {
                          throw new Error("Server error");
                        }
                      } catch (e) {
                        console.error(e);
                        setStatusMsg("Failed to clear memory.");
                        alert("Failed to reset. Check console.");
                      }
                    }
                  }}
                >
                  Reset All Data
                </button>

                <button
                  className="btn"
                  style={{ marginTop: '0.5rem', width: '100%', background: '#3f3f46' }}
                  onClick={() => setShowManage(true)}
                >
                  Manage Dictionary
                </button>
              </div>
            )}
          </div>

          {/* Speech Bridge */}
          <div className="speech-card">
            <div className="speech-header">
              <span className="card-label">Voice Bridge</span>
              {isListening && <span style={{ color: '#ef4444' }}>● Recording</span>}
            </div>

            <div className="box-content">
              {speechText || <span style={{ opacity: 0.5 }}>Tap microphone to speak...</span>}
            </div>

            <button
              onClick={toggleListening}
              className={`btn btn-mic ${isListening ? 'listening' : ''}`}
            >
              {isListening ? "Stop Microphone" : "Start Microphone"}
            </button>

            {/* Smart Replies */}
            {voiceSuggestions.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <span className="card-label">Suggested Replies</span>
                <div className="suggestions-container">
                  {voiceSuggestions.map(s => (
                    <button key={s} className="chip chip-primary" onClick={() => speak(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
