import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "./styles.css";

const socket = io("http://localhost:4000");

function formatTime(ts = Date.now()) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    socket.on("receive_message", (msg) => {
      const incoming =
        typeof msg === "string"
          ? { text: msg, type: "other", ts: Date.now(), sender: "Friend" }
          : {
              text: msg.text || msg.message || "",
              type: "other",
              ts: msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now(),
              sender: msg.senderName || "Friend",
            };
      setMessages((p) => [...p, incoming]);
      // auto-scroll if near bottom
      setTimeout(() => {
        const el = listRef.current;
        if (!el) return;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        if (atBottom) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }, 40);
    });

    socket.on("typing", (isTyping) => setTyping(Boolean(isTyping)));

    return () => {
      socket.off("receive_message");
      socket.off("typing");
    };
  }, []);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const max = 90; // px, roughly 3 lines
    ta.style.height = Math.min(ta.scrollHeight, max) + "px";
  }, [text]);

  const sendMessage = () => {
    if (!text.trim()) return;
    const payload = text.trim();
    socket.emit("send_message", payload);
    setMessages((p) => [...p, { text: payload, type: "self", ts: Date.now(), sender: "You" }]);
    setText("");
    socket.emit("typing", false);
    // scroll
    setTimeout(() => {
      const el = listRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, 40);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    socket.emit("typing", e.target.value !== "");
  };

  return (
    <div className="outer-wrapper">
      <div className="chat-card">
        <header className="chat-header">
          <div className="title">Live Chat</div>
          <div className="status">Connected</div>
        </header>

        <main className="chat-body" ref={listRef}>
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="emoji">💬</div>
              <div className="empty-text">No messages yet — say hi!</div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i + "-" + m.ts} className={`msg-row ${m.type === "self" ? "me" : "them"}`}>
              {m.type === "them" && <div className="avatar">{(m.sender || "F").charAt(0)}</div>}

              <div className="bubble">
                <div className="bubble-content">
                  {m.type === "them" && <div className="sender">{m.sender}</div>}
                  <div className="bubble-text">{m.text}</div>
                  <div className={`bubble-time ${m.type === "self" ? "time-self" : "time-them"}`}>
                    {formatTime(m.ts)}
                  </div>
                </div>
              </div>

              {m.type === "self" && <div style={{ width: 36 }} />}
            </div>
          ))}

          {typing && <div className="typing-indicator">Someone is typing…</div>}
        </main>

        <footer className="chat-input-area">
          <div className="input-inner">
            <textarea
              ref={taRef}
              className="input-textarea"
              placeholder="Type a message…"
              value={text}
              onChange={handleChange}
              onKeyDown={onKeyDown}
              rows={1}
            />
            <button className="send-button" onClick={sendMessage} disabled={!text.trim()}>
              Send
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
