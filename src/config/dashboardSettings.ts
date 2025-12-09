// src/config/dashboardSettings.ts

export const DASHBOARD_SYSTEM_SETTINGS = {
  showNotificationTestButton: {
    key: "dashboard_show_notification_test_button",
    defaultValue: false,
  },
  showShortcutsSection: {
    key: "dashboard_show_shortcuts_section",
    defaultValue: true,
  },
  showNotesSection: {
    key: "dashboard_show_notes_section",
    defaultValue: true,
  },
  showBirthdayModal: {
    key: "dashboard_show_birthday_modal",
    defaultValue: true,
  },
} as const;

export type DashboardSystemSettingKey =
  (typeof DASHBOARD_SYSTEM_SETTINGS)[keyof typeof DASHBOARD_SYSTEM_SETTINGS]["key"];

export function getDashboardDefaultForKey(
  key: DashboardSystemSettingKey
): boolean {
  const config = Object.values(DASHBOARD_SYSTEM_SETTINGS).find(
    (item) => item.key === key
  );
  // se não achar, assume true pra não esconder nada sem querer
  return config?.defaultValue ?? true;
}
