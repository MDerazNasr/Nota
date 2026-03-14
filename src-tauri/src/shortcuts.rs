use tauri::{AppHandle, Runtime};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
use tauri_plugin_store::StoreExt;

const DEFAULT_TOGGLE_WINDOW: &str = "CommandOrControl+Shift+N";

pub fn register_toggle_shortcut<R: Runtime>(app: &AppHandle<R>) {
    let shortcut = load_toggle_shortcut(app);

    if shortcut.is_empty() {
        return;
    }

    match shortcut.parse::<Shortcut>() {
        Ok(parsed) => {
            if let Err(error) = app.global_shortcut().register(parsed) {
                eprintln!("Could not register global shortcut: {error}");
            }
        }
        Err(error) => {
            eprintln!("Could not parse global shortcut: {error}");
        }
    }
}

fn load_toggle_shortcut<R: Runtime>(app: &AppHandle<R>) -> String {
    let Ok(store) = app.store("settings.json") else {
        return DEFAULT_TOGGLE_WINDOW.to_string();
    };

    store
        .get("settings")
        .and_then(|settings| settings.get("shortcuts").cloned())
        .and_then(|shortcuts| shortcuts.get("toggleWindow").cloned())
        .and_then(|value| value.as_str().map(ToOwned::to_owned))
        .unwrap_or_else(|| DEFAULT_TOGGLE_WINDOW.to_string())
}
