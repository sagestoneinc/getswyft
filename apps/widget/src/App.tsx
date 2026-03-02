import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useChat } from './useChat'
import './App.css'

declare global {
  interface Window {
    SwyftWidget?: {
      tenantId?: string;
      listingId?: string;
      address?: string;
      price?: string;
    };
  }
}

const widgetConfig = window.SwyftWidget || {};
const TENANT_ID = widgetConfig.tenantId || 'default';

function App() {
  const [open, setOpen] = useState(false)
  const [started, setStarted] = useState(false)
  const [lead, setLead] = useState<Record<string, string>>({})
  const [listing, setListing] = useState<Record<string, string>>({})
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  function handleStartChat(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLead({ name, email, phone })
    setListing({
      url: window.location.href,
      ...(widgetConfig.listingId ? { listingId: widgetConfig.listingId } : {}),
      ...(widgetConfig.address ? { address: widgetConfig.address } : {}),
      ...(widgetConfig.price ? { price: widgetConfig.price } : {}),
    })
    setStarted(true)
  }

  if (!open) {
    return (
      <button className="chat-launcher" onClick={() => setOpen(true)}>
        💬
      </button>
    )
  }

  if (!started) {
    return (
      <div className="chat-widget">
        <header className="chat-header">
          <span>Chat with us</span>
          <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
        </header>
        <form className="prechat-form" onSubmit={handleStartChat}>
          <label>
            Name *
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <label>
            Phone
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0100" />
          </label>
          <button type="submit">Start Chat</button>
        </form>
      </div>
    )
  }

  return <ChatWindow lead={lead} listing={listing} onClose={() => setOpen(false)} />
}

function ChatWindow({ lead, listing, onClose }: { lead: Record<string, string>; listing: Record<string, string>; onClose: () => void }) {
  const { messages, connected, error, afterHours, send } = useChat({
    tenantId: TENANT_ID,
    lead,
    listing,
  })

  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    send(text)
    setInput('')
  }

  return (
    <div className="chat-widget">
      <header className="chat-header">
        <span className={`status-dot ${connected ? 'online' : 'offline'}`} />
        <span>Chat {connected ? '(connected)' : '(connecting…)'}</span>
        <button className="chat-close" onClick={onClose}>✕</button>
      </header>

      {afterHours && (
        <div className="chat-after-hours">We're currently offline — leave a message and we'll get back to you!</div>
      )}

      {error && <div className="chat-error">{error}</div>}

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-msg chat-msg--${msg.sender}`}>
            <span className="chat-msg-body">{msg.body}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          disabled={!connected}
        />
        <button type="submit" disabled={!connected || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}

export default App
