//RegisterPage.tsx//

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { pageTransition } from "../utils/motion";
import { CLUBS, POSITIONS } from "../utils/constants";
import Select, { components } from "react-select";
import "./RegisterPage.scss";
import Input from "../components/ui/Input/Input";
import Button from "../components/ui/Button/Button";
import { getLeagueStatus, registerPlayer } from "../api/playerApi";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import imageCompression from "browser-image-compression";
import type { ToastType } from "../components/ui/Toaster/Toast";
import Toast from "../components/ui/Toaster/Toast";
import type { PlayerPosition } from "../types";

const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    minHeight: "48px",
    backgroundColor: "var(--color-white)",
    // Exact border logic from your Input.scss
    border: state.isFocused
      ? "2px solid var(--color-red)"
      : "2px solid var(--color-gray-medium)",
    borderRadius: "var(--radius-sm)",
    boxShadow: state.isFocused ? "0 0 0 4px rgba(237, 28, 36, 0.05)" : "none",
    transition: "var(--transition-smooth)",
    "&:hover": {
      borderColor: state.isFocused
        ? "var(--color-red)"
        : "var(--color-gray-medium)",
    },
    padding: "0 5px",
    fontFamily: "var(--font-content)",
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: "0 8px",
  }),
  placeholder: (base: any) => ({
    ...base,
    color: "#adb5bd",
    fontSize: "1rem",
  }),
  singleValue: (base: any) => ({
    ...base,
    color: "var(--color-black)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: "var(--radius-sm)",
    boxShadow: "var(--shadow-soft)",
    zIndex: 99,
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? "rgba(237, 28, 36, 0.05)" : "white",
    color: "var(--color-black)",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "var(--color-red)",
      color: "white",
    },
  }),
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  //State for preview images
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [fullPreview, setFullPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: ToastType;
  }>({
    isVisible: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // Use "instant" so they don't see the scroll happening
    });
  }, []);

  // Helper function to easily show toasts
  const showToast = (message: string, type: ToastType) => {
    setToast({ isVisible: true, message, type });
  };

  const validationSchema = Yup.object({
    fullname: Yup.string().min(3, "Name too short").required("Required"),
    phone: Yup.string()
      .matches(/^[0-9]{10}$/, "10 digits required")
      .required("Required"),
    place: Yup.string().required("Required"),
    // age: Yup.number().min(10).max(60).required("Required"),
    club: Yup.string().required("Required"),
    position: Yup.string().required("Required"),
  });

  const formik = useFormik({
    initialValues: {
      fullname: "",
      phone: "",
      place: "",
      // age: "",
      club: "",
      position: "",
      facePhoto: null as File | null,
      fullPhoto: null as File | null,
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        showToast("System Error: Environment variables are missing.", "error");
        return;
      }

      setIsSubmitting(true);

      try {
        // STEP 1: PRE-CHECK LIMITS (No upload happens yet)
        const status = await getLeagueStatus();

        if (status.total >= 48) {
          throw new Error("League is full! Max 48 players reached.");
        }

        if (values.position === "GK") {
          if (status.gkCount >= 7)
            throw new Error("Goalkeeper slots are full (7/7).");
        } else {
          if (status.outfieldCount >= 41)
            throw new Error("Outfield player slots are full (41/41).");
        }

        // STEP 2: UPLOAD IMAGES (Only happens if STEP 1 passes)
        const uploadToCloudinary = async (file: File) => {
          const options = {
            maxSizeMB: 1, // Target max size (1MB is plenty for web)
            maxWidthOrHeight: 1024, // Resize if larger than 1024px
            useWebWorker: true,
          };

          let compressedFile = file;

          try {
            compressedFile = await imageCompression(file, options);
            console.log(
              `Original: ${file.size / 1024 / 1024} MB | Compressed: ${compressedFile.size / 1024 / 1024} MB`,
            );
          } catch (error) {
            console.warn("Compression failed, using original file", error);
          }
          const formData = new FormData();
          formData.append("file", compressedFile);
          formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: "POST", body: formData },
          );

          if (!response.ok) throw new Error("Cloudinary upload failed");
          const data = await response.json();
          return data.secure_url;
        };

        const faceUrl = await uploadToCloudinary(values.facePhoto!);
        const fullUrl = await uploadToCloudinary(values.fullPhoto!);

        // STEP 3: SAVE TO FIRESTORE
        await registerPlayer({
          fullname: values.fullname,
          phone: values.phone,
          place: values.place,
          club: values.club,
          position: values.position as PlayerPosition,
          facePhotoUrl: faceUrl,
          fullPhotoUrl: fullUrl,
        });

        await queryClient.invalidateQueries({ queryKey: ["players"] }); //FORCE REFRESH: Tell TanStack Query the 'players' list is now old

        showToast("Registratered Successfully!", "success");
        setTimeout(() => {
          navigate("/players");
        }, 1000);
      } catch (error: any) {
        console.error("Registration Error:", error);
        showToast(error.message || "An unexpected error occurred.", "error");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => {
    const file = e.currentTarget.files?.[0];
    if (file) {
      formik.setFieldValue(field, file);
      const reader = new FileReader();
      reader.onloadend = () => {
        field === "facePhoto"
          ? setFacePreview(reader.result as string)
          : setFullPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // The component that renders the logo + text inside the list
  const IconOption = (props: any) => (
    <components.Option {...props}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <img
          src={props.data.logo}
          alt=""
          style={{ width: "24px", height: "24px", objectFit: "contain" }}
        />
        {props.data.label}
      </div>
    </components.Option>
  );

  const SingleValueWithIcon = (props: any) => (
    <components.SingleValue {...props}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <img
          src={props.data.logo}
          alt=""
          style={{ width: "20px", height: "20px", objectFit: "contain" }}
        />
        {props.data.label}
      </div>
    </components.SingleValue>
  );

  const PositionOption = (props: any) => (
    <components.Option {...props}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "1.2rem" }}>{props.data.emoji}</span>
        {props.data.label}
      </div>
    </components.Option>
  );

  const PositionValue = (props: any) => (
    <components.SingleValue {...props}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span>{props.data.emoji}</span>
        {props.data.label}
      </div>
    </components.SingleValue>
  );

  return (
    <motion.div {...pageTransition} className="register-container">
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />

      <div className="form-card">
        <header>
          <h2>
            PLAYER <span>REGISTRATION</span>
          </h2>
          <p>Fill in the details to join the league</p>
        </header>

        <form onSubmit={formik.handleSubmit}>
          <Input
            label="Full Name"
            {...formik.getFieldProps("fullname")}
            error={formik.errors.fullname}
            touched={formik.touched.fullname}
          />

          <div className="input-row">
            <Input
              label="Phone"
              type="tel"
              {...formik.getFieldProps("phone")}
              error={formik.errors.phone}
              touched={formik.touched.phone}
            />

            <Input
              label="Place"
              {...formik.getFieldProps("place")}
              error={formik.errors.place}
              touched={formik.touched.place}
            />
          </div>

          <div className="input-row">
            {/* CLUB SELECT */}
            <div
              className={`input-container ${formik.touched.club && formik.errors.club ? "invalid" : ""}`}
            >
              <label className="input-label">Club</label>
              <div className="input-wrapper">
                <Select
                  name="club"
                  options={CLUBS}
                  styles={customSelectStyles}
                  components={{
                    Option: IconOption,
                    SingleValue: SingleValueWithIcon,
                    IndicatorSeparator: () => null,
                  }}
                  placeholder="Select Club"
                  onChange={(option) =>
                    formik.setFieldValue("club", option ? option.label : "")
                  }
                  onBlur={() => formik.setFieldTouched("club", true)}
                  value={CLUBS.find((c) => c.label === formik.values.club)}
                />
              </div>
              {formik.touched.club && formik.errors.club && (
                <span className="error-message">{formik.errors.club}</span>
              )}
            </div>

           {/* POSITION SELECT */}
  <div className={`input-container ${formik.touched.position && formik.errors.position ? 'invalid' : ''}`}>
    <label className="input-label">Position</label>
    <div className="input-wrapper">
      <Select
        name="position"
        options={POSITIONS}
        styles={customSelectStyles}
        components={{ 
          Option: PositionOption, 
          SingleValue: PositionValue,
          IndicatorSeparator: () => null 
        }}
        placeholder="Select Position" // <-- This will now show initially
        onChange={(option) => formik.setFieldValue("position", option ? option.value : "")}
        onBlur={() => formik.setFieldTouched("position", true)}
        // Find will return undefined initially, showing the placeholder
        value={POSITIONS.find(p => p.value === formik.values.position) || null} 
      />
    </div>
    {formik.touched.position && formik.errors.position && (
      <span className="error-message">{formik.errors.position as string}</span>
    )}
  </div>
          </div>

          <div className="photo-section">
            {/* Face Photo Card */}
            <div className={`upload-card ${facePreview ? "has-image" : ""}`}>
              <label>Face Photo</label>
              <div className="preview-container">
                {facePreview ? (
                  <>
                    <img src={facePreview} alt="Face Preview" />
                    <button
                      type="button"
                      className="remove-btn"
                      title="Remove Photo"
                      onClick={() => {
                        setFullPreview(null);
                        formik.setFieldValue("fullPhoto", null);
                      }}
                    >
                      <X size={16} strokeWidth={2.5} />{" "}
                      {/* Replaced text with icon */}
                    </button>
                  </>
                ) : (
                  <div className="upload-placeholder">
                    <span>+ Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "facePhoto")}
                    />
                  </div>
                )}
              </div>
            </div>{" "}
            {/* Closing Face Photo Card properly */}
            {/* Full Body Photo Card */}
            <div className={`upload-card ${fullPreview ? "has-image" : ""}`}>
              <label>Normal Photo</label>
              <div className="preview-container">
                {fullPreview ? (
                  <>
                    <img src={fullPreview} alt="Full Preview" />
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => {
                        setFullPreview(null);
                        formik.setFieldValue("fullPhoto", null);
                      }}
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <div className="upload-placeholder">
                    <span>+ Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "fullPhoto")}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button type="submit" isLoading={isSubmitting} variant="secondary">
            SUBMIT REGISTRATION
          </Button>
        </form>
      </div>
    </motion.div>
  );
};

export default RegisterPage;
