import React, { useState, useEffect } from "react";
import api from "./api";

function App() {
  const [token, setToken] = useState(localStorage.getItem("accessToken"));
  const [activeTab, setActiveTab] = useState("bookings");
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // Стан для авторизації
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authRole, setAuthRole] = useState("User");

  // Дані з бекенду
  const [workspaces, setWorkspaces] = useState([]);
  const [residents, setResidents] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Форми створення
  const [newWorkspace, setNewWorkspace] = useState({
    roomType: "Small",
    isActive: true,
  });
  const [newResident, setNewResident] = useState({
    name: "",
    surName: "",
    type: "Standard",
  });
  const [newBooking, setNewBooking] = useState({
    bookingDate: "",
    timeBooking: 60,
    residentName: "",
    residentSurName: "",
    residentMaxCount: 2,
  });

  const showMsg = (text, type = "success") => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: "", text: "" }), 4000);
  };

  // ------------------ АВТОРИЗАЦІЯ ------------------
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegisterMode) {
        await api.post("/auth/register", {
          email: authEmail,
          password: authPassword,
          role: authRole,
        });
        showMsg("Успішно зареєстровано! Тепер увійдіть.");
        setIsRegisterMode(false);
      } else {
        const res = await api.post("/auth/login", {
          email: authEmail,
          password: authPassword,
        });
        localStorage.setItem("accessToken", res.data.accessToken);
        localStorage.setItem("refreshToken", res.data.refreshToken);
        setToken(res.data.accessToken);
        showMsg("Успішний вхід!");
      }
    } catch (err) {
      showMsg(err.response?.data?.message || "Помилка авторизації", "error");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
  };

  // ------------------ ЗАВАНТАЖЕННЯ ДАНИХ ------------------
  const loadAllData = async () => {
    try {
      const [wsRes, resRes, bRes] = await Promise.all([
        api.get("/workspaces"),
        api.get("/residents"),
        api.get("/booking"),
      ]);
      setWorkspaces(wsRes.data);
      setResidents(resRes.data);
      setBookings(bRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        showMsg("Помилка при завантаженні даних з сервера", "error");
      }
    }
  };

  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token]);

  // ------------------ РОБОЧІ ЗОНИ (WORKSPACES) ------------------
  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    try {
      await api.post("/workspaces", {
        roomType: newWorkspace.roomType,
        isActive: newWorkspace.isActive,
        createdAt: [],
        duringDate: [],
      });
      showMsg("Робочу зону успішно додано!");
      loadAllData();
    } catch (err) {
      showMsg(
        err.response?.data?.message ||
          err.response?.data ||
          "Помилка створення зони (потрібна роль Admin)",
        "error",
      );
    }
  };

  const handleDeleteWorkspace = async (id) => {
    if (!window.confirm("Видалити цю кімнату?")) return;
    try {
      await api.delete(`/workspaces/${id}`);
      showMsg("Кімнату видалено!");
      loadAllData();
    } catch (err) {
      showMsg("Не вдалося видалити кімнату (потрібна роль Admin)", "error");
    }
  };

  // ------------------ РЕЗИДЕНТИ (RESIDENTS) ------------------
  const handleCreateResident = async (e) => {
    e.preventDefault();
    try {
      await api.post("/residents", newResident);
      showMsg("Резидента успішно додано!");
      setNewResident({ name: "", surName: "", type: "Standard" });
      loadAllData();
    } catch (err) {
      showMsg(
        err.response?.data?.message || "Помилка при додаванні резидента",
        "error",
      );
    }
  };

  const handleDeleteResident = async (id) => {
    if (!window.confirm("Видалити цього резидента?")) return;
    try {
      await api.delete(`/residents/${id}`);
      showMsg("Резидента видалено!");
      loadAllData();
    } catch (err) {
      showMsg("Помилка видалення резидента", "error");
    }
  };

  // ------------------ БРОНЮВАННЯ (BOOKINGS) ------------------
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      await api.post("/booking", {
        bookingDate: new Date(newBooking.bookingDate).toISOString(),
        timeBooking: parseInt(newBooking.timeBooking),
        residentName: newBooking.residentName.trim(),
        residentSurName: newBooking.residentSurName.trim(),
        residentMaxCount: parseInt(newBooking.residentMaxCount),
      });
      showMsg("Бронювання успішно оформлено!");
      setNewBooking({
        bookingDate: "",
        timeBooking: 60,
        residentName: "",
        residentSurName: "",
        residentMaxCount: 2,
      });
      loadAllData();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data;
      showMsg(
        typeof msg === "string" ? msg : "Помилка оформлення бронювання",
        "error",
      );
    }
  };

  const handleDeleteBooking = async (id) => {
    if (!window.confirm("Скасувати це бронювання?")) return;
    try {
      const res = await api.delete(`/booking/${id}`);
      showMsg(
        `Бронювання скасовано! Повернення коштів: ${res.data.returnMoney ?? 0} грн`,
      );
      loadAllData();
    } catch (err) {
      showMsg(
        err.response?.data?.message ||
          err.response?.data ||
          "Не вдалося скасувати бронювання",
        "error",
      );
    }
  };

  // ------------------ ЕКРАН ВХОДУ / РЕЄСТРАЦІЇ ------------------
  if (!token) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authCard}>
          <h2>{isRegisterMode ? "Реєстрація" : "Вхід у систему"}</h2>
          {statusMsg.text && (
            <div
              style={{
                ...styles.alert,
                backgroundColor:
                  statusMsg.type === "error" ? "#f8d7da" : "#d4edda",
              }}
            >
              {statusMsg.text}
            </div>
          )}
          <form onSubmit={handleAuth}>
            <label style={styles.label}>Email:</label>
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
              style={styles.input}
            />

            <label style={styles.label}>Пароль:</label>
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              required
              style={styles.input}
            />

            {isRegisterMode && (
              <>
                <label style={styles.label}>Роль:</label>
                <select
                  value={authRole}
                  onChange={(e) => setAuthRole(e.target.value)}
                  style={styles.input}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </>
            )}

            <button type="submit" style={styles.primaryBtn}>
              {isRegisterMode ? "Зареєструватися" : "Увійти"}
            </button>
          </form>

          <p style={{ marginTop: "1rem", textAlign: "center" }}>
            <span
              style={styles.link}
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setStatusMsg({ type: "", text: "" });
              }}
            >
              {isRegisterMode
                ? "Вже є акаунт? Увійти"
                : "Немає акаунту? Зареєструватися"}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // ------------------ ГОЛОВНА ПАНЕЛЬ КЕРУВАННЯ ------------------
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2>Панель керування коворкінгом</h2>
        <div>
          <button onClick={loadAllData} style={styles.secondaryBtn}>
            Оновити дані
          </button>
          <button onClick={handleLogout} style={styles.dangerBtn}>
            Вийти
          </button>
        </div>
      </header>

      {statusMsg.text && (
        <div
          style={{
            ...styles.alert,
            backgroundColor: statusMsg.type === "error" ? "#f8d7da" : "#d4edda",
          }}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Навігація вкладок */}
      <div style={styles.tabBar}>
        <button
          style={activeTab === "bookings" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("bookings")}
        >
          📅 Бронювання ({bookings.length})
        </button>
        <button
          style={activeTab === "workspaces" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("workspaces")}
        >
          🏢 Робочі зони ({workspaces.length})
        </button>
        <button
          style={activeTab === "residents" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("residents")}
        >
          👥 Резиденти ({residents.length})
        </button>
      </div>

      {/* ВКЛАДКА 1: БРОНЮВАННЯ */}
      {activeTab === "bookings" && (
        <div style={styles.contentGrid}>
          <div style={styles.card}>
            <h3>Оформити нове бронювання</h3>
            <form onSubmit={handleCreateBooking}>
              <label style={styles.label}>Дата та час початку:</label>
              <input
                type="datetime-local"
                value={newBooking.bookingDate}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, bookingDate: e.target.value })
                }
                required
                style={styles.input}
              />

              <label style={styles.label}>Тривалість (хвилин):</label>
              <input
                type="number"
                min="15"
                step="15"
                value={newBooking.timeBooking}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, timeBooking: e.target.value })
                }
                required
                style={styles.input}
              />

              <label style={styles.label}>Ім'я резидента:</label>
              <input
                type="text"
                value={newBooking.residentName}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, residentName: e.target.value })
                }
                required
                style={styles.input}
              />

              <label style={styles.label}>Прізвище резидента:</label>
              <input
                type="text"
                value={newBooking.residentSurName}
                onChange={(e) =>
                  setNewBooking({
                    ...newBooking,
                    residentSurName: e.target.value,
                  })
                }
                required
                style={styles.input}
              />

              <label style={styles.label}>Кількість осіб (2 - 15):</label>
              <input
                type="number"
                min="2"
                max="15"
                value={newBooking.residentMaxCount}
                onChange={(e) =>
                  setNewBooking({
                    ...newBooking,
                    residentMaxCount: e.target.value,
                  })
                }
                required
                style={styles.input}
              />

              <button type="submit" style={styles.primaryBtn}>
                Забронювати
              </button>
            </form>
          </div>

          <div style={styles.card}>
            <h3>Список активних бронювань</h3>
            {bookings.length === 0 ? (
              <p>Немає створених бронювань.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Резидент</th>
                    <th>Початок</th>
                    <th>Час</th>
                    <th>Осіб</th>
                    <th>Сума</th>
                    <th>Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        {b.residentName} {b.residentSurName}
                      </td>
                      <td>{new Date(b.bookingDate).toLocaleString()}</td>
                      <td>{b.timeBooking} хв</td>
                      <td>{b.residentMaxCount}</td>
                      <td>
                        <b>{b.totalPrice} грн</b>
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteBooking(b.id)}
                          style={styles.smallDangerBtn}
                        >
                          Скасувати
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ВКЛАДКА 2: РОБОЧІ ЗОНИ */}
      {activeTab === "workspaces" && (
        <div style={styles.contentGrid}>
          <div style={styles.card}>
            <h3>Створити робочу зону (Admin)</h3>
            <form onSubmit={handleCreateWorkspace}>
              <label style={styles.label}>Тип кімнати:</label>
              <select
                value={newWorkspace.roomType}
                onChange={(e) =>
                  setNewWorkspace({ ...newWorkspace, roomType: e.target.value })
                }
                style={styles.input}
              >
                <option value="Small">Small (2-4 місця)</option>
                <option value="Medium">Medium (5-8 місць)</option>
                <option value="Big">Big (9-12 місць)</option>
                <option value="Large">Large (13-15 місць)</option>
              </select>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={newWorkspace.isActive}
                  onChange={(e) =>
                    setNewWorkspace({
                      ...newWorkspace,
                      isActive: e.target.checked,
                    })
                  }
                />
                Активна для бронювань
              </label>

              <button type="submit" style={styles.primaryBtn}>
                Додати кімнату
              </button>
            </form>
          </div>

          <div style={styles.card}>
            <h3>Список робочих зон</h3>
            <div style={styles.grid}>
              {workspaces.map((ws) => (
                <div key={ws.id} style={styles.itemCard}>
                  <h4>Кімната: {ws.roomType}</h4>
                  <p>Статус: {ws.isActive ? "🟢 Активна" : "🔴 Вимкнена"}</p>
                  <p>
                    Зайнятих слотів: {ws.createdAt ? ws.createdAt.length : 0}
                  </p>
                  <small style={{ color: "#666" }}>ID: {ws.id}</small>
                  <div style={{ marginTop: "0.75rem" }}>
                    <button
                      onClick={() => handleDeleteWorkspace(ws.id)}
                      style={styles.smallDangerBtn}
                    >
                      Видалити
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ВКЛАДКА 3: РЕЗИДЕНТИ */}
      {activeTab === "residents" && (
        <div style={styles.contentGrid}>
          <div style={styles.card}>
            <h3>Додати резидента</h3>
            <form onSubmit={handleCreateResident}>
              <label style={styles.label}>Ім'я:</label>
              <input
                type="text"
                value={newResident.name}
                onChange={(e) =>
                  setNewResident({ ...newResident, name: e.target.value })
                }
                required
                style={styles.input}
              />

              <label style={styles.label}>Прізвище:</label>
              <input
                type="text"
                value={newResident.surName}
                onChange={(e) =>
                  setNewResident({ ...newResident, surName: e.target.value })
                }
                required
                style={styles.input}
              />

              <label style={styles.label}>Тип членства:</label>
              <select
                value={newResident.type}
                onChange={(e) =>
                  setNewResident({ ...newResident, type: e.target.value })
                }
                style={styles.input}
              >
                <option value="Standard">Standard</option>
                <option value="VIP">VIP (знижка 20%)</option>
              </select>

              <button type="submit" style={styles.primaryBtn}>
                Зберегти резидента
              </button>
            </form>
          </div>

          <div style={styles.card}>
            <h3>Список резидентів</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Ім'я та Прізвище</th>
                  <th>Тип підписки</th>
                  <th>Дії</th>
                </tr>
              </thead>
              <tbody>
                {residents.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.name} {r.surName}
                    </td>
                    <td>
                      <b>{r.type}</b>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteResident(r.id)}
                        style={styles.smallDangerBtn}
                      >
                        Видалити
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Прості стилі інтерфейсу
const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "1.5rem",
    fontFamily: "Segoe UI, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  authContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f0f2f5",
    fontFamily: "sans-serif",
  },
  authCard: {
    width: "380px",
    padding: "2rem",
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  tabBar: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1.5rem",
    borderBottom: "2px solid #ddd",
    paddingBottom: "0.5rem",
  },
  tab: {
    padding: "0.5rem 1rem",
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: "1rem",
    color: "#555",
  },
  tabActive: {
    padding: "0.5rem 1rem",
    border: "none",
    background: "#007bff",
    color: "#fff",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: "1.5rem",
  },
  card: {
    backgroundColor: "#fff",
    padding: "1.25rem",
    borderRadius: "8px",
    border: "1px solid #e1e4e8",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  input: {
    width: "100%",
    padding: "0.5rem",
    marginBottom: "0.75rem",
    borderRadius: "4px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
  },
  label: {
    display: "block",
    marginBottom: "0.25rem",
    fontWeight: "500",
    fontSize: "0.9rem",
  },
  primaryBtn: {
    width: "100%",
    padding: "0.6rem",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  secondaryBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "#6c757d",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: "0.5rem",
  },
  dangerBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  smallDangerBtn: {
    padding: "0.25rem 0.5rem",
    backgroundColor: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
  link: { color: "#007bff", cursor: "pointer", textDecoration: "underline" },
  alert: {
    padding: "0.75rem",
    marginBottom: "1rem",
    borderRadius: "4px",
    textAlign: "center",
    fontWeight: "bold",
  },
  table: { width: "100%", borderCollapse: "collapse", marginTop: "0.5rem" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "1rem",
    marginTop: "0.5rem",
  },
  itemCard: {
    padding: "1rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
    backgroundColor: "#fafafa",
  },
};

export default App;
