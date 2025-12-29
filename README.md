# UniFi Diagnostics Dashboard

A Next.js/React dashboard with glass UI for monitoring UniFi network infrastructure.

## Features

- **Device Discovery**: Lists all UniFi devices (switches, APs, gateways)
- **Network Topology**: Interactive diagram showing device hierarchy, ports, and uplink speeds
- **Port Status**: Per-switch port grid with speed, PoE, and error indicators
- **Health Monitoring**: Alerts for overheating SFPs, packet errors, and available upgrades
- **Click-to-Locate**: Click health alerts to zoom to affected device in topology
- **Auto-refresh**: Data updates every 30 seconds

## Screenshots

<img width="545" height="242" alt="image" src="https://github.com/user-attachments/assets/c659c53c-d1b7-4a9c-8d76-fe4fedcb4a4f" />

<img width="1504" height="175" alt="image" src="https://github.com/user-attachments/assets/8dcca848-c5f1-4677-af85-66bd5744937b" />

<img width="315" height="234" alt="image" src="https://github.com/user-attachments/assets/2192614c-f880-42c8-8314-c6d394832261" />

<img width="743" height="464" alt="image" src="https://github.com/user-attachments/assets/b3485211-0627-45cc-8215-fc65531ebca4" />

<img width="551" height="332" alt="image" src="https://github.com/user-attachments/assets/78e8ab3c-93cf-4f72-8c51-6f01ee51d65f" />

The dashboard displays:
- Health alerts panel with critical/warning issues (clickable to locate)
- Interactive network topology diagram with port-level detail
- Expandable device list with port details

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/charlie-x/unifi-diag.git
   cd unifi-diag
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your UniFi controller credentials:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your controller details:
   ```env
   UNIFI_API_URL=https://<controller-ip>/proxy/network/api/s/default
   UNIFI_API_KEY=<your-api-key>
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## UniFi API Configuration

### Finding Your API URL

The URL format depends on your UniFi controller type:

| Controller Type | URL Format |
|-----------------|------------|
| UniFi OS (UDM, UDM-Pro, UDR, etc.) | `https://<ip>/proxy/network/api/s/default` |
| Self-hosted Controller | `https://<ip>:8443/api/s/default` |
| UniFi Cloud Key | `https://<ip>/api/s/default` |

Replace `default` with your site name if you have multiple sites.

### Generating an API Key

1. Log into your UniFi Network Controller
2. Go to **Settings** > **System** > **Advanced**
3. Scroll to **API** section
4. Click **Create API Key**
5. Copy the key (you won't be able to see it again)

**Note**: API key authentication requires UniFi Network 7.0+ or UniFi OS 2.0+. Older versions may require username/password authentication (not currently supported by this app).

## Health Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| SFP Temperature | > 70C | > 80C |
| RX Errors | > 100 | > 10,000 |
| RX Dropped | > 100,000 | - |

## Tech Stack

- Next.js 16 with App Router
- React 19
- React Flow for network diagrams
- Tailwind CSS for styling
- TanStack React Query for data fetching
- dagre for graph layout

## API Routes

- `GET /api/unifi/devices` - All devices with port tables
- `GET /api/unifi/clients` - Connected clients for MAC lookup
- `GET /api/unifi/health` - Aggregated health alerts

## Development

```bash
npm run dev     # Start dev server
npm run build   # Build for production
npm run start   # Start production server
npm run lint    # Run ESLint
```

## SSL Certificates

If your UniFi controller uses a self-signed certificate (common for local deployments), the app handles this automatically in development mode via `NODE_TLS_REJECT_UNAUTHORIZED=0`.

For production, consider:
- Installing the controller's CA certificate on your system
- Using a reverse proxy with a valid certificate
- Setting `NODE_TLS_REJECT_UNAUTHORIZED=0` (not recommended for production)

## License

MIT
