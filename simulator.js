const WebSocket = require('ws');

// Connect to your local Node.js server running on port 8080
const socket = new WebSocket('ws://localhost:8080');

socket.on('open', function open() {
  console.log('📡 Connected to local Node.js Server! Starting data stream...');

  // Send a data packet every 2 seconds
  setInterval(() => {
    // Generate standard room temperature (24°C - 27°C) with random minor fluctuations
    const baseTemp = 25.0;
    const temperature = parseFloat((baseTemp + Math.random() * 2.5).toFixed(2));
    
    // Generate humidity data (50% - 60%)
    const baseHumidity = 52.0;
    const humidity = parseFloat((baseHumidity + Math.random() * 8).toFixed(2));

    // Construct the structured JSON payload matching our architecture plan
    const payload = {
      deviceId: "ESP32_SIMULATED_01",
      timestamp: Math.floor(Date.now() / 1000),
      temperature: temperature,
      humidity: humidity
    };

    // Convert the JavaScript object to a clean string format and transmit it
    socket.send(JSON.stringify(payload));
    console.log('📤 Sent to backend:', payload);
  }, 2000); 
});

socket.on('close', () => {
  console.log('❌ Disconnected from server.');
});

socket.on('error', (err) => {
  console.error('❌ WebSocket Simulator Error:', err.message);
});