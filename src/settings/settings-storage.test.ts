import {
  loadStoredSettings,
  readStorageItem,
  saveSettings,
  writeStorageItem,
} from "./settings-storage";
import { SETTINGS_STORAGE_KEY } from "./settings-types";
import { createDefaultSettings } from "./settings-defaults";

describe("settings-storage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-25T12:00:00Z"));
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads and writes storage values", () => {
    expect(writeStorageItem("test-key", "value")).toBe(true);
    expect(readStorageItem("test-key")).toBe("value");
  });

  it("saves and reloads normalized settings", () => {
    const settings = {
      ...createDefaultSettings(),
      desiredRetirementIncome: 60000,
      startDate: "2026-05-01",
    };

    saveSettings(settings);

    const stored = JSON.parse(
      window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "{}"
    ) as Record<string, unknown>;
    expect(stored.startDate).toBeUndefined();

    const loaded = loadStoredSettings();
    expect(loaded.desiredRetirementIncome).toBe(60000);
    expect(loaded.startDate).toBe("2026-04-25");
  });
});
