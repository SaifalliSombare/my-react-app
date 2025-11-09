import { useState, useRef } from 'react'
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
  const [statusImage, setStatusImage] = useState(null)
  const [statusVideo, setStatusVideo] = useState(null)
  const [profilePic, setProfilePic] = useState(null)
  const [statusText, setStatusText] = useState('')
  const [views, setViews] = useState('')
  const [time, setTime] = useState('')
  const [fontFamily, setFontFamily] = useState('Arial')
  const [fontStyle, setFontStyle] = useState('normal')
  const [progress, setProgress] = useState(40 + Math.random() * 40) // Random 40-80%
  const [isVideo, setIsVideo] = useState(false)
  const screenshotRef = useRef(null)
  const videoRef = useRef(null)

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

  const generateScreenshot = async () => {
    if (!screenshotRef.current) return
    
    try {
      const element = screenshotRef.current
      
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
      })
      
      const link = document.createElement('a')
      link.download = 'whatsapp-status-screenshot.png'
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()
    } catch (error) {
      console.error('Error generating screenshot:', error)
      alert('Failed to generate screenshot. Please try again.')
    }
  }

  return (
    <div className="app-container">
      <div className="upload-section">
        <h1>WhatsApp Status Screenshot Generator</h1>
        
        <div className="upload-controls">
          <div className="upload-group">
            <label>Status Image/Video:</label>
            <input type="file" accept="image/*,video/*" onChange={handleStatusUpload} />
          </div>

          <div className="upload-group">
            <label>Profile Picture:</label>
            <input type="file" accept="image/*" onChange={handleProfileUpload} />
          </div>

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
            <label>Time (e.g., 2 hours ago):</label>
            <input 
              type="text" 
              value={time} 
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g., 2 hours ago"
            />
          </div>

          <div className="upload-group">
            <label>Views:</label>
            <input 
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

          <button className="generate-btn" onClick={generateScreenshot}>
            Generate Screenshot
          </button>
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
                {time && <div className="status-time">{time}</div>}
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
              <span className="view-count">{views}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
