# 📡 Asynchronous HIL Telemetry Pipeline

<p align="left">
  <img src="https://img.shields.io/badge/Runtime-Node.js%20v24+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Cloud-Azure%20IoT%20Hub-0089D6?style=flat-square&logo=microsoftazure&logoColor=white" alt="Azure">
  <img src="https://img.shields.io/badge/Database-Cosmos%20DB%20NoSQL-B10B1C?style=flat-square&logo=azurecosmosdb&logoColor=white" alt="Cosmos DB">
  <img src="https://img.shields.io/badge/Protocol-WebSockets-010101?style=flat-square" alt="WebSockets">
</p>

An enterprise-grade, asynchronous backend architecture engineered to manage high-throughput telemetry streams from simulated edge hardware. The ingestion core maps inbound sensor metrics concurrently across a distributed three-tier system: instant cloud ingestion, local NoSQL persistence, and a real-time visualization layer.

---

## ⚡ Key Architecture Highlights

* **Concurrent Stream Forking** – Engineered with a non-blocking I/O routing core to process and duplicate streaming datasets to local and cloud infrastructure simultaneously.
* **Low-Latency Push Ring** – Dispatches lightweight JSON payloads natively across active client sockets using a state-verified WebSocket broadcast ring.
* **Optimized Partitioning** – Utilizes isolated strict partition indices (`/deviceId`) inside document storage for sub-millisecond querying operations.
* **Encapsulated Security Configuration** – Zero-exposure credential layer using environmental isolation barriers, ensuring secure deployment flows.

---

## 🏗️ System Data Flow

```text
  ┌───────────────────────┐
  │   Simulated Edge Node │  ──( Metrics Stream )──┐
  │     (simulator.js)    │                        │
  └───────────────────────┘                        │ WebSockets (Port 8080)
                                                   v
                                       ┌───────────────────────┐
                                       │   Asynchronous Core   │
                                       │       (app.js)        │
                                       └───────────┬───────────┘
                                                   │
                ┌──────────────────────────────────┼──────────────────────────────────┐
                │                                  │                                  │
                v                                  v                                  v
    🚀 Pipeline A: Cloud Ingest        📝 Pipeline B: Hot Storage          🔥 Pipeline C: UI Broadcast
     [ Azure IoT Hub Gateway ]         [ Local Cosmos DB Emulator ]         [ Web Dashboard UI ]
