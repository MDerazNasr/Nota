use tauri::AppHandle;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
use tauri_plugin_shell::ShellExt;

#[tauri::command]
pub fn set_activation_policy(app: AppHandle, show: bool) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let policy = if show {
            tauri::ActivationPolicy::Regular
        } else {
            tauri::ActivationPolicy::Accessory
        };

        app.set_activation_policy(policy).map_err(|error| error.to_string())?;
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = (app, show);
    }

    Ok(())
}

#[tauri::command]
pub fn update_global_shortcut(app: AppHandle, old: String, new: String) -> Result<(), String> {
    if !old.is_empty() {
        let old_shortcut = old.parse::<Shortcut>().map_err(|error| error.to_string())?;
        app.global_shortcut()
            .unregister(old_shortcut)
            .map_err(|error| error.to_string())?;
    }

    if !new.is_empty() {
        let new_shortcut = new.parse::<Shortcut>().map_err(|error| error.to_string())?;
        app.global_shortcut()
            .register(new_shortcut)
            .map_err(|error| error.to_string())?;
    }

    Ok(())
}

#[tauri::command]
#[allow(deprecated)]
pub fn open_url(app: AppHandle, url: String) -> Result<(), String> {
    // The spec requires shell based URL opening for v1.
    app.shell().open(url, None).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn get_app_version(app: AppHandle) -> String {
    app.package_info().version.to_string()
}
