use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, LogicalSize, Manager, Size, Window,
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
fn update_tray_status(app: AppHandle, pending_count: usize, completed_count: usize) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("main_tray") {
        let tooltip = if pending_count == 0 {
            "Dali — Harika! Tüm görevler tamamlandı ✨".to_string()
        } else {
            format!("Dali — {} bekleyen, {} tamamlanan görev", pending_count, completed_count)
        };
        let _ = tray.set_tooltip(Some(tooltip));
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
            // Sistem tepsisi menüsü oluştur
            let quick_add_item = MenuItem::with_id(app, "quick_add", "⚡ Hızlı Görev Ekle (Ctrl+Space)", true, None::<&str>)?;
            let show_item = MenuItem::with_id(app, "show", "Dali'yi Aç", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Çıkış", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&quick_add_item, &show_item, &quit_item])?;

            // Sistem tepsisi ikonu oluştur
            let tray_icon = tauri::include_image!("icons/128x128.png");
            let _tray = TrayIconBuilder::with_id("main_tray")
                .icon(tray_icon)
                .menu(&tray_menu)
                .tooltip("Dali — Bugüne yer aç")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quick_add" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                            let _ = window.emit("trigger-quick-capture", ());
                        }
                    }
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
            enter_capture_overlay,
            exit_capture_overlay,
            update_tray_status,
            exit_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running dali application");
}
