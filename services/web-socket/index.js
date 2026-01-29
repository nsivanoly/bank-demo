const http = require('http');
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const url = require('url');

// === CONFIG ===
const HTTP_PORT = 8081;
const HTTPS_PORT = 8443;
const HOST = '0.0.0.0';
const ACCESS_HOST = 'localhost';

// SSL Certificate (self-signed for development)
const SSL_CERT = {
    key: fs.readFileSync("../../certs/localhost.key"),
    cert: fs.readFileSync("../../certs/localhost.crt"),
};

// === SERVER SETUP ===
const httpServer = http.createServer();
const httpsServer = https.createServer(SSL_CERT, (req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    } else {
        res.writeHead(404);
        res.end();
    }
});

// === Health Check Endpoint ===
httpServer.on('request', (req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    }
});

// === WebSocket Server Instances ===
// HTTP (ws://) servers
const notificationsHttp = new WebSocket.Server({ noServer: true });
const generalSupportHttp = new WebSocket.Server({ noServer: true });
const paymentsHttp = new WebSocket.Server({ noServer: true });
const transfersHttp = new WebSocket.Server({ noServer: true });
const cardsHttp = new WebSocket.Server({ noServer: true });
const roomsHttp = { payments: paymentsHttp, transfers: transfersHttp, cards: cardsHttp };

// HTTPS (wss://) servers
const notificationsHttps = new WebSocket.Server({ noServer: true });
const generalSupportHttps = new WebSocket.Server({ noServer: true });
const paymentsHttps = new WebSocket.Server({ noServer: true });
const transfersHttps = new WebSocket.Server({ noServer: true });
const cardsHttps = new WebSocket.Server({ noServer: true });
const roomsHttps = { payments: paymentsHttps, transfers: transfersHttps, cards: cardsHttps };

const notificationClients = new Set();

// === Start HTTP/HTTPS Servers ===
httpServer.listen(HTTP_PORT, HOST, () => {
    console.log('========== Healthcheck Endpoint ===========');
    console.log(`🔍 HTTP Healthcheck: http://${ACCESS_HOST}:${HTTP_PORT}/health`);
    console.log('========== WebSocket Servers ==========');
    console.log(`🔔 Notifications (WS): ws://${ACCESS_HOST}:${HTTP_PORT}/notifications`);
    console.log(`🛟 General Support (WS): ws://${ACCESS_HOST}:${HTTP_PORT}/support`);
    console.log(`💬 Chat rooms (WS):    ws://${ACCESS_HOST}:${HTTP_PORT}/rooms?room={payments|transfers|cards}`);
    console.log('------------------------------------------------');
});

httpsServer.listen(HTTPS_PORT, HOST, () => {
    console.log(`🔍 HTTPS Healthcheck: https://${ACCESS_HOST}:${HTTPS_PORT}/health`);
    console.log(`🔔 Notifications (WSS): wss://${ACCESS_HOST}:${HTTPS_PORT}/notifications`);
    console.log(`🛟 General Support (WSS): wss://${ACCESS_HOST}:${HTTPS_PORT}/support`);
    console.log(`💬 Chat rooms (WSS):    wss://${ACCESS_HOST}:${HTTPS_PORT}/rooms?room={payments|transfers|cards}`);
    console.log('=================================================');
});

// === WebSocket Upgrade Handling for HTTP (ws://) ===
httpServer.on('upgrade', (req, socket, head) => {
    handleUpgrade(req, socket, head, {
        notifications: notificationsHttp,
        support: generalSupportHttp,
        rooms: roomsHttp
    });
});

// === WebSocket Upgrade Handling for HTTPS (wss://) ===
httpsServer.on('upgrade', (req, socket, head) => {
    handleUpgrade(req, socket, head, {
        notifications: notificationsHttps,
        support: generalSupportHttps,
        rooms: roomsHttps
    });
});

function handleUpgrade(req, socket, head, servers) {
    const pathname = url.parse(req.url).pathname;
    const queryParams = url.parse(req.url, true).query;

    if (pathname === '/notifications') {
        servers.notifications.handleUpgrade(req, socket, head, (ws) => {
            servers.notifications.emit('connection', ws, req);
        });
    } else if (pathname === '/support') {
        servers.support.handleUpgrade(req, socket, head, (ws) => {
            servers.support.emit('connection', ws, req);
        });
    } else if (pathname === '/rooms') {
        const room = servers.rooms[queryParams.room];
        if (room) {
            room.handleUpgrade(req, socket, head, (ws) => {
                room.emit('connection', ws, req);
            });
        } else {
            socket.destroy();
        }
    } else {
        socket.destroy();
    }
}

// === Message Formatting Utilities ===
const messageFormats = {
    notification: (message, user, protocol) => ({
        type: 'notification',
        message,
        user: user || 'system',
        timestamp: new Date().toISOString(),
        protocol
    }),
    support: (message, user, protocol) => ({
        type: 'support',
        message,
        user: user || 'Anonymous',
        timestamp: new Date().toISOString(),
        protocol
    }),
    chat: (message, room, user, protocol) => ({
        type: 'chat',
        message,
        room,
        user: user || 'system',
        timestamp: new Date().toISOString(),
        protocol
    }),
    system: (message, protocol) => ({
        type: 'system',
        message,
        timestamp: new Date().toISOString(),
        protocol
    })
};

// === Enhanced Notifications Server ===
function setupNotificationsServer(server, protocol) {
    server.on('connection', (ws, req) => {
        // Get user from query parameters or default to system
        const url = new URL(req.url, `ws://${req.headers.host}`);
        const user = url.searchParams.get('user') || "system";

        console.log(`🔔 ${protocol} Notifications client connected (${user})`);
        notificationClients.add(ws);

        // Send welcome message to the new connection
        ws.send(JSON.stringify(
            // messageFormats.notification(`Connected to ${protocol} notifications service`, 'system', protocol)
        ));

        // Send sample notifications periodically
        const notifications = [
            { "msg": "📉 Loan interest rate adjustments coming soon.", "type": "warning" },
            { "msg": "🛑 Temporary outage in mobile banking — working to restore service.", "type": "danger" },
            { "msg": "📍 ATM locator tool updated for better coverage.", "type": "info" },
            { "msg": "🧾 Digital statements are now faster and more accessible.", "type": "info" },
            { "msg": "🧩 New features added to mobile and web banking apps.", "type": "info" },
            { "msg": "📢 Banking services are operating as scheduled.", "type": "info" },
            { "msg": "🔔 Turn on notifications to never miss an update.", "type": "info" },
            { "msg": "🚀 Mobile app performance improvements rolling out.", "type": "success" },
            { "msg": "🧠 Financial wellness tools are available in our help center.", "type": "info" },
            { "msg": "📦 Safe deposit locker availability updated.", "type": "info" },
            { "msg": "📊 Stay updated with daily financial market overviews.", "type": "info" },
            { "msg": "📬 New customer service hours effective from next month.", "type": "info" },
            { "msg": "📤 Digital onboarding now available nationwide.", "type": "success" },
            { "msg": "💰 Special time deposit offers available for a limited time.", "type": "success" },
            { "msg": "🔄 We’re upgrading to serve you better.", "type": "info" },
            { "msg": "📢 Important notices will always appear here first.", "type": "warning" },
            { "msg": "📅 Upcoming holiday: Branches will be closed on public holidays.", "type": "warning" },
            { "msg": "🌱 Sustainability goals aligned with green banking practices.", "type": "success" },
            { "msg": "📌 Reminder: Check the latest interest rates on savings accounts.", "type": "warning" },
            { "msg": "🎓 Financial literacy webinars available monthly.", "type": "info" },
            { "msg": "📈 Explore our latest investment solutions online.", "type": "info" },
            { "msg": "⚠️ Service disruption due to unexpected technical issues.", "type": "danger" },
            { "msg": "⚙️ Routine maintenance scheduled for this weekend.", "type": "warning" },
            { "msg": "💼 Supporting small businesses with flexible financing options.", "type": "info" },
            { "msg": "🔎 Transparency and trust — our commitment to you.", "type": "info" },
            { "msg": "❗ Phishing alert: Do not share personal banking info via email.", "type": "danger" },
            { "msg": "🏦 Branch network expansion planned for key regions.", "type": "info" },
            { "msg": "💬 We're listening: Share your feedback anytime.", "type": "info" },
            { "msg": "📉 Critical system failure reported — emergency maintenance in progress.", "type": "danger" },
            { "msg": "🌐 Online banking platform receives performance upgrades.", "type": "info" },
            { "msg": "🚫 Suspicious login detected — please verify your activity.", "type": "danger" },
            { "msg": "🎯 Focus on digital transformation continues.", "type": "info" },
            { "msg": "🛡️ Multi-layer authentication keeps your data safe.", "type": "success" },
            { "msg": "🔒 Your security is our priority — systems monitored 24/7.", "type": "success" },
            { "msg": "💳 New card designs now available across all branches.", "type": "info" }
        ];

        const interval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                const msg = notifications[Math.floor(Math.random() * notifications.length)];
                ws.send(JSON.stringify(
                    messageFormats.notification(msg, 'system', protocol)
                ));
            }
        }, 20000);

        ws.on('close', () => {
            clearInterval(interval);
            notificationClients.delete(ws);
            console.log(`📴 ${protocol} Notifications client disconnected (${user})`);
        });
    });
}

// === Enhanced General Support Server ===
function setupSupportServer(server, protocol) {
    server.on('connection', (ws, req) => {
        // Get user from query parameters or default to Anonymous
        const url = new URL(req.url, `ws://${req.headers.host}`);
        const user = url.searchParams.get('user') || "Anonymous";

        // Send welcome message to the new connection
        ws.send(JSON.stringify(
            // messageFormats.support(`Welcome to ${protocol} general support`, 'Support', protocol)
        ));

        // Broadcast join notification to all other clients
        broadcast(ws, server,
            messageFormats.support(`${user} joined ${protocol} support`, 'System', protocol)
        );

        ws.on('message', (msg) => {
            try {
                const data = JSON.parse(msg.toString());
                const messageText = data.message || msg;
                const senderName = data.user || user;

                broadcast(ws, server,
                    messageFormats.support(messageText, senderName, protocol)
                );
            } catch {
                broadcast(ws, server,
                    messageFormats.support(msg.toString(), user, protocol)
                );
            }
        });

        ws.on('close', () => {
            broadcast(ws, server,
                messageFormats.support(`${user} left ${protocol} support`, 'System', protocol)
            );
        });
    });
}

// === Enhanced Chat Room Connections ===
function setupRoomServer(roomServer, roomName, protocol) {
    roomServer.on('connection', (ws, req) => {
        // Get user from query parameters or default to Anonymous
        const url = new URL(req.url, `ws://${req.headers.host}`);
        const user = url.searchParams.get('user') || "Anonymous";

        // Send welcome message
        ws.send(JSON.stringify(
            messageFormats.chat(`You joined ${roomName} chat`, roomName, 'system', protocol)
        ));

        // Broadcast join notification
        broadcast(ws, roomServer,
            messageFormats.chat(`${user} joined`, roomName, 'system', protocol)
        );

        ws.on('message', (msg) => {
            try {
                const data = JSON.parse(msg.toString());
                broadcast(ws, roomServer,
                    messageFormats.chat(
                        data.message || msg,
                        roomName,
                        user,
                        protocol
                    )
                );
            } catch {
                broadcast(ws, roomServer,
                    messageFormats.chat(
                        msg.toString(),
                        roomName,
                        user,
                        protocol
                    )
                );
            }
        });

        ws.on('close', () => {
            broadcast(ws, roomServer,
                messageFormats.chat(
                    `${user} left`,
                    roomName,
                    'system',
                    protocol
                )
            );
        });
    });
}

// === Enhanced Broadcast Helper ===
function broadcast(sender, channel, message) {
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);

    channel.clients.forEach(client => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(messageString);
        }
    });
}

// Initialize servers with new naming
setupNotificationsServer(notificationsHttp, 'WS');
setupNotificationsServer(notificationsHttps, 'WSS');
setupSupportServer(generalSupportHttp, 'WS');
setupSupportServer(generalSupportHttps, 'WSS');
setupRoomServer(paymentsHttp, 'Payments', 'WS');
setupRoomServer(transfersHttp, 'Transfers', 'WS');
setupRoomServer(cardsHttp, 'Cards', 'WS');
setupRoomServer(paymentsHttps, 'Payments', 'WSS');
setupRoomServer(transfersHttps, 'Transfers', 'WSS');
setupRoomServer(cardsHttps, 'Cards', 'WSS');
