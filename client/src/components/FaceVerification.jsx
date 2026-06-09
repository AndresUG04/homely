import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { X, Camera } from "lucide-react";
import { api } from "../config/api";

const AVATAR_BASE_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars`
  : "";

export default function FaceVerification({ avatarUrl, token, onVerified, onClose }) {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState("Cargando modelos...");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadModels();
  }, []);

  async function loadModels() {
    try {
      await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      await faceapi.nets.faceExpressionNet.loadFromUri("/models");
      setModelsLoaded(true);
      setStatus("Sonríe a la cámara y presiona Verificar");
    } catch (err) {
      console.error(err);
      setStatus("Error al cargar modelos");
    }
  }

  async function handleVerify() {
    if (!webcamRef.current) return;
    setVerifying(true);
    setStatus("Verificando...");

    try {
      const screenshot = webcamRef.current.getScreenshot();
      if (!screenshot) {
        setStatus("No se pudo capturar la imagen");
        setVerifying(false);
        return;
      }

      const img = await faceapi.fetchImage(screenshot);

      const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceExpressions();

      if (!detection) {
        setStatus("No se detectó una cara");
        setVerifying(false);
        return;
      }

      if (detection.expressions.happy < 0.7) {
        setStatus("Debes sonreír más");
        setVerifying(false);
        return;
      }

      const profileImage = await faceapi.fetchImage(`${AVATAR_BASE_URL}/${avatarUrl}`);

      const [profileDetection, webcamDetection] = await Promise.all([
        faceapi.detectSingleFace(profileImage).withFaceLandmarks().withFaceDescriptor(),
        faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor(),
      ]);

      if (!profileDetection) {
        setStatus("No se detectó una cara en tu foto de perfil");
        setVerifying(false);
        return;
      }

      if (!webcamDetection) {
        setStatus("No se detectó una cara");
        setVerifying(false);
        return;
      }

      const distance = faceapi.euclideanDistance(
        profileDetection.descriptor,
        webcamDetection.descriptor
      );

      if (distance < 0.55) {
        setStatus(`¡Coincidencia! (${distance.toFixed(3)})`);
        const data = await api.post("/api/users/face-verify", {}, token);
        if (!data.error) {
          setTimeout(() => onVerified(), 1000);
        } else {
          setStatus("Error al guardar verificación");
        }
      } else {
        setStatus(`No coincide (${distance.toFixed(3)}), intenta de nuevo`);
      }
    } catch (err) {
      console.error(err);
      setStatus("Error durante la verificación");
    }
    setVerifying(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
            Verificación Facial
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#D06222]/10 transition-colors text-[#5C3A1E]/60 hover:text-[#D06224]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm mb-4 text-center font-medium"
          style={{
            color: status.includes("¡Coincidencia") ? "#22C55E" :
                   status.includes("No coincide") || status.includes("Error") || status.includes("Debes") ? "#AE431E" :
                   status.includes("Verificado") ? "#22C55E" : "#5C3A1E"
          }}>
          {status}
        </p>

        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="w-full rounded-xl mb-4"
          videoConstraints={{ facingMode: "user" }}
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ backgroundColor: "#D0622215", color: "#D06224" }}
          >
            Cancelar
          </button>
          <button
            disabled={!modelsLoaded || verifying}
            onClick={handleVerify}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              backgroundColor: !modelsLoaded || verifying ? "#D0622470" : "#D06224",
              boxShadow: !modelsLoaded || verifying ? "none" : "0 4px 12px rgba(208,98,36,0.25)",
            }}
          >
            {verifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                Verificando...
              </>
            ) : modelsLoaded ? (
              <>
                <Camera className="w-4 h-4" />
                Verificar
              </>
            ) : "Cargando..."}
          </button>
        </div>
      </div>
    </div>
  );
}
