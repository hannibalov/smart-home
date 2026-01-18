'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DeviceDetails, CommandLogEntry, DeviceEvent, DeviceProfile } from '@/types';

export function useDeviceDashboard() {
    const [devices, setDevices] = useState<DeviceDetails[]>([]);
    const [profiles, setProfiles] = useState<DeviceProfile[]>([]);
    const [scanning, setScanning] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<DeviceDetails | null>(null);
    const [commandLog, setCommandLog] = useState<CommandLogEntry[]>([]);

    // Fetch devices and status
    const fetchDevices = useCallback(async () => {
        try {
            const [devicesRes, profilesRes] = await Promise.all([
                fetch('/api/devices'),
                fetch('/api/profiles'),
            ]);
            const devicesData = await devicesRes.json();
            const profilesData = await profilesRes.json();

            setDevices(devicesData.devices || []);
            setProfiles(profilesData || []);
            setScanning(devicesData.scanning || false);
        } catch (error) {
            console.error('Failed to fetch devices:', error);
        }
    }, []);

    // Start scan
    const startScan = async () => {
        try {
            setScanning(true);
            await fetch('/api/devices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ duration: 5000 }),
            });

            // Safety timeout: if we don't get a scan_stopped event within 15s, reset state
            setTimeout(() => {
                setScanning(prev => {
                    if (prev) {
                        console.warn('Scan safety timeout reached. Resetting scanning state.');
                        return false;
                    }
                    return prev;
                });
            }, 15000);
        } catch (error) {
            console.error('Failed to start scan:', error);
            setScanning(false);
        }
    };

    // Connect to device
    const connectDevice = async (deviceId: string) => {
        try {
            const res = await fetch(`/api/devices/${deviceId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'connect' }),
            });
            const data = await res.json();
            if (data.device) {
                setSelectedDevice(data.device);
                fetchDevices();

                // Automatically read state after connection (connection.ts also does this, but we ensure UI is updated)
                if (data.device.connected) {
                    // Small delay to allow backend to read state first
                    setTimeout(async () => {
                        try {
                            const deviceRes = await fetch(`/api/devices/${deviceId}`);
                            const deviceData = await deviceRes.json();
                            if (deviceData && deviceData.state) {
                                setSelectedDevice(deviceData);
                            } else {
                                // If state wasn't read automatically, try reading it manually
                                const stateRes = await fetch(`/api/devices/${deviceId}/state`);
                                const stateData = await stateRes.json();
                                if (stateData && Object.keys(stateData).length > 0) {
                                    setSelectedDevice({
                                        ...deviceData,
                                        state: {
                                            power: stateData.power ?? deviceData.state?.power ?? false,
                                            brightness: stateData.brightness ?? deviceData.state?.brightness ?? 100,
                                            colorTemperature: stateData.colorTemperature ?? deviceData.state?.colorTemperature ?? 50,
                                            color: stateData.color ?? deviceData.state?.color,
                                            ...stateData
                                        }
                                    });
                                }
                            }
                        } catch (e) {
                            console.error('Failed to refresh state after connection:', e);
                        }
                    }, 500);
                }
            }
        } catch (error) {
            console.error('Failed to connect:', error);
        }
    };

    // Disconnect from device
    const disconnectDevice = async (deviceId: string) => {
        try {
            await fetch(`/api/devices/${deviceId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'disconnect' }),
            });
            if (selectedDevice?.id === deviceId) {
                setSelectedDevice(null);
            }
            fetchDevices();
        } catch (error) {
            console.error('Failed to disconnect:', error);
        }
    };

    // Select device for control
    const selectDevice = async (deviceId: string) => {
        try {
            const res = await fetch(`/api/devices/${deviceId}`);
            const device = await res.json();
            setSelectedDevice(device);

            // Fetch command log
            const logRes = await fetch(`/api/devices/${deviceId}/control`);
            const logData = await logRes.json();
            setCommandLog(logData.log || []);

            // Refresh device state if connected
            if (device.connected) {
                try {
                    const stateRes = await fetch(`/api/devices/${deviceId}/state`);
                    const stateData = await stateRes.json();
                    if (stateData && Object.keys(stateData).length > 0) {
                        setSelectedDevice({
                            ...device,
                            state: {
                                power: stateData.power ?? device.state?.power ?? false,
                                brightness: stateData.brightness ?? device.state?.brightness ?? 100,
                                colorTemperature: stateData.colorTemperature ?? device.state?.colorTemperature ?? 50,
                                color: stateData.color ?? device.state?.color,
                                ...stateData
                            }
                        });
                    }
                } catch (e) {
                    console.error('Failed to refresh state:', e);
                }
            }
        } catch (error) {
            console.error('Failed to get device details:', error);
        }
    };

    // Send command to device
    const sendCommand = async (type: string, value: unknown): Promise<boolean> => {
        if (!selectedDevice) return false;
        try {
            const res = await fetch(`/api/devices/${selectedDevice.id}/control`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, value }),
            });
            const data = await res.json();

            // Refresh command log
            const logRes = await fetch(`/api/devices/${selectedDevice.id}/control`);
            const logData = await logRes.json();
            setCommandLog(logData.log || []);

            // Refresh device state after command
            if (data.success) {
                try {
                    const stateRes = await fetch(`/api/devices/${selectedDevice.id}/state`);
                    const stateData = await stateRes.json();
                    if (stateData && Object.keys(stateData).length > 0) {
                        setSelectedDevice({
                            ...selectedDevice,
                            state: {
                                power: stateData.power ?? selectedDevice.state?.power ?? false,
                                brightness: stateData.brightness ?? selectedDevice.state?.brightness ?? 100,
                                colorTemperature: stateData.colorTemperature ?? selectedDevice.state?.colorTemperature ?? 50,
                                color: stateData.color ?? selectedDevice.state?.color,
                                ...stateData
                            }
                        });
                    }
                } catch (e) {
                    console.error('Failed to refresh state after command:', e);
                }
            }

            return data.success;
        } catch (error) {
            console.error('Failed to send command:', error);
            return false;
        }
    };

    // Toggle save device
    const toggleSaveDevice = async (deviceId: string) => {
        try {
            await fetch(`/api/devices/${deviceId}/save`, {
                method: 'POST',
            });
            // SSE will trigger fetchDevices
        } catch (error) {
            console.error('Failed to toggle save:', error);
        }
    };

    // Rename device
    const renameDevice = async (deviceId: string, newName: string) => {
        try {
            await fetch(`/api/devices/${deviceId}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customName: newName }),
            });
            // SSE will trigger fetchDevices, but we optimistically update if we want
            // For now rely on SSE as backend emits device_updated
        } catch (error) {
            console.error('Failed to rename device:', error);
        }
    };

    // SSE for real-time updates
    useEffect(() => {
        const eventSource = new EventSource('/api/events');

        eventSource.onmessage = (event) => {
            try {
                const data: DeviceEvent = JSON.parse(event.data);

                switch (data.type) {
                    case 'scan_started':
                        const scanPayload = data.payload as { type?: string };
                        if (scanPayload?.type === 'manual') {
                            setScanning(true);
                        }
                        break;
                    case 'scan_stopped':
                        setScanning(false);
                        // Only fetch if it was a manual scan that finished
                        // Auto-scans don't usually change the list of saved devices
                        if (scanning) {
                            fetchDevices();
                        }
                        break;
                    case 'device_discovered':
                        // Only fetch on discovery if we are manually scanning
                        if (scanning) {
                            fetchDevices();
                        }
                        break;
                    case 'device_disconnected':
                        fetchDevices();
                        break;
                    case 'device_connected':
                        fetchDevices();
                        // If the connected device is selected, refresh its state
                        if (data.payload && typeof data.payload === 'object' && 'id' in data.payload) {
                            const connectedDevice = data.payload as DeviceDetails;
                            if (selectedDevice?.id === connectedDevice.id) {
                                // Fetch fresh device data with state
                                fetch(`/api/devices/${connectedDevice.id}`)
                                    .then(res => res.json())
                                    .then(device => {
                                        if (device && device.state) {
                                            setSelectedDevice(device);
                                        }
                                    })
                                    .catch(e => console.error('Failed to refresh device after connection:', e));
                            }
                        }
                        break;
                    case 'device_updated':
                        // No need to fetch ALL devices if just one updated
                        // fetchDevices(); 

                        // Update the devices list in memory if possible to avoid full fetch
                        if (data.payload && typeof data.payload === 'object') {
                            const updatedDevice = data.payload as DeviceDetails;

                            setDevices(prev => prev.map(d => d.id === updatedDevice.id ? { ...d, ...updatedDevice } : d));

                            if (selectedDevice?.id === updatedDevice.id && updatedDevice.state) {
                                setSelectedDevice({
                                    ...selectedDevice,
                                    state: updatedDevice.state
                                });
                            }
                        }
                        break;
                }
            } catch {
                // Ignore parse errors
            }
        };

        return () => {
            eventSource.close();
        };
    }, [fetchDevices, selectedDevice]);

    // Initial fetch
    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchDevices();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchDevices]);

    return {
        devices,
        profiles,
        scanning,
        selectedDevice,
        commandLog,
        startScan,
        connectDevice,
        disconnectDevice,
        selectDevice,
        sendCommand,
        toggleSaveDevice,
        renameDevice,
        refreshDevices: fetchDevices,
    };
}
