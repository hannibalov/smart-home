import { getServiceSupabase } from '@/lib/supabase-admin';
import type { DeviceType, DeviceConnectivity, DeviceProtocol } from '@/types';

export interface DbDevice {
    id: string; // db uuid
    home_id: string;
    hardware_id: string;
    custom_name?: string;
    type?: DeviceType;
    connectivity?: DeviceConnectivity;
    protocol?: DeviceProtocol;
    last_ip?: string;
    is_connected: boolean;
    settings: Record<string, unknown> | null;
    last_state: unknown;
}

// Since the Pi controller acts as a central hub (likely for a single home in this context, 
// or acting as system admin), we might default to a specific home or just query based on hardware_id.
// For now, let's assume we maintain a mapping of hardware_id -> db_record.

// Map to cache DB IDs from hardware IDs
const hardwareToDbId = new Map<string, string>();
const DEFAULT_HOME_NAME = 'My Smart Home';

/**
 * Get the default home ID or create it if not exists.
 * This ensures we have a home to attach devices to.
 */
async function getOrCreateDefaultHomeId(): Promise<string | null> {
    const supabase = getServiceSupabase();
    if (!supabase) return null;

    // Try to find a home
    const { data: homes, error } = await supabase
        .from('homes')
        .select('id')
        .limit(1);

    if (error) {
        console.error('[DB] Failed to fetch homes:', error);
        return null;
    }

    if (homes && homes.length > 0) {
        return homes[0].id;
    }

    // Create default home
    const { data: newHome, error: createError } = await supabase
        .from('homes')
        .insert({ name: DEFAULT_HOME_NAME })
        .select('id')
        .single();

    if (createError) {
        console.error('[DB] Failed to create default home:', createError);
        return null;
    }

    return newHome.id;
}

/**
 * Load all devices from DB into a map format compatible with legacy settings
 */
export async function loadDevicesFromDb(): Promise<Record<string, unknown>> {
    const supabase = getServiceSupabase();
    if (!supabase) return {};

    const { data: devices, error } = await supabase
        .from('devices')
        .select('*');

    if (error) {
        console.error('[DB] Failed to load devices:', error);
        return {};
    }

    const map: Record<string, unknown> = {};

    devices.forEach((dev: DbDevice) => {
        if (!dev.hardware_id) return;

        hardwareToDbId.set(dev.hardware_id, dev.id);

        map[dev.hardware_id] = {
            saved: true, // If it's in DB, consider it 'saved'
            customName: dev.custom_name,
            type: dev.type,
            connectivity: dev.connectivity,
            protocol: dev.protocol,
            lastState: dev.last_state,
            ...dev.settings // Merge other settings like profileId
        };
    });

    return map;
}

/**
 * Upsert a device to the DB
 */
export async function saveDeviceToDb(hardwareId: string, settings: Record<string, unknown>) {
    const supabase = getServiceSupabase();
    if (!supabase) return;

    const homeId = await getOrCreateDefaultHomeId();
    if (!homeId) {
        console.error('[DB] Cannot save device: No home found.');
        return;
    }

    const payload: Record<string, unknown> = {
        home_id: homeId,
        hardware_id: hardwareId,
        custom_name: settings.customName,
        type: settings.type,
        connectivity: settings.connectivity,
        protocol: settings.protocol,
        last_state: settings.lastState || {},
        settings: {
            profileId: settings.profileId,
            targetChar: settings.targetChar,
            // ... other misc settings
        },
        updated_at: new Date().toISOString()
    };

    // If we know the DB ID, update explicitly, otherwise upsert on hardware_id/home_id
    hardwareToDbId.get(hardwareId);

    // We rely on the UNIQUE(home_id, hardware_id) constraint for upsert
    const { data, error } = await supabase
        .from('devices')
        .upsert(payload, { onConflict: 'home_id,hardware_id' })
        .select('id')
        .single();

    if (error) {
        console.error('[DB] Failed to save device:', error);
    } else if (data) {
        hardwareToDbId.set(hardwareId, data.id);
    }
}
