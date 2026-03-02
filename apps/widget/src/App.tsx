import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useChat } from './useChat'
import './App.css'

const TENANT_ID = 'default'

function App() {
  const { messages, connected, error, send } = useChat({
    tenantId: TENANT_ID,
    lead: {},
    listing: {},
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
        Chat {connected ? '(connected)' : '(connecting…)'}
      </header>

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
