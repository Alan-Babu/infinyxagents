import { Inject, Injectable } from "@angular/core";
import { AppConfig } from "@nfinyx/types";
import { APP_CONFIG } from "./app-config";

@Injectable({
    providedIn: "root",
})
export class StorageService {
    private storage: Storage;
    private prefix: string;

    private expirationOptions: { [key: string]: number } = {
        "30m": 1800000,
        "1hr": 3600000,
        "2hs": 7200000,
        "3hs": 10800000,
        "6hs": 21600000,
        "12hs": 43200000,
        "24hs": 86400000,
    };

    constructor(@Inject(APP_CONFIG) private config: AppConfig) {
        // Namespace separator matches the `appId:key` convention used by `ApiService.ns()` so all
        // app-scoped keys read consistently in DevTools (e.g. `attestation_center:theme`).
        this.prefix = (config.appId ?? "app") + ":";
        this.storage = localStorage;
    }

    /** Resolves the storage backing for a single call: explicit `useSession` overrides the app-level default. */
    private resolveStorage(useSession?: boolean): Storage {
        if (useSession === true) return sessionStorage;
        if (useSession === false) return localStorage;
        return this.storage;
    }

    /**
     * Saves a value to Storage with an optional expiration time from a predefined list or default 1 hour.
     * @param {string} key The key under which to store the value.
     * @param value The value to be stored. Can be any type that is JSON serializable.
     * @param {boolean} expire Optional parameter to set expiration. Defaults to 1 hour if true.
     * @param {string} expirationOption Optional parameter to set a specific expiration time from predefined options.
     * @param {boolean} useSession Forces sessionStorage (`true`) or localStorage (`false`); falls back to app default when omitted.
     */
    public setItem(
        key: string,
        value: any,
        expire?: boolean,
        expirationOption?: string,
        useSession?: boolean
    ): void {
        let expiryTime = this.expirationOptions["1hr"]; // Default to 1 Hour
        if (
            expire &&
            expirationOption &&
            this.expirationOptions[expirationOption]
        ) {
            expiryTime = this.expirationOptions[expirationOption];
        }
        const data = {
            value: value,
            expiry: expire ? new Date().getTime() + expiryTime : null,
        };
        const storage = this.resolveStorage(useSession);
        storage.setItem(`${this.prefix}${key}`, JSON.stringify(data));
    }

    /**
     * Retrieves a value from Storage and checks if it has expired.
     * @param {string} key The key of the value to retrieve.
     * @param {boolean} useSession Forces sessionStorage (`true`) or localStorage (`false`); falls back to app default when omitted.
     * @returns The retrieved value parsed from JSON, or null if the key does not exist or the item has expired.
     */
    public getItem(key: string, useSession?: boolean): any {
        const storage = this.resolveStorage(useSession);
        const itemStr = storage.getItem(`${this.prefix}${key}`);
        if (!itemStr) {
            return null;
        }
        const item = JSON.parse(itemStr);
        const now = new Date().getTime();
        if (item.expiry && now > item.expiry) {
            storage.removeItem(`${this.prefix}${key}`);
            return null;
        }
        return item.value;
    }

    /**
     * Removes a value from Storage.
     * @param {string} key The key of the value to remove.
     * @param {boolean} useSession Forces sessionStorage (`true`) or localStorage (`false`); falls back to app default when omitted.
     */
    public removeItem(key: string, useSession?: boolean): void {
        const storage = this.resolveStorage(useSession);
        storage.removeItem(`${this.prefix}${key}`);
    }

    getJSON<T>(key: string): T | null {
        const raw = this.getItem(key);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as T;
        } catch {
            return null;
        }
    }

    setJSON<T>(key: string, value: T): void {
        this.setItem(key, JSON.stringify(value));
    }
}
