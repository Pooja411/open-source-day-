import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [lastUpdate, setLastUpdate] = useState("--:--:--");
  const [loading, setLoading] = useState(true);

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "JUST NOW";
    if (minutes < 60) return `${minutes}m AGO`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h AGO`;
    return `${Math.floor(hours / 24)}d AGO`;
  };

  const getStatus = (score) => {
    if (score >= 500) return { text: "ELITE", class: "status-elite" };
    if (score >= 300) return { text: "VETERAN", class: "status-veteran" };
    if (score >= 100) return { text: "ACTIVE", class: "status-active" };
    return { text: "ROOKIE", class: "status-rookie" };
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return "👑";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "";
  };

  const loadLeaderboard = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/leaderboard", {
        credentials: "include",
      });
      const data = await res.json();
      setLeaderboardData(data);
      setTotalUsers(data.length);
      setLastUpdate(new Date().toLocaleTimeString());
      setLoading(false);
    } catch (err) {
      console.error("Failed to load rankings", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-container leaderboard-page">
      <div className="logo-link">
        <img
          src="https://linuxdiary6.0.wcewlug.org/assets/wlug-logo-B2ywaANR.png"
          alt="WLUG Logo"
          style={{ height: "40px", display: "block" }}
        />
      </div>

      <h1>LEADERBOARD</h1>

      <div className="decor-lines">
        <div className="line-long"></div>
        <div className="scan-text">GLOBAL OPERATOR RANKINGS // LIVE FEED</div>
        <div className="line-long" style={{ width: "70%", opacity: 0.5 }}></div>
      </div>

      <div className="lb-container">
        <div className="lb-header">
          <div className="lb-stats">
            <span id="total-users">{totalUsers}</span> ACTIVE OPERATORS
          </div>
          <div className="lb-refresh">
            LAST SYNC: <span id="last-update">{lastUpdate}</span>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="lb-table">
            <thead>
              <tr>
                <th className="col-rank">RANK</th>
                <th className="col-player">OPERATOR</th>
                <th className="col-score">SCORE</th>
                <th className="col-level">LEVEL</th>
                <th className="col-time">LAST ACTIVITY</th>
                <th className="col-status">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="loading-row">
                  <td colSpan="6">
                    <div className="loading-text">
                      INITIALIZING DATA STREAM...
                    </div>
                  </td>
                </tr>
              ) : leaderboardData.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      color: "#ff0000",
                      padding: "40px",
                      textAlign: "center",
                    }}
                  >
                    &gt;&gt; ERROR: NO DATA AVAILABLE
                  </td>
                </tr>
              ) : (
                leaderboardData.map((entry, index) => {
                  const rank = index + 1;
                  const status = getStatus(entry.totalScore);
                  const badge = getRankBadge(rank);
                  const rankClass = rank <= 3 ? "rank-top" : "";

                  return (
                    <tr key={entry._id} className={rankClass}>
                      <td className="col-rank">
                        <span className="rank-number">
                          #{rank.toString().padStart(2, "0")}
                        </span>
                        {badge && <span className="rank-badge">{badge}</span>}
                      </td>
                      <td className="col-player">
                        {entry.user.username.toUpperCase()}
                      </td>
                      <td className="col-score">{entry.totalScore}</td>
                      <td className="col-level">
                        L{Math.floor(entry.totalScore / 100) + 1}
                      </td>
                      <td className="col-time">{formatTime(entry.lastSub)}</td>
                      <td className="col-status">
                        <span className={`status-badge ${status.class}`}>
                          {status.text}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Link to="/dashboard" className="lb-link">
          &lt; BACK_TO_TERMINAL &gt;
        </Link>
      </div>
    </div>
  );
}

export default Leaderboard;
