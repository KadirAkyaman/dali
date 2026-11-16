param (
    [string]$Version
)

if (-not $Version) {
    $Version = Read-Host "Yayınlanacak yeni sürüm numarasını girin (örnek: 0.2.1)"
}

if (-not $Version) {
    Write-Host "Sürüm numarası girilmedi, işlem iptal edildi." -ForegroundColor Red
    exit 1
}

Write-Host "=== Dali v$Version Sürümü Hazırlanıyor ===" -ForegroundColor Cyan

# 1. package.json güncelle
$pkgPath = "package.json"
$pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
$pkg.version = $Version
$pkg | ConvertTo-Json -Depth 10 | Set-Content $pkgPath

# 2. tauri.conf.json güncelle
$tauriConfPath = "src-tauri/tauri.conf.json"
$tauriConf = Get-Content $tauriConfPath -Raw | ConvertFrom-Json
$tauriConf.version = $Version
$tauriConf | ConvertTo-Json -Depth 10 | Set-Content $tauriConfPath

# 3. Cargo.toml güncelle (Yalnızca [package] altındaki sürüm)
$cargoPath = "src-tauri/Cargo.toml"
$cargoContent = Get-Content $cargoPath -Raw
$r = [regex]'(?m)^version\s*=\s*"[^"]+"'
$cargoContent = $r.Replace($cargoContent, "version = `"$Version`"", 1)
Set-Content $cargoPath $cargoContent

Write-Host "1. Versiyon numaraları güncellendi." -ForegroundColor Green

# 4. Derleme (Build)
Write-Host "2. Dali NSIS ve Updater paketleri derleniyor..." -ForegroundColor Cyan
$env:TAURI_SIGNING_PRIVATE_KEY = "dW50cnVzdGVkIGNvbW1lbnQ6IHJzaWduIGVuY3J5cHRlZCBzZWNyZXQga2V5ClJXUlRZMEl5NEpmRHpJMGt5K0NPQnlrU2Joa2tPTVpIUFRiUzJrbzRCdSthN2lZVUhwSUFBQkFBQUFBQUFBQUFBQUlBQUFBQWhyVWtpZVVJeTYzUVdEaVk0YUpzZmZxR1E1OTA5bnJoOHpITEtYTWhIK2NIQjZJKzc0OUlUaUFHUDUxclBFN24xTzFVUjV2ekRkWDA2UHF0bkN5djZEQ1ZkL2wrVWY2cFVSaWRKZkRlMmliSTJxVElKS0ZnVW9YbHVMcmRacEhIaFJCRTlCNmY0NlE9Cg=="
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ""
npm run tauri build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Derleme başarısız oldu!" -ForegroundColor Red
    exit 1
}

Write-Host "3. Derleme başarılı! Dosyalar imzalandı." -ForegroundColor Green

# 5. Git commit & push
git add .
git commit -m "chore: release v$Version"
git push origin main

# 6. GitHub Release Yükleme
$inputStr = "protocol=https`nhost=github.com`n`n"
$lines = $inputStr | git credential fill
$pwdLine = $lines | Where-Object { $_ -like "password=*" }
$token = $pwdLine.Substring(9)
$headers = @{
    "Authorization" = "Bearer $token"
    "Accept" = "application/vnd.github+json"
    "User-Agent" = "Dali-App"
}

$releaseBody = @{
    tag_name = "v$Version"
    name = "Dali v$Version"
    body = "### ✨ Dali v$Version Yenilikleri`n`n- 🔥 **Alışkanlıklar ve Zincir (Habit Streaks)**: Günlük mikro-ritüeller (Su, Kitap, Yürüyüş, Meditasyon), 7 günlük interaktif dot zinciri, kesintisiz gün sayacı (streak) ve en iyi rekor rozetleri.`n- 📝 **Not Defteri ve Karalama (Daily Scratchpad)**: Günün notu ve kalıcı hızlı karalama alanı, otomatik kaydetme, saat damgası ve tek tıkla **Satırları Göreve Dönüştürme**.`n- ⏱️ **Bağımsız Pomodoro ve Odak Sayfası**: Sol menüden doğrudan erişilebilen odak çalışma alanı, görev seçimi ve seans takibi.`n- 🌿 **Doğal Ortam Sesleri (Offline)**: Web Audio API ile sıfır harici dosya bağımlılığıyla üretilen Rahatlatıcı Yağmur ve Okyanus Dalgaları.`n- 📊 **Haftalık Ritim ve İstatistikler**: Bugün sayfasının en üstüne taşındı.`n- 💫 **Yenilenen Günün Ritmi ve Enerjisi (Daily Pulse)**: 5 farklı durum için özel rehberlik.`n- 🪟 **Ultra-Mini Yüzen Bar Modu**: Widget başlığında doğrudan görünen mini bar butonuyla tek tıkla kompakt tek görev çubuğuna dönüşme.`n- 🚀 **Performans ve Hata İyileştirmeleri**."
    draft = $false
    prerelease = $false
}
$releaseJson = $releaseBody | ConvertTo-Json

$rel = Invoke-RestMethod -Uri "https://api.github.com/repos/KadirAkyaman/dali/releases" -Method Post -Headers $headers -ContentType "application/json; charset=utf-8" -Body ([System.Text.Encoding]::UTF8.GetBytes($releaseJson))
$relId = $rel.id

$exePath = "src-tauri/target/release/bundle/nsis/Dali_${Version}_x64-setup.exe"
$sigPath = "src-tauri/target/release/bundle/nsis/Dali_${Version}_x64-setup.exe.sig"

$sig = [System.IO.File]::ReadAllText((Resolve-Path $sigPath)).Trim()

$latestJson = @{
    version = $Version
    notes = "Dali v${Version} - Aliskanliklar Zinciri, Not Defteri, Pomodoro Odak Sayfasi ve Ultra-Mini Bar Modu."
    pub_date = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    platforms = @{
        "windows-x86_64" = @{
            signature = $sig
            url = "https://github.com/KadirAkyaman/dali/releases/download/v$Version/Dali_${Version}_x64-setup.exe"
        }
    }
} | ConvertTo-Json -Depth 5

$cleanBytes = [System.Text.Encoding]::UTF8.GetBytes($latestJson)
[System.IO.File]::WriteAllBytes("latest.json", $cleanBytes)

function Upload-File($fPath, $fName, $cType) {
    $uploadUri = "https://uploads.github.com/repos/KadirAkyaman/dali/releases/$relId/assets?name=$fName"
    $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $fPath))
    $uHeaders = @{
        "Authorization" = "Bearer $token"
        "User-Agent" = "Dali-App"
    }
    Write-Host "Yükleniyor: $fName..." -ForegroundColor Gray
    Invoke-RestMethod -Uri $uploadUri -Method Post -Headers $uHeaders -ContentType $cType -Body $bytes | Out-Null
    Write-Host "$fName yüklendi." -ForegroundColor Green
}

Upload-File "latest.json" "latest.json" "application/json"
Upload-File $sigPath "Dali_${Version}_x64-setup.exe.sig" "text/plain"
Upload-File $exePath "Dali_${Version}_x64-setup.exe" "application/octet-stream"

Write-Host "=== TEBRİKLER! v$Version Yayında ve Tüm Kullanıcılar İçin Otomatik Güncelleme Aktif! ===" -ForegroundColor Cyan
