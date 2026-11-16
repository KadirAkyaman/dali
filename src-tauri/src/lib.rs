use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, Position, Size, Window,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

#[tauri::command]
fn minimize_window(window: Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_maximize(window: Window) -> Result<bool, String> {
    let is_max = window.is_maximized().map_err(|e| e.to_string())?;
    if is_max {
        window.unmaximize().map_err(|e| e.to_string())?;
        Ok(false)
    } else {
        window.maximize().map_err(|e| e.to_string())?;
        Ok(true)
    }
}

#[tauri::command]
fn close_window(window: Window) -> Result<(), String> {
    // Hide window to system tray instead of destroying process
    window.hide().map_err(|e| e.to_string())
}

#[tauri::command]
fn show_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn enter_widget_mode(window: Window) -> Result<(), String> {
    let _ = window.unmaximize();
    window
        .set_size(Size::Logical(LogicalSize::new(340.0, 500.0)))
        .map_err(|e| e.to_string())?;
    window.set_resizable(true).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn exit_widget_mode(window: Window) -> Result<(), String> {
    window.set_resizable(true).map_err(|e| e.to_string())?;
    window
        .set_size(Size::Logical(LogicalSize::new(1000.0, 720.0)))
        .map_err(|e| e.to_string())?;
    window.center().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn set_widget_size(window: Window, width: f64, height: f64) -> Result<(), String> {
    window
        .set_size(Size::Logical(LogicalSize::new(width, height)))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn set_always_on_top(window: Window, always_on_top: bool) -> Result<(), String> {
    window
        .set_always_on_top(always_on_top)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn enter_zen_fullscreen(window: Window) -> Result<(), String> {
    if let Ok(Some(monitor)) = window.current_monitor() {
        let size = monitor.size();
        let scale = monitor.scale_factor();
        let logical_width = size.width as f64 / scale;
        let _ = window.set_fullscreen(false);
        let _ = window.unmaximize();
        let _ = window.set_size(Size::Logical(LogicalSize::new(logical_width, 100.0)));
        let _ = window.set_position(Position::Logical(LogicalPosition::new(0.0, 0.0)));
        let _ = window.set_always_on_top(true);
    }
    Ok(())
}

#[tauri::command]
fn exit_zen_fullscreen(window: Window) -> Result<(), String> {
    let _ = window.set_always_on_top(false);
    let _ = window.set_size(Size::Logical(LogicalSize::new(1000.0, 720.0)));
    let _ = window.center();
    Ok(())
}

#[tauri::command]
fn enter_capture_overlay(window: Window) -> Result<bool, String> {
    let was_max = window.is_maximized().map_err(|e| e.to_string())?;
    window.set_fullscreen(true).map_err(|e| e.to_string())?;
    Ok(was_max)
}

#[tauri::command]
fn exit_capture_overlay(window: Window, was_maximized: bool) -> Result<(), String> {
    window.set_fullscreen(false).map_err(|e| e.to_string())?;
    if was_maximized {
        let _ = window.maximize();
    }
    Ok(())
}

#[tauri::command]
fn exit_app(app: AppHandle) {
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_always_on_top(true);
                            let _ = window.set_focus();
                            let _ = window.set_always_on_top(false);
                            let shortcut_str = shortcut.to_string().to_lowercase();
                            if shortcut_str.contains("space") {
                                let _ = window.emit("trigger-quick-capture", ());
                            } else if shortcut_str.contains("period") || shortcut_str.contains(".") {
                                let _ = window.emit("trigger-zen-focus", ());
                            }
                        }
                    }
                })
                .build(),
        )
        .setup(|app| {
            // Global kısayolları güvenle kaydet
            let _ = app.global_shortcut().register("Ctrl+Space");
            let _ = app.global_shortcut().register("CommandOrControl+Space");
            let _ = app.global_shortcut().register("Ctrl+.");
            let _ = app.global_shortcut().register("Ctrl+Period");
            let _ = app.global_shortcut().register("CommandOrControl+Period");
            // Sistem tepsisi menüsü oluştur
            let show_item = MenuItem::with_id(app, "show", "Dali'yi Aç", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Çıkış", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            // Sistem tepsisi ikonu oluştur
            let _tray = TrayIconBuilder::new()
                .menu(&tray_menu)
                .tooltip("Dali — Bugüne yer aç")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            minimize_window,
            toggle_maximize,
            close_window,
            show_window,
            enter_widget_mode,
            exit_widget_mode,
            set_widget_size,
            set_always_on_top,
            enter_zen_fullscreen,
            exit_zen_fullscreen,
            enter_capture_overlay,
            exit_capture_overlay,
            exit_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running dali application");
}
