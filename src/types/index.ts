// BLE Device Types

export interface BLEDevice {
  id: string;
  name: string;
  rssi: number;
  connected: boolean;
  services: string[];
  lastSeen: number;
  saved: boolean;
  customName?: string;
}

export interface WiFiDevice {
  id: string; // IP or IP-based ID
  name: string;
  ip: string;
  type: 'ac' | 'generic';
  connected: boolean;
  lastSeen: number;
}

export interface BLECharacteristic {
  uuid: string;
  serviceUuid: string;
  properties: string[];
  value?: string;
}

export interface DeviceDetails extends BLEDevice {
  characteristics: BLECharacteristic[];
  latestCommand?: string;
  profileId?: string;
  targetChar?: string;
  saved: boolean;
  state?: LightState;
}

export interface DeviceProfile {
  id: string;
  name: string;
  description: string;
  targetChar: string; // Recommended characteristic for write
  statusChar?: string; // Characteristic to read for status
  encoding: '55aa' | 'triones' | 'magic' | 'raw';
}

export interface LightState {
  power: boolean;
  brightness: number; // 0-100
  colorTemperature: number; // 0-100 (0 = warm, 100 = cool)
  color?: { r: number; g: number; b: number };
}

export interface ACState {
  power: boolean;
  targetTemp: number;
  currentTemp?: number;
  mode: 'cool' | 'heat' | 'fan' | 'dry' | 'auto';
  fanSpeed: 'low' | 'medium' | 'high' | 'auto';
  swing?: boolean;
}

export interface ACControlCommand {
  type: 'power' | 'targetTemp' | 'mode' | 'fanSpeed' | 'swing';
  value: boolean | number | string;
}

export type ControlCommand =
  | { type: 'power' | 'brightness' | 'colorTemperature' | 'color' | 'raw'; value: boolean | number | string | { r: number; g: number; b: number } }
  | ACControlCommand;

export interface CommandLogEntry {
  id: string;
  deviceId: string;
  timestamp: number;
  characteristic: string;
  command: string; // hex string
  success: boolean;
  response?: string;
}

export interface ScanResult {
  devices: BLEDevice[];
  scanning: boolean;
}

export interface DeviceEvent {
  type: 'device_discovered' | 'device_connected' | 'device_disconnected' | 'device_updated' | 'scan_started' | 'scan_stopped';
  payload: unknown;
  timestamp: number;
}
