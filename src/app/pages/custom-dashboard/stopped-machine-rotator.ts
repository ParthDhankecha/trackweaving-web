/**
 * Circular queue of stopped machines. The host component drives `next()` on its own timer.
 *
 * Each page takes `pageSize` items starting at the current cursor and wraps to the
 * front when the list is not evenly divisible — e.g. 3 machines shown two at a time:
 * [M1, M2] → [M3, M1] → [M2, M3] → [M1, M2].
 *
 * Live updates use `syncByKey`: first payload is taken as-is, later payloads
 * keep existing order, drop missing keys, and append new keys at the end.
 */
export class StoppedMachineRotator<T> {

    private items: T[] = [];
    private cursor: number = 0;
    private initialized: boolean = false;

    constructor(private readonly pageSize: number = 2) { }

    /**
     * First call: take `incoming` in the given order.
     * Later calls: keep current queue order, remove keys no longer present,
     * update remaining items in place, and push new keys to the end.
     */
    syncByKey(incoming: T[], getKey: (item: T) => string): void {
        if (!this.initialized) {
            this.items = [...incoming];
            this.initialized = true;
            this.cursor = 0;
            return;
        }

        const incomingByKey = new Map(incoming.map(item => [getKey(item), item]));
        const next: T[] = [];

        for (const item of this.items) {
            const updated = incomingByKey.get(getKey(item));
            if (updated) next.push(updated);
        }

        const queuedKeys = new Set(next.map(getKey));
        for (const item of incoming) {
            if (!queuedKeys.has(getKey(item))) {
                next.push(item);
                queuedKeys.add(getKey(item));
            }
        }

        this.items = next;
        if (this.items.length === 0) {
            this.cursor = 0;
        } else {
            this.cursor %= this.items.length;
        }
    }

    /** Jumps back to an empty first-load state (e.g. on section change). */
    reset(): void {
        this.items = [];
        this.cursor = 0;
        this.initialized = false;
    }

    get pageCount(): number {
        return this.items.length;
    }

    get currentPage(): T[] {
        return this.pageFrom(this.cursor);
    }

    /** Advances the circular window by `pageSize` and returns the new page. */
    next(): T[] {
        if (this.items.length === 0) return [];
        if (this.items.length > this.pageSize) {
            this.cursor = (this.cursor + this.pageSize) % this.items.length;
        }
        return this.currentPage;
    }

    private pageFrom(start: number): T[] {
        if (this.items.length === 0) return [];
        if (this.items.length <= this.pageSize) return this.items.slice();

        const page: T[] = [];
        for (let i = 0; i < this.pageSize; i++) {
            page.push(this.items[(start + i) % this.items.length]);
        }
        return page;
    }
}
