/**
 * Paginates a list into fixed-size pages and rotates through them one at a time.
 * Framework-agnostic: the host component drives `next()` on its own timer.
 */
export class StoppedMachineRotator<T> {

    private pages: T[][] = [];
    private index: number = 0;

    constructor(private readonly pageSize: number = 2) { }

    /** Replaces the source list. Preserves the current page index when it is still valid. */
    setItems(items: T[]): void {
        const pages: T[][] = [];
        for (let i = 0; i < items.length; i += this.pageSize) {
            pages.push(items.slice(i, i + this.pageSize));
        }
        this.pages = pages;

        if (this.index >= this.pages.length) {
            this.index = 0;
        }
    }

    /** Jumps back to the first page (e.g. on section change). */
    reset(): void {
        this.index = 0;
    }

    get pageCount(): number {
        return this.pages.length;
    }

    get currentPage(): T[] {
        return this.pages[this.index] ?? [];
    }

    /** Advances to the next page and returns it. */
    next(): T[] {
        if (this.pages.length === 0) return [];
        this.index = (this.index + 1) % this.pages.length;
        return this.currentPage;
    }
}
