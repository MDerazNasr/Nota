use serde_json::json;
use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize, Runtime};
use tauri_plugin_store::StoreExt;

const DEFAULT_WINDOW_WIDTH: u32 = 380;
const DEFAULT_WINDOW_HEIGHT: u32 = 500;
const DEFAULT_EDGE_OFFSET: i32 = 16;

pub fn restore_window_state<R: Runtime>(app: &AppHandle<R>) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };

    let Ok(store) = app.store("settings.json") else {
        return;
    };

    let mut restored_size = None;

    if let Some(size) = store.get("windowSize") {
        let width = size.get("width").and_then(|value| value.as_u64());
        let height = size.get("height").and_then(|value| value.as_u64());
        if let (Some(width), Some(height)) = (width, height) {
            restored_size = Some(PhysicalSize::new(width as u32, height as u32));
        }
    }

    let size = restored_size.unwrap_or(PhysicalSize::new(DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT));
    let _ = window.set_size(size);

    if let Some(position) = store.get("windowPosition") {
        let x = position.get("x").and_then(|value| value.as_i64());
        let y = position.get("y").and_then(|value| value.as_i64());
        if let (Some(x), Some(y)) = (x, y) {
            let _ = window.set_position(PhysicalPosition::new(x as i32, y as i32));
            return;
        }
    }

    if let Some(position) = default_top_right_position(&window, size) {
        let _ = window.set_position(position);
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

fn default_top_right_position<R: Runtime>(
    window: &tauri::WebviewWindow<R>,
    size: PhysicalSize<u32>,
) -> Option<PhysicalPosition<i32>> {
    let monitor = window
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| window.available_monitors().ok().and_then(|monitors| monitors.into_iter().next()))?;
    let work_area = monitor.work_area();
    let x = work_area.position.x + work_area.size.width as i32 - size.width as i32 - DEFAULT_EDGE_OFFSET;
    let y = work_area.position.y + DEFAULT_EDGE_OFFSET;

    Some(PhysicalPosition::new(x.max(work_area.position.x), y))
}
