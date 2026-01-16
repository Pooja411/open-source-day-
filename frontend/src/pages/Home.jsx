import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    // Mouse move effect
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.body.style.setProperty("--mouse-x", x + "%");
      document.body.style.setProperty("--mouse-y", y + "%");
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleConnect = () => {
    window.location.href = "http://localhost:3000/auth/github";
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

      <h1 style={{ marginBottom: "20px", paddingBottom: "20px" }}>
        OPEN SOURCE DAY
      </h1>

      <div className="decor-lines">
        <div className="line-long"></div>
        <div className="scan-text">WHERE COMMITS BECOME COMBAT</div>
        <div className="line-long" style={{ width: "60%", opacity: 0.5 }}></div>
      </div>

      <div className="container" style={{ marginTop: "30px" }}>
        <p
          style={{
            color: "#6d6a6a",
            fontSize: "1rem",
            letterSpacing: "3px",
            marginBottom: "40px",
            fontWeight: 500,
          }}
        >
          // CONNECT_GITHUB_TO_BEGIN
        </p>
        <button className="btn" onClick={handleConnect}>
          CONNECT TERMINAL
        </button>
      </div>
    </div>
  );
}

export default Home;
