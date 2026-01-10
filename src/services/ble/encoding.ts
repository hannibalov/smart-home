
import type { ControlCommand } from '@/types';

export function encodeILinkCommand(cid: string, data: string = ''): string {
    const header = '55aa';
    const dataBuf = Buffer.from(data, 'hex');
    const len = dataBuf.length;
    const cidHi = parseInt(cid.substring(0, 2), 16);
    const cidLo = parseInt(cid.substring(2, 4), 16);

    let sum = len + cidHi + cidLo;
    for (const b of dataBuf) sum += b;

    const checksum = (256 - (sum % 256)) % 256;
    const lenHex = len.toString(16).padStart(2, '0');
    const csHex = checksum.toString(16).padStart(2, '0');

    return `${header}${lenHex}${cid}${data}${csHex}`;
}

export function encodeTrionesCommand(command: ControlCommand): string {
    if (command.type === 'power') {
        return command.value ? 'cc2333' : 'cc2433';
    }
    if (command.type === 'color') {
        const { r, g, b } = command.value as { r: number; g: number; b: number };
        return `56${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}00f0aa`;
    }
    return '';
}

export function encodeMagicHomeCommand(command: ControlCommand): string {
    if (command.type === 'power') {
        return command.value ? '7e0404f00001ff00ef' : '7e0404000000ff00ef';
    }
    if (command.type === 'color') {
        const { r, g, b } = command.value as { r: number; g: number; b: number };
        const rHex = r.toString(16).padStart(2, '0');
        const gHex = g.toString(16).padStart(2, '0');
        const bHex = b.toString(16).padStart(2, '0');
        return `7e070503${rHex}${gHex}${bHex}10ef`;
    }
    if (command.type === 'brightness') {
        const brightness = Math.min(100, Math.max(0, command.value as number));
        const brightnessHex = Math.floor((brightness / 100) * 255).toString(16).padStart(2, '0');
        return `7e0401${brightnessHex}000000ef`;
    }
    return '';
}
