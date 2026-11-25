import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { DepartmentRecommendation, ComplaintPriority, ComplaintDetail } from '../services/types';
import { SmartLocationPicker, LocationSelection } from '../components/SmartLocationPicker';
import { MapViewer } from '../components/MapViewer';
import {
  FileText,
  MapPin,
  Camera,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Info,
  Shield,
  Upload,
  X,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

const CATEGORIES = [
  // Road Maintenance
  { value: 'potholes', label: 'Potholes / Road Surface Hazard', dept: 'Road Maintenance' },
  { value: 'damaged_roads', label: 'Damaged Roads / Roadbed Cave-in', dept: 'Road Maintenance' },
  { value: 'broken_road_surfaces', label: 'Broken Pavement / Bitumen Deterioration', dept: 'Road Maintenance' },

  // Waste Management
  { value: 'garbage_accumulation', label: 'Garbage Accumulation on Streets', dept: 'Waste Management' },
  { value: 'overflowing_bins', label: 'Overflowing Public Municipal Bins', dept: 'Waste Management' },
  { value: 'waste_collection', label: 'Missed Door-to-Door Waste Collection', dept: 'Waste Management' },

  // Water Supply
  { value: 'water_leakage', label: 'Potable Water Pipeline Rupture / Leakage', dept: 'Water Supply' },
  { value: 'damaged_pipelines', label: 'Damaged Distribution Main Pipe', dept: 'Water Supply' },
  { value: 'water_disruption', label: 'Complete Water Supply Interruption / Zero Pressure', dept: 'Water Supply' },

  // Drainage and Sewage
  { value: 'blocked_drains', label: 'Blocked Storm Drain / Silt Accumulation', dept: 'Drainage & Sewage' },
  { value: 'sewage_overflow', label: 'Sanitary Sewer Overflow / Manhole Backflow', dept: 'Drainage & Sewage' },
  { value: 'waterlogging', label: 'Street Waterlogging / Stagnant Runoff', dept: 'Drainage & Sewage' },
];

export const CreateComplaintPage: React.FC = () => {
  const navigate = useNavigate();

  // Wizard Step (1: Problem, 2: Location, 3: Photo, 4: Review)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('potholes');
  const [priority, setPriority] = useState<ComplaintPriority>('medium');

  // Location states
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState('');
  const [latitude, setLatitude] = useState<number | null>(12.9716);
  const [longitude, setLongitude] = useState<number | null>(77.5946);
  const [geocodingId, setGeocodingId] = useState<string | undefined>(undefined);
  const [selectionMethod, setSelectionMethod] = useState<string>('search');
  const [additionalLandmark, setAdditionalLandmark] = useState('');

  // Photo states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  // Recommendation state
  const [recommendation, setRecommendation] = useState<DepartmentRecommendation | null>(null);
  const [isRecommending, setIsRecommending] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdComplaint, setCreatedComplaint] = useState<ComplaintDetail | null>(null);

  // Fetch department recommendation on category or title change
  useEffect(() => {
    let active = true;
    setIsRecommending(true);
    api.recommendDepartment(category, `${title} ${description}`)
      .then((res) => {
        if (active) setRecommendation(res);
      })
      .catch((e) => console.error('Recommendation fetch error:', e))
      .finally(() => {
        if (active) setIsRecommending(false);
      });

    return () => {
      active = false;
    };
  }, [category]);

  const handleLocationChange = (loc: LocationSelection) => {
    setAddress(loc.address);
    setLocality(loc.locality);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setGeocodingId(loc.geocodingId);
    setSelectionMethod(loc.selectionMethod);
  };

  const handleImageFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB limit. Please upload a smaller photo.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Supported formats are JPEG, PNG, and WEBP.');
      return;
    }
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  // Step Validations
  const validateStep1 = (): boolean => {
    setError(null);
    if (title.trim().length < 5) {
      setError('Complaint title must be at least 5 characters.');
      return false;
    }
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters.');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    setError(null);
    if (!address.trim() && (latitude === null || longitude === null)) {
      setError('Please select or search a location on the interactive map.');
      return false;
    }
    if (address.trim().length < 3) {
      setError('Please provide a specific street address or landmark.');
      return false;
    }
    return true;
  };

  const goToNextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setError(null);
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const goToPrevStep = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    const fullAddress = additionalLandmark.trim()
      ? `${additionalLandmark.trim()}, ${address.trim()}`
      : address.trim();

    try {
      const complaint = await api.createComplaint({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        address: fullAddress,
        locality: locality || 'Bengaluru',
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        geocoding_id: geocodingId,
        selection_method: selectionMethod,
      });

      if (selectedImage) {
        try {
          await api.uploadComplaintImage(complaint.id, selectedImage);
        } catch (uploadErr) {
          console.warn('Image upload notice:', uploadErr);
        }
      }

      setCreatedComplaint(complaint);
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please check inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success Confirmation Screen
  if (createdComplaint) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 bg-[#F0FDF4] text-[#16A34A] rounded-full mx-auto flex items-center justify-center border border-[#BBF7D0]">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#166534] bg-[#F0FDF4] px-3 py-1 rounded-full border border-[#BBF7D0]">
              Grievance Successfully Registered
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D] mt-3">
              Tracking ID: <span className="text-[#2563EB] font-mono">#{createdComplaint.tracking_id}</span>
            </h2>
            <p className="text-sm text-[#64748B] mt-2 max-w-lg mx-auto">
              Your grievance has been safely logged in CivicTrack Bengaluru and routed to the{' '}
              <strong className="text-[#172B4D]">{createdComplaint.recommended_department?.name || 'Department'}</strong>.
            </p>
          </div>

          {/* Quick Summary of Geotagged Location */}
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-left text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#172B4D]">
              <MapPin className="w-4 h-4 text-[#2563EB]" />
              <span>Geotagged Incident Location</span>
              {createdComplaint.locality && (
                <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded text-[11px] font-semibold border border-[#DBEAFE]">
                  {createdComplaint.locality}
                </span>
              )}
            </div>
            <p className="text-[#64748B] pl-6">{createdComplaint.address}</p>
            {createdComplaint.latitude && createdComplaint.longitude && (
              <div className="pl-6 font-mono text-[11px] text-[#94A3B8]">
                Coordinates: {createdComplaint.latitude.toFixed(6)}, {createdComplaint.longitude.toFixed(6)}
              </div>
            )}
          </div>

          {/* Next Steps Guidance */}
          <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg p-4 text-left text-xs space-y-2">
            <h4 className="font-bold text-[#1E40AF] uppercase tracking-wider text-[11px]">
              What happens next?
            </h4>
            <ul className="space-y-1.5 text-[#1E3A8A]">
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#2563EB]">1.</span>
                <span>Assigned departmental engineers review the reported hazard and dispatch inspection crews.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#2563EB]">2.</span>
                <span>You can follow live status changes, inspect resolution notes, and add follow-up evidence.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#2563EB]">3.</span>
                <span>You may record official BBMP Sahaya or BWSSB docket numbers under external submissions.</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-[#E2E8F0]">
            <Link
              to={`/complaints/${createdComplaint.id}`}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#17324D] hover:bg-[#0F2133] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors text-center"
            >
              View Complaint Timeline
            </Link>
            <button
              onClick={() => {
                setCreatedComplaint(null);
                setCurrentStep(1);
                setTitle('');
                setDescription('');
                setAddress('');
                setLocality('');
                setSelectedImage(null);
                setImagePreview(null);
                setAdditionalLandmark('');
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#172B4D] text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              Submit Another Grievance
            </button>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-6 py-2.5 text-[#64748B] hover:text-[#172B4D] text-sm font-medium transition-colors text-center"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#17324D] mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D]">
          Report a Civic Grievance
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Intelligent Grievance Reporting and Tracking for Bengaluru Municipal Services (BBMP, BWSSB, BESCOM).
        </p>
      </div>

      {/* 4-Step Progress Indicator */}
      <div className="mb-8">
        <div className="grid grid-cols-4 gap-2">
          {[
            { step: 1, label: 'Problem Info', icon: FileText },
            { step: 2, label: 'Location & Map', icon: MapPin },
            { step: 3, label: 'Photo Evidence', icon: Camera },
            { step: 4, label: 'Confirm & Submit', icon: CheckCircle2 },
          ].map((item) => {
            const Icon = item.icon;
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;

            return (
              <div
                key={item.step}
                className={`flex flex-col sm:flex-row items-center gap-2 p-2.5 rounded-lg border transition-all ${
                  isCurrent
                    ? 'bg-[#17324D] border-[#17324D] text-white shadow-sm'
                    : isCompleted
                    ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                    : 'bg-white border-[#E2E8F0] text-[#64748B]'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-white text-[#17324D]'
                      : isCompleted
                      ? 'bg-[#16A34A] text-white'
                      : 'bg-[#F1F5F9] text-[#64748B]'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : item.step}
                </div>
                <div className="min-w-0 text-center sm:text-left">
                  <div className="text-[11px] font-semibold truncate leading-tight">
                    {item.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1 font-medium">{error}</div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Card Wrapper */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6 sm:p-8">
        {/* ================= STEP 1: PROBLEM INFORMATION ================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-[#F1F5F9] pb-4">
              <h2 className="text-lg font-bold text-[#172B4D] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2563EB]" />
                <span>Step 1: Problem Information</span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Provide clear details about the civic issue to ensure prompt classification.
              </p>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-2">
                Issue Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    [{cat.dept}] — {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Recommended Department Banner */}
            {recommendation && (
              <div className="p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-2 font-semibold text-[#166534]">
                  <Sparkles className="w-4 h-4 text-[#16A34A]" />
                  <span>Recommended Department: {recommendation.department_name}</span>
                </div>
                <p className="text-[#166534] pl-6">{recommendation.explanation}</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-2">
                Complaint Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Deep pothole dangerous for two-wheelers on 100 Feet Road"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#172B4D] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
              <span className="text-[11px] text-[#64748B] mt-1 block">
                Be specific and mention key landmarks where applicable (minimum 5 characters).
              </span>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-2">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe the hazard, size, severity, duration, and safety implications for pedestrians and traffic..."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#172B4D] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
              <span className="text-[11px] text-[#64748B] mt-1 block">
                Minimum 10 characters. Include any safety risks.
              </span>
            </div>

            {/* Priority Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-2">
                Urgency / Priority Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { value: 'low', label: 'Low', desc: 'Minor inconvenience' },
                  { value: 'medium', label: 'Medium', desc: 'Standard repair needed' },
                  { value: 'high', label: 'High', desc: 'Active hazard' },
                  { value: 'urgent', label: 'Urgent', desc: 'Immediate risk to life' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setPriority(item.value as ComplaintPriority)}
                    className={`p-3 text-left rounded-lg border text-xs transition-all ${
                      priority === item.value
                        ? 'border-[#2563EB] bg-[#EFF6FF] ring-2 ring-[#2563EB]'
                        : 'border-[#E2E8F0] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="font-bold text-[#172B4D]">{item.label}</div>
                    <div className="text-[11px] text-[#64748B] mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="pt-4 border-t border-[#F1F5F9] flex justify-end">
              <button
                type="button"
                onClick={goToNextStep}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#17324D] hover:bg-[#0F2133] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
              >
                <span>Next: Location & Map</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: LOCATION SEARCH AND INTERACTIVE MAP ================= */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-[#F1F5F9] pb-4">
              <h2 className="text-lg font-bold text-[#172B4D] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#2563EB]" />
                <span>Step 2: Location Search and Interactive Map</span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Search an address in Bengaluru or click anywhere on the map to pin the incident.
              </p>
            </div>

            {/* Smart Location Picker with Leaflet + Nominatim */}
            <SmartLocationPicker
              initialLocation={{
                address,
                locality,
                latitude,
                longitude,
              }}
              onLocationChange={handleLocationChange}
              height="400px"
            />

            {/* Additional Landmark Details */}
            <div>
              <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-2">
                Specific Landmark / Spot Instructions (Optional)
              </label>
              <input
                type="text"
                value={additionalLandmark}
                onChange={(e) => setAdditionalLandmark(e.target.value)}
                placeholder="e.g., Near Baptist Hospital entrance, opposite petrol bunk, pillar #42..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#172B4D] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
              <span className="text-[11px] text-[#64748B] mt-1 block">
                Helps municipal field crews locate the exact pothole or leak faster.
              </span>
            </div>

            {/* Step 2 Actions */}
            <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-between">
              <button
                type="button"
                onClick={goToPrevStep}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#172B4D] text-sm font-semibold rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={goToNextStep}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#17324D] hover:bg-[#0F2133] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
              >
                <span>Next: Photo Evidence</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: PHOTO EVIDENCE / ATTACHMENTS ================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-[#F1F5F9] pb-4">
              <h2 className="text-lg font-bold text-[#172B4D] flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#2563EB]" />
                <span>Step 3: Photo Evidence / Attachments</span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Attach a clear photo of the damage. Reports with photos receive prioritized field inspection.
              </p>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingPhoto(true);
              }}
              onDragLeave={() => setIsDraggingPhoto(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDraggingPhoto
                  ? 'border-[#2563EB] bg-[#EFF6FF]'
                  : 'border-[#CBD5E1] hover:border-[#94A3B8] bg-[#F8FAFC]'
              }`}
            >
              {imagePreview ? (
                <div className="space-y-4">
                  <div className="relative inline-block max-w-sm rounded-lg overflow-hidden border border-[#E2E8F0] shadow-sm">
                    <img
                      src={imagePreview}
                      alt="Complaint preview"
                      className="max-h-64 w-auto object-contain mx-auto"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1.5 bg-[#172B4D]/80 hover:bg-[#172B4D] text-white rounded-full transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-[#64748B]">
                    <span className="font-semibold text-[#172B4D]">{selectedImage?.name}</span> (
                    {((selectedImage?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-white rounded-full mx-auto flex items-center justify-center border border-[#E2E8F0] text-[#2563EB] shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <label
                      htmlFor="photo-upload"
                      className="cursor-pointer text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                    >
                      Click to upload a photo
                    </label>
                    <span className="text-sm text-[#64748B]"> or drag and drop here</span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8]">
                    PNG, JPG, or WEBP up to 5MB.
                  </p>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Notice */}
            <div className="p-3 bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg text-xs flex items-start gap-2.5 text-[#1E40AF]">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Photographic evidence is strongly encouraged. Photos verify the exact condition of the roadway, water leakage, or overflowing bin for the maintenance engineer.
              </span>
            </div>

            {/* Step 3 Actions */}
            <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-between">
              <button
                type="button"
                onClick={goToPrevStep}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#172B4D] text-sm font-semibold rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={goToNextStep}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#17324D] hover:bg-[#0F2133] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
              >
                <span>Next: Review & Confirm</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: LOCATION & COMPLAINT CONFIRMATION ================= */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-[#F1F5F9] pb-4">
              <h2 className="text-lg font-bold text-[#172B4D] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                <span>Step 4: Location & Complaint Confirmation</span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Review all grievance details and verified coordinates prior to submission.
              </p>
            </div>

            {/* SECTION A: SELECTED COMPLAINT LOCATION CARD */}
            <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-xs font-bold text-[#172B4D] uppercase tracking-wider">
                    Selected Complaint Location
                  </span>
                  {locality && (
                    <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded text-[11px] font-semibold border border-[#DBEAFE]">
                      {locality}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
                >
                  Edit Location
                </button>
              </div>

              <div className="text-sm font-medium text-[#172B4D]">
                {additionalLandmark ? `${additionalLandmark}, ` : ''}{address}
              </div>

              {/* Coordinates & Selection Method Metadata */}
              {latitude !== null && longitude !== null && (
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#64748B] font-mono pt-2 border-t border-[#F1F5F9]">
                  <div>
                    <span className="text-[#94A3B8]">Latitude:</span> {latitude.toFixed(6)}
                  </div>
                  <div>
                    <span className="text-[#94A3B8]">Longitude:</span> {longitude.toFixed(6)}
                  </div>
                  <div>
                    <span className="text-[#94A3B8]">Method:</span>{' '}
                    <span className="capitalize text-[#172B4D]">{selectionMethod}</span>
                  </div>
                </div>
              )}

              {/* Small Interactive Map Preview */}
              {latitude !== null && longitude !== null && (
                <div className="pt-2">
                  <MapViewer
                    singleLocation={{
                      latitude,
                      longitude,
                      title,
                      address,
                      locality,
                      status: 'Submitted',
                    }}
                    height="180px"
                    interactive={false}
                  />
                </div>
              )}
            </div>

            {/* SECTION B: PROBLEM DETAILS SUMMARY CARD */}
            <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-xs font-bold text-[#172B4D] uppercase tracking-wider">
                    Problem Summary
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
                >
                  Edit Details
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#172B4D]">{title}</h3>
                <p className="text-xs text-[#64748B] mt-1 whitespace-pre-wrap">{description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F1F5F9] text-xs">
                <div className="px-2.5 py-1 bg-[#F1F5F9] text-[#172B4D] rounded font-medium">
                  Category: <span className="font-bold">{category}</span>
                </div>
                <div className="px-2.5 py-1 bg-[#EFF6FF] text-[#2563EB] rounded font-medium border border-[#DBEAFE]">
                  Department: <span className="font-bold">{recommendation?.department_name || 'Routing...'}</span>
                </div>
                <div className={`px-2.5 py-1 rounded font-bold uppercase text-[10px] tracking-wider ${
                  priority === 'urgent'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : priority === 'high'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  Priority: {priority}
                </div>
              </div>

              {/* Photo Preview Thumbnail */}
              {imagePreview && (
                <div className="pt-2 flex items-center gap-3">
                  <img
                    src={imagePreview}
                    alt="Uploaded thumbnail"
                    className="w-14 h-14 object-cover rounded-md border border-[#E2E8F0]"
                  />
                  <div className="text-xs text-[#64748B]">
                    <div className="font-semibold text-[#172B4D]">{selectedImage?.name}</div>
                    <div>Photo attached for field crew verification</div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION C: SUBMISSION TRANSPARENCY NOTICE */}
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs space-y-1.5 text-[#64748B]">
              <div className="flex items-center gap-2 font-semibold text-[#172B4D]">
                <Shield className="w-4 h-4 text-[#2563EB]" />
                <span>Civic Grievance Notice</span>
              </div>
              <p>
                Submitting this grievance records the incident with exact GPS coordinates in CivicTrack Bengaluru. Department staff will triage and dispatch ground teams. You can track this report using its generated tracking ID at any time.
              </p>
            </div>

            {/* Step 4 Actions */}
            <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-between">
              <button
                type="button"
                onClick={goToPrevStep}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#172B4D] text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-8 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Grievance...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Submit Grievance</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
