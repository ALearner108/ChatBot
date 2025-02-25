import { createContext, useState } from "react";

export const PromptContext = createContext();

export const PromptProvider = ({ children }) => {
  // Initialize with an empty string or null, depending on the type of data expected
  const [recentPrompts, setRecentPrompts] = useState([]);
  const [recentResult, setRecentResult] = useState(null); // Assuming it's a single response
  const [query, setQuery] = useState(""); // Assuming it's a single query string
  const [selectedOption, setSelectedOption] = useState("Gemini");

  return (
    <PromptContext.Provider
      value={{
        selectedOption,
        setSelectedOption,
        recentPrompts,
        setRecentPrompts,
        recentResult,
        setRecentResult,
        query,
        setQuery,
      }}
    >
      {children}
    </PromptContext.Provider>
  );
};
