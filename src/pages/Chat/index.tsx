import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, CardBody, Input, Button, Spinner, Badge } from 'reactstrap';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import { useDispatch } from 'react-redux';
import { changeLayoutMode, changeTopbarTheme, changeSidebarTheme } from '../../slices/thunks';
import { APIClient } from '../../helpers/api_helper';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useProjectStore } from '../../Components/Hooks/useProjectStore';

const TypewriterMarkdown = ({ text, isNew }: { text: string; isNew?: boolean }) => {
  const [displayedText, setDisplayedText] = useState(isNew ? '' : text);
  
  useEffect(() => {
    if (!isNew) {
      setDisplayedText(text);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) {
        clearInterval(interval);
      }
    }, 10);
    return () => clearInterval(interval);
  }, [text, isNew]);

  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({node, ...props}: any) => <table className="table table-sm table-bordered mt-2 mb-2 bg-white" {...props} />,
        thead: ({node, ...props}: any) => <thead className="table-light" {...props} />,
        code: ({node, inline, className, children, ...props}: any) => {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
              className="rounded mt-2 mb-2 shadow-sm"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 4px', borderRadius: '4px', color: '#e83e8c' }} className={className} {...props}>
              {children}
            </code>
          );
        }
      }}
    >
      {displayedText}
    </ReactMarkdown>
  );
};

const api = APIClient;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  theme?: ThemeConfig | null;
  isNew?: boolean;
}

interface ThemeConfig {
  dark_mode: boolean;
  primary_color?: string;
  sidebar_color?: string;
  topbar_color?: string;
}

interface Capability {
  category: string;
  action: string;
  description: string;
  required_role: string;
  allowed: boolean;
  icon: string;
  example_prompt: string;
}

// ─── Role badge color mapping ──────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  'Cualquiera': 'info',
  'Product Owner': 'warning',
  'Scrum Master': 'success',
  'Developer': 'primary',
  'Administrador': 'danger',
};

const CATEGORY_ICONS: Record<string, string> = {
  'Proyecto': 'ri-folder-line',
  'Sprint': 'ri-calendar-todo-line',
  'Historias': 'ri-file-list-3-line',
  'Tareas': 'ri-task-line',
  'Métricas': 'ri-bar-chart-grouped-line',
  'Perfil': 'ri-user-line',
  'Tema': 'ri-palette-line',
  'Admin': 'ri-shield-user-line',
};

// ─── Capability Card ───────────────────────────────────────────────────────
const CapabilityCard = React.memo(({ cap, onUse }: { cap: Capability; onUse: (prompt: string) => void }) => (
  <div
    className={`d-flex align-items-start gap-2 p-2 rounded-3 ${cap.allowed ? 'capability-card' : 'capability-card-disabled'}`}
    style={{
      cursor: cap.allowed ? 'pointer' : 'not-allowed',
      opacity: cap.allowed ? 1 : 0.5,
      transition: 'all 0.2s ease',
      border: '1px solid transparent',
    }}
    onClick={() => cap.allowed && onUse(cap.example_prompt)}
    title={cap.allowed ? `Haz clic para usar: "${cap.example_prompt}"` : `Requiere rol: ${cap.required_role}`}
  >
    <div className="flex-shrink-0 mt-1">
      <i className={`${cap.icon} fs-5 text-primary`}></i>
    </div>
    <div className="flex-grow-1 overflow-hidden">
      <div className="d-flex align-items-center gap-1 mb-0">
        <span className="fw-medium text-truncate" style={{ fontSize: '0.85rem' }}>{cap.action}</span>
        <Badge color={ROLE_COLORS[cap.required_role] || 'secondary'} pill className="ms-auto flex-shrink-0" style={{ fontSize: '0.65rem' }}>
          {cap.required_role}
        </Badge>
      </div>
      <small className="text-muted d-block text-truncate" style={{ fontSize: '0.75rem' }}>{cap.description}</small>
    </div>
  </div>
));
CapabilityCard.displayName = 'CapabilityCard';

// ─── Capabilities Panel ────────────────────────────────────────────────────
const CapabilitiesPanel = React.memo(({ capabilities, onUse, onClose }: {
  capabilities: Capability[];
  onUse: (prompt: string) => void;
  onClose: () => void;
}) => {
  const grouped = useMemo(() => {
    const map: Record<string, Capability[]> = {};
    for (const cap of capabilities) {
      if (!map[cap.category]) map[cap.category] = [];
      map[cap.category].push(cap);
    }
    return map;
  }, [capabilities]);

  const categories = useMemo(() => Object.keys(grouped), [grouped]);

  return (
    <div className="capabilities-panel p-3 rounded-3 mb-3" style={{
      background: 'var(--vz-card-bg, #fff)',
      border: '1px solid var(--vz-border-color, #e9ebec)',
      maxHeight: '60vh',
      overflowY: 'auto',
    }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h6 className="mb-0 d-flex align-items-center gap-2">
          <i className="ri-magic-line text-primary"></i>
          ¿Qué puedo hacer?
        </h6>
        <Button close onClick={onClose} />
      </div>
      <div className="row g-3">
        {categories.map(cat => (
          <div key={cat} className="col-12 col-md-6 col-lg-4">
            <div className="mb-2 d-flex align-items-center gap-1">
              <i className={`${CATEGORY_ICONS[cat] || 'ri-list-check'} text-muted`}></i>
              <span className="fw-semibold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', color: 'var(--vz-body-color)' }}>
                {cat}
              </span>
            </div>
            <div className="d-flex flex-column gap-1">
              {grouped[cat].map((cap, i) => (
                <CapabilityCard key={i} cap={cap} onUse={onUse} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-top">
        <small className="text-muted">
          <i className="ri-information-line me-1"></i>
          Las acciones disponibles dependen de tu rol en el proyecto activo. Los badges indican el rol requerido.
        </small>
      </div>
    </div>
  );
});
CapabilitiesPanel.displayName = 'CapabilitiesPanel';

// ─── Main Chat Component ───────────────────────────────────────────────────
const Chat = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem("chatHistory");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { role: 'assistant', content: '¡Hola! Soy tu asistente Scrum. Puedo ayudarte a gestionar proyectos, crear sprints, historias, tareas, asignar miembros y mucho más.\n\nHaz clic en **"¿Qué puedo hacer?"** para ver todas mis capacidades según tu rol, o simplemente pregúntame lo que necesites.' }
    ];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);

  const dispatch = useDispatch<any>();
  const authUserStr = (sessionStorage.getItem("authUser") || localStorage.getItem("authUser"));
  const authUser = authUserStr ? JSON.parse(authUserStr) : null;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    sessionStorage.setItem("chatHistory", JSON.stringify(messages));
  }, [messages]);

  // Load capabilities
  useEffect(() => {
    const loadCapabilities = async () => {
      try {
        const params = activeProjectId ? { active_project_id: activeProjectId } : {};
        const res: any = await api.get('/api/chat/capabilities', params);
        if (res?.capabilities) setCapabilities(res.capabilities);
      } catch { }
    };
    loadCapabilities();
  }, [activeProjectId]);

  const applyTheme = useCallback((theme: ThemeConfig | null) => {
    if (!theme) return;
    if (theme.dark_mode) {
      dispatch(changeLayoutMode('dark'));
      dispatch(changeTopbarTheme(theme.topbar_color || 'dark'));
      dispatch(changeSidebarTheme(theme.sidebar_color || 'dark'));
    } else {
      dispatch(changeLayoutMode('light'));
      dispatch(changeTopbarTheme(theme.topbar_color || 'light'));
      dispatch(changeSidebarTheme(theme.sidebar_color || 'light'));
    }
    if (theme.primary_color) {
      document.documentElement.style.setProperty('--vz-primary', theme.primary_color);
    }
  }, [dispatch]);

  const handleCapabilityUse = useCallback((prompt: string) => {
    setInput(prompt);
    setShowCapabilities(false);
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;

    setShowCapabilities(false);
    setShowSuggestions(false);

    const userMessage: Message = { role: 'user', content: msg.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .slice(-20)
        .map(m => ({ role: m.role, content: m.content }));

      const res: any = await api.create('/api/chat', {
        message: msg.trim(),
        history,
        active_project_id: activeProjectId
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: res.reply || 'Sin respuesta.',
        suggestions: res.suggestions || [],
        isNew: true
      };

      let themeConfig: ThemeConfig | null = null;
      const reply = res.reply || '';
      try {
        let jsonStr = null;
        let rawJsonMatch: any = null;
        const themeMatch = reply.match(/```json\n([\s\S]*?)\n```/);
        
        if (themeMatch && themeMatch[1].includes("dark_mode")) {
          jsonStr = themeMatch[1];
        } else {
          rawJsonMatch = reply.match(/\{[^{}]*"dark_mode"[^{}]*\}/);
          if (rawJsonMatch) jsonStr = rawJsonMatch[0];
        }

        if (jsonStr) {
          const parsed = JSON.parse(jsonStr);
          if (parsed.dark_mode !== undefined) {
            themeConfig = parsed;
            assistantMessage.theme = parsed;
            // Ocultar el código JSON crudo de la vista del usuario
            const matchToRemove = (themeMatch && themeMatch[1].includes("dark_mode")) ? themeMatch[0] : rawJsonMatch![0];
            assistantMessage.content = assistantMessage.content.replace(matchToRemove, '').trim();
            if (!assistantMessage.content) {
              assistantMessage.content = "✨ He generado y aplicado el nuevo tema a tu perfil.";
            }
          }
        }
      } catch { }

      setMessages(prev => [...prev, assistantMessage]);
      setShowSuggestions(true);

      if (themeConfig) {
        setTimeout(() => applyTheme(themeConfig), 500);
      }
    } catch (err: any) {
      const errorMsg = typeof err === 'string' ? err : 'Error al conectar con el asistente.';
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, activeProjectId, applyTheme]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const allowedCount = useMemo(() => capabilities.filter(c => c.allowed).length, [capabilities]);

  return (
    <div className="page-content">
      <style>{`
        .capability-card:hover {
          background: var(--vz-light, #f3f6f9) !important;
          border-color: var(--vz-primary, #556ee6) !important;
          transform: translateY(-1px);
        }
        .capability-card-disabled {
          filter: grayscale(0.5);
        }
        .capabilities-panel::-webkit-scrollbar {
          width: 4px;
        }
        .capabilities-panel::-webkit-scrollbar-thumb {
          background: var(--vz-border-color);
          border-radius: 4px;
        }
      `}</style>
      <Container fluid>
        <BreadCrumb title="Chat · Asistente IA" />

        <Row className="m-0 h-100">
          <Col xs={12} className="p-0 h-100">
            <Card className="chat-card shadow-none border-0 m-0" style={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
              <CardBody className="p-0" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }} className="chat-messages">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`d-flex mb-3 ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                      <div className={`p-3 rounded-3 ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-light'}`}
                        style={{ maxWidth: '80%', borderRadius: '12px' }}>
                        {msg.role === 'assistant' && (
                          <div className="d-flex align-items-center mb-2">
                            <div className="flex-shrink-0 me-2">
                              <div className="avatar-xs">
                                <span className="avatar-title rounded-circle bg-success">
                                  <i className="ri-robot-line"></i>
                                </span>
                              </div>
                            </div>
                            <h6 className="mb-0">Asistente</h6>
                          </div>
                        )}
                        {msg.role === 'user' && (
                          <div className="d-flex align-items-center justify-content-end mb-2">
                            <h6 className="mb-0 me-2 text-white">{authUser?.nombre_completo || 'Tú'}</h6>
                            <div className="flex-shrink-0">
                              <div className="avatar-xs">
                                <span className="avatar-title rounded-circle bg-primary">
                                  <i className="ri-user-line"></i>
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div style={{ whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '0.95rem', lineHeight: '1.5' }}>
                          {msg.role === 'assistant' ? (
                            <TypewriterMarkdown text={msg.content} isNew={msg.isNew} />
                          ) : (
                            msg.content
                          )}
                        </div>
                        {msg.theme && (
                          <div className="mt-2 p-2 rounded" style={{ background: msg.theme.dark_mode ? '#2a2a3e' : '#f0f0f5' }}>
                            <small className="d-block mb-1">🎨 Vista previa del tema:</small>
                            <div className="d-flex gap-1">
                              <span className="badge" style={{ backgroundColor: msg.theme.primary_color || '#556ee6', width: 24, height: 24 }}></span>
                              <span className={`badge ${msg.theme.dark_mode ? 'bg-dark' : 'bg-light text-dark'}`} style={{ width: 24, height: 24, border: '1px solid #ccc' }}></span>
                            </div>
                            <small className="d-block mt-1">{msg.theme.dark_mode ? '🌙 Oscuro' : '☀️ Claro'} · Color primario: {msg.theme.primary_color}</small>
                          </div>
                        )}
                        {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && idx === messages.length - 1 && (
                          <div className="mt-3 pt-3 border-top border-light">
                            <small className="text-muted d-block mb-2">⚡ Acciones rápidas recomendadas:</small>
                            <div className="d-flex flex-wrap gap-2">
                              {msg.suggestions.map((s, i) => (
                                <Button
                                  key={i}
                                  color="primary"
                                  outline
                                  size="sm"
                                  className="d-flex align-items-center"
                                  style={{ borderRadius: '20px', padding: '0.25rem 0.75rem' }}
                                  onClick={() => sendMessage(s)}
                                >
                                  <i className="ri-flashlight-fill me-1"></i> {s}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="d-flex justify-content-start mb-3">
                      <div className="p-3 rounded-3 bg-light">
                        <div className="d-flex align-items-center">
                          <Spinner size="sm" color="primary" className="me-2" />
                          <span>El asistente está pensando...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Capabilities Panel */}
                {showCapabilities && capabilities.length > 0 && (
                  <CapabilitiesPanel
                    capabilities={capabilities}
                    onUse={handleCapabilityUse}
                    onClose={() => setShowCapabilities(false)}
                  />
                )}

                <div className="mt-2 pt-2 border-top position-relative">
                  <div className="d-flex gap-2">
                    <Button
                      color="soft-primary"
                      className="flex-shrink-0 d-flex align-items-center gap-1"
                      onClick={() => setShowCapabilities(!showCapabilities)}
                      title="Ver qué puedo hacer"
                      style={{ borderRadius: '8px', padding: '0.375rem 0.75rem' }}
                    >
                      <i className="ri-magic-line"></i>
                      <span className="d-none d-md-inline" style={{ fontSize: '0.8rem' }}>
                        ¿Qué puedo hacer?
                      </span>
                      {allowedCount > 0 && (
                        <Badge color="primary" pill className="ms-1" style={{ fontSize: '0.65rem' }}>
                          {allowedCount}
                        </Badge>
                      )}
                    </Button>
                    <Input
                      innerRef={inputRef}
                      type="text"
                      placeholder="Escribe un mensaje al asistente..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={loading}
                    />
                    <Button color="primary" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
                      {loading ? <Spinner size="sm" /> : <i className="ri-send-plane-2-line"></i>}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
      
    </div>
  );
};

export default Chat;
