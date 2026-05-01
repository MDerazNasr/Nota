use serde_json::json;
use tauri::{AppHandle, Manager, PhysicalPosition, Runtime};
use tauri_plugin_store::StoreExt;

pub fn restore_window_position<R: Runtime>(app: &AppHandle<R>) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };

    let Ok(store) = app.store("settings.json") else {
        return;
    };

    let Some(position) = store.get("windowPosition") else {
        return;
    };

    let Some(x) = position.get("x").and_then(|value| value.as_i64()) else {
        return;
    };

    let Some(y) = position.get("y").and_then(|value| value.as_i64()) else {
        return;
    };

    let _ = window.set_position(PhysicalPosition::new(x as i32, y as i32));
}

pub fn save_window_position<R: Runtime>(app: &AppHandle<R>, x: i32, y: i32) {
    if let Ok(store) = app.store("settings.json") {
        store.set("windowPosition", json!({ "x": x, "y": y }));
        let _ = store.save();
    }
}
