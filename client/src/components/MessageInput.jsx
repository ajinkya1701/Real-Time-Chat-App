import React, { useState, useRef, useEffect } from 'react';

export default function MessageInput({ onSend, onTyping, onStopTyping }) {
  const [text, setText] = useState('');
  const typingRef = useRef(false);
  const timeoutRef = useRef();

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const handleChange = (e) => {
    setText(e.target.value);
    if (!typingRef.current) {
      typingRef.current = true;
      onTyping();
    }
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      typingRef.current = false;
      onStopTyping();
    }, 800); // stop typing after 800ms of inactivity
  };

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
    typingRef.current = false;
    onStopTyping();
    clearTimeout(timeoutRef.current);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ padding:10, borderTop:'1px solid #eee' }}>
      <textarea
        value={text}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder="Type your message..."
        style={{ width:'100%', height:60, padding:8, resize:'none' }}
      />
      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:6 }}>
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
