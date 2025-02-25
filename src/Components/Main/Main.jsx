import React, { useState, useEffect, useContext } from "react";
import "./Main.css";
import { assets } from "../../assets/assets";
import Sidebar from "../Sidebar/Sidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PromptContext } from "../../Context/Context";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by Error Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{ padding: "20px", backgroundColor: "red", color: "white" }}
        >
          <h2>Something went wrong!</h2>
          <p>{this.state.errorMessage}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

const Main = () => {
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaPreview1, setMediaPreview1] = useState(false);
  const [resultData, setResultData] = useState("");
  const [blank, setBlank] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [recentPrompt, setRecentPrompt] = useState("");
  const [selectedPromptResponse, setSelectedPromptResponse] = useState(null);
  const { recentPrompts } = useContext(PromptContext);
  const { recentResult } = useContext(PromptContext); // New state for the response
  const { query, selectedOption } = useContext(PromptContext);

  const fetchHistory = async () => {
    try {
      const response = await fetch("http://localhost:8000/prompts");
      const data = await response.json();
      console.log("Prompt History:", data.prompts);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (recentPrompts && query !== "") {
      setBlank(false);
      setMediaPreview(false);
      setResultData(recentResult);
      setRecentPrompt(query);
    }
  }, [recentResult, query]);

  const sendPromptToBackend = async () => {
    if (selectedFile) {
      handleMediaSubmit(); // Handle file upload if a file is selected
    } else {
      setInput(""); // Clear input text
      setBlank(false); // Set the blank state to false
      setResultData(""); // Clear previous result
      setMediaPreview(null); // Clear media preview
      setIsLoading(true); // Show loading indicator

      // Default API URL for Gemini
      let apiUrl = "http://localhost:8000/generate";
      const requestBody = {};

      if (selectedOption === "Qwen") {
        apiUrl = "http://localhost:8000/chat-huggingface"; // API URL for Qwen
        requestBody.message = input; // Set message when Qwen is selected
      } else {
        requestBody.prompt = input; // Set prompt for Gemini
      }

      // If the selected option is Gemini, include the API key
      if (selectedOption !== "Qwen") {
        requestBody.api_key = "AIzaSyBJWK1kMs4SDGpV0NDk7UQs-k5Ggzf2DQM";
      }

      console.log("Request Body:", requestBody); // Log the request body

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        console.log("Response Status:", response.status); // Log the response status

        if (!response.ok) {
          const errorResponse = await response.json();
          console.error("Error Response:", errorResponse); // Log the error response body
          throw new Error("Failed to generate response from the backend");
        }

        const data = await response.json();
        setResultData(data.response); // Store the response in the state
        setRecentPrompt(input); // Store the input as the recent prompt
      } catch (error) {
        toast.error(`Error: ${error.message}`); // Show an error toast
      } finally {
        setIsLoading(false); // Hide the loading indicator
      }
    }
  };

  const [isListening, setIsListening] = useState(false);
  const recognition =
    window.SpeechRecognition || window.webkitSpeechRecognition
      ? new (window.SpeechRecognition || window.webkitSpeechRecognition)()
      : null;

  if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };
  }

  const toggleListening = () => {
    if (!recognition) return alert("Speech Recognition not supported");
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
    setIsListening(!isListening);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setBlank(false);
      setSelectedFile(file);
      const fileType = file.type.startsWith("image") ? "image" : "video";
      setFileType(fileType);
      setMediaPreview(URL.createObjectURL(file));
      setMediaPreview1(true);
    }
  };

  const handleMediaSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      setBlank(false);
      return;
    }
    setMediaPreview1(false);
    setResultData("");
    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    let apiUrl;

    // Change API based on selectedOption for file uploads
    if (selectedOption === "Qwen") {
      apiUrl =
        fileType === "video"
          ? "http://localhost:8000/analyze-video-huggingface" // API for video when Qwen is selected
          : "http://localhost:8000/analyze-image-huggingface"; // API for image when Qwen is selected
    } else {
      apiUrl =
        fileType === "video"
          ? "http://localhost:8000/analyze-video" // Default API for video
          : "http://localhost:8000/analyze-image"; // Default API for image
    }

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `${fileType === "video" ? "Video" : "Image"} analysis failed.`
        );
      }

      const data = await response.json();
      setResultData(data.response);
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  const handleFileDelete = () => {
    setSelectedFile(null);
    setMediaPreview(null);
    document.getElementById("file-upload").value = "";
  };

  return (
    <ErrorBoundary>
      <Sidebar setInput={setInput} setResponse={setSelectedPromptResponse} />
      <div className="main">
        <div className="nav">
          <p>{selectedOption}Bot</p>
          <img src={assets.user_icon} alt="User Icon" />
        </div>
        <div className="main-container">
          {blank ? (
            <div className="greet">
              <p>
                <span>Hello, Dev.</span>
              </p>
              <p>How can I help you today?</p>
            </div>
          ) : (
            <div className="result">
              <div className="result-title">
                <img src={assets.user_icon} alt="User Icon" />
                <p>{recentPrompt || "Processing Media..."}</p>
              </div>
              <div className="result-data">
                {isLoading ? (
                  <div className="loader">
                    <hr />
                    <hr />
                    <hr />
                  </div>
                ) : (
                  <>
                    {/* Preview in the Output section */}
                    {!mediaPreview1 && mediaPreview && (
                      <div className="media-preview">
                        {fileType === "image" ? (
                          <img
                            src={mediaPreview}
                            alt="Selected Preview"
                            className="result-image"
                            style={{
                              height: "40vh",
                              width: "40vw",
                              objectFit: "contain",
                              borderRadius: "0px",
                            }}
                          />
                        ) : (
                          <video
                            controls
                            src={mediaPreview}
                            style={{
                              height: "40vh",
                              width: "40vw",
                              objectFit: "contain",
                              borderRadius: "0px",
                            }}
                          />
                        )}
                      </div>
                    )}
                    <p dangerouslySetInnerHTML={{ __html: resultData }}></p>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="main-bottom">
            {mediaPreview1 && (
              <div className="media-preview-small">
                {fileType === "image" ? (
                  <img
                    src={mediaPreview}
                    alt="Selected Preview"
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                ) : (
                  <video
                    src={mediaPreview}
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                )}
                <span
                  className="delete-media"
                  onClick={handleFileDelete}
                  style={{
                    position: "absolute",
                    top: "0",
                    left: "0",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    color: "white",
                    borderRadius: "50%",
                    padding: "2px 5px",
                    cursor: "pointer",
                  }}
                >
                  X
                </span>
              </div>
            )}

            <div className="search-box">
              <input
                onChange={(e) => {
                  setInput(e.target.value);
                  setMediaPreview(null);
                }}
                value={input}
                type="text"
                placeholder="Enter a prompt here"
              />
              <div>
                <label htmlFor="file-upload">
                  <img
                    src={assets.gallery_icon}
                    alt="Gallery Icon"
                    style={{ cursor: "pointer" }}
                  />
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
                <label htmlFor="audio-upload">
                  <img
                    src={assets.mic_icon}
                    onClick={toggleListening}
                    alt="Mic Icon"
                    style={{ cursor: "pointer" }}
                  />
                </label>

                <img
                  onClick={sendPromptToBackend}
                  src={assets.send_icon}
                  alt="Send Icon"
                  style={{ cursor: "pointer" }}
                />
              </div>
            </div>
          </div>
        </div>
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
};

export default Main;
