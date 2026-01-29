<?php
require_once '../includes/header.php';
?>

<div class="container mt-5" id="chat-box">
    <div class="row justify-content-center">
        <div class="col-lg-8">
            <div class="card shadow-lg">
                <div class="card-body">
                    <h2 class="mb-4 text-center fw-bold">
                        🏦 Banking Support Channels
                    </h2>
                    
                    <ul class="nav nav-tabs mb-3" id="chatTabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="room-tab" data-bs-toggle="tab" data-bs-target="#roomChat" type="button" role="tab">
                                <i class="bi bi-chat-square-text me-1"></i> Room Chat
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="support-tab" data-bs-toggle="tab" data-bs-target="#supportChat" type="button" role="tab">
                                <i class="bi bi-headset me-1"></i> Support
                            </button>
                        </li>
                    </ul>
                    
                    <div class="tab-content">
                        <!-- Room Chat Tab -->
                        <div class="tab-pane fade show active" id="roomChat" role="tabpanel">
                            <div class="mb-4">
                                <label for="chatRoom" class="form-label">
                                    <i class="bi bi-door-open me-1"></i>Select Chat Room
                                </label>
                                <select class="form-select" id="chatRoom">
                                    <option value="payments">💳 Payments</option>
                                    <option value="transfers">⇄ Transfers</option>
                                    <option value="cards">🪪 Cards</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <button id="connectRoomBtn" class="btn btn-primary w-100">
                                    <i class="bi bi-plug me-1"></i> Connect to Room
                                </button>
                            </div>
                            
                            <div id="roomChatContainer" class="d-none">
                                <div class="card mb-3">
                                    <div class="card-body p-0">
                                        <div id="roomMessages" style="height: 300px; overflow-y: auto;" class="p-3"></div>
                                    </div>
                                </div>
                                
                                <div class="input-group mb-3">
                                    <input type="text" id="roomMessageInput" class="form-control" placeholder="Type your message...">
                                    <button id="sendRoomBtn" class="btn btn-success">
                                        <i class="bi bi-send me-1"></i> Send
                                    </button>
                                </div>
                                
                                <div class="d-flex justify-content-end">
                                    <button id="disconnectRoomBtn" class="btn btn-danger">
                                        <i class="bi bi-x-circle me-1"></i> Disconnect
                                    </button>
                                </div>
                            </div>
                            
                            <div id="roomConnectionStatus" class="mt-3 text-center"></div>
                        </div>
                        
                        <!-- Support Chat Tab -->
                        <div class="tab-pane fade" id="supportChat" role="tabpanel">
                            <div class="mb-3">
                                <button id="connectSupportBtn" class="btn btn-primary w-100">
                                    <i class="bi bi-headset me-1"></i> Connect to Support
                                </button>
                            </div>
                            
                            <div id="supportChatContainer" class="d-none">
                                <div class="card mb-3">
                                    <div class="card-body p-0">
                                        <div id="supportMessages" style="height: 300px; overflow-y: auto;" class="p-3"></div>
                                    </div>
                                </div>
                                
                                <div class="input-group mb-3">
                                    <input type="text" id="supportMessageInput" class="form-control" placeholder="Type your message...">
                                    <button id="sendSupportBtn" class="btn btn-success">
                                        <i class="bi bi-send me-1"></i> Send
                                    </button>
                                </div>
                                
                                <div class="d-flex justify-content-end">
                                    <button id="disconnectSupportBtn" class="btn btn-danger">
                                        <i class="bi bi-x-circle me-1"></i> Disconnect
                                    </button>
                                </div>
                            </div>
                            
                            <div id="supportConnectionStatus" class="mt-3 text-center"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Room Chat Elements
    const chatRoomSelect = document.getElementById('chatRoom');
    const connectRoomBtn = document.getElementById('connectRoomBtn');
    const disconnectRoomBtn = document.getElementById('disconnectRoomBtn');
    const sendRoomBtn = document.getElementById('sendRoomBtn');
    const roomMessageInput = document.getElementById('roomMessageInput');
    const roomMessages = document.getElementById('roomMessages');
    const roomChatContainer = document.getElementById('roomChatContainer');
    const roomConnectionStatus = document.getElementById('roomConnectionStatus');
    
    // Support Chat Elements
    const connectSupportBtn = document.getElementById('connectSupportBtn');
    const disconnectSupportBtn = document.getElementById('disconnectSupportBtn');
    const sendSupportBtn = document.getElementById('sendSupportBtn');
    const supportMessageInput = document.getElementById('supportMessageInput');
    const supportMessages = document.getElementById('supportMessages');
    const supportChatContainer = document.getElementById('supportChatContainer');
    const supportConnectionStatus = document.getElementById('supportConnectionStatus');
    
    let roomSocket = null;
    let supportSocket = null;
    let roomUsername = 'User-' + Math.floor(Math.random() * 1000);
    let supportUsername = 'User-' + Math.floor(Math.random() * 1000);
    
    // Room Chat Functions
    connectRoomBtn.addEventListener('click', connectToRoom);
    disconnectRoomBtn.addEventListener('click', disconnectFromRoom);
    sendRoomBtn.addEventListener('click', sendRoomMessage);
    roomMessageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendRoomMessage();
    });
    
    // Support Chat Functions
    connectSupportBtn.addEventListener('click', connectToSupport);
    disconnectSupportBtn.addEventListener('click', disconnectFromSupport);
    sendSupportBtn.addEventListener('click', sendSupportMessage);
    supportMessageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendSupportMessage();
    });
    
    function connectToRoom() {
        const room = chatRoomSelect.value;
        <?php  if (AUTH_ENABLED && TYPE=="KM" && isset($_SESSION['access_token'])) { ?>
        const roomWsUrl = `<?php echo WEBSOCKET_ROOMS_URL; ?>/${room}?access_token=<?php echo $_SESSION['access_token']; ?>`;
        <?php } else { ?>
        const roomWsUrl = `<?php echo WEBSOCKET_ROOMS_URL; ?>?room=${room}`;
        <?php } ?>
        
        roomSocket = new WebSocket(roomWsUrl);
        
        roomSocket.onopen = function(e) {
            roomConnectionStatus.innerHTML = `<div class="alert alert-success">Connected to ${room} room</div>`;
            roomChatContainer.classList.remove('d-none');
            connectRoomBtn.disabled = true;
            chatRoomSelect.disabled = true;
            
            // Send join message
            const joinMsg = {
                type: "chat",
                message: `${roomUsername} joined`,
                room: room.charAt(0).toUpperCase() + room.slice(1),
                user: roomUsername,
                timestamp: new Date().toISOString(),
                protocol: "WSS"
            };
            roomSocket.send(JSON.stringify(joinMsg));
            addRoomMessage(joinMsg);
        };
        
        roomSocket.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                addRoomMessage(data);
            } catch (e) {
                console.error('Error parsing room message:', e);
                addRoomMessage({
                    user: 'system',
                    message: event.data,
                    timestamp: new Date().toISOString()
                });
            }
        };
        
        roomSocket.onclose = function(event) {
            if (event.wasClean) {
                addRoomMessage({
                    user: 'system',
                    message: `Disconnected: ${event.code} ${event.reason || ''}`,
                    timestamp: new Date().toISOString()
                });
            } else {
                addRoomMessage({
                    user: 'system',
                    message: 'Connection lost unexpectedly',
                    timestamp: new Date().toISOString()
                });
            }
            roomConnectionStatus.innerHTML = `<div class="alert alert-danger">Disconnected from room chat</div>`;
            resetRoomConnection();
        };
        
        roomSocket.onerror = function(error) {
            addRoomMessage({
                user: 'system',
                message: `Error: ${error.message || 'Unknown error'}`,
                timestamp: new Date().toISOString()
            });
            roomConnectionStatus.innerHTML = `<div class="alert alert-danger">Connection error occurred</div>`;
            resetRoomConnection();
        };
    }
    
    function connectToSupport() {
        <?php  if (AUTH_ENABLED && TYPE=="AUTH" && isset($_SESSION['access_token'])) { ?>
        const supportWsUrl = '<?php echo WEBSOCKET_SUPPORT_URL; ?>?access_token=<?php echo $_SESSION['access_token']; ?>';
        <?php } else { ?>
        const supportWsUrl = '<?php echo WEBSOCKET_SUPPORT_URL; ?>';
        <?php } ?>
        
        supportSocket = new WebSocket(supportWsUrl);
        
        supportSocket.onopen = function(e) {
            supportConnectionStatus.innerHTML = `<div class="alert alert-success">Connected to support</div>`;
            supportChatContainer.classList.remove('d-none');
            connectSupportBtn.disabled = true;
            
            addSupportMessage({
                user: 'system',
                message: 'Connected to support channel',
                timestamp: new Date().toISOString()
            });
        };
        
        supportSocket.onmessage = function(event) {
            try {
                if (typeof event.data === "string") {
                const data = JSON.parse(event.data);
                addSupportMessage(data);
                }
            } catch (e) {
                console.error('Error parsing support message:', e);
                addSupportMessage({
                    user: 'system',
                    message: event.data,
                    timestamp: new Date().toISOString()
                });
            }
        };
        
        supportSocket.onclose = function(event) {
            addSupportMessage({
                user: 'system',
                message: 'Disconnected from support',
                timestamp: new Date().toISOString()
            });
            supportConnectionStatus.innerHTML = `<div class="alert alert-danger">Disconnected from support</div>`;
            resetSupportConnection();
        };
        
        supportSocket.onerror = function(error) {
            addSupportMessage({
                user: 'system',
                message: `Error: ${error.message || 'Unknown error'}`,
                timestamp: new Date().toISOString()
            });
            supportConnectionStatus.innerHTML = `<div class="alert alert-danger">Support connection error</div>`;
            resetSupportConnection();
        };
    }
    
    function disconnectFromRoom() {
        if (roomSocket) {
            // Send leave message
            const leaveMsg = {
                type: "chat",
                message: `${roomUsername} left`,
                room: chatRoomSelect.value.charAt(0).toUpperCase() + chatRoomSelect.value.slice(1),
                user: roomUsername,
                timestamp: new Date().toISOString(),
                protocol: "WSS"
            };
            roomSocket.send(JSON.stringify(leaveMsg));
            roomSocket.close();
        }
        resetRoomConnection();
    }
    
    function disconnectFromSupport() {
        if (supportSocket) {
            supportSocket.close();
        }
        resetSupportConnection();
    }
    
    function sendRoomMessage() {
        const message = roomMessageInput.value.trim();
        if (message && roomSocket && roomSocket.readyState === WebSocket.OPEN) {
            const msg = {
                type: "chat",
                message: message,
                room: chatRoomSelect.value.charAt(0).toUpperCase() + chatRoomSelect.value.slice(1),
                user: roomUsername,
                timestamp: new Date().toISOString(),
                protocol: "WSS"
            };
            roomSocket.send(JSON.stringify(msg));
            roomMessageInput.value = '';
        }
    }
    
    function sendSupportMessage() {
        const message = supportMessageInput.value.trim();
        if (message && supportSocket && supportSocket.readyState === WebSocket.OPEN) {
            const msg = {
                type: "support",
                message: message,
                user: supportUsername,
                timestamp: new Date().toISOString(),
                protocol: "WSS"
            };
            supportSocket.send(JSON.stringify(msg));
            addSupportMessage(msg); // Show our own message immediately
            supportMessageInput.value = '';
        }
    }
    
    function addRoomMessage(data) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('mb-2');
        
        const timeElement = document.createElement('small');
        timeElement.classList.add('text-muted', 'me-2');
        timeElement.textContent = formatTime(data.timestamp);
        
        const senderElement = document.createElement('strong');
        senderElement.textContent = `${data.user === roomUsername ? 'You' : data.user}: `;
        
        const textElement = document.createElement('span');
        textElement.textContent = data.message;
        
        messageElement.appendChild(timeElement);
        messageElement.appendChild(senderElement);
        messageElement.appendChild(textElement);
        
        roomMessages.appendChild(messageElement);
        roomMessages.scrollTop = roomMessages.scrollHeight;
    }
    
    function addSupportMessage(data) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('mb-2');
        
        const timeElement = document.createElement('small');
        timeElement.classList.add('text-muted', 'me-2');
        timeElement.textContent = formatTime(data.timestamp);
        
        const senderElement = document.createElement('strong');
        const senderName = data.user === supportUsername ? 'You' : 
                         data.user === 'system' ? 'System' : 
                         data.user === 'support' ? 'Support Agent' : data.user;
        senderElement.textContent = `${senderName}: `;
        
        const textElement = document.createElement('span');
        textElement.textContent = data.message;
        
        messageElement.appendChild(timeElement);
        messageElement.appendChild(senderElement);
        messageElement.appendChild(textElement);
        
        supportMessages.appendChild(messageElement);
        supportMessages.scrollTop = supportMessages.scrollHeight;
    }
    
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    }
    
    function resetRoomConnection() {
        if (roomSocket) {
            roomSocket.close();
            roomSocket = null;
        }
        roomChatContainer.classList.add('d-none');
        connectRoomBtn.disabled = false;
        chatRoomSelect.disabled = false;
    }
    
    function resetSupportConnection() {
        if (supportSocket) {
            supportSocket.close();
            supportSocket = null;
        }
        supportChatContainer.classList.add('d-none');
        connectSupportBtn.disabled = false;
    }
    
    // Clean up on page unload
    window.addEventListener('beforeunload', function() {
        if (roomSocket) {
            roomSocket.close();
        }
        if (supportSocket) {
            supportSocket.close();
        }
    });
});
</script>
<br/>
<br/>
<?php require_once '../includes/footer.php'; ?>