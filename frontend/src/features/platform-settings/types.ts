/** Mirrors Backend platform_settings.service.describe(). Secrets never arrive here. */
export interface PlatformSetting {
  key: string;
  label: string;
  group: string;
  help: string;
  secret: boolean;
  kind: 'str' | 'int' | 'bool' | 'choice';
  choices: string[];
  placeholder: string;
  configured: boolean;
  /** dashboard = saved here; server = from the server's env file; not_set. */
  source: 'dashboard' | 'server' | 'not_set';
  /** Shown for non-secret settings only. */
  value: string | number | boolean | null;
  /** Last four characters of a secret, e.g. "••••abcd". */
  hint: string;
  /** Saved value could not be decrypted (e.g. the server secret changed). */
  unreadable: boolean;
}

export interface SettingGroup {
  id: 'paystack' | 'sms' | 'email' | string;
  title: string;
  description: string;
  settings: PlatformSetting[];
}

export interface ConnectionTestResult {
  ok: boolean;
  detail: string;
  mode?: string;
  warning?: string;
}
