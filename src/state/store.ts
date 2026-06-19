import { readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { z } from "zod";

const DATA_DIR = resolve(import.meta.dirname, "../../data");

export class JsonStore<T> {
  private filePath: string;
  private schema: z.ZodType<T>;

  constructor(filename: string, schema: z.ZodType<T>) {
    this.filePath = resolve(DATA_DIR, filename);
    this.schema = schema;
  }

  load(): T[] {
    if (!existsSync(this.filePath)) return [];
    const raw = readFileSync(this.filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return (parsed as unknown[]).map((item) => this.schema.parse(item));
  }

  save(items: T[]): void {
    const tmpPath = this.filePath + ".tmp";
    writeFileSync(tmpPath, JSON.stringify(items, null, 2));
    renameSync(tmpPath, this.filePath);
  }

  findById(id: string): T | undefined {
    return this.load().find((item: any) => item.id === id);
  }

  add(item: T): void {
    const items = this.load();
    items.push(item);
    this.save(items);
  }

  update(id: string, updater: (item: T) => T): T | null {
    const items = this.load();
    const idx = items.findIndex((item: any) => item.id === id);
    if (idx === -1) return null;
    items[idx] = updater(items[idx]);
    this.save(items);
    return items[idx];
  }

  remove(id: string): boolean {
    const items = this.load();
    const filtered = items.filter((item: any) => item.id !== id);
    if (filtered.length === items.length) return false;
    this.save(filtered);
    return true;
  }
}
