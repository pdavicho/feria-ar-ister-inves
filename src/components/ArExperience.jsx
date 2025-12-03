import React, { useState } from 'react';
import { storage, db } from '../firebase-config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './ArExperience.css';

const ArExperience = ({ selectedAvatar, onGoToGallery, onBack }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // COMPRIMIR IMAGEN
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const maxWidth = 1920;
          const scale = Math.min(1, maxWidth / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { 
              type: 'image/jpeg',
              lastModified: Date.now()
            }));
          }, 'image/jpeg', 0.85);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // VALIDAR ARCHIVO
  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Solo se permiten imágenes (JPG, PNG, WEBP)');
    }
    
    if (file.size > maxSize) {
      throw new Error('La imagen es muy pesada (máx. 10MB)');
    }
    
    return true;
  };

  // SUBIR FOTO
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(10);

    try {
      validateFile(file);
      setUploadProgress(25);

      const compressedFile = await compressImage(file);
      setUploadProgress(50);

      const fileName = `feria_${Date.now()}_${selectedAvatar.name.replace(/\s+/g, '_')}.jpg`;
      const storageRef = ref(storage, `fotos_feria/${fileName}`);
      
      await uploadBytes(storageRef, compressedFile);
      setUploadProgress(75);

      const url = await getDownloadURL(storageRef);
      setUploadProgress(90);

      await addDoc(collection(db, "galeria"), {
        url: url,
        avatar: selectedAvatar.name,
        avatarFile: selectedAvatar.file,
        createdAt: serverTimestamp(),
        fileSize: compressedFile.size
      });
      
      setUploadProgress(100);
      
      setTimeout(() => {
        alert("¡Foto guardada exitosamente! 🎉");
        onGoToGallery();
      }, 500);

    } catch (error) {
      console.error('Error al subir foto:', error);
      
      let errorMessage = "Error al subir la foto. ";
      if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += "Intenta de nuevo.";
      }
      
      alert(errorMessage);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="ar-experience-container">
      {/* Header */}
      <div className="ar-header">
        <h2 className="avatar-title-centered">{selectedAvatar.name}</h2>
      </div>

      {/* MODEL VIEWER - CONFIGURADO PARA AR */}
      <div className="model-viewer-wrapper">
        <model-viewer
          src={selectedAvatar.file} 
          alt={selectedAvatar.name}
          ar
          ar-modes="scene-viewer webxr quick-look"
          ar-scale="auto"
          camera-controls
          shadow-intensity="1"
          auto-rotate
          rotation-per-second="30deg"
          tone-mapping="neutral"
          exposure="1"
          environment-image="neutral"
          className="model-viewer"
          ios-src=""
        >
          {/* Botón AR personalizado */}
          <button slot="ar-button" className="ar-button">
            📱 Abrir en AR y Tomar Foto
          </button>
          
          <div className="ar-help">
            <p>👆 Arrastra para rotar • 🔍 Pellizca para zoom</p>
          </div>
        </model-viewer>
      </div>

      {/* Instrucciones específicas */}
      <div className="ar-instructions">
        <div className="instruction-card android">
          <h3>Android - Instrucciones</h3>
          <ol>
            <li>Toca el botón "📱 Abrir en AR y Tomar Foto" arriba</li>
            <li>Se abrirá Google Scene Viewer</li>
            <li>Apunta tu cámara donde quieras colocar el avatar</li>
            <li>Toca el botón de captura ⚪</li>
            <li>La foto se guardará automáticamente en tu galería</li>
            <li>Regresa aquí y selecciónala para subirla</li>
          </ol>
        </div>

        <div className="instruction-card ios">
          <h3>iOS - Instrucciones</h3>
          <ol>
            <li>Toca el botón "📱 Abrir en AR y Tomar Foto" arriba</li>
            <li>Se abrirá AR Quick Look</li>
            <li>Posiciona el avatar en tu espacio</li>
            <li>Toca el botón de captura ⚪</li>
            <li>Regresa aquí y selecciona la foto</li>
          </ol>
        </div>
      </div>

      {/* Sección de subida */}
      <div className="upload-section">
        <div className="upload-card">
          <h3 className="upload-title">📤 ¿Ya tomaste tu foto en AR?</h3>
          <p className="upload-description">
            Selecciónala de tu galería para subirla
          </p>

          {uploading ? (
            <div className="uploading-state">
              <div className="spinner"></div>
              <p className="uploading-text">Subiendo tu foto...</p>
              
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="progress-text">{uploadProgress}%</p>
            </div>
          ) : (
            <>
              <input 
                type="file" 
                accept="image/*"
                id="galleryInput" 
                className="file-input-hidden"
                onChange={handleFileSelect}
              />
              
              <button 
                onClick={() => document.getElementById('galleryInput').click()}
                className="upload-button gallery-btn-single"
              >
                <span className="button-icon">🖼️</span>
                <span className="button-text">Seleccionar foto de galería</span>
              </button>

              <div className="upload-tip">
                <p>💡 <strong>No encuentras el botón de cámara en AR?</strong></p>
                <p>Algunos dispositivos Android no lo muestran. En ese caso, puedes:</p>
                <ul>
                  <li>Usar la captura de pantalla de tu teléfono</li>
                  <li>O tomar una foto normal del avatar en la pantalla</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArExperience;