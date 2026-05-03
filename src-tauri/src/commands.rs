use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
use tauri_plugin_shell::ShellExt;

const TRAY_ID: &str = "nota-menu-bar";

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

#[tauri::command]
pub fn set_menu_bar_icon(app: AppHandle, show: bool) -> Result<(), String> {
    #[cfg(desktop)]
    {
        use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};

        if let Some(tray) = app.tray_by_id(TRAY_ID) {
            tray.set_visible(show).map_err(|error| error.to_string())?;
            return Ok(());
        }

        let handle = app.clone();
        let tray = TrayIconBuilder::with_id(TRAY_ID)
            .title("nota")
            .tooltip("nota")
            .show_menu_on_left_click(false)
            .on_tray_icon_event(move |_tray, event| {
                if let TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                } = event
                {
                    if let Some(window) = handle.get_webview_window("main") {
                        if window.is_visible().unwrap_or(false) {
                            let _ = window.hide();
                        } else {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                }
            })
            .build(&app)
            .map_err(|error| error.to_string())?;

        tray.set_visible(show).map_err(|error| error.to_string())?;
    }

    #[cfg(not(desktop))]
    {
        let _ = (app, show);
    }

    Ok(())
}
