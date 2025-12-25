import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import { IoArrowBack, IoEllipsisVertical, IoAdd } from 'react-icons/io5'
import './App.css'

// Custom Eye Icon Component
const CustomEyeIcon = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5Z" 
      stroke="white" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle 
      cx="12" 
      cy="12.5" 
      r="3.5" 
      stroke="white" 
      strokeWidth="2"
    />
  </svg>
)
function App() {
  const navigate = useNavigate();
  const [statusImage, setStatusImage] = useState(null)
  const [statusVideo, setStatusVideo] = useState(null)
  const [profilePic, setProfilePic] = useState(null)
  const [statusText, setStatusText] = useState('')
  const [views, setViews] = useState('51')
  const [randomViews, setRandomViews] = useState(null)
  const [currentViewForSS, setCurrentViewForSS] = useState(null); // for per-ss random views
  // Time input: user number, am/pm, random minutes
  const [timeNumber, setTimeNumber] = useState('');
  const [timePeriod, setTimePeriod] = useState('am');
  const [randomMinutes, setRandomMinutes] = useState('00');
  const [currentMinutesForSS, setCurrentMinutesForSS] = useState('00');
  const [fontFamily, setFontFamily] = useState('Arial')
  const [fontStyle, setFontStyle] = useState('normal')
  const [progress, setProgress] = useState(40 + Math.random() * 40) // Random 40-80%
  const [isVideo, setIsVideo] = useState(false)
  const screenshotRef = useRef(null)
  const videoRef = useRef(null)
  // Profile photo list and selection
  const [profileList, setProfileList] = useState([]);
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  // Load profile photos from localStorage (dpsaver_0, dpsaver_1, ...)
  useEffect(() => {
    const arr = [];
    let i = 0;
    while (true) {
      const item = localStorage.getItem(`dpsaver_${i}`);
      if (!item) break;
      arr.push(item);
      i++;
    }
    setProfileList(arr);
  }, []);

  // Toggle profile selection
  const toggleProfile = (idx) => {
    setSelectedProfiles((prev) =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleStatusUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const fileType = file.type.split('/')[0]
    setIsVideo(fileType === 'video')

    if (fileType === 'video') {
      const videoURL = URL.createObjectURL(file)
      setStatusVideo(videoURL)
      
      // Extract middle frame for thumbnail
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        video.currentTime = video.duration / 2
      }
      video.onseeked = () => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d').drawImage(video, 0, 0)
        setStatusImage(canvas.toDataURL())
      }
      video.src = videoURL
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        setStatusImage(e.target.result)
        setStatusVideo(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => setProfilePic(e.target.result)
    reader.readAsDataURL(file)
    // Optionally, you could add uploaded profile to dpsaver list here
  }

  const handleFontChange = (e) => {
    const value = e.target.value;
    if (value.includes('|italic')) {
      const font = value.replace('|italic', '');
      setFontFamily(font);
      setFontStyle('italic');
    } else {
      setFontFamily(value);
      setFontStyle('normal');
    }
  };

  const detectAndRenderLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return <a key={index} href={part.startsWith('http') ? part : `https://${part}`} target="_blank" rel="noopener noreferrer">{part}</a>;
      }
      return part;
    });
  };

  // Helper to set profilePic, render, and screenshot
  const takeScreenshotWithProfile = async (profilePicData, idx = null, customViews = null, customMinutes = null) => {
    setProfilePic(profilePicData);
    setCurrentViewForSS(customViews);
    setCurrentMinutesForSS(customMinutes);
    await new Promise(r => setTimeout(r, 100)); // Wait for UI update
    if (!screenshotRef.current) return;
    const element = screenshotRef.current;
    const canvas = await html2canvas(element, {
      backgroundColor: '#000',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0
    });
    const link = document.createElement('a');
    link.download = idx !== null ? `whatsapp-status-screenshot-${idx + 1}.png` : 'whatsapp-status-screenshot.png';
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    setCurrentViewForSS(null); // reset after screenshot
    setCurrentMinutesForSS('00');
  };

  // Main generate logic
  const generateScreenshot = async () => {
    if (!timeNumber || timeNumber.trim() === '') {
      alert('Please enter the hour for status upload time.');
      return;
    }
    if (views === '51') {
      setRandomViews(null); // not used anymore
    }
    if (selectedProfiles.length === 0) {
      // No profile selected: generate without profile pic
      const prev = profilePic;
      setProfilePic(null);
      let customViews = null;
      let customMinutes = null;
      if (views === '51') {
        customViews = Math.floor(Math.random() * (70 - 52 + 1)) + 52;
      }
      customMinutes = Math.floor(Math.random() * 60).toString().padStart(2, '0');
      await new Promise(r => setTimeout(r, 100));
      await takeScreenshotWithProfile(null, null, customViews, customMinutes);
      setProfilePic(prev);
    } else {
      // For each selected profile, generate screenshot
      const prev = profilePic;
      for (let i = 0; i < selectedProfiles.length; i++) {
        const idx = selectedProfiles[i];
        let customViews = null;
        let customMinutes = null;
        if (views === '51') {
          customViews = Math.floor(Math.random() * (70 - 52 + 1)) + 52;
        }
        customMinutes = Math.floor(Math.random() * 60).toString().padStart(2, '0');
        await takeScreenshotWithProfile(profileList[idx], i, customViews, customMinutes);
      }
      setProfilePic(prev);
    }
  };

  return (
    <div className="app-container">
      {/* DP Saver Navigation Button */}
      <div className="upload-section">
        <div style={{color:'#ff5100ff', background:'rgba(30,32,38,0.18)', borderRadius:8, padding:'8px 14px', marginBottom:16, fontWeight:500, fontSize:'1rem', textAlign:'center'}}>
          <span role="img" aria-label="info">ℹ️</span> For best results, use <b>Google Chrome</b> browser.
        </div>

        <h1>WhatsApp Status Screenshot Generator
          
      <button className="dpsaver-btn"  onClick={() => navigate('/dpsaver')}>
        Go to DP Saver
      </button>
        </h1>


        {/* Profile Photo List Selection */}
        {profileList.length > 0 && (
          <div style={{ margin: '1rem 0' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Select Profile Photos:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {profileList.map((src, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleProfile(idx)}
                  style={{
                    border: selectedProfiles.includes(idx) ? '3px solid #25d366' : '2px solid #ccc',
                    borderRadius: 8,
                    padding: 2,
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  title={selectedProfiles.includes(idx) ? 'Deselect' : 'Select'}
                >
                  <img src={src} alt={`profile-${idx}`} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                  {selectedProfiles.includes(idx) && (
                    <span style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      background: '#25d366',
                      color: 'white',
                      borderRadius: '50%',
                      width: 18,
                      height: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      border: '2px solid #fff',
                    }}>✓</span>
                  )}
                </div>
              ))}
            </div>
            <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
              (Tap to select/deselect. If none selected, screenshot will be generated without profile photo.)
            </div>
          </div>
        )}

        <div className="upload-controls">
          <div className="upload-group">
            <label>Status Image/Video:</label>
            <input type="file" accept="image/*,video/*" onChange={handleStatusUpload} />
          </div>

          {/* <div className="upload-group">
            <label>Profile Picture:</label>
            <input type="file" accept="image/*" onChange={handleProfileUpload} />
          </div> */}

          <div className="upload-group">
            <label>Status Text:</label>
            <input 
              type="text" 
              value={statusText} 
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="Enter caption..."
            />
          </div>

          <div className="upload-group">
            <label>Status Upload Time: (minutes will come random)</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>Yesterday,</span>
              <input
                type="number"
                min="1"
                max="12"
                value={timeNumber}
                onChange={e => setTimeNumber(e.target.value)}
                placeholder="Hour"
                style={{ width: 50 }}
              />
              <span>:</span>
              <span>{randomMinutes}</span>
              <select value={timePeriod} onChange={e => setTimePeriod(e.target.value)}>
                <option value="am">am</option>
                <option value="pm">pm</option>
              </select>
            </div>
          </div>

          <div className="upload-group">
              <label>Views: (leave as 51 for random views to each screenshot)</label>            <input 
              type="text" 
              value={views} 
              onChange={(e) => setViews(e.target.value)}
              placeholder="e.g., 123"
            />
          </div>

          <div className="upload-group">
            <label>Font Style:</label>
            <select 
              value={fontStyle === 'italic' ? `${fontFamily}|italic` : fontFamily}
              onChange={handleFontChange}
              className="font-selector"
            >
              <option value="Arial">Arial</option>
              <option value="Arial|italic">Arial Italic</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Helvetica|italic">Helvetica Italic</option>
              <option value="Georgia">Georgia</option>
              <option value="Georgia|italic">Georgia Italic</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Times New Roman|italic">Times New Roman Italic</option>
              <option value="Courier New">Courier New</option>
              <option value="Courier New|italic">Courier New Italic</option>
              <option value="Verdana">Verdana</option>
              <option value="Verdana|italic">Verdana Italic</option>
              <option value="Comic Sans MS">Comic Sans MS</option>
              <option value="Comic Sans MS|italic">Comic Sans MS Italic</option>
              <option value="Impact">Impact</option>
              <option value="Trebuchet MS">Trebuchet MS</option>
              <option value="Trebuchet MS|italic">Trebuchet MS Italic</option>
              <option value="Palatino">Palatino</option>
              <option value="Palatino|italic">Palatino Italic</option>
            </select>
          </div>
        </div>
      </div>

      <div className="preview-section">
        <h2>Preview</h2>
        <div className="whatsapp-status" ref={screenshotRef} style={{ fontFamily, fontStyle }}>
          {/* Progress Bar */}
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>

          {/* Header Section */}
          <div className="header-section">
            <div className="header-left">
              <IoArrowBack className="back-icon" />
              <div className="profile-container">
                {profilePic && (
                  <img src={profilePic} alt="Profile" className="profile-pic" />
                )}
                <div className="add-status-icon">
                  <IoAdd />
                </div>
              </div>
              <div className="profile-info">
                <div className="status-title">My status</div>
                <div className="status-time">
                  Yesterday, {timeNumber ? timeNumber : '--'}:{currentMinutesForSS || randomMinutes} {timePeriod}
                </div>
              </div>
            </div>
            <IoEllipsisVertical className="menu-icon" />
          </div>

          {/* Status Content */}
          <div className="status-content">
            {isVideo && statusVideo ? (
              <video 
                ref={videoRef}
                src={statusVideo} 
                className="status-media"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : statusImage ? (
              <img src={statusImage} alt="Status" className="status-media" />
            ) : null}
          </div>

          {/* Status Text */}
          {statusText && (
            <div className="status-text-container">
              <p className="status-text">{detectAndRenderLinks(statusText)}</p>
            </div>
          )}

          {/* Views Section */}
          {views && (
            <div className="views-section">
              <div className="custom-eye-icon">
                <CustomEyeIcon />
              </div>
              <span className="view-count">{views === '51' && currentViewForSS ? currentViewForSS : views}</span>
            </div>
          )}
        </div>
          <button className="generate-btn" onClick={generateScreenshot}>
            Generate Screenshot
          </button>
      </div>
    </div>
  )
}

export default App
