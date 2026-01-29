import React, { useEffect, useState, useRef, FormEvent, useCallback } from "react";
import { DefaultLayout } from "../layouts/default";
import { useAuthContext } from "@asgardeo/auth-react";
import { ChatService, ChatMessage, ChatTab, BankingChannel } from "../services/chat.service";
import { UserService } from "../services/user.service";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  InputGroup,
  Tab,
  Tabs,
} from "react-bootstrap";

const Chat = () => {
  const { state } = useAuthContext();
  const [activeTab, setActiveTab] = useState<ChatTab>("support");
  const [selectedChannel, setSelectedChannel] = useState<Exclude<BankingChannel, "SUPPORT">>("PAYMENTS");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const chatServiceRef = useRef<ChatService | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const [username] = useState(() => UserService.getDisplayName(state?.username));

  const handleNewMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => {
      const isDuplicate = prev.some(msg => msg.id === message.id);
      return isDuplicate ? prev : [...prev, message];
    });
  }, []);

  useEffect(() => {
    chatServiceRef.current = new ChatService(
      username,
      handleNewMessage,
      setConnectionStatus
    );
    chatServiceRef.current.connect(activeTab, selectedChannel);

    return () => {
      chatServiceRef.current?.disconnect();
    };
  }, [username, handleNewMessage, activeTab, selectedChannel]);

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages]);

  const sendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = chatServiceRef.current?.sendMessage(input);
    if (newMessage) {
      setMessages(prev => [...prev, newMessage]);
      setInput("");
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (activeTab === "support") {
      return msg.channel === "SUPPORT" || msg.type === 'system';
    } else {
      return msg.channel === selectedChannel || msg.type === 'system';
    }
  });

  const getMessageSender = (message: ChatMessage) => {
    if (message.type === 'system') return 'System';
    if (message.user === username) return 'You';
    return message.user || 'Bank Representative';
  };

  const bankingChannels = ChatService.getBankingChannels();

  return (
    <DefaultLayout>
      <Container className="my-5">
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <Card className="shadow">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">🏦 Banking Support</h4>
                  <div className="text-muted small">
                    Connected as: <strong>{username}</strong>
                  </div>
                </div>
                <span className={`badge ${connectionStatus === "Connected" ? "bg-success" : "bg-warning"}`}>
                  {connectionStatus}
                </span>
              </Card.Header>

              <Card.Body>
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k as ChatTab)}
                  className="mb-3"
                >
                  <Tab eventKey="support" title={bankingChannels.SUPPORT} />
                  <Tab eventKey="banking" title="💬 Banking Services">
                    <div className="d-flex align-items-center mb-2 mt-3">
                      <span className="text-muted small me-2">Channel:</span>
                      <select
                        className="form-select form-select-sm"
                        value={selectedChannel}
                        onChange={(e) => setSelectedChannel(e.target.value as Exclude<BankingChannel, "SUPPORT">)}
                        style={{ width: "180px" }}
                      >
                        {(Object.keys(bankingChannels) as BankingChannel[])
                          .filter(key => key !== 'SUPPORT')
                          .map(key => (
                            <option key={key} value={key}>
                              {bankingChannels[key]}
                            </option>
                          ))}
                      </select>
                    </div>
                  </Tab>
                </Tabs>

                <div
                  ref={chatRef}
                  className="border rounded p-3 mb-3 bg-light"
                  style={{ height: "400px", overflowY: "auto" }}
                >
                  {filteredMessages.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      {activeTab === "support"
                        ? "No messages in Support yet"
                        : `No messages in ${bankingChannels[selectedChannel]} yet`}
                    </div>
                  ) : (
                    filteredMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`d-flex mb-3 ${message.type === 'system' ? "justify-content-center" :
                            message.user === username ? "justify-content-end" : "justify-content-start"
                          }`}
                      >
                        <div
                          className={`p-3 rounded ${message.type === 'system' ? "bg-light text-muted text-center" :
                              message.user === username ? "bg-secondary text-white" : "bg-white border"
                            }`}
                          style={{ maxWidth: message.type === 'system' ? "100%" : "75%" }}
                        >
                          <div className="fw-bold small">
                            {getMessageSender(message)}
                            <small className="small text-muted ms-2 text-end">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </small>
                          </div>
                          <div className="mt-1">{message.message}</div>
                          {message.channel && message.channel !== "SUPPORT" && (
                            <div className="small text-muted mt-1">
                              {bankingChannels[message.channel]}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Form onSubmit={sendMessage} className="d-flex">
                  <InputGroup className="flex-grow-3 me-3">
                    <InputGroup.Text className="bg-white">
                      <i className="fas fa-comment-dots text-secondary" />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder={
                        activeTab === "support"
                          ? "Ask a banking question..."
                          : `Message about ${bankingChannels[selectedChannel]}...`
                      }
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="rounded-0"
                    />
                  </InputGroup>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!input.trim()}
                    className="px-4"
                  >
                    <i className="fas fa-paper-plane" />
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </DefaultLayout>
  );
};

export default Chat;
