mod commands;
mod shortcuts;
mod window_state;

use commands::{get_app_version, open_url, set_activation_policy, set_menu_bar_icon, update_global_shortcut};
use shortcuts::register_toggle_shortcut;
use tauri::{Manager, WindowEvent};
use tauri_plugin_global_shortcut::ShortcutState;
use window_state::{restore_window_state, save_window_position, save_window_size};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                restore_window_state(app);
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            set_activation_policy,
            set_menu_bar_icon,
            update_global_shortcut,
            open_url,
            get_app_version
        ])
        .setup(|app| {
            restore_window_state(app.handle());
            register_toggle_shortcut(app.handle());
            Ok(())
        })
        .on_window_event(|window, event| {
            match event {
                WindowEvent::Moved(position) => {
                    save_window_position(&window.app_handle(), position.x, position.y);
                }
                WindowEvent::Resized(size) => {
                    save_window_size(&window.app_handle(), size.width, size.height);
                }
                WindowEvent::CloseRequested { api, .. } => {
                    api.prevent_close();
                    let _ = window.hide();
                    // TODO: Add the v1 system tray quit hook when tray support is implemented.
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
