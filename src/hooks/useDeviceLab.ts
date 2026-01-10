'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DeviceDetails } from '@/types';

interface LabLogEntry {
    id: number;
    name: string;
    hex: string;
    success: boolean;
    readValue: string;
    timestamp: string;
}

export function useDeviceLab(deviceId: string) {
    const [device, setDevice] = useState<DeviceDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [customHex, setCustomHex] = useState('');
    const [targetChar, setTargetChar] = useState('a044');
    const [readChar, setReadChar] = useState('a041');
    const [isFuzzing, setIsFuzzing] = useState(false);
    const [logs, setLogs] = useState<LabLogEntry[]>([]);
    const [delay, setDelay] = useState(1500);
    const [sweepTemplate, setSweepTemplate] = useState('7e04??f00001ff00ef');
    const [sweepRange, setSweepRange] = useState({ start: 0, end: 255 });
    const activeFuzzer = useRef(false);

    const fetchDevice = useCallback(async () => {
        try {
            const res = await fetch(`/api/devices/${deviceId}`);
            const data = await res.json();
            setDevice(data);
        } catch (error) {
            console.error('Failed to fetch device:', error);
        } finally {
            setLoading(false);
        }
    }, [deviceId]);

    const fetchHistory = useCallback(async () => {
        try {
            const res = await fetch(`/api/devices/${deviceId}/control`);
            const data = await res.json();
            if (data.log) {
                const history = data.log.map((entry: { id: number; command: string; success: boolean; response?: string; timestamp: number }) => ({
                    id: entry.id,
                    name: entry.command.length > 5 ? 'Remote Command' : 'Control',
                    hex: entry.command,
                    success: entry.success,
                    readValue: entry.response || '',
                    timestamp: new Date(entry.timestamp).toLocaleTimeString(),
                }));
                setLogs(history.reverse() as LabLogEntry[]);
            }
        } catch (e) {
            console.error('Failed to fetch history:', e);
        }
    }, [deviceId]);

    useEffect(() => {
        fetchDevice();
        fetchHistory();

        // Auto-subscribe to notify characteristics
        const setupSubscriptions = async () => {
            try {
                await fetch(`/api/devices/${deviceId}/subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uuid: 'a042' }),
                });
                await fetch(`/api/devices/${deviceId}/subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uuid: 'a043' }),
                });
            } catch (e) {
                console.error('Failed to setup subscriptions:', e);
            }
        };
        setupSubscriptions();
    }, [deviceId, fetchDevice, fetchHistory]);

    const sendCommand = async (hex: string, name = 'Single Command') => {
        try {
            const res = await fetch(`/api/devices/${deviceId}/control`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    characteristic: targetChar,
                    raw: hex,
                }),
            });

            // Read back after command
            const readRes = await fetch(`/api/devices/${deviceId}/read?uuid=${readChar}`);
            const readData = await readRes.json();

            const logEntry = {
                id: Date.now() + Math.random(),
                name,
                hex,
                success: res.ok,
                readValue: readRes.ok ? readData.value : 'read error',
                timestamp: new Date().toLocaleTimeString(),
            };

            setLogs((prev) => [logEntry, ...prev]);
            return res.ok;
        } catch (error) {
            console.error('Command failed:', error);
            return false;
        }
    };

    const saveSettings = async () => {
        try {
            const res = await fetch(`/api/devices/${deviceId}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetChar,
                    protocol: device?.services?.includes('a032') ? 'ilink' : 'generic',
                }),
            });
            if (res.ok) {
                alert('Settings saved as default for this device!');
            }
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    };

    const startFuzz = async () => {
        setIsFuzzing(true);
        activeFuzzer.current = true;
        const patterns = [
            { name: 'ilink On (5510)', hex: '5510010d0a' },
            { name: 'ilink Off (5510)', hex: '5510020d0a' },
            { name: 'ilink Red (5510)', hex: '551001ff00000d0a' },
            { name: 'Magic Red', hex: '7e070503ff000010ef' },
            { name: 'Magic Green', hex: '7e07050300ff0010ef' },
            { name: 'Magic Blue', hex: '7e0705030000ff10ef' },
            { name: 'Magic On', hex: '7e0404f00001ff00ef' },
            { name: 'Magic Off', hex: '7e0404000000ff00ef' },
            { name: 'Triones Red', hex: '56ff000000f0aa' },
            { name: 'Triones Blue', hex: '560000ff00f0aa' },
        ];

        for (const p of patterns) {
            if (!activeFuzzer.current) break;
            await sendCommand(p.hex, p.name);
            await new Promise((r) => setTimeout(r, delay));
        }
        setIsFuzzing(false);
        activeFuzzer.current = false;
    };

    const startByteSweep = async () => {
        setIsFuzzing(true);
        activeFuzzer.current = true;
        for (let i = sweepRange.start; i <= sweepRange.end; i++) {
            if (!activeFuzzer.current) break;
            const hexByte = i.toString(16).padStart(2, '0');
            const hex = sweepTemplate.replace('??', hexByte);
            await sendCommand(hex, `Sweep [${hexByte}]`);
            await new Promise((r) => setTimeout(r, Math.max(200, delay / 2)));
        }
        setIsFuzzing(false);
        activeFuzzer.current = false;
    };

    const stopFuzzer = () => {
        setIsFuzzing(false);
        activeFuzzer.current = false;
    };

    const clearLogs = () => setLogs([]);

    // SSE for real-time notifications
    useEffect(() => {
        const eventSource = new EventSource('/api/events');
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'device_updated' && data.payload.notification) {
                    const { characteristic, notification, timestamp } = data.payload;
                    setLogs((prev) => [
                        {
                            id: Date.now() + Math.random(),
                            name: `NOTIFY (${characteristic})`,
                            hex: 'N/A',
                            success: true,
                            readValue: notification,
                            timestamp: new Date(timestamp).toLocaleTimeString(),
                        },
                        ...prev,
                    ]);
                }
            } catch {
                // Ignore parse errors
            }
        };
        return () => eventSource.close();
    }, []);

    return {
        device,
        loading,
        customHex,
        setCustomHex,
        targetChar,
        setTargetChar,
        readChar,
        setReadChar,
        isFuzzing,
        logs,
        delay,
        setDelay,
        sweepTemplate,
        setSweepTemplate,
        sweepRange,
        setSweepRange,
        sendCommand,
        saveSettings,
        startFuzz,
        startByteSweep,
        stopFuzzer,
        clearLogs,
    };
}
