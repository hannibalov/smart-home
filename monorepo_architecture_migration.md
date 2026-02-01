---
name: Monorepo Architecture Migration
overview: Refactor the smart-home app into a monorepo with separate frontend (Egin Home) and backend applications. The backend will handle device commands via WebSocket and Supabase Realtime queue, while the frontend will send commands through both channels and listen for state updates.
todos:
  - id: setup-monorepo
    content: Set up Yarn workspaces monorepo structure with packages/egin-home, packages/backend, and packages/shared
    status: pending
  - id: extract-shared-types
    content: Extract shared types to packages/shared and update imports across codebase
    status: pending
  - id: implement-backend-websocket
    content: Implement WebSocket server in backend (port 3001, configurable)
    status: pending
  - id: implement-backend-supabase-listener
    content: Implement Supabase Realtime listener for device_commands channel in backend
    status: pending
  - id: migrate-device-logic-backend
    content: Migrate device command processing logic from frontend to backend
    status: pending
  - id: implement-backend-state-emission
    content: Implement state update emission to device_state_updates channel in backend
    status: pending
  - id: implement-frontend-event-service
    content: Create eventService.ts for Supabase Realtime publishing/subscribing in frontend
    status: pending
  - id: implement-frontend-websocket-service
    content: Create websocketService.ts with connection management and retry logic in frontend
    status: pending
  - id: modify-control-route
    content: Modify control route to use event service and WebSocket when connected
    status: pending
  - id: update-dashboard-hook
    content: Update useDeviceDashboard hook to listen for state updates and update database
    status: pending
  - id: add-env-variables
    content: Add IS_CLOUD and backend WebSocket URL environment variables
    status: pending
  - id: write-backend-tests
    content: Write backend unit tests (stateManager, commandHandler, server) - test files as siblings
    status: pending
  - id: write-frontend-tests
    content: Write frontend unit tests (eventService, websocketService, backendManager) - test files as siblings
    status: pending
  - id: write-integration-tests
    content: Write integration tests for full event flow (command → processing → state update)
    status: pending
  - id: implement-state-manager
    content: Implement stateManager.ts with .status file persistence and state comparison
    status: pending
  - id: implement-backend-localhost-only
    content: Implement backend with localhost-only WebSocket and Supabase validation
    status: pending
  - id: implement-state-comparison
    content: Implement state comparison in commandHandler (deep equality, force flag support)
    status: pending
  - id: implement-backend-spawning
    content: Implement backendManager.ts to spawn backend on Next.js startup (IS_CLOUD=false) with hot reload handling (30s wait + retry)
    status: pending
  - id: implement-backend-kill-command
    content: Add yarn backend:kill command to kill all backend processes
    status: pending
  - id: update-documentation
    content: Update README and create deployment documentation
    status: pending
isProject: false
---

# Monorepo Architecture Migration Plan

## Overview

This plan outlines the migration from a single Next.js application to a monorepo structure with two separate applications:

1. **Egin Home** (Frontend) - Next.js application for user interface
2. **Backend** - Node.js application that processes device commands

## Architecture

### Event Flow

```
Frontend (Egin Home)
    │
    ├─► Always sends to Supabase Realtime: device_commands channel
    │
    └─► If IS_CLOUD=false && WebSocket connected: Also sends via WebSocket
         │
         └─► Backend receives from both sources
              │
              ├─► Processes command → sends to physical device
              │
              └─► Emits state update → Supabase Realtime: device_state_updates channel
                   │
                   └─► Frontend listens → Updates database
```

### Communication Channels

1. **Supabase Realtime Channels (per-home):**
  - `device_commands:${home_id}` - Commands from frontend to backend for specific home (pub/sub, consumed once per subscriber)
  - `device_state_updates:${home_id}` - State updates from backend to frontend for specific home (pub/sub, multiple subscribers)
  - **Note:** Each Raspberry Pi backend subscribes only to its configured home's channels
2. **WebSocket (when IS_CLOUD=false):**
  - Bidirectional connection between frontend and backend
  - Used for low-latency command delivery when backend is local
  - Default port: 3001 (configurable via yarn argument)
3. **Database Queue (offline fallback):**
  - `device_command_queue` table - Stores commands when backend is offline
  - Backend polls this table on startup and periodically when online

## Monorepo Structure

```
smart-home/
├── packages/
│   ├── egin-home/          # Frontend Next.js app
│   │   ├── src/
│   │   ├── package.json
│   │   └── next.config.ts
│   │
│   ├── backend/            # Backend Node.js app
│   │   ├── src/
│   │   │   ├── server.ts   # WebSocket server + Supabase listener
│   │   │   ├── handlers/   # Command handlers
│   │   │   └── services/   # Device interaction services
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/             # Shared types and utilities
│       ├── src/
│       │   ├── types/      # Shared TypeScript types
│       │   └── events/     # Event schemas
│       └── package.json
│
├── package.json            # Root workspace config
├── tsconfig.json           # Base TypeScript config
└── yarn.lock
```

## Implementation Details

### 1. Monorepo Setup (Yarn Workspaces)

**Root package.json:**

- Configure workspaces: `["packages/*"]`
- Add scripts for building/running both apps
- Add shared dependencies at root level

**Shared Package:**

- Extract common types from `src/types/index.ts`
- Define event schemas for device commands and state updates
- Export interfaces: `DeviceCommandEvent`, `DeviceStateUpdateEvent`

### 2. Backend Application

**Structure:**

- WebSocket server (using `ws` package) - **only accepts localhost connections**
- Supabase Realtime subscription to `device_commands` channel - **only accepts localhost origin**
- Command processing logic (migrate from `src/services/hub.ts`, `src/services/ble/interaction.ts`)
- State update emission to `device_state_updates` channel
- Local state persistence to `.status` file
- State comparison before processing commands

**Key Files:**

- `src/server.ts` - Main entry point, starts WebSocket server and Supabase listener
- `src/handlers/commandHandler.ts` - Processes device commands (with state comparison)
- `src/services/deviceService.ts` - Wraps BLE/AC device interactions
- `src/services/stateManager.ts` - Manages `.status` file (read/write/compare)
- `src/config.ts` - Configuration (port, Supabase credentials)

**State Management:**

- `.status` file location: `packages/backend/.status` (untracked, in .gitignore)
- Format: 
  ```json
  {
    "lastUpdated": 1234567890,
    "devices": {
      "deviceId1": { "power": true, "brightness": 50, ... },
      "deviceId2": { "power": false, "targetTemp": 22, ... }
    }
  }
  ```
- On startup: Try to load from Supabase database (`devices.last_state`), if unreachable recreate empty file `{}`
- On command: Compare new state with current state (deep equality using `JSON.stringify` comparison), discard if same (unless `force: true`)
- On state change: Update `.status` file immediately (synchronous write)
- File operations: Use Node.js `fs` module, handle corruption gracefully (try/catch, fallback to empty)

**Security:**

- WebSocket server only accepts connections from `localhost`/`127.0.0.1`
- Backend uses service role key but validates `home_id` in commands matches backend's configured `homeId`
- Backend subscribes only to `device_commands:${homeId}` channel (its configured home)
- Commands include `home_id` in payload - backend validates before processing
- RLS policies on Realtime channels restrict access by home membership (though service key bypasses, validation provides security)
- No external network access for WebSocket

**Dependencies:**

- `ws` - WebSocket server
- `@supabase/supabase-js` - Supabase client
- `@abandonware/noble` - BLE (if backend runs on device with BLE)

**Configuration:**

- `.config.json` file location: `packages/backend/.config.json` (untracked, in .gitignore)
- Format:
  ```json
  {
    "homeId": "uuid-of-home",
    "piId": "unique-pi-identifier",
    "registeredAt": "2026-02-01T00:00:00Z"
  }
  ```
- Backend requires `homeId` to start (fails gracefully if missing, waits for registration)
- `piId` is generated on first registration (UUID or MAC address)

**Environment Variables:**

- `PORT` - WebSocket server port (default: 3001)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key for Realtime access (doesn't expire)
- `STATUS_FILE_PATH` - Optional path to .status file (default: `.status` in backend root)
- `CONFIG_FILE_PATH` - Optional path to .config.json (default: `.config.json` in backend root)

**Standalone Mode:**

- Backend can run standalone: `yarn backend:start` (for production/cloud deployments)
- Or be spawned by frontend when `IS_CLOUD=false` (for local development)
- When spawned, frontend manages lifecycle (restart on crash, cleanup on frontend shutdown)
- Port detection: Frontend checks if port 3001 is listening before spawning (reuse existing if found)

### 3. Frontend Application (Egin Home)

**Changes Required:**

**New Service: `src/services/eventService.ts`**

- Manages Supabase Realtime subscriptions
- Publishes commands to `device_commands:${homeId}` channel (homeId from user selection)
- Subscribes to `device_state_updates:${homeId}` channel
- If Realtime publish fails (backend offline), stores command in `device_command_queue` table
- Updates database when state updates received
- Handles home selection changes (unsubscribe old home, subscribe new home)

**New Service: `src/services/websocketService.ts**`

- Manages WebSocket connection to backend
- Handles connection lifecycle (connect, disconnect, reconnect)
- Implements retry logic (1 minute intervals when IS_CLOUD=false)
- Sends commands via WebSocket when connected

**New Service: `src/services/backendManager.ts`**

- Spawns backend process when `IS_CLOUD=false` (Next.js startup hook using `instrumentation.ts` or custom server)
- **Hot reload handling:** Detects if backend is already running (attempt WebSocket connection to ws://localhost:3001)
- **Hot reload handling:** If port is in use but connection fails (backend compiling), wait 30 seconds and retry connection
- **Hot reload handling:** If retry fails (backend still not responding after 30s), then spawn new backend
- If backend already running and responsive, reuse existing connection
- Restarts backend automatically if it crashes (monitor process exit, respawn after delay)
- Manages backend process lifecycle (spawn, monitor, cleanup)
- Provides `killBackend()` function for cleanup (kill process by PID or port)
- Exports function for `yarn backend:kill` command (finds processes on port 3001, kills them)
- **Pi Registration:** Handles "Add Pi to Home" button - sends WebSocket command to backend to write .config.json and update hubs table

**New Component: `src/components/common/HomeSelector.tsx`**

- Dropdown in header to select current home
- Persists selection in localStorage or cookie
- Updates eventService subscriptions when home changes
- Shows "Add Pi to Home" button when backend connected and home selected

**Modified: `src/app/api/devices/[id]/control/route.ts**`

- Instead of directly calling `updateDeviceState`, publish to queue
- If WebSocket connected, also send via WebSocket
- Return success immediately (fire-and-forget pattern)

**Modified: `src/hooks/useDeviceDashboard.ts`**

- Subscribe to `device_state_updates:${homeId}` channel via eventService
- Update local state when updates received
- Update database via API call when state updates received
- Filter devices by selected home

**New API Route: `src/app/api/hubs/register/route.ts`**

- POST endpoint to register Raspberry Pi to home
- Writes .config.json file to backend (via WebSocket if connected, or direct file write)
- Creates/updates hubs table record
- Returns success/failure

**Environment Variables:**

- `IS_CLOUD` - Boolean (default: false)
- `NEXT_PUBLIC_BACKEND_WS_URL` - WebSocket URL (e.g., `ws://localhost:3001`)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

**Frontend State:**

- Selected home ID stored in localStorage (key: `selectedHomeId`)
- Defaults to first home user has access to
- Home selector component in header updates this state

### 4. Event Schema

**Device Command Event (device_commands:${home_id} channel):**

```typescript
{
  id: string;              // Unique event ID (for idempotency)
  homeId: string;          // Home UUID (validated by backend)
  deviceId: string;        // Device hardware ID
  command: {
    type: string;           // Command type (power, brightness, etc.)
    value: unknown;        // Command value (varies by type)
    raw?: string;          // Optional raw hex command
    characteristic?: string; // Optional characteristic UUID
    force?: boolean;       // Optional flag to override state comparison
  };
  timestamp: number;       // Unix timestamp
  source: 'frontend';      // Event source identifier
  userId?: string;         // Optional user ID (for audit)
}
```

**Device State Update Event (device_state_updates:${home_id} channel):**

```typescript
{
  id: string;              // Unique event ID
  homeId: string;          // Home UUID
  deviceId: string;        // Device hardware ID
  state: Record<string, unknown>; // Updated state (power, brightness, etc.)
  timestamp: number;       // Unix timestamp
  source: 'backend';       // Event source identifier
  piId?: string;           // Optional Pi identifier (if multiple Pis)
}
```

### 5. Database Updates

**Migration: `003_create_hubs_and_command_queue.sql`**

- Create `hubs` table for Raspberry Pi registration:
  - Columns: id (UUID), home_id (FK), pi_id (unique identifier), name, last_seen, created_at, updated_at
  - Indexes: home_id, pi_id
  - RLS policies: Users can view hubs for their homes
  
- Create `device_command_queue` table for offline command storage:
  - Columns: id (UUID), home_id (FK), device_id, command (JSONB), status (pending/processing/completed/failed), created_at, processed_at, error_message
  - Indexes: home_id, status, created_at
  - RLS policies: Users can insert commands for their homes, backend (service key) can read/update
  
- Optional: Create `device_events` table for event logging/audit:
  - Columns: id, device_id, event_type, payload, created_at
  - Indexes for querying by device_id and timestamp

**Note:** Commands are sent to Realtime channel first. If backend is offline, frontend stores command in `device_command_queue` table. Backend polls this table on startup and periodically.

## Testing Strategy

### Unit Tests

**Backend:**

- `packages/backend/src/handlers/commandHandler.test.ts` - Test command processing logic, state comparison, force flag
- `packages/backend/src/services/deviceService.test.ts` - Test device interaction wrappers
- `packages/backend/src/services/stateManager.test.ts` - Test .status file read/write, corruption handling, database fallback
- `packages/backend/src/server.test.ts` - Test WebSocket server (localhost-only), message handling
- Mock Supabase Realtime client for testing

**Frontend:**

- `packages/egin-home/src/services/eventService.test.ts` - Test Supabase Realtime publishing/subscribing
- `packages/egin-home/src/services/websocketService.test.ts` - Test WebSocket connection lifecycle, retry logic
- `packages/egin-home/src/services/backendManager.test.ts` - Test backend spawning, port detection, hot reload handling (30s wait + retry), crash recovery
- Mock WebSocket and Supabase clients

### Integration Tests

**Backend:**

- `packages/backend/src/handlers/commandHandler.integration.test.ts` - Test command processing with state comparison
- `packages/backend/src/server.integration.test.ts` - Test WebSocket server accepts localhost connections, rejects non-localhost
- `packages/backend/src/services/stateManager.integration.test.ts` - Test state persistence, database fallback

**Frontend:**

- `packages/egin-home/src/services/eventService.integration.test.ts` - Test command sending (both queue and WebSocket)
- `packages/egin-home/src/services/websocketService.integration.test.ts` - Test state update reception and database update
- `packages/egin-home/src/hooks/useDeviceDashboard.integration.test.ts` - Test WebSocket reconnection logic, state updates

**Shared:**

- `packages/shared/src/types/events.test.ts` - Test event schema validation

## Migration Steps

### Phase 1: Monorepo Setup

1. Create monorepo structure with Yarn workspaces
2. Move existing code to `packages/egin-home`
3. Create `packages/shared` with extracted types
4. Update imports to use shared package
5. Verify existing functionality still works
6. Add root scripts: `yarn backend:kill` to kill all backend processes

### Phase 2: Testing (Test-Driven Development)

**Backend Tests:**

1. Write `stateManager.test.ts` - Test .status file operations, corruption handling, database fallback
2. Write `commandHandler.test.ts` - Test command processing, state comparison logic, force flag
3. Write `server.test.ts` - Test WebSocket server (localhost-only), message handling
4. Write integration tests for state persistence and command flow

**Frontend Tests:**

1. Write `eventService.test.ts` - Test Supabase Realtime publishing/subscribing
2. Write `websocketService.test.ts` - Test WebSocket connection lifecycle, retry logic
3. Write `backendManager.test.ts` - Test backend spawning, port detection, crash recovery
4. Write integration tests for event flow and state updates

**Shared Tests:**

1. Write `events.test.ts` - Test event schema validation

### Phase 3: Backend Implementation

1. Create `packages/backend` structure
2. Implement `configManager.ts` - .config.json file management (read/write, validate homeId exists)
3. Implement `stateManager.ts` - .status file management (read/write/compare)
4. Implement WebSocket server (localhost-only, port 3001)
5. Implement WebSocket handler for "register-pi" command (writes .config.json, updates hubs table)
6. Implement Supabase Realtime listener for `device_commands:${homeId}` (validates homeId matches config)
7. Implement database poller for `device_command_queue` table (polls on startup and periodically)
8. Implement `commandHandler.ts` - Process commands with state comparison (deep equality, force flag), idempotency by command ID
9. Migrate device command logic from frontend
10. Implement state update emission to `device_state_updates:${homeId}`
11. Add configuration and environment variable handling
12. Ensure backend fails gracefully if homeId not configured (wait for registration)
13. Ensure backend can run standalone (`yarn backend:start`)

### Phase 4: Frontend Event System

1. Create `backendManager.ts` - Spawn backend on Next.js startup (if IS_CLOUD=false)
2. Implement port detection (check if backend already running via WebSocket connection attempt)
3. **Implement hot reload handling:** If port in use but connection fails, wait 30s and retry before spawning
4. Implement crash recovery (restart backend on crash)
5. Create `eventService.ts` for Supabase Realtime (home-aware channels)
6. Create `websocketService.ts` for WebSocket management
7. Create `HomeSelector.tsx` component for header
8. Implement home selection persistence (localStorage)
9. Implement "Add Pi to Home" functionality (WebSocket command + API route)
10. Modify control route to use event system (include homeId in commands)
11. Update hooks to listen for state updates (filter by selected home)
12. Add database update logic on state updates
13. Implement fallback to `device_command_queue` table when Realtime fails
14. Add `yarn backend:kill` command implementation

### Phase 5: Documentation & Cleanup

1. Update README with new architecture
2. Document environment variables
3. Document deployment process
4. Document .status file format and location
5. Remove deprecated code paths
6. Update API documentation
7. Add .status to .gitignore

## Key Considerations

### Supabase Realtime Limitations

- Events are consumed once per subscriber (pub/sub model)
- Need separate channels per home: `device_commands:${homeId}` and `device_state_updates:${homeId}`
- If no subscriber is listening, messages are lost (use database queue as fallback)
- Realtime requires proper authentication and RLS policies
- Service role key bypasses RLS, so backend must validate homeId manually
- Channel names with colons may need URL encoding - verify Supabase Realtime supports this format

### WebSocket Connection Management

- Frontend spawns backend process when `IS_CLOUD=false` (Next.js startup hook)
- **Hot reload handling:** Frontend detects if backend already running (port check + WebSocket connection attempt)
- **Hot reload handling:** If port in use but WebSocket connection fails (backend compiling), wait 30 seconds and retry connection
- **Hot reload handling:** If retry fails (backend still not responding after 30s), spawn new backend
- Frontend automatically restarts backend if it crashes
- Frontend handles connection failures gracefully
- Implement retry logic (1 minute intervals when IS_CLOUD=false for reconnection after disconnect)
- Consider connection health checks (ping/pong)
- Handle browser tab visibility (pause when hidden, resume when visible)
- Provide `yarn backend:kill` command to kill all backend processes

### Error Handling

- Commands should be idempotent - use command `id` field to deduplicate (track processed command IDs)
- **State comparison prevents duplicate commands** - Backend compares new command with current state (deep equality)
- **Force flag allows override** - Commands with `force: true` bypass state comparison
- If state unchanged and no force flag, discard command (no device interaction)
- **Multiple backends same home:** All backends receive same commands, idempotency prevents duplicate processing
- Implement retry logic for failed commands
- Log errors for debugging
- Consider dead letter queue for failed commands (mark as 'failed' in device_command_queue)
- .status file corruption: Try to load from database, if unreachable recreate empty file
- Backend startup without homeId: Log warning, wait for registration, don't process commands until configured

### Performance

- WebSocket provides lower latency for local connections
- Supabase queue ensures reliability even if WebSocket fails
- Consider batching multiple state updates
- Monitor queue depth and processing time

### Security

- **WebSocket only accepts localhost connections** - Reject any connection not from 127.0.0.1/localhost
- **Supabase Realtime validates localhost origin** - Backend should only accept events from localhost
- Supabase Realtime uses RLS policies for authorization
- Commands should validate device ownership before processing
- Consider rate limiting for command sending
- .status file should not contain sensitive data (only device state)

## Files to Modify/Create

### New Files

**Backend:**

- `packages/backend/src/server.ts`
- `packages/backend/src/handlers/commandHandler.ts`
- `packages/backend/src/handlers/commandHandler.test.ts` (sibling)
- `packages/backend/src/services/deviceService.ts`
- `packages/backend/src/services/stateManager.ts`
- `packages/backend/src/services/stateManager.test.ts` (sibling)
- `packages/backend/src/services/configManager.ts`
- `packages/backend/src/services/configManager.test.ts` (sibling)
- `packages/backend/src/services/queuePoller.ts` - Polls device_command_queue table
- `packages/backend/src/services/queuePoller.test.ts` (sibling)
- `packages/backend/src/server.test.ts` (sibling)
- `packages/backend/src/config.ts`
- `packages/backend/.status` (untracked, in .gitignore)
- `packages/backend/.config.json` (untracked, in .gitignore)

**Frontend:**

- `packages/egin-home/src/services/eventService.ts`
- `packages/egin-home/src/services/eventService.test.ts` (sibling)
- `packages/egin-home/src/services/websocketService.ts`
- `packages/egin-home/src/services/websocketService.test.ts` (sibling)
- `packages/egin-home/src/services/backendManager.ts`
- `packages/egin-home/src/services/backendManager.test.ts` (sibling)
- `packages/egin-home/src/components/common/HomeSelector.tsx`
- `packages/egin-home/src/components/common/HomeSelector.test.tsx` (sibling)
- `packages/egin-home/src/app/api/hubs/register/route.ts`
- `packages/egin-home/src/app/api/hubs/register/route.test.ts` (sibling)

**Shared:**

- `packages/shared/src/types/events.ts`
- `packages/shared/src/types/events.test.ts` (sibling)
- `packages/shared/src/index.ts`

**Root:**

- `MONOREPO.md` (this file)

### Modified Files

- `package.json` (root) - Add workspaces config
- `packages/egin-home/src/app/api/devices/[id]/control/route.ts` - Use event service
- `packages/egin-home/src/hooks/useDeviceDashboard.ts` - Listen to state updates
- `packages/egin-home/package.json` - Add dependencies, update name
- `tsconfig.json` - Add references to workspace packages

### Migrated Files

- `src/services/ble/*` → `packages/backend/src/services/ble/*` (backend needs these)
- `src/services/ac.ts` → `packages/backend/src/services/ac.ts`
- `src/services/hub.ts` → `packages/backend/src/handlers/commandHandler.ts` (refactored)
- `src/types/index.ts` → `packages/shared/src/types/index.ts` (extracted)

## Dependencies

### Backend

- `ws` - WebSocket server
- `@supabase/supabase-js` - Supabase client
- `@abandonware/noble` - BLE (if needed)
- `typescript` - TypeScript support

### Frontend

- `@supabase/supabase-js` - Supabase client (already present)
- No new dependencies (WebSocket API is native)

### Shared

- `typescript` - Type definitions only

## Environment Variables

### Backend (.env)

```
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

### Frontend (.env.local)

```
IS_CLOUD=false
NEXT_PUBLIC_BACKEND_WS_URL=ws://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Potential Issues & Concerns

### 1. Supabase Realtime Channel Naming
**Issue:** Supabase Realtime may not support colons in channel names (`device_commands:${homeId}`)
**Solution:** 
- Verify Supabase Realtime documentation for channel naming conventions
- Alternative: Use underscore (`device_commands_${homeId}`) or encode homeId
- Test channel subscription with dynamic names before implementation

### 2. Service Key Security
**Issue:** Service role key bypasses RLS, so backend could theoretically process commands for any home
**Mitigation:**
- Backend validates `homeId` in command matches its configured `homeId` from .config.json
- Backend only subscribes to its own home's channel
- Commands include `homeId` in payload - backend rejects mismatches
- Consider adding command signing/verification in future

### 3. Multiple Backends Same Home
**Issue:** If multiple Raspberry Pis manage same home, all receive same commands
**Mitigation:**
- Use command `id` field for idempotency (track processed IDs)
- State comparison prevents duplicate device interactions
- Each backend maintains its own .status file (may diverge slightly)
- State updates from all backends are broadcast (last write wins in database)

### 4. Offline Command Queue
**Issue:** Supabase Realtime is pub/sub - if no subscriber, messages are lost
**Solution:**
- Frontend checks if backend is online before sending to Realtime
- If offline or Realtime fails, store command in `device_command_queue` table
- Backend polls queue on startup and periodically (every 30s)
- Mark commands as 'processing' to prevent duplicate processing

### 5. Backend Startup Without HomeId
**Issue:** Backend needs `homeId` to subscribe to channels, but .config.json may not exist
**Solution:**
- Backend checks for .config.json on startup
- If missing, log warning and wait for registration
- Don't start Realtime listener or process commands until configured
- WebSocket server still starts (for registration command)
- Frontend shows "Register Pi" button when backend connected but not registered

### 6. Home Selection Persistence
**Issue:** User selects home in Vercel, but selection lost on refresh
**Solution:**
- Store selected `homeId` in localStorage
- Default to first home user has access to
- Update eventService subscriptions when home changes
- Consider syncing to database for cross-device persistence

### 7. Command Deduplication
**Issue:** Same command sent multiple times (user clicks rapidly, network retry, etc.)
**Solution:**
- Use command `id` field (UUID) for idempotency
- Backend tracks processed command IDs (in-memory cache, TTL 1 hour)
- State comparison provides additional deduplication layer
- Database queue marks commands as 'processing' to prevent duplicates

### 8. State Synchronization
**Issue:** Vercel frontend and Raspberry Pi frontend may show different states
**Solution:**
- Both frontends subscribe to `device_state_updates:${homeId}` channel
- Backend emits state updates after processing commands
- Database is source of truth (updated by backend)
- Frontends refresh from database on connection/reconnect

### 9. WebSocket Registration Command
**Issue:** Backend needs to write .config.json file, but running as separate process
**Solution:**
- Frontend sends "register-pi" command via WebSocket
- Backend receives command, validates user has access to home
- Backend writes .config.json file (Node.js fs module)
- Backend updates hubs table via Supabase
- Backend restarts Realtime listener with new homeId

### 10. Vercel Deployment Limitations
**Issue:** Vercel serverless functions can't spawn long-running processes
**Solution:**
- Backend spawning only happens when `IS_CLOUD=false` (Raspberry Pi)
- Vercel deployment uses `IS_CLOUD=true` (no backend spawning)
- Vercel frontend only uses Supabase Realtime + database queue
- Raspberry Pi backend must be running separately (not spawned by Vercel)

### 11. Database Queue Polling Frequency
**Issue:** Too frequent polling wastes resources, too infrequent causes delay
**Solution:**
- Poll on backend startup (immediate)
- Poll every 30 seconds when online
- Poll immediately after processing a command (catch any missed)
- Use database triggers or webhooks if available (future optimization)

### 12. Channel Subscription Management
**Issue:** Frontend needs to unsubscribe from old home and subscribe to new home
**Solution:**
- eventService manages subscription lifecycle
- When home changes, unsubscribe from old channel, subscribe to new
- Handle subscription errors gracefully (retry, fallback to database polling)

## Deployment Considerations

### Backend Deployment

- Can run on same machine as devices (Raspberry Pi)
- Requires Node.js runtime
- WebSocket server needs accessible port
- Consider using PM2 or systemd for process management

### Frontend Deployment

- Can deploy to Vercel/Netlify (cloud)
- Or run locally (when IS_CLOUD=false)
- WebSocket URL should be configurable per environment

### Supabase Setup

- Enable Realtime for the project
- Configure RLS policies for Realtime channels (though service key bypasses, validation provides security)
- Create `hubs` and `device_command_queue` tables (migration 003)
- Verify Supabase Realtime supports channel names with colons (`device_commands:${homeId}`)
- If not supported, use alternative naming: `device_commands_${homeId}` or encode homeId
- Consider using database webhooks for event logging

