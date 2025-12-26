import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';


const DPSaver = () => {
	const navigate = useNavigate();
	const [images, setImages] = useState([]); // for new uploads
	const [previews, setPreviews] = useState([]); // for new uploads
	const [savedImages, setSavedImages] = useState([]); // for localStorage
	const [loading, setLoading] = useState(false); // loader for add to list

	// Load previews from selected files

	// Compress image to ~200KB using canvas
	const compressImage = (src, mimeType = 'image/jpeg', targetSize = 200 * 1024) => {
		return new Promise((resolve) => {
			const img = new window.Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				// Resize to max 400x400 for DP
				const maxDim = 400;
				let w = img.width, h = img.height;
				if (w > maxDim || h > maxDim) {
					if (w > h) {
						h = Math.round(h * (maxDim / w));
						w = maxDim;
					} else {
						w = Math.round(w * (maxDim / h));
						h = maxDim;
					}
				}
				canvas.width = w;
				canvas.height = h;
				const ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, 0, w, h);
				let quality = 0.92;
				let dataUrl = canvas.toDataURL(mimeType, quality);
				// Reduce quality until under targetSize or minimum quality
				while (dataUrl.length > targetSize * 1.33 && quality > 0.5) {
					quality -= 0.07;
					dataUrl = canvas.toDataURL(mimeType, quality);
				}
				resolve(dataUrl);
			};
			img.src = src;
		});
	};

	const handleImageChange = async (e) => {
		const files = Array.from(e.target.files);
		setImages(files);
		const fileReaders = files.map(file => {
			return new Promise((resolve) => {
				const reader = new FileReader();
				reader.onload = (ev) => resolve(ev.target.result);
				reader.readAsDataURL(file);
			});
		});
		const rawPreviews = await Promise.all(fileReaders);
		// Compress each preview
		const compressedPreviews = await Promise.all(
			rawPreviews.map(src => compressImage(src))
		);
		setPreviews(compressedPreviews);
	};

	// Save images to localStorage with 0,1,2... keys (append to existing)
	const handleSave = async () => {
		setLoading(true);
		const current = getAllFromLocalStorage();
		const all = [...current, ...previews];
		saveAllToLocalStorage(all);
		setSavedImages(all);
		setImages([]);
		setPreviews([]);
        setTimeout(() => {
        setLoading(false);
        history.back();
        }, 4000);
	};

	// Get all images from localStorage in order
	const getAllFromLocalStorage = () => {
		const arr = [];
		let i = 0;
		while (true) {
			const item = localStorage.getItem(`dpsaver_${i}`);
			if (!item) break;
			arr.push(item);
			i++;
		}
		return arr;
	};

	// Save all images to localStorage with correct keys
	const saveAllToLocalStorage = (arr) => {
		// Clear old
		let i = 0;
		while (localStorage.getItem(`dpsaver_${i}`)) {
			localStorage.removeItem(`dpsaver_${i}`);
			i++;
		}
		// Set new
		arr.forEach((img, idx) => {
			localStorage.setItem(`dpsaver_${idx}`, img);
		});
	};

	// Delete image at index and re-sequence
	const handleDelete = (idx) => {
		const all = getAllFromLocalStorage();
		all.splice(idx, 1);
		saveAllToLocalStorage(all);
		setSavedImages(all);
	};

	// Load saved images on mount
	useEffect(() => {
		setSavedImages(getAllFromLocalStorage());
	}, []);

	return (
		
<>
			{loading && (
				<div className="fullscreen-loader-overlay">
					<span className="loader-spinner-large">
						<svg width="60" height="60" viewBox="0 0 50 50">
							<circle cx="25" cy="25" r="20" fill="none" stroke="#25d366" strokeWidth="6" strokeDasharray="31.4 31.4" strokeLinecap="round">
								<animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite" />
							</circle>
						</svg>
					</span>
				</div>
			)}
            
			<div className="upload-section">
			<button className="generate-btn" style={{ marginBottom: 16 }} onClick={() => navigate('/')}>Go Back</button>
			<h1>DP Saver</h1>
			<div className="upload-controls">
				<div className="upload-group">
					<label>Upload Multiple Images:</label>
					<input type="file" accept="image/*" multiple onChange={handleImageChange} />
				</div>
				{previews.length > 0 && (
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', margin: '1rem 0' }}>
						{previews.map((src, i) => (
							<img key={i} src={src} alt={`preview-${i}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #ccc' }} />
						))}
					</div>
				)}
				<button className="generate-btn" onClick={handleSave} disabled={previews.length === 0}>
					Add to List
				</button>
			</div>

			{/* List of saved images with delete option */}
			<div style={{ marginTop: '2rem' }}>
				<h2>Saved Images</h2>
				{savedImages.length === 0 ? (
					<div style={{ color: '#888' }}>No images saved yet.</div>
				) : (
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
						{savedImages.map((src, i) => (
							<div key={i} style={{ position: 'relative', display: 'inline-block' }}>
								<img src={src} alt={`saved-${i}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #ccc' }} />
								<button onClick={() => handleDelete(i)} style={{ position: 'absolute', top: 2, right: 2, background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontWeight: 700, fontSize: 14, lineHeight: '22px', padding: 0 }}>×</button>
								<div style={{ position: 'absolute', bottom: 2, left: 2, background: '#222', color: '#fff', borderRadius: 4, fontSize: 12, padding: '0 4px', opacity: 0.7 }}>{i}</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
        </>
	);
};

export default DPSaver;
