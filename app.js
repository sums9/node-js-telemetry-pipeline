// 1. Bypass local certificate verification for the Cosmos Emulator
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { WebSocketServer } = require('ws');
const Client = require('azure-iot-device').Client;
const Message = require('azure-iot-device').Message;
const Mqtt = require('azure-iot-device-mqtt').Mqtt;
const { CosmosClient } = require("@azure/cosmos"); // Added Cosmos SDK

// ==========================================
// CONFIGURATION & CREDENTIALS
// ==========================================
// Azure IoT Hub Configuration
// Change line 14 to look like this (Remove your actual key string):
const iotHubConnectionString = 'HostName=YOUR_HUB_NAME.azure-devices.net;DeviceId=YOUR_DEVICE_ID;SharedAccessKey=YOUR_SECRET_KEY_PLACEHOLDER';const azureClient = Client.fromConnectionString(iotHubConnectionString, Mqtt);

// Local Cosmos DB Emulator Configuration
const cosmosEndpoint = "https://localhost:8081/";
const cosmosKey = "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="; // Removed trailing semicolon
const cosmosClient = new CosmosClient({ endpoint: cosmosEndpoint, key: cosmosKey });

let cosmosContainer;

// ==========================================
// INITIALIZE DATABASES & CONNECTIONS
// ==========================================
async function initBackend() {
    console.log("🔄 Initializing backend storage and cloud gateways...");

    // 1. Connect and setup Cosmos DB Emulator
    try {
        const { database } = await cosmosClient.databases.createIfNotExists({ id: "TelemetryDB" });
        const { container } = await database.containers.createIfNotExists({
            id: "TelemetryData",
            partitionKey: "/deviceId" // Using deviceId to split data cleanly
        });
        cosmosContainer = container;
        console.log('💾 Successfully connected to Local Cosmos DB Emulator!');
    } catch (cosmosErr) {
        console.error('❌ Cosmos DB Initialization failed:', cosmosErr.message);
    }

    // 2. Open the connection to Azure IoT Hub
    azureClient.open((err) => {
        if (err) {
            console.error('❌ Could not connect to Azure IoT Hub:', err.message);
        } else {
            console.log('☁️ Successfully connected to Azure IoT Hub cloud gateway!');
        }
    });
}

// Spin up connections
initBackend();


// ==========================================
// WEBSOCKET SERVER LOGIC
// ==========================================
const wss = new WebSocketServer({ port: 8080 });
console.log("🚀 Node.js WebSocket server running on port 8080...");

wss.on('connection', function connection(ws) {
    console.log("🔌 Simulator/Device connected to local backend!");

    ws.on('message', async function message(data) {
        try {
            // 1. Parse the incoming telemetry string into a JSON object
            const payload = JSON.parse(data);
            console.log("📥 Received locally:", payload);

            // 2. Ensure vital properties exist for database partition keys
            if (!payload.deviceId) {
                payload.deviceId = "ESP32_SIMULATED_01"; 
            }
            if (!payload.timestamp) {
                payload.timestamp = new Date().toISOString();
            }

            // =======================================================
            // 🔥 NEW: BROADCAST TO DASHBOARD
            // Send the data package to any webpage listening on port 8080
            // =======================================================
            wss.clients.forEach(function each(client) {
                if (client.readyState === 1) { // 1 means the socket connection is OPEN
                    client.send(JSON.stringify(payload));
                }
            });

            // =======================================================
            // PIPELINE A: FORWARD TO AZURE IOT HUB CLOUD
            // =======================================================
            const msg = new Message(JSON.stringify(payload));
            azureClient.sendEvent(msg, (err) => {
                if (err) {
                    console.error('❌ Cloud forwarding failed:', err.toString());
                } else {
                    console.log('🚀 Telemetry successfully pushed to Azure Cloud!');
                }
            });

            // =======================================================
            // PIPELINE B: SAVE TO LOCAL COSMOS DB EMULATOR
            // =======================================================
            if (cosmosContainer) {
                try {
                    const { resource: createdItem } = await cosmosContainer.items.create(payload);
                    console.log(`📝 Database Log: Saved item to Cosmos DB (ID: ${createdItem.id})`);
                } catch (dbErr) {
                    console.error('❌ Database storage failed:', dbErr.message);
                }
            }

        } catch (error) {
            console.log("❌ Error processing message:", error.message);
        }
    });

    ws.on('close', () => console.log("❌ Device disconnected."));
});