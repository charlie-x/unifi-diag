# UniFi Diagnostics Dashboard

A Next.js/React dashboard with glass UI for monitoring UniFi network infrastructure.

## Features

- **Device Discovery**: Lists all UniFi devices (switches, APs, gateways)
- **Network Topology**: Interactive diagram showing device hierarchy and uplink speeds
- **Port Status**: Per-switch port grid with speed, PoE, and error indicators
- **Health Monitoring**: Alerts for overheating SFPs, packet errors, and available upgrades
- **Auto-refresh**: Data updates every 30 seconds

## Screenshots

The dashboard displays:
- Health alerts panel with critical/warning issues
- Interactive network topology diagram
- Expandable device list with port details

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and configure:
   ```env
   UNIFI_API_URL=https://192.168.1.1/proxy/network/api/s/default
   UNIFI_API_KEY=your-api-key-here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## UniFi API Key

Generate an API key in your UniFi Network Controller:
1. Go to Settings > System > Advanced
2. Enable "Local API"
3. Create a new API key

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

## License

Private - for internal use only.
