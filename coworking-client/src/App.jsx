import React, { useState, useEffect } from "react";
import api from "./api";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("accessToken"));
  const [activeTab, setActiveTab] = useState("bookings");
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // Стан авторизації
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authRole, setAuthRole] = useState("User");

  // Дані з API
  const [workspaces, setWorkspaces] = useState([]);
  const [residents, setResidents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Стан форм
  const [newWorkspace, setNewWorkspace] = useState({
    roomType: "Small",
    isActive: true,
  });
  const [newResident, setNewResident] = useState({
    name: "",
    surName: "",
<<<<<<< HEAD
    type: "Guest",
=======
    type: "Standard",
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
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

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegisterMode) {
        await api.post("/auth/register", {
          email: authEmail,
          password: authPassword,
          role: authRole,
        });
        showMsg("Акаунт успішно зареєстровано! Увійдіть у систему.");
        setIsRegisterMode(false);
      } else {
        const res = await api.post("/auth/login", {
          email: authEmail,
          password: authPassword,
        });
        localStorage.setItem("accessToken", res.data.accessToken);
        localStorage.setItem("refreshToken", res.data.refreshToken);
        setToken(res.data.accessToken);
        showMsg("Раді бачити вас знову!");
      }
    } catch (err) {
      showMsg(err.response?.data?.message || "Помилка автентифікації", "error");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
  };

  const loadAllData = async () => {
    setLoading(true);
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
        showMsg("Не вдалося завантажити актуальні дані", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadAllData();
  }, [token]);

  // Робочі зони
  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    try {
      await api.post("/workspaces", {
        ...newWorkspace,
        createdAt: [],
        duringDate: [],
      });
<<<<<<< HEAD
      showMsg("Робочу зону успішно створено!");
=======
      showMsg("Робочу зону додано!");
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
      loadAllData();
    } catch (err) {
      showMsg(
        err.response?.data?.message ||
<<<<<<< HEAD
          err.response?.data ||
          "Помилка створення робочої зони",
        "error"
=======
          "Потрібні права Admin для створення зони",
        "error",
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
      );
    }
  };

  const handleDeleteWorkspace = async (id) => {
    if (!window.confirm("Ви дійсно хочете видалити цю зону?")) return;
    try {
      await api.delete(`/workspaces/${id}`);
      showMsg("Робочу зону видалено!");
      loadAllData();
    } catch (err) {
<<<<<<< HEAD
      showMsg("Помилка видалення робочої зони", "error");
=======
      showMsg("Помилка видалення (лише для Admin)", "error");
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
    }
  };

  // Резиденти
  const handleCreateResident = async (e) => {
    e.preventDefault();
    try {
      await api.post("/residents", newResident);
<<<<<<< HEAD
      showMsg("Резидента успішно зареєстровано!");
      setNewResident({ name: "", surName: "", type: "Guest" });
=======
      showMsg("Резидента зареєстровано!");
      setNewResident({ name: "", surName: "", type: "Standard" });
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
      loadAllData();
    } catch (err) {
      showMsg("Помилка реєстрації резидента", "error");
    }
  };

  const handleDeleteResident = async (id) => {
    if (!window.confirm("Видалити дані резидента?")) return;
    try {
      await api.delete(`/residents/${id}`);
<<<<<<< HEAD
      showMsg("Резидента видалено!");
=======
      showMsg("Резидента успішно видалено!");
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
      loadAllData();
    } catch (err) {
      showMsg("Помилка видалення резидента", "error");
    }
  };

  // Бронювання
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      await api.post("/booking", {
        bookingDate: new Date(newBooking.bookingDate).toISOString(),
        timeBooking: parseInt(newBooking.timeBooking, 10),
        residentName: newBooking.residentName.trim(),
        residentSurName: newBooking.residentSurName.trim(),
        residentMaxCount: parseInt(newBooking.residentMaxCount, 10),
      });
<<<<<<< HEAD
      showMsg("Бронювання успішно оформлено!");
=======
      showMsg("Бронювання успішно зафіксовано!");
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
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
      showMsg(typeof msg === "string" ? msg : "Помилка бронювання", "error");
    }
  };

  const handleDeleteBooking = async (id) => {
    if (!window.confirm("Скасувати це бронювання?")) return;
    try {
      const res = await api.delete(`/booking/${id}`);
      showMsg(
<<<<<<< HEAD
        `Бронювання скасовано! До повернення: ${res.data.returnMoney ?? 0} грн`
=======
        `Бронювання скасовано! До повернення: ${res.data.returnMoney ?? 0} грн`,
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
      );
      loadAllData();
    } catch (err) {
      showMsg(
        err.response?.data?.message || "Не вдалося скасувати бронювання",
<<<<<<< HEAD
        "error"
=======
        "error",
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
      );
    }
  };

<<<<<<< HEAD
  // Допоміжна функція для бейджів типів резидентів
  const renderResidentBadge = (type) => {
    if (type === "VIP") return <span style={ui.badgeVip}>VIP</span>;
    if (type === "Regular") return <span style={ui.badgeRegular}>Regular</span>;
    return <span style={ui.badgeGuest}>Guest</span>;
  };

=======
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
  // --- ЕКРАН АВТОРИЗАЦІЇ ---
  if (!token) {
    return (
      <div style={ui.authPage}>
        <div style={ui.authBox}>
          <div style={ui.logoArea}>
            <div style={ui.logoBadge}>💼</div>
            <h1 style={ui.title}>Coworking Space</h1>
<<<<<<< HEAD
            <p style={ui.subtitle}>Керуйте простором та бронюванням</p>
=======
            <p style={ui.subtitle}>Керуйте бронюванням просто та зручно</p>
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
          </div>

          {statusMsg.text && (
            <div
              style={{
                ...ui.toast,
                ...(statusMsg.type === "error" ? ui.toastErr : ui.toastOk),
              }}
            >
              {statusMsg.text}
            </div>
          )}

          <form
            onSubmit={handleAuth}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div>
              <label style={ui.label}>Електронна пошта</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                style={ui.input}
              />
            </div>

            <div>
              <label style={ui.label}>Пароль</label>
              <input
                type="password"
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                style={ui.input}
              />
            </div>

            {isRegisterMode && (
              <div>
<<<<<<< HEAD
                <label style={ui.label}>Роль</label>
=======
                <label style={ui.label}>Рівень доступу</label>
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
                <select
                  value={authRole}
                  onChange={(e) => setAuthRole(e.target.value)}
                  style={ui.input}
                >
<<<<<<< HEAD
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
=======
                  <option value="User">User (Клієнт)</option>
                  <option value="Admin">Admin (Адміністратор)</option>
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
                </select>
              </div>
            )}

            <button type="submit" style={ui.btnPrimary}>
<<<<<<< HEAD
              {isRegisterMode ? "Зареєструватися" : "Увійти до системи"}
=======
              {isRegisterMode ? "Зареєструватися" : "Увійти до панелі"}
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
            </button>
          </form>

          <div style={ui.switchMode}>
            <span>{isRegisterMode ? "Вже маєте профіль?" : "Вперше тут?"}</span>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setStatusMsg({ type: "", text: "" });
              }}
              style={ui.linkBtn}
            >
              {isRegisterMode ? "Увійти" : "Створити акаунт"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- ГОЛОВНА СТОРІНКА DASHBOARD ---
  return (
    <div style={ui.layout}>
<<<<<<< HEAD
      {/* Навігаційна панель */}
=======
      {/* Верхня навігаційна панель */}
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
      <header style={ui.navbar}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={ui.logoBadgeSmall}>💼</div>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>
<<<<<<< HEAD
              Coworking Space
            </h2>
            <small style={{ color: "var(--text-muted)" }}>
              Панель управління бронюванням та кімнатами
=======
              Coworking OS
            </h2>
            <small style={{ color: "var(--text-muted)" }}>
              Панель управління простором
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
            </small>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={loadAllData} style={ui.btnSecondary}>
            {loading ? "Оновлення..." : "🔄 Оновити"}
          </button>
          <button onClick={handleLogout} style={ui.btnDangerOutline}>
            Вийти
          </button>
        </div>
      </header>

<<<<<<< HEAD
      {/* Toast повідомлення */}
=======
      {/* Сповіщення (Toast) */}
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
      {statusMsg.text && (
        <div
          style={{
            ...ui.toast,
            ...(statusMsg.type === "error" ? ui.toastErr : ui.toastOk),
          }}
        >
          {statusMsg.text}
        </div>
      )}

<<<<<<< HEAD
      {/* Вкладки */}
=======
      {/* Вкладки перемикання */}
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
      <div style={ui.navTabs}>
        <button
          onClick={() => setActiveTab("bookings")}
          style={activeTab === "bookings" ? ui.navTabActive : ui.navTab}
        >
          📅 Бронювання <span style={ui.counter}>{bookings.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("workspaces")}
          style={activeTab === "workspaces" ? ui.navTabActive : ui.navTab}
        >
          🏢 Робочі зони <span style={ui.counter}>{workspaces.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("residents")}
          style={activeTab === "residents" ? ui.navTabActive : ui.navTab}
        >
          👥 Резиденти <span style={ui.counter}>{residents.length}</span>
        </button>
      </div>

<<<<<<< HEAD
      <main style={ui.mainGrid}>
        {/* ВКЛАДКА 1: БРОНЮВАННЯ */}
        {activeTab === "bookings" && (
          <>
            <div style={ui.card}>
              <h3 style={ui.cardTitle}>Нове бронювання</h3>
              <p style={ui.cardDesc}>
                Кімната підбирається автоматично за місткістю та вільним часом
=======
      {/* КОНТЕНТ ВКЛАДОК */}
      <main style={ui.mainGrid}>
        {/* Вкладка 1: Бронювання */}
        {activeTab === "bookings" && (
          <>
            <div style={ui.card}>
              <h3 style={ui.cardTitle}>Створити бронювання</h3>
              <p style={ui.cardDesc}>
                Вільна кімната та вартість розраховуються автоматично
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
              </p>

              <form
                onSubmit={handleCreateBooking}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.9rem",
                }}
              >
                <div>
                  <label style={ui.label}>Дата та час початку</label>
                  <input
                    type="datetime-local"
                    value={newBooking.bookingDate}
                    onChange={(e) =>
                      setNewBooking({
                        ...newBooking,
                        bookingDate: e.target.value,
                      })
                    }
                    required
                    style={ui.input}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  <div>
<<<<<<< HEAD
                    <label style={ui.label}>Тривалість (хв)</label>
=======
                    <label style={ui.label}>Час (хвилин)</label>
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
                    <input
                      type="number"
                      min="15"
                      step="15"
                      value={newBooking.timeBooking}
                      onChange={(e) =>
                        setNewBooking({
                          ...newBooking,
                          timeBooking: e.target.value,
                        })
                      }
                      required
                      style={ui.input}
                    />
                  </div>
                  <div>
                    <label style={ui.label}>Осіб (2-15)</label>
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
                      style={ui.input}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  <div>
                    <label style={ui.label}>Ім'я</label>
                    <input
                      type="text"
<<<<<<< HEAD
                      placeholder="Іван"
=======
                      placeholder="Олексій"
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
                      value={newBooking.residentName}
                      onChange={(e) =>
                        setNewBooking({
                          ...newBooking,
                          residentName: e.target.value,
                        })
                      }
                      required
                      style={ui.input}
                    />
                  </div>
                  <div>
                    <label style={ui.label}>Прізвище</label>
                    <input
                      type="text"
<<<<<<< HEAD
                      placeholder="Франко"
=======
                      placeholder="Шевченко"
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
                      value={newBooking.residentSurName}
                      onChange={(e) =>
                        setNewBooking({
                          ...newBooking,
                          residentSurName: e.target.value,
                        })
                      }
                      required
                      style={ui.input}
                    />
                  </div>
                </div>

                <button type="submit" style={ui.btnPrimary}>
                  Підтвердити бронювання
                </button>
              </form>
            </div>

            <div style={ui.card}>
              <h3 style={ui.cardTitle}>Журнал бронювань</h3>
<<<<<<< HEAD
              <p style={ui.cardDesc}>Активні заплановані сесії</p>

              {bookings.length === 0 ? (
                <div style={ui.emptyState}>Немає зареєстрованих бронювань</div>
=======
              <p style={ui.cardDesc}>Усі заплановані та підтверджені візити</p>

              {bookings.length === 0 ? (
                <div style={ui.emptyState}>Немає активних бронювань</div>
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={ui.table}>
                    <thead>
                      <tr>
                        <th>Резидент</th>
                        <th>Дата та час</th>
<<<<<<< HEAD
                        <th>Час</th>
=======
                        <th>Тривалість</th>
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
                        <th>Осіб</th>
                        <th>До сплати</th>
                        <th style={{ textAlign: "right" }}>Дії</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id}>
                          <td style={{ fontWeight: 600 }}>
                            {b.residentName} {b.residentSurName}
                          </td>
                          <td style={{ color: "var(--text-muted)" }}>
                            {new Date(b.bookingDate).toLocaleString([], {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                          <td>{b.timeBooking} хв.</td>
                          <td>{b.residentMaxCount}</td>
                          <td>
                            <span style={ui.priceTag}>{b.totalPrice} ₴</span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              onClick={() => handleDeleteBooking(b.id)}
                              style={ui.btnCancelSmall}
                            >
                              Скасувати
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

<<<<<<< HEAD
        {/* ВКЛАДКА 2: РОБОЧІ ЗОНИ */}
        {activeTab === "workspaces" && (
          <>
            <div style={ui.card}>
              <h3 style={ui.cardTitle}>Створити робочу зону</h3>
              <p style={ui.cardDesc}>
                Додайте нову кімнату для бронювання
=======
        {/* Вкладка 2: Робочі зони */}
        {activeTab === "workspaces" && (
          <>
            <div style={ui.card}>
              <h3 style={ui.cardTitle}>Нова локація</h3>
              <p style={ui.cardDesc}>
                Тільки для користувачів із правами адміністратора
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
              </p>

              <form
                onSubmit={handleCreateWorkspace}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div>
<<<<<<< HEAD
                  <label style={ui.label}>Тип кімнати</label>
=======
                  <label style={ui.label}>Розмір та місткість</label>
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
                  <select
                    value={newWorkspace.roomType}
                    onChange={(e) =>
                      setNewWorkspace({
                        ...newWorkspace,
                        roomType: e.target.value,
                      })
                    }
                    style={ui.input}
                  >
                    <option value="Small">Small (2–4 місця)</option>
                    <option value="Medium">Medium (5–8 місць)</option>
                    <option value="Big">Big (9–12 місць)</option>
                    <option value="Large">Large (13–15 місць)</option>
                  </select>
                </div>

                <label style={ui.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={newWorkspace.isActive}
                    onChange={(e) =>
                      setNewWorkspace({
                        ...newWorkspace,
                        isActive: e.target.checked,
                      })
                    }
                    style={{
                      width: "18px",
                      height: "18px",
                      accentColor: "var(--primary)",
                    }}
                  />
<<<<<<< HEAD
                  <span>Активна для бронювань</span>
                </label>

                <button type="submit" style={ui.btnPrimary}>
                  Додати кімнату
=======
                  <span>Готова до експлуатації</span>
                </label>

                <button type="submit" style={ui.btnPrimary}>
                  Створити зону
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
                </button>
              </form>
            </div>

            <div style={ui.card}>
<<<<<<< HEAD
              <h3 style={ui.cardTitle}>Робочі зони коворкінгу</h3>
              <p style={ui.cardDesc}>
                Поточний статус доступності та зайнятих сесій
=======
              <h3 style={ui.cardTitle}>Доступні зали</h3>
              <p style={ui.cardDesc}>
                Поточний статус доступності робочих місць
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
              </p>

              <div style={ui.gridCards}>
                {workspaces.map((ws) => (
                  <div key={ws.id} style={ui.roomCard}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={ui.roomBadge}>{ws.roomType}</span>
                      <span
                        style={
                          ws.isActive ? ui.statusActive : ui.statusInactive
                        }
                      >
<<<<<<< HEAD
                        {ws.isActive ? "Активна" : "Вимкнена"}
=======
                        {ws.isActive ? "Вільна" : "Неактивна"}
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
                      </span>
                    </div>

                    <div style={{ margin: "1rem 0" }}>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text-muted)",
                        }}
                      >
<<<<<<< HEAD
                        Зайнятих слотів:
=======
                        Заплановано сесій:
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
                      </div>
                      <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                        {ws.createdAt ? ws.createdAt.length : 0}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderTop: "1px solid #f1f5f9",
                        paddingTop: "0.75rem",
                      }}
                    >
                      <small
                        style={{ color: "#94a3b8", fontFamily: "monospace" }}
                      >
                        {ws.id?.slice(-6)}
                      </small>
                      <button
                        onClick={() => handleDeleteWorkspace(ws.id)}
                        style={ui.btnCancelSmall}
                      >
                        Видалити
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

<<<<<<< HEAD
        {/* ВКЛАДКА 3: РЕЗИДЕНТИ */}
        {activeTab === "residents" && (
          <>
            <div style={ui.card}>
              <h3 style={ui.cardTitle}>Додати резидента</h3>
              <p style={ui.cardDesc}>
                Guest, Regular або VIP (зі знижкою 20%)
=======
        {/* Вкладка 3: Резиденти */}
        {activeTab === "residents" && (
          <>
            <div style={ui.card}>
              <h3 style={ui.cardTitle}>Новий резидент</h3>
              <p style={ui.cardDesc}>
                VIP-клієнти автоматично отримують 20% знижки
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
              </p>

              <form
                onSubmit={handleCreateResident}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.9rem",
                }}
              >
                <div>
                  <label style={ui.label}>Ім'я</label>
                  <input
                    type="text"
<<<<<<< HEAD
                    placeholder="Тарас"
=======
                    placeholder="Марія"
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
                    value={newResident.name}
                    onChange={(e) =>
                      setNewResident({ ...newResident, name: e.target.value })
                    }
                    required
                    style={ui.input}
                  />
                </div>

                <div>
                  <label style={ui.label}>Прізвище</label>
                  <input
                    type="text"
<<<<<<< HEAD
                    placeholder="Григорович"
=======
                    placeholder="Коваленко"
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
                    value={newResident.surName}
                    onChange={(e) =>
                      setNewResident({
                        ...newResident,
                        surName: e.target.value,
                      })
                    }
                    required
                    style={ui.input}
                  />
                </div>

                <div>
<<<<<<< HEAD
                  <label style={ui.label}>Тип резидента</label>
=======
                  <label style={ui.label}>Тарифний план</label>
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
                  <select
                    value={newResident.type}
                    onChange={(e) =>
                      setNewResident({ ...newResident, type: e.target.value })
                    }
                    style={ui.input}
                  >
<<<<<<< HEAD
                    <option value="Guest">Guest (Гість)</option>
                    <option value="Regular">Regular (Постійний)</option>
=======
                    <option value="Standard">Standard (Базовий)</option>
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
                    <option value="VIP">VIP (Знижка 20%)</option>
                  </select>
                </div>

                <button type="submit" style={ui.btnPrimary}>
<<<<<<< HEAD
                  Зберегти резидента
=======
                  Зберегти в базі
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
                </button>
              </form>
            </div>

            <div style={ui.card}>
              <h3 style={ui.cardTitle}>База резидентів</h3>
<<<<<<< HEAD
              <p style={ui.cardDesc}>Список зареєстрованих клієнтів</p>

              {residents.length === 0 ? (
                <div style={ui.emptyState}>Резидентів ще немає в базі</div>
=======
              <p style={ui.cardDesc}>Зареєстровані постійні відвідувачі</p>

              {residents.length === 0 ? (
                <div style={ui.emptyState}>Резидентів ще не додано</div>
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
              ) : (
                <table style={ui.table}>
                  <thead>
                    <tr>
                      <th>Користувач</th>
<<<<<<< HEAD
                      <th>Тип</th>
=======
                      <th>Рівень</th>
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
                      <th style={{ textAlign: "right" }}>Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {residents.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>
                          {r.name} {r.surName}
                        </td>
<<<<<<< HEAD
                        <td>{renderResidentBadge(r.type)}</td>
=======
                        <td>
                          <span
                            style={
                              r.type === "VIP" ? ui.badgeVip : ui.badgeStandard
                            }
                          >
                            {r.type}
                          </span>
                        </td>
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
                        <td style={{ textAlign: "right" }}>
                          <button
                            onClick={() => handleDeleteResident(r.id)}
                            style={ui.btnCancelSmall}
                          >
                            Видалити
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ------------------ СТИЛІ ІНТЕРФЕЙСУ ------------------
const ui = {
  authPage: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "1.5rem",
  },
  authBox: {
    background: "var(--card-bg)",
    backdropFilter: "blur(16px)",
    border: "1px solid var(--card-border)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-lg)",
    width: "100%",
    maxWidth: "420px",
    padding: "2.5rem",
  },
  logoArea: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  logoBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "54px",
    height: "54px",
    borderRadius: "16px",
    background: "var(--primary-light)",
    fontSize: "1.75rem",
    marginBottom: "0.75rem",
  },
  logoBadgeSmall: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "var(--primary-light)",
    fontSize: "1.25rem",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    letterSpacing: "-0.025em",
    marginBottom: "0.25rem",
  },
  subtitle: {
    color: "var(--text-muted)",
    fontSize: "0.9rem",
  },
  layout: {
    maxWidth: "1240px",
    margin: "0 auto",
    padding: "1.5rem",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "var(--card-bg)",
    backdropFilter: "blur(12px)",
    border: "1px solid var(--card-border)",
    padding: "1rem 1.5rem",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-sm)",
    marginBottom: "1.5rem",
  },
  navTabs: {
    display: "flex",
    gap: "0.5rem",
    background: "rgba(255, 255, 255, 0.5)",
    padding: "0.35rem",
    borderRadius: "var(--radius-md)",
    marginBottom: "1.5rem",
    border: "1px solid var(--card-border)",
    width: "fit-content",
  },
  navTab: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.6rem 1.15rem",
    borderRadius: "8px",
    border: "none",
    background: "transparent",
    color: "var(--text-muted)",
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  navTabActive: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.6rem 1.15rem",
    borderRadius: "8px",
    border: "none",
    background: "#ffffff",
    color: "var(--primary)",
    fontWeight: 700,
    fontSize: "0.9rem",
    boxShadow: "var(--shadow-sm)",
    cursor: "pointer",
  },
  counter: {
    fontSize: "0.75rem",
    padding: "0.15rem 0.45rem",
    borderRadius: "12px",
    background: "var(--primary-light)",
    color: "var(--primary)",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "360px 1fr",
    gap: "1.5rem",
    alignItems: "start",
  },
  card: {
    background: "var(--card-bg)",
    backdropFilter: "blur(12px)",
    border: "1px solid var(--card-border)",
    borderRadius: "var(--radius-lg)",
    padding: "1.75rem",
    boxShadow: "var(--shadow-sm)",
  },
  cardTitle: {
    fontSize: "1.15rem",
    fontWeight: 700,
    marginBottom: "0.25rem",
  },
  cardDesc: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    marginBottom: "1.25rem",
  },
  label: {
    display: "block",
    fontSize: "0.825rem",
    fontWeight: 600,
    color: "var(--text-main)",
    marginBottom: "0.35rem",
  },
  input: {
    width: "100%",
    padding: "0.65rem 0.85rem",
    borderRadius: "var(--radius-md)",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    fontSize: "0.9rem",
    color: "var(--text-main)",
    outline: "none",
    transition: "border-color 0.2s",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    fontSize: "0.9rem",
    fontWeight: 500,
    cursor: "pointer",
    userSelect: "none",
  },
  btnPrimary: {
    padding: "0.75rem",
    background: "var(--primary)",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "0.925rem",
    border: "none",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
    transition: "background 0.2s",
  },
  btnSecondary: {
    padding: "0.55rem 0.95rem",
    background: "#ffffff",
    color: "var(--text-main)",
    fontWeight: 600,
    fontSize: "0.85rem",
    border: "1px solid #cbd5e1",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
  },
  btnDangerOutline: {
    padding: "0.55rem 0.95rem",
    background: "transparent",
    color: "var(--danger)",
    fontWeight: 600,
    fontSize: "0.85rem",
    border: "1px solid var(--danger)",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
  },
  btnCancelSmall: {
    padding: "0.35rem 0.75rem",
    background: "var(--danger-light)",
    color: "var(--danger)",
    fontWeight: 600,
    fontSize: "0.775rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  switchMode: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "0.5rem",
    marginTop: "1.5rem",
    fontSize: "0.875rem",
    color: "var(--text-muted)",
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "var(--primary)",
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "underline",
  },
  toast: {
    padding: "0.85rem 1.25rem",
    borderRadius: "var(--radius-md)",
    marginBottom: "1.25rem",
    fontWeight: 600,
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    boxShadow: "var(--shadow-sm)",
  },
  toastOk: {
    background: "var(--success-light)",
    color: "#065f46",
    border: "1px solid #a7f3d0",
  },
  toastErr: {
    background: "var(--danger-light)",
    color: "#991b1b",
    border: "1px solid #fecaca",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0 0.5rem",
    textAlign: "left",
    fontSize: "0.875rem",
  },
  priceTag: {
    background: "var(--success-light)",
    color: "var(--success)",
    padding: "0.2rem 0.6rem",
    borderRadius: "6px",
    fontWeight: 700,
  },
  badgeVip: {
    background: "#fef3c7",
    color: "#b45309",
    padding: "0.2rem 0.6rem",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: 700,
  },
<<<<<<< HEAD
  badgeRegular: {
    background: "#e0f2fe",
    color: "#0369a1",
    padding: "0.2rem 0.6rem",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  badgeGuest: {
=======
  badgeStandard: {
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
    background: "#f1f5f9",
    color: "#475569",
    padding: "0.2rem 0.6rem",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  gridCards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "1rem",
  },
  roomCard: {
    background: "#ffffff",
    border: "1px solid #f1f5f9",
    borderRadius: "var(--radius-md)",
    padding: "1.25rem",
    boxShadow: "var(--shadow-sm)",
  },
  roomBadge: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "var(--primary)",
  },
  statusActive: {
    background: "var(--success-light)",
    color: "var(--success)",
    fontSize: "0.75rem",
    fontWeight: 700,
    padding: "0.2rem 0.5rem",
    borderRadius: "10px",
  },
  statusInactive: {
    background: "#f1f5f9",
    color: "#94a3b8",
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "0.2rem 0.5rem",
    borderRadius: "10px",
  },
  emptyState: {
    padding: "2.5rem",
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: "0.9rem",
    border: "2px dashed #cbd5e1",
    borderRadius: "var(--radius-md)",
  },
<<<<<<< HEAD
};
=======
};
>>>>>>> 04736398c971bc45f79ef84104ca2dac00efcf4b
