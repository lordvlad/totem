import { Modal, Button, ActionIcon, Tooltip, Group, Box, Center, Text, Loader, TextInput } from "@mantine/core";
import { useState, useRef, useEffect, useCallback } from "react";
import * as lamejs from 'lamejs';
import Microphone from "./icons/Microphone";
import Trash from "./icons/Trash";
import CircleStop from "./icons/CircleStop";
import { useI18n } from "../hooks/useI18n";
import { iconStyle } from "../util/constants";
import { useAlert } from "./Alert";
import { useLibrary } from "../hooks/useLibrary"; // Import useLibrary

interface RecordModalProps {
  opened: boolean;
  onClose: () => void;
  // onAddAudio prop is removed as RecordModal now uses useLibrary.addRecording directly
}

export function RecordModal({ opened, onClose }: RecordModalProps) {
  const i18n = useI18n();
  const alert = useAlert();
  const { addRecording, value: libraryState } = useLibrary(); // Get addRecording and full library state
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordedAudioURL, setRecordedAudioURL] = useState<string | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isEncoding, setIsEncoding] = useState(false);
  const [customFilename, setCustomFilename] = useState(""); // State for custom filename

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const cleanupResources = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    if (recordedAudioURL) {
      URL.revokeObjectURL(recordedAudioURL);
      setRecordedAudioURL(null);
    }
    setRecordedAudioBlob(null);
  }, [recordedAudioURL]);

  const requestMicrophonePermission = useCallback(async () => {
    setPermissionError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = i18n`Microphone access is not supported by your browser.`;
      setPermissionError(errorMsg);
      alert.show(errorMsg, { type: "error" });
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      // Attempt to get a common MIME type, fall back if not supported
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/wav', 'audio/webm'];
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
      if (!selectedMimeType) {
        console.warn("No preferred MIME type supported, using default.");
        // Let the browser decide, or handle error
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, selectedMimeType ? { mimeType: selectedMimeType } : undefined);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        // Use the selectedMimeType or the recorder's mimeType
        const blobMimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: blobMimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioURL(audioUrl);
        setRecordedAudioBlob(audioBlob);
        setIsRecording(false);
        setHasRecording(true);
        audioChunksRef.current = []; // Clear for next recording
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        const errorMsg = i18n`Recording failed.`;
        alert.show(errorMsg, { type: "error" });
        setIsRecording(false);
        setHasRecording(false);
      };
      return true;
    } catch (err) {
      console.error("Error accessing microphone:", err);
      const errorMsg = i18n`Microphone permission denied. Please enable it in your browser settings.`;
      setPermissionError(errorMsg);
      alert.show(errorMsg, { type: "error" });
      return false;
    }
  }, [i18n, alert]);

  useEffect(() => {
    if (opened) {
      // Request permission when modal opens, if not already available
      if (!mediaStreamRef.current && !mediaRecorderRef.current) {
        requestMicrophonePermission();
      }
    } else {
      // Cleanup when modal closes
      cleanupResources();
      setIsRecording(false);
      setHasRecording(false);
      setPermissionError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, cleanupResources]); // requestMicrophonePermission is not added to avoid re-requesting on every render if already denied

  const handleRecordActionClick = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      // State will be updated in onstop handler
    } else if (hasRecording) {
      // Delete recording
      if (recordedAudioURL) URL.revokeObjectURL(recordedAudioURL);
      setRecordedAudioURL(null);
      setRecordedAudioBlob(null);
      setHasRecording(false);
      setPermissionError(null); // Clear permission error if user deletes recording
    } else {
      // Start recording
      audioChunksRef.current = []; // Clear previous chunks
      if (recordedAudioURL) URL.revokeObjectURL(recordedAudioURL); // Clear previous URL
      setRecordedAudioURL(null);
      setRecordedAudioBlob(null);

      let hasPermission = !!mediaRecorderRef.current;
      if (!mediaRecorderRef.current || mediaStreamRef.current?.getAudioTracks().every(track => track.readyState === 'ended')) {
         // Re-request permission if stream ended or not initialized
        cleanupResources(); // Clean up any old stream first
        hasPermission = await requestMicrophonePermission();
      }

      if (hasPermission && mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.start();
          setIsRecording(true);
          setHasRecording(false);
          setPermissionError(null);
        } catch (e) {
            console.error("Error starting recording:", e);
            alert.show(i18n`Could not start recording.`, { type: "error" });
        }
      } else if (!permissionError) {
        // If no explicit permission error set but still failed to get recorder
        const errorMsg = i18n`Could not access microphone. Please check permissions.`;
        setPermissionError(errorMsg);
        // alert.show(errorMsg, { type: "error" }); // Already shown by requestMicrophonePermission
      }
    }
  };

  const handleCloseModal = () => {
    cleanupResources();
    setIsRecording(false);
    setHasRecording(false);
    setRecordedAudioBlob(null);
    setRecordedAudioURL(null);
    setPermissionError(null);
      setIsEncoding(false); // Reset encoding state
    onClose();
  };

  const encodeAudioToMp3 = async (audioBlob: Blob): Promise<Blob> => {
    if (!audioBlob) {
        throw new Error("No audio blob provided for encoding.");
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    
    // For simplicity, using mono. If stereo, interleave or take one channel.
    // LameJS expects Int16Array samples.
    let pcmData = new Int16Array(audioBuffer.length * numChannels);
    
    if (numChannels === 2) { // Stereo
        const left = audioBuffer.getChannelData(0);
        const right = audioBuffer.getChannelData(1);
        for (let i = 0; i < audioBuffer.length; i++) {
            pcmData[i*2] = Math.max(-32768, Math.min(32767, Math.floor(left[i] * 32768)));
            pcmData[i*2+1] = Math.max(-32768, Math.min(32767, Math.floor(right[i] * 32768)));
        }
    } else { // Mono
        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < audioBuffer.length; i++) {
            pcmData[i] = Math.max(-32768, Math.min(32767, Math.floor(channelData[i] * 32768)));
        }
    }
    
    // Using 1 channel for mono output, sampleRate from input, and 128kbps bitrate as an example
    const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, 128);
    const mp3Data: Int8Array[] = [];

    const bufferSize = 1152 * numChannels; // Recommended buffer size for lamejs
    for (let i = 0; i < pcmData.length; i += bufferSize) {
        const chunk = pcmData.subarray(i, Math.min(i + bufferSize, pcmData.length));
        const mp3buf = mp3encoder.encodeBuffer(chunk);
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
    }
    const flush = mp3encoder.flush();
    if (flush.length > 0) {
        mp3Data.push(flush);
    }

    return new Blob(mp3Data, { type: 'audio/mpeg' });
  };


  const handleAdd = async () => {
    if (recordedAudioBlob && hasRecording && !isEncoding && !libraryState.isLoading) {
      setIsEncoding(true);
      const filename = customFilename.trim() ? `${customFilename.trim().replace(/\.mp3$/i, '')}.mp3` : `recording-${Date.now()}.mp3`;
      try {
        const mp3Blob = await encodeAudioToMp3(recordedAudioBlob);
        await addRecording(mp3Blob, filename); // Call useLibrary's addRecording
        
        // Reset states specific to the current recording
        setHasRecording(false); 
        setRecordedAudioBlob(null);
        if (recordedAudioURL) URL.revokeObjectURL(recordedAudioURL);
        setRecordedAudioURL(null);
        setCustomFilename(""); // Reset custom filename
        
        handleCloseModal(); // This will also reset isEncoding via its own logic if modal closes
      } catch (error) {
        console.error("MP3 encoding or adding error:", error);
        alert.show(i18n`Failed to process and add audio. Error: ${(error as Error).message}`, { type: "error" });
        // Ensure isEncoding is reset even if addRecording or encoding fails
        setIsEncoding(false);
      }
      // No finally here for setIsEncoding, because handleCloseModal or error case handles it.
    } else if (!isEncoding && !libraryState.isLoading) { 
        handleCloseModal();
    }
  };

  const handleAddAndRecordAgain = async () => {
    let addedSuccessfully = false;
    if (recordedAudioBlob && hasRecording && !isEncoding && !libraryState.isLoading) {
      setIsEncoding(true);
      const filename = customFilename.trim() ? `${customFilename.trim().replace(/\.mp3$/i, '')}.mp3` : `recording-${Date.now()}.mp3`;
      try {
        const mp3Blob = await encodeAudioToMp3(recordedAudioBlob);
        await addRecording(mp3Blob, filename); // Call useLibrary's addRecording
        addedSuccessfully = true;
      } catch (error) {
        console.error("MP3 encoding or adding error:", error);
        alert.show(i18n`Failed to process and add audio. Error: ${(error as Error).message}`, { type: "error" });
        // Do not proceed to reset for new recording if encoding/adding fails, allow user to retry or cancel.
        setIsEncoding(false); 
        return; 
      }
      // setIsEncoding(false) will be handled after resetting states for new recording
    }
    
    // Reset for new recording only if not currently encoding or if it was successful
    // This logic ensures that if the user clicks "Add and record again" while still encoding the PREVIOUS track, it doesn't reset.
    if (addedSuccessfully || (!isEncoding && !libraryState.isLoading)) {
        setHasRecording(false);
        setIsRecording(false); // Ready to record again
        if (recordedAudioURL) URL.revokeObjectURL(recordedAudioURL);
        setRecordedAudioURL(null);
        setRecordedAudioBlob(null);
        audioChunksRef.current = [];
        setPermissionError(null);
        setCustomFilename(""); 
        setIsEncoding(false); // Reset encoding state after everything is done for this cycle
    }


    // Ensure recorder is ready for next recording (only if opened)
    let hasPermission = !!mediaRecorderRef.current && mediaStreamRef.current?.getAudioTracks().every(track => track.readyState === 'live');
    if (!hasPermission) {
        cleanupResources(); // Clean up before requesting again
        hasPermission = await requestMicrophonePermission();
    }
    
    if (hasPermission && mediaRecorderRef.current) {
        console.log("Ready for new recording, modal stays open.");
    } else if (!permissionError && !isEncoding) { // Only show if not already showing a permission error and not encoding
        alert.show(i18n`Could not prepare for next recording. Check microphone.`, { type: "error" });
    }
  };

  const getRecordIcon = () => {
    if (isEncoding) return <Loader size="lg" />;
    if (isRecording) return <CircleStop {...iconStyle} color="red" />;
    if (hasRecording) return <Trash {...iconStyle} color="orange" />;
    return <Microphone {...iconStyle} color={permissionError ? "gray" : "blue"}/>;
  };

  const getRecordTooltip = () => {
    // This part of the logic might need adjustment based on whether requestMicrophonePermission should be auto-called.
    // For now, it ensures that if the modal is open, we try to get permission if needed.
    if (opened && !mediaStreamRef.current?.active) { // Check if stream is active
        let hasPermission = !!mediaRecorderRef.current && mediaStreamRef.current?.getAudioTracks().every(track => track.readyState === 'live');
        if (!hasPermission) {
            cleanupResources(); // Clean up before requesting again
            hasPermission = await requestMicrophonePermission();
        }
        if (hasPermission && mediaRecorderRef.current) {
            console.log("Ready for new recording, modal stays open.");
        } else if (!permissionError && !isEncoding && !libraryState.isLoading) {
             alert.show(i18n`Could not prepare for next recording. Check microphone.`, { type: "error" });
        }
    }
  };

  const getRecordIcon = () => {
    if (isEncoding || (libraryState.isLoading && hasRecording)) return <Loader size="lg" />; // Show loader if encoding OR library is busy saving this recording
    if (isRecording) return <CircleStop {...iconStyle} color="red" />;
    if (hasRecording) return <Trash {...iconStyle} color="orange" />;
    return <Microphone {...iconStyle} color={permissionError ? "gray" : "blue"}/>;
  };

  const getRecordTooltip = () => {
    if (isEncoding) return i18n`Processing audio...`;
    if (libraryState.isLoading && hasRecording) return i18n`Adding to library...`;
    if (permissionError && !isRecording && !hasRecording) return i18n`Microphone permission needed`;
    if (isRecording) return i18n`Stop recording`;
    if (hasRecording) return i18n`Delete recording`;
    return i18n`Start recording`;
  };

  const mainActionDisabled = (permissionError && !hasRecording && !isRecording) || isEncoding || (libraryState.isLoading && hasRecording) ;
  };

  return (
    <Modal
      opened={opened}
      onClose={handleCloseModal}
      title={i18n`Record Audio`}
      size="md"
      centered
      trapFocus={false} // Allow interaction with permission prompts
    >
      <Box style={{ minHeight: 250, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Center style={{ flexGrow: 1, flexDirection: 'column', paddingBottom: '20px' }}>
          <Tooltip label={getRecordTooltip()} withArrow>
            <ActionIcon
              size={80} // Mantine v7 uses direct number for size
              radius="xl"
              variant="filled"
              color={isRecording ? "red" : (hasRecording ? "orange" : (permissionError ? "gray" : "blue"))}
              onClick={handleRecordActionClick}
              disabled={mainActionDisabled}
            >
              {getRecordIcon()}
            </ActionIcon>
          </Tooltip>

          {permissionError && !isRecording && !hasRecording && !isEncoding && (
            <Text color="red" mt="md" ta="center">{permissionError}</Text>
          )}
          
          {isEncoding && ( // General encoding message
             <Text mt="md" ta="center">{i18n`Processing audio...`}</Text>
          )}
          {!isEncoding && libraryState.isLoading && hasRecording && ( // Library saving this specific recording
             <Text mt="md" ta="center">{i18n`Adding to library...`}</Text>
          )}

          {isRecording && !isEncoding && !libraryState.isLoading && (
            <Box mt="lg" style={{ textAlign: 'center' }}>
              <div style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                border: '2px dashed #aaa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: 'auto',
                animation: 'pulse 1.5s infinite ease-in-out' // Simple pulse animation
              }}>
                {i18n`Recording...`}
              </div>
            </Box>
          )}

          {hasRecording && !isRecording && recordedAudioURL && !isEncoding && !libraryState.isLoading && (
            <Box mt="lg" style={{ textAlign: 'center', width: '100%' }}>
              <TextInput
                label={i18n`Filename (optional)`}
                placeholder={`recording-${Date.now()}.mp3`}
                value={customFilename}
                onChange={(event) => setCustomFilename(event.currentTarget.value)}
                mb="sm"
                disabled={isEncoding || libraryState.isLoading}
              />
              <audio src={recordedAudioURL} controls style={{width: '100%', marginTop: '10px'}} disabled={isEncoding || libraryState.isLoading} />
            </Box>
          )}
        </Center>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleCloseModal} disabled={isEncoding || libraryState.isLoading}>
            {i18n`Cancel`}
          </Button>
          <Button onClick={handleAdd} disabled={!hasRecording || isRecording || !recordedAudioBlob || isEncoding || libraryState.isLoading}>
            {i18n`Add`}
          </Button>
          <Button
            variant="outline"
            onClick={handleAddAndRecordAgain}
            disabled={!hasRecording || isRecording || !recordedAudioBlob || isEncoding || libraryState.isLoading}
          >
            {i18n`Add and record again`}
          </Button>
        </Group>
      </Box>
      {/* Simple CSS for pulsing animation */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(0.95); opacity: 0.7; }
            50% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.7; }
          }
        `}
      </style>
    </Modal>
  );
}
