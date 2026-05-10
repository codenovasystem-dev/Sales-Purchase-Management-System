import React, { useEffect, useRef, useState } from "react";

const createAssistantMessage = (content, meta = {}) => ({
  id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role: "assistant",
  content,
  ...meta
});

const readApiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const bodyText = await response.text();
  const compactBody = bodyText.replace(/\s+/g, " ").trim();

  if (compactBody.startsWith("<!DOCTYPE") || compactBody.startsWith("<html")) {
    throw new Error(
      "The support API returned HTML instead of JSON. The backend may need to be restarted or redeployed with the new support routes."
    );
  }

  throw new Error(compactBody || "The support API returned an unexpected response.");
};

function SupportChatWidget({ API_BASE_URL, WS_BASE_URL, user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [supportAvailable, setSupportAvailable] = useState(true);
  const [messages, setMessages] = useState([
    createAssistantMessage(
      "I'm your SalesIQ support copilot. Ask about sales, orders, inventory, or request a live human handoff."
    )
  ]);
  const [statusText, setStatusText] = useState("AI assistant online");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    let isMounted = true;

    const checkSupportHealth = async () => {
      if (!API_BASE_URL) {
        if (isMounted) {
          setSupportAvailable(false);
          setStatusText("Backend API unavailable");
        }
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/support/health`);
        const result = await readApiResponse(response);

        if (!response.ok || !result.supportApi) {
          throw new Error(result.message || "Support API unavailable");
        }

        if (isMounted) {
          setSupportAvailable(true);
          setStatusText(result.providers?.openai || result.providers?.gemini
            ? "AI assistant online"
            : "Demo AI assistant online");
        }
      } catch (_error) {
        if (isMounted) {
          setSupportAvailable(false);
          setStatusText("Support API needs backend redeploy");
        }
      }
    };

    checkSupportHealth();

    return () => {
      isMounted = false;
    };
  }, [API_BASE_URL]);

  useEffect(() => {
    if (!WS_BASE_URL || !user?.email || !supportAvailable) {
      return undefined;
    }

    const websocket = new WebSocket(WS_BASE_URL);

    websocket.onmessage = (event) => {
      const payload = JSON.parse(event.data);

      if (
        payload.type === "SUPPORT_ESCALATED" &&
        payload.data?.userEmail === user.email
      ) {
        setTicketId(payload.data.ticketId);
        setStatusText(`Escalated to human support (${payload.data.ticketId})`);
        setMessages((current) => [
          ...current,
          createAssistantMessage(
            `Your escalation is in queue with ticket ${payload.data.ticketId}. I'll update you as soon as a support teammate is assigned.`,
            { kind: "status", ticketId: payload.data.ticketId }
          )
        ]);
      }

      if (payload.type === "SUPPORT_AGENT_ASSIGNED" && payload.data?.ticketId) {
        setStatusText(`Human agent assigned to ${payload.data.ticketId}`);
        setMessages((current) => {
          if (!current.some((message) => message.ticketId === payload.data.ticketId && message.kind === "handoff")) {
            return [
              ...current,
              createAssistantMessage(
                `${payload.data.agentName} has joined ticket ${payload.data.ticketId}. Estimated response time: ${payload.data.eta}.`,
                { kind: "handoff", ticketId: payload.data.ticketId }
              )
            ];
          }

          return current;
        });
      }
    };

    return () => {
      websocket.close();
    };
  }, [WS_BASE_URL, supportAvailable, user]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isSending) {
      return;
    }

    if (!API_BASE_URL || !supportAvailable) {
      setMessages((current) => [
        ...current,
        { id: `user-${Date.now()}`, role: "user", content: text },
        createAssistantMessage("The chat UI is available, but the deployed backend does not currently expose the support API. Redeploy or restart the backend service, then try again.")
      ]);
      setInput("");
      return;
    }

    const nextUserMessage = { id: `user-${Date.now()}`, role: "user", content: text };
    const nextMessages = [...messages, nextUserMessage];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/support/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: text,
          history: nextMessages.map(({ role, content }) => ({ role, content }))
        })
      });

      const result = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(result.message || "Support chat failed");
      }

      setStatusText(result.source === "demo" ? "Demo AI assistant online" : "AI assistant online");
      setMessages((current) => [
        ...current,
        createAssistantMessage(result.reply, {
          escalationSuggested: result.escalationSuggested
        })
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        createAssistantMessage(`I hit an error while replying: ${error.message}`)
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const requestHumanSupport = async () => {
    if (isSending || !API_BASE_URL || !supportAvailable) {
      if (!supportAvailable) {
        setMessages((current) => [
          ...current,
          createAssistantMessage("Live escalation is unavailable until the backend is redeployed with the support API routes.")
        ]);
      }
      return;
    }

    setIsSending(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/support/escalate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: "User requested live support from dashboard chat",
          transcript: messages.map(({ role, content }) => ({ role, content }))
        })
      });

      const result = await readApiResponse(response);
      if (!response.ok) {
        throw new Error(result.message || "Escalation failed");
      }

      setTicketId(result.ticketId);
      setStatusText(`Escalation created (${result.ticketId})`);
    } catch (error) {
      setMessages((current) => [
        ...current,
        createAssistantMessage(`I couldn't create the escalation yet: ${error.message}`)
      ]);
      setIsSending(false);
      return;
    }

    setIsSending(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen((current) => !current)}
        style={{
          position: "fixed",
          right: "24px",
          bottom: "24px",
          zIndex: 30,
          border: "none",
          borderRadius: "999px",
          padding: "14px 18px",
          background: "linear-gradient(135deg, #0f766e 0%, #0ea5e9 100%)",
          color: "#fff",
          boxShadow: "0 16px 30px rgba(14, 165, 233, 0.25)",
          fontWeight: 700
        }}
      >
        {isOpen ? "Close Support" : "AI Support"}
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            right: "24px",
            bottom: "86px",
            width: "min(380px, calc(100vw - 32px))",
            height: "560px",
            backgroundColor: "#ffffff",
            borderRadius: "22px",
            overflow: "hidden",
            boxShadow: "0 25px 60px rgba(15, 23, 42, 0.22)",
            border: "1px solid rgba(148, 163, 184, 0.35)",
            zIndex: 30,
            display: "flex",
            flexDirection: "column"
          }}
        >
          <div
            style={{
              padding: "18px 18px 14px",
              color: "#fff",
              background: "linear-gradient(135deg, #082f49 0%, #0f766e 55%, #0ea5e9 100%)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "18px", fontWeight: 700 }}>SalesIQ Support</div>
                <div style={{ fontSize: "13px", opacity: 0.9 }}>{statusText}</div>
              </div>
              <div style={{ fontSize: "12px", padding: "6px 10px", borderRadius: "999px", backgroundColor: "rgba(255,255,255,0.18)" }}>
                {user.role}
              </div>
            </div>
          </div>

          <div style={{ padding: "12px 16px", backgroundColor: "#ecfeff", borderBottom: "1px solid #dbeafe", fontSize: "13px", color: "#155e75" }}>
            {supportAvailable
              ? "AI answers common questions and can escalate to a human teammate when needed."
              : "Support API is not live on the backend yet. Redeploy the backend service to enable chat and escalation."}
            {ticketId ? ` Active ticket: ${ticketId}` : ""}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px", background: "linear-gradient(180deg, #f8fafc 0%, #ecfeff 100%)" }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: "flex",
                  justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: "12px"
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "12px 14px",
                    borderRadius: message.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    backgroundColor: message.role === "user" ? "#0f766e" : "#ffffff",
                    color: message.role === "user" ? "#ffffff" : "#0f172a",
                    boxShadow: message.role === "user" ? "none" : "0 10px 24px rgba(15, 23, 42, 0.08)",
                    fontSize: "14px",
                    lineHeight: 1.5
                  }}
                >
                  {message.content}
                  {message.escalationSuggested && message.role === "assistant" && (
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "#0f766e", fontWeight: 700 }}>
                      Human handoff recommended for this issue.
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: "14px", borderTop: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
              <button
                onClick={requestHumanSupport}
                disabled={isSending || !supportAvailable}
                style={{
                  flex: 1,
                  border: "1px solid #0f766e",
                  color: "#0f766e",
                  backgroundColor: supportAvailable ? "#f0fdfa" : "#f8fafc",
                  borderRadius: "12px",
                  padding: "10px 12px",
                  fontWeight: 600
                }}
              >
                Escalate to Human
              </button>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask about orders, stock, revenue..."
                disabled={!supportAvailable}
                style={{
                  flex: 1,
                  border: "1px solid #cbd5e1",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  fontSize: "14px"
                }}
              />
              <button
                onClick={sendMessage}
                disabled={isSending || !input.trim() || !supportAvailable}
                style={{
                  border: "none",
                  borderRadius: "12px",
                  padding: "0 18px",
                  backgroundColor: "#0f766e",
                  color: "#ffffff",
                  fontWeight: 700
                }}
              >
                {isSending ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SupportChatWidget;
