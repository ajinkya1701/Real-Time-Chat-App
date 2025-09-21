import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

// adjust server URL if needed
const SERVER = 'http://localhost:4000';

export default function ChatWindow({ user, conversationId }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]); // ascending order (oldest->newest)
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const topCursorRef = useRef(null); // cursor for fetching older messages
  const messageListRef = useRef();

  useEffect(() => {
    const s = io(SERVER);
    setSocket(s);

    s.on('connect', () => {
      s.emit('join', conversationId);
    });

    s.on('message', (msg) => {
      // append new message at end
      setMessages(prev => [...prev, msg]);
      // optionally scroll to bottom
      scrollToBottom();
    });

    s.on('typing', ({ senderName, senderId }) => {
      if (senderId !== user.id) {
        // show typing UI - handled inside MessageInput/MessageList via event
        // we'll store indicator locally using custom event
        const ev = new CustomEvent('peerTyping', { detail: { senderName } });
        window.dispatchEvent(ev);
      }
    });

    s.on('stopTyping', ({ senderId }) => {
      const ev = new CustomEvent('peerStopTyping', {});
      window.dispatchEvent(ev);
    });

    return () => {
      s.emit('leave', conversationId);
      s.disconnect();
    };
  }, [conversationId]);

  useEffect(() => {
    // load latest messages (first page)
    (async function loadLatest(){
      try {
        const res = await axios.get(`${SERVER}/messages/${conversationId}?limit=20`);
        const { messages: msgs, nextCursor } = res.data;
        setMessages(msgs); // msgs already oldest->newest
        topCursorRef.current = nextCursor; // cursor to fetch older
        setHasMore(Boolean(nextCursor));
        // scroll to bottom after initial load
        setTimeout(scrollToBottom, 50);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [conversationId]);

  const fetchOlder = async () => {
    if (!topCursorRef.current || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const res = await axios.get(`${SERVER}/messages/${conversationId}?limit=20&before=${topCursorRef.current}`);
      const { messages: olderMessages, nextCursor } = res.data;
      if (olderMessages.length === 0) {
        setHasMore(false);
      } else {
        setMessages(prev => [...olderMessages, ...prev]);
        topCursorRef.current = nextCursor;
        setHasMore(Boolean(nextCursor));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOlder(false);
    }
  };

  // helper to scroll to bottom
  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };

  const sendMessage = (text) => {
    if (!socket) return;
    const payload = {
      conversationId,
      senderId: user.id,
      senderName: user.name,
      text
    };
    socket.emit('message', payload);
    // optionally optimistic update handled by server broadcast
  };

  const sendTyping = () => {
    if (!socket) return;
    socket.emit('typing', { conversationId, senderId: user.id, senderName: user.name });
  };

  const sendStopTyping = () => {
    if (!socket) return;
    socket.emit('stopTyping', { conversationId, senderId: user.id });
  };

  return (
    <div style={{ width: 420, border:'1px solid #ddd', borderRadius:8, display:'flex', flexDirection:'column', height:600 }}>
      <div style={{ padding:10, borderBottom:'1px solid #eee' }}>
        <strong>Chat — {conversationId}</strong>
      </div>

      <MessageList
        ref={messageListRef}
        messages={messages}
        onScrollTopReached={fetchOlder}
        hasMore={hasMore}
        loadingOlder={loadingOlder}
      />

      <MessageInput
        onSend={sendMessage}
        onTyping={sendTyping}
        onStopTyping={sendStopTyping}
      />
    </div>
  );
}
