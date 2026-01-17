import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Dashboard() {
  const [repoUrl, setRepoUrl] = useState("");
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("#ff8c00");
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [levelLinks, setLevelLinks] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch level links
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        // const res = await fetch("http://localhost:3000/api/user/levels", {
        //   credentials: "include",
        // });
        const res = await fetch(
  `${import.meta.env.VITE_BACKEND_URL}/api/user/levels`,
  { credentials: "include" }
);

        const data = await res.json();
        setLevelLinks(data.levelLinks);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch levels:", err);
        setLoading(false);
      }
    };
    fetchLevels();
  }, []);

  // Handle level selection
  const handleLevelClick = (level) => {
    // Toggle: deselect if clicking the same level
    if (selectedLevel === level) {
      setSelectedLevel(null);
      setMessage("");
      setRepoUrl("");
    } else {
      setSelectedLevel(level);
      setMessage("");
      setRepoUrl("");
    }
  };

  const handleSubmit = async () => {
    if (selectedLevel === null) {
      setMessage(">> ERROR: SELECT A LEVEL FIRST");
      setMessageColor("#ff0000");
      return;
    }

    setMessage(">> PROCESSING...");
    setMessageColor("#ff8c00");

    try {
     const res = await fetch(
  `${import.meta.env.VITE_BACKEND_URL}/api/submit`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ repoUrl, level: selectedLevel.toString() }),
  }
);


      const data = await res.json();

      if (!res.ok) {
        setMessage(
          ">> ERROR: " + (data.error || data.message || "SUBMISSION FAILED")
        );
        setMessageColor("#ff0000");
        return;
      }

      if (data.status === "passed") {
        setMessage(`>> PASSED | +${data.score} pts`);
        setMessageColor("#00ff41");
        setSelectedLevel(null);
        setRepoUrl("");
      } else {
        setMessage(`>> ${data.message || "FAILED"}`);
        setMessageColor("#ff0000");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setMessage(
        ">> ERROR: UPLINK FAILED - Check if backend is running on port 3000"
      );
      setMessageColor("#ff0000");
    }
  };

  return (
    <div className="page-container">
      {/* Level selector on the left - mirroring logo on right */}
      <div
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          zIndex: 100,
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((level) => {
          const selected = selectedLevel === level;
          return (
            <button
              key={level}
              onClick={() => handleLevelClick(level)}
              style={{
                width: "65px",
                height: "65px",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "bold",
                fontFamily: "'Syncopate', sans-serif",
                backgroundColor: selected ? "#ff8c00" : "#1a1a1a",
                color: selected ? "#000" : "#ff8c00",
                border: selected ? "3px solid #ff8c00" : "2px solid #ff8c00",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: selected
                  ? "0 0 25px rgba(255, 140, 0, 0.6), inset 0 0 15px rgba(255, 140, 0, 0.2)"
                  : "0 0 10px rgba(255, 140, 0, 0.2)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px",
              }}
              onMouseEnter={(e) => {
                if (!selected) {
                  e.currentTarget.style.backgroundColor = "#ff8c00";
                  e.currentTarget.style.color = "#000";
                  e.currentTarget.style.transform = "scale(1.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (!selected) {
                  e.currentTarget.style.backgroundColor = "#1a1a1a";
                  e.currentTarget.style.color = "#ff8c00";
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
            >
              <div style={{ fontSize: "1.3rem", lineHeight: "1" }}>{level}</div>
              <div
                style={{
                  fontSize: "0.5rem",
                  marginTop: "4px",
                  letterSpacing: "1px",
                  opacity: 0.8,
                }}
              >
                {level === 0 ? "DEMO" : "LVL"}
              </div>
            </button>
          );
        })}
      </div>

      <div className="logo-link">
        <img
          src="https://linuxdiary6.0.wcewlug.org/assets/wlug-logo-B2ywaANR.png"
          alt="WLUG Logo"
          style={{ height: "40px", display: "block" }}
        />
      </div>

      <h1 style={{ marginTop: "15px" }}>DASHBOARD</h1>

      <div className="decor-lines">
        <div className="line-long"></div>
        <div className="scan-text">WHERE COMMITS BECOME COMBAT</div>
        <div className="line-long" style={{ width: "70%", opacity: 0.5 }}></div>
      </div>

      <div className="container">
        {loading ? (
          <p style={{ color: "#ff8c00", fontSize: "1.2rem" }}>
            LOADING LEVELS...
          </p>
        ) : (
          <>
            {selectedLevel !== null && (
              <div
                style={{
                  marginBottom: "25px",
                  padding: "25px",
                  backgroundColor: "rgba(26, 26, 26, 0.8)",
                  border: "2px solid #ff8c00",
                  borderRadius: "10px",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 4px 20px rgba(255, 140, 0, 0.3)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        color: "#ff8c00",
                        fontSize: "1.4rem",
                        margin: "0 0 8px 0",
                        fontFamily: "'Syncopate', sans-serif",
                      }}
                    >
                      LEVEL {selectedLevel}
                    </h3>
                    <p
                      style={{ color: "#aaa", fontSize: "0.85rem", margin: 0 }}
                    >
                      {selectedLevel === 0
                        ? "DEMO CHALLENGE"
                        : `CHALLENGE ${selectedLevel}`}
                    </p>
                  </div>
                  <div
                    style={{
                      backgroundColor: "#ff8c00",
                      color: "#000",
                      padding: "12px 20px",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      fontSize: "1rem",
                      fontFamily: "'Syncopate', sans-serif",
                      boxShadow: "0 4px 15px rgba(255, 140, 0, 0.4)",
                    }}
                  >
                    {selectedLevel === 0 ? "100" : selectedLevel * 100} PTS
                  </div>
                </div>

                <a
                  href={levelLinks ? levelLinks[selectedLevel.toString()] : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    color: "#00ff41",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    padding: "12px 20px",
                    border: "2px solid #00ff41",
                    borderRadius: "6px",
                    marginBottom: "15px",
                    transition: "all 0.3s",
                    backgroundColor: "rgba(0, 255, 65, 0.1)",
                    fontWeight: "bold",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(0, 255, 65, 0.2)";
                    e.currentTarget.style.boxShadow =
                      "0 0 20px rgba(0, 255, 65, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(0, 255, 65, 0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  🔗 VIEW CHALLENGE REPO →
                </a>

                <p
                  style={{
                    color: "#bbb",
                    fontSize: "0.85rem",
                    margin: 0,
                    lineHeight: "1.6",
                  }}
                >
                  📋 Fork the repository, solve the challenge, push your
                  changes, and submit your forked repo link below
                </p>
              </div>
            )}

            {/* Submission Section */}
            <div
              style={{
                marginTop: "30px",
                padding: "25px",
                backgroundColor: "rgba(16, 16, 16, 0.8)",
                borderRadius: "10px",
                border: "1px solid #444",
              }}
            >
              <p
                style={{
                  color: "#fff",
                  fontSize: "1rem",
                  marginBottom: "18px",
                  letterSpacing: "2px",
                  fontFamily: "'Syncopate', sans-serif",
                  textAlign: "center",
                }}
              >
                {selectedLevel !== null
                  ? "SUBMIT YOUR SOLUTION"
                  : "SELECT A LEVEL TO BEGIN"}
              </p>

              <input
                type="text"
                id="repoUrl"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder={
                  selectedLevel !== null
                    ? "https://github.com/username/repo"
                    : "Select a level first..."
                }
                disabled={selectedLevel === null}
                style={{
                  opacity: selectedLevel === null ? 0.5 : 1,
                  cursor: selectedLevel === null ? "not-allowed" : "text",
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: "0.95rem",
                  backgroundColor: "#0a0a0a",
                  color: "#fff",
                  border:
                    selectedLevel === null
                      ? "1px solid #333"
                      : "2px solid #ff8c00",
                  borderRadius: "6px",
                  outline: "none",
                  fontFamily: "'Space Grotesk', monospace",
                  transition: "all 0.3s",
                }}
              />

              <button
                className="btn"
                onClick={handleSubmit}
                disabled={selectedLevel === null || !repoUrl}
                style={{
                  width: "100%",
                  marginTop: "15px",
                  padding: "15px",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  letterSpacing: "2px",
                  opacity: selectedLevel === null || !repoUrl ? 0.4 : 1,
                  cursor:
                    selectedLevel === null || !repoUrl
                      ? "not-allowed"
                      : "pointer",
                  transition: "all 0.3s",
                  backgroundColor:
                    selectedLevel === null || !repoUrl ? "#333" : "#ff8c00",
                  border: "none",
                  color: "#000",
                  borderRadius: "6px",
                  fontFamily: "'Syncopate', sans-serif",
                  boxShadow:
                    selectedLevel !== null && repoUrl
                      ? "0 0 20px rgba(255, 140, 0, 0.4)"
                      : "none",
                }}
              >
                {selectedLevel === null
                  ? "SELECT LEVEL FIRST"
                  : !repoUrl
                  ? "ENTER REPO URL"
                  : "SUBMIT SOLUTION"}
              </button>

              {message && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "14px",
                    fontSize: "0.95rem",
                    fontWeight: "bold",
                    color: messageColor,
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    borderRadius: "6px",
                    border: `2px solid ${messageColor}`,
                    textAlign: "center",
                    fontFamily: "'Space Grotesk', monospace",
                  }}
                >
                  {message}
                </div>
              )}
            </div>

            <Link
              to="/leaderboard"
              className="lb-link"
              style={{
                display: "inline-block",
                marginTop: "30px",
                padding: "12px 24px",
                fontSize: "0.95rem",
                textDecoration: "none",
              }}
            >
              [ VIEW_LEADERBOARD ]
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
