use serde_json::json;
use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize, Runtime};
use tauri_plugin_store::StoreExt;

pub fn restore_window_state<R: Runtime>(app: &AppHandle<R>) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };

    let Ok(store) = app.store("settings.json") else {
        return;
    };

    if let Some(size) = store.get("windowSize") {
        let width = size.get("width").and_then(|value| value.as_u64());
        let height = size.get("height").and_then(|value| value.as_u64());
        if let (Some(width), Some(height)) = (width, height) {
            let _ = window.set_size(PhysicalSize::new(width as u32, height as u32));
        }
    }

    if let Some(position) = store.get("windowPosition") {
        let x = position.get("x").and_then(|value| value.as_i64());
        let y = position.get("y").and_then(|value| value.as_i64());
        if let (Some(x), Some(y)) = (x, y) {
            let _ = window.set_position(PhysicalPosition::new(x as i32, y as i32));
        }
    }
}

pub fn save_window_position<R: Runtime>(app: &AppHandle<R>, x: i32, y: i32) {
    if let Ok(store) = app.store("settings.json") {
        store.set("windowPosition", json!({ "x": x, "y": y }));
        let _ = store.save();
    }
}

pub fn save_window_size<R: Runtime>(app: &AppHandle<R>, width: u32, height: u32) {
    if let Ok(store) = app.store("settings.json") {
        store.set("windowSize", json!({ "width": width, "height": height }));
        let _ = store.save();
    }
}
