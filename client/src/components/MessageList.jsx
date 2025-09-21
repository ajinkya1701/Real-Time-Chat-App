import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

// MessageList receives messages in ascending (oldest->newest)
// and triggers onScrollTopReached to load older messages (infinite scroll up)
const MessageList = forwardRef(({ messages, onScrollTopReached, hasMore, loadingOlder }, ref) => {
  const containerRef = useRef();
  const [showTyping, setShowTyping] = useState(false);
  const [peerName, setPeerName] = useState('');

  useImperativeHandle(ref, () => containerRef.current);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let isFetching = false;
    const handleScroll = () => {
      // if scrollTop <= 50 -> user reached top -> fetch older messages
      if (el.scrollTop <= 50 && !isFetching && hasMore) {
        isFetching = true;
        const prevHeight = el.scrollHeight;
        Promise.resolve(onScrollTopReached()).then(() => {
          // after older messages loaded, maintain scroll position
          // compute new scrollTop: newScrollTop = newScrollHeight - prevHeight + oldScrollTop
          const newHeight = el.scrollHeight;
          el.scrollTop = newHeight - prevHeight + el.scrollTop;
          isFetching = false;
        }).catch(() => isFetching = false);
      }
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [onScrollTopReached, hasMore]);

  useEffect(() => {
    const onPeerTyping = (e) => {
      setPeerName(e.detail.senderName || 'Someone');
      setShowTyping(true);
    };
    const onPeerStop = () => setShowTyping(false);

    window.addEventListener('peerTyping', onPeerTyping);
    window.addEventListener('peerStopTyping', onPeerStop);
    return () => {
      window.removeEventListener('peerTyping', onPeerTyping);
      window.removeEventListener('peerStopTyping', onPeerStop);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:8 }}>
      {loadingOlder && <div style={{ textAlign:'center' }}>Loading older...</div>}
      {messages.map(msg => (
        <div key={msg._id} style={{ alignSelf: msg.senderId === 'user1' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
          <div style={{ fontSize:12, opacity:0.75 }}>{msg.senderName}</div>
          <div style={{ background:'#f1f1f1', padding:8, borderRadius:8 }}>{msg.text}</div>
          <div style={{ fontSize:11, opacity:0.6 }}>{new Date(msg.createdAt).toLocaleTimeString()}</div>
        </div>
      ))}
      {showTyping && <div style={{ fontStyle:'italic', opacity:0.8 }}>{peerName} is typing...</div>}
    </div>
  );
});

export default MessageList;
