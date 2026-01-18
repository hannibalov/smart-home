import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWiFiDevices, getACState, sendACCommand } from './ac';

describe('AC Service', () => {
    it('should return mock AC device', async () => {
        const devices = await getWiFiDevices();
        expect(devices.length).toBeGreaterThan(0);
        expect(devices[0].name).toContain('Pro Klima');
    });

    it('should return initial AC state', async () => {
        const devices = await getWiFiDevices();
        const state = await getACState(devices[0].id);
        expect(state).toBeDefined();
        expect(state?.power).toBe(false);
        expect(state?.targetTemp).toBe(22);
    });

    it('should update AC state when power command is sent', async () => {
        const devices = await getWiFiDevices();
        const deviceId = devices[0].id;

        const success = await sendACCommand(deviceId, { type: 'power', value: true });
        expect(success).toBe(true);

        const state = await getACState(deviceId);
        expect(state?.power).toBe(true);
    });

    it('should update AC state when targetTemp command is sent', async () => {
        const devices = await getWiFiDevices();
        const deviceId = devices[0].id;

        const success = await sendACCommand(deviceId, { type: 'targetTemp', value: 25 });
        expect(success).toBe(true);

        const state = await getACState(deviceId);
        expect(state?.targetTemp).toBe(25);
    });
});
