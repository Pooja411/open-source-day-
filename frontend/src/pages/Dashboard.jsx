import { useState } from "react";
import { Link } from "react-router-dom";

function Dashboard() {
  const [repoUrl, setRepoUrl] = useState("");
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("#ff8c00");

  const handleSubmit = async () => {
    setMessage(">> PROCESSING...");
    setMessageColor("#ff8c00");

    try {
      const res = await fetch("http://localhost:3000/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ repoUrl, level: "1" }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle HTTP error responses
        setMessage(
          ">> ERROR: " + (data.error || data.message || "SUBMISSION FAILED")
        );
        setMessageColor("#ff0000");
        return;
      }

      // Success response
      if (data.status === "passed") {
        setMessage(`>> PASSED | +${data.score} pts`);
        setMessageColor("#00ff41");
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
        <p
          style={{
            color: "#fff",
            fontSize: "1.1rem",
            marginBottom: "30px",
            letterSpacing: "3px",
            fontFamily: "'Syncopate', sans-serif",
          }}
        >
          SUBMIT GITHUB REPO LINK
        </p>

        <input
          type="text"
          id="repoUrl"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/user/repo"
        />

        <button className="btn" onClick={handleSubmit}>
          SUBMIT SOLUTION
        </button>

        <div
          style={{
            marginTop: "20px",
            fontSize: "1rem",
            fontWeight: "bold",
            color: messageColor,
          }}
        >
          {message}
        </div>

        <Link to="/leaderboard" className="lb-link">
          [ VIEW_LEADERBOARD ]
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
