import React, { useState, useEffect, useContext } from "react";
import { assets } from "../../assets/assets";
import axios from "axios";
import "./sidebar.css";
import { PromptContext } from "../../Context/Context"; // Ensure this path is correct

const Sidebar = ({ setInput, setResponse }) => {
  const [extended, setExtended] = useState(false);
  const { recentPrompts, setRecentPrompts, recentResult, setRecentResult } =
    useContext(PromptContext);
  const { query, setQuery } = useContext(PromptContext);

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await axios.get("http://localhost:8000/prompts");
        setRecentPrompts(response.data.prompts);
        if (response.data.prompts.length > 0) {
          setRecentResult(response.data.prompts[0].response);
        }
      } catch (error) {
        console.error("Error fetching prompts:", error);
      }
    };
    fetchPrompts();
  }, [setRecentResult]);

  const loadPrompt = async (promptId) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/prompts/${promptId}`
      );
      setRecentResult(response.data.prompt.response);
      setQuery(response.data.prompt.prompt); // Assuming you want the actual prompt string in `query`
      // Optionally use setInput and setResponse here if required
    } catch (error) {
      console.error("Error fetching prompt response:", error);
    }
  };

  return (
    <div className="sidebar">
      <div className="top">
        <img
          onClick={() => setExtended((prev) => !prev)}
          className="menu"
          src={assets.menu_icon}
          alt=""
        />
        <div onClick={() => console.log("New Chat")} className="new-chat">
          <img src={assets.plus_icon} alt="" />
          {extended && <p>New Chat</p>}
        </div>
        {extended && (
          <div className="recent">
            <p className="recent-title">Recent</p>
            {recentPrompts.length > 0 ? (
              recentPrompts.map((item, index) => (
                <div
                  key={index}
                  onClick={() => loadPrompt(item._id)}
                  className="recent-entry"
                >
                  <img src={assets.message_icon} alt="" />
                  <p>{item.prompt.slice(0, 18)}...</p>
                </div>
              ))
            ) : (
              <p>No recent prompts</p>
            )}
          </div>
        )}
      </div>
      <div className="bottom">
        <div className="bottom-item recent-entry">
          <img src={assets.question_icon} alt="" />
          {extended && <p>Help</p>}
        </div>
        <div className="bottom-item recent-entry">
          <img src={assets.history_icon} alt="" />
          {extended && <p>Activity</p>}
        </div>
        <div className="bottom-item recent-entry">
          <img src={assets.setting_icon} alt="" />
          {extended && <p>Settings</p>}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
