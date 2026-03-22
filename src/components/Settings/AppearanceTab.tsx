import { RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { THEMES } from "../../lib/themes";
import type { FontOption, Settings } from "../../lib/types";
import { useSettingsStore } from "../../store/settings";

const FONTS: FontOption[] = ["JetBrains Mono", "Fira Code", "IBM Plex Mono", "Geist Mono"];

export function AppearanceTab() {
  const theme = useSettingsStore((state) => state.theme);
  const font = useSettingsStore((state) => state.font);
  const fontSize = useSettingsStore((state) => state.fontSize);
  const borderRadius = useSettingsStore((state) => state.borderRadius);
  const itemLimit = useSettingsStore((state) => state.itemLimit);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setFont = useSettingsStore((state) => state.setFont);
  const setFontSize = useSettingsStore((state) => state.setFontSize);
  const setBorderRadius = useSettingsStore((state) => state.setBorderRadius);
  const setItemLimit = useSettingsStore((state) => state.setItemLimit);

  return (
    <section className="settings-section" aria-label="Appearance settings">
      <SettingRow label="Theme" resetKey="theme">
        <div className="theme-grid">
          {Object.entries(THEMES).map(([key, definition]) => (
            <button
              className={theme === key ? "theme-swatch active" : "theme-swatch"}
              data-settings-focusable
              key={key}
              type="button"
              title={definition.name}
              aria-label={definition.name}
              onClick={() => setTheme(key)}
            >
              <span style={{ background: definition.variables["--bg"] }} />
              <span style={{ background: definition.variables["--surface"] }} />
              <span style={{ background: definition.variables["--accent"] }} />
            </button>
          ))}
        </div>
      </SettingRow>
      <SettingRow label="Font" resetKey="font">
        <select
          data-settings-focusable
          value={font}
          onChange={(event) => setFont(event.currentTarget.value as FontOption)}
        >
          {FONTS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </SettingRow>
      <SettingRow label="Font Size" resetKey="fontSize">
        <Slider max={20} min={10} value={fontSize} onChange={setFontSize} />
      </SettingRow>
      <SettingRow label="Radius" resetKey="borderRadius">
        <Slider max={12} min={0} value={borderRadius} onChange={setBorderRadius} />
      </SettingRow>
      <SettingRow label="Item Limit" resetKey="itemLimit">
        <Slider max={50} min={5} value={itemLimit} onChange={setItemLimit} />
      </SettingRow>
    </section>
  );
}

type SettingRowProps = {
  children: ReactNode;
  label: string;
  resetKey: keyof Settings;
};

function SettingRow({ children, label, resetKey }: SettingRowProps) {
  const resetSetting = useSettingsStore((state) => state.resetSetting);

  return (
    <div className="setting-row">
      <label>{label}</label>
      <div className="setting-control">{children}</div>
      <button
        className="reset-button"
        data-settings-focusable
        type="button"
        aria-label={`Reset ${label}`}
        onClick={() => resetSetting(resetKey)}
      >
        <RotateCcw size={14} strokeWidth={1.75} />
      </button>
    </div>
  );
}

type SliderProps = {
  max: number;
  min: number;
  value: number;
  onChange: (value: number) => void;
};

function Slider({ max, min, onChange, value }: SliderProps) {
  return (
    <div className="slider-control">
      <input
        data-settings-focusable
        max={max}
        min={min}
        step={1}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
      <output>{value}</output>
    </div>
  );
}
