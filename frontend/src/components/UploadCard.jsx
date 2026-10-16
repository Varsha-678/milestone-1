import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileCheck, 
  FileVideo, 
  FileImage, 
  X, 
  Sliders, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  HardHat,
  Shield,
  Eye
} from 'lucide-react';
import { analyzeFile } from '../services/api';

const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'avi', 'mov'];

export default function UploadCard({ onAnalysisComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileType, setFileType] = useState(null); // 'image' or 'video'
  const [isDragging, setIsDragging] = useState(false);
  const [confThreshold, setConfThreshold] = useState(0.25);
  
  // PPE Policy toggles
  const [requiredItems, setRequiredItems] = useState(['helmet', 'vest']);
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  const fileInputRef = useRef(null);

  const toggleRequiredItem = (item) => {
    setRequiredItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleFileSelection = (files) => {
    setErrorMessage(null);
    if (!files || files.length === 0) return;

    if (files.length > 1) {
      setErrorMessage("Please select only one file per submission.");
      return;
    }

    const file = files[0];
    const ext = file.name.split('.').pop().toLowerCase();

    if (!ALLOWED_EXTS.includes(ext)) {
      setErrorMessage("Unsupported file format. Please upload JPG, PNG, WEBP, MP4, AVI, or MOV.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage("File size exceeds the configured upload limit of 50 MB.");
      return;
    }

    setSelectedFile(file);
    const isVid = ['mp4', 'avi', 'mov'].includes(ext);
    setFileType(isVid ? 'video' : 'image');
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileSelection(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileType(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setProgressStep('Uploading & validating media contents...');

    try {
      setTimeout(() => setProgressStep('Running Ultralytics YOLOv8 inference...'), 600);
      setTimeout(() => setProgressStep('Evaluating compliance against safety policy...'), 1400);

      const result = await analyzeFile(
        selectedFile,
        confThreshold,
        requiredItems
      );

      setProgressStep('Analysis finished successfully!');
      setTimeout(() => {
        setIsSubmitting(false);
        onAnalysisComplete(result);
      }, 500);

    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'An error occurred during safety analysis.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-4xl mx-auto">
      <div className="border-b border-slate-100 pb-4 mb-6">
        <h2 className="text-xl font-bold text-slate-900">Upload Media for PPE Inspection</h2>
        <p className="text-sm text-slate-500 mt-1">
          Submit one image or video for workplace safety and protective equipment compliance analysis.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div className="text-sm">
            <span className="font-semibold">Validation Notice: </span>
            {errorMessage}
          </div>
        </div>
      )}

      {/* Drag & Drop Zone */}
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-teal-500 bg-teal-50/50'
              : 'border-slate-300 hover:border-teal-600 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileSelection(e.target.files)}
            className="hidden"
            accept=".jpg,.jpeg,.png,.webp,.mp4,.avi,.mov"
          />

          <div className="mx-auto w-14 h-14 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base font-semibold text-slate-800">
            Click to browse or drag & drop media here
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Supported Images: JPG, PNG, WEBP &nbsp;|&nbsp; Supported Videos: MP4, AVI, MOV (Max 50 MB)
          </p>
          <p className="text-xs font-medium text-teal-700 mt-3">
            Single file submission only
          </p>
        </div>
      ) : (
        /* File Selected Preview Area */
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                {fileType === 'video' ? <FileVideo className="w-6 h-6" /> : <FileImage className="w-6 h-6" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500">
                  {fileType.toUpperCase()} &bull; {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>

            <button
              onClick={handleRemoveFile}
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-100/60 border border-rose-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Remove File</span>
            </button>
          </div>

          {/* Media Preview Box */}
          <div className="bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center max-h-96 border border-slate-800">
            {fileType === 'image' ? (
              <img
                src={previewUrl}
                alt="Selected preview"
                className="max-h-96 w-auto object-contain"
              />
            ) : (
              <video
                src={previewUrl}
                controls
                className="max-h-96 w-full"
              />
            )}
          </div>

          {/* Configuration Accordion */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <div className="flex items-center space-x-2 text-sm font-semibold text-slate-800">
              <Sliders className="w-4 h-4 text-teal-700" />
              <span>Safety Inspection Policy & Parameters</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Required PPE Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Required PPE for Site Compliance:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'helmet', label: 'Safety Helmet' },
                    { id: 'vest', label: 'Safety Vest' },
                    { id: 'mask', label: 'Safety Mask' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleRequiredItem(item.id)}
                      className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                        requiredItems.includes(item.id)
                          ? 'bg-teal-700 text-white border-teal-800'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {requiredItems.includes(item.id) ? '✓ ' : '+ '}
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Required items not detected will be flagged as potential violations.
                </p>
              </div>

              {/* Confidence Threshold */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Confidence Threshold:
                  </label>
                  <span className="text-xs font-bold text-teal-800 font-mono">
                    {Math.round(confThreshold * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.80"
                  step="0.05"
                  value={confThreshold}
                  onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                  className="w-full accent-teal-700 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>10% (High Recall)</span>
                  <span>45% (Balanced)</span>
                  <span>80% (Strict)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full py-3.5 px-6 rounded-xl font-semibold text-white shadow-xs flex items-center justify-center space-x-2 transition-all ${
                isSubmitting
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-teal-800 hover:bg-teal-900 active:scale-[0.99] cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{progressStep}</span>
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  <span>Analyze {fileType === 'video' ? 'Video' : 'Image'} with YOLOv8</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
