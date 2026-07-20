# ============================================================
#  SADOKSAN — Netsis SSH Tuneli KALICI Kurulum (fabrika PC)
#
#  Bunu fabrika PC'sinde YONETICI PowerShell ile BIR KEZ calistirin.
#
#    powershell -ExecutionPolicy Bypass -File tunel-kur.ps1
#
#  Ne yapar:
#    - Tuneli acan bir dongu scripti olusturur (koparsa 10sn'de yeniden baglanir)
#    - Windows Zamanlanmis Gorev olarak kaydeder (acilista otomatik baslar)
#    - Kimse oturum acmasa bile calisir
#
#  NEDEN GEREKLI: Tunel daha once elle "ssh -R ..." ile aciliyordu.
#  O pencere kapaninca tunel oldu ve 10 gun boyunca kimse fark etmedi.
# ============================================================

$ErrorActionPreference = 'Stop'

$SunucuKullanici = 'sadok'
$SunucuAdres     = '45.43.152.52'
$NetsisIP        = '172.16.156.38'
$NetsisPort      = 8081
$TunelPort       = 17070

$Klasor      = 'C:\netsis-tunel'
$DonguScript = Join-Path $Klasor 'tunel-dongu.ps1'
$GorevAdi    = 'NetsisTunel'

Write-Host ''
Write-Host '=== Netsis Tuneli Kalici Kurulum ===' -ForegroundColor Cyan
Write-Host ''

# --- 1) Klasor ---
if (-not (Test-Path $Klasor)) {
    New-Item -ItemType Directory -Path $Klasor -Force | Out-Null
}
Write-Host "  [OK] Klasor hazir: $Klasor" -ForegroundColor Green

# --- 2) SSH anahtari (sifresiz baglanti icin sart) ---
$KeyPath = Join-Path $env:USERPROFILE '.ssh\id_ed25519'
if (-not (Test-Path $KeyPath)) {
    Write-Host '  [!] SSH anahtari yok, olusturuluyor...' -ForegroundColor Yellow
    ssh-keygen -t ed25519 -N '""' -f $KeyPath
    Write-Host ''
    Write-Host '  !!! ONEMLI: Asagidaki anahtari sunucuya eklemeniz gerekiyor:' -ForegroundColor Red
    Write-Host ''
    Get-Content "$KeyPath.pub"
    Write-Host ''
    Write-Host '  Sunucuda su komutu calistirin:' -ForegroundColor Yellow
    Write-Host "    echo '<yukaridaki satir>' >> /home/sadok/.ssh/authorized_keys"
    Write-Host ''
    Read-Host '  Ekledikten sonra ENTER a basin'
} else {
    Write-Host '  [OK] SSH anahtari mevcut' -ForegroundColor Green
}

# --- 3) Dongu scripti ---
$DonguIcerik = @"
# Netsis tuneli — koparsa yeniden baglanir. tunel-kur.ps1 tarafindan olusturuldu.
while (`$true) {
    try {
        # -N: komut calistirma, sadece tunel
        # ServerAliveInterval: 30sn'de bir canlilik testi, 3 kez cevapsizsa kopar
        # ExitOnForwardFailure: port zaten doluysa sessizce takilma, cik ve yeniden dene
        ssh -N ``
            -o ExitOnForwardFailure=yes ``
            -o ServerAliveInterval=30 ``
            -o ServerAliveCountMax=3 ``
            -o StrictHostKeyChecking=no ``
            -R ${TunelPort}:${NetsisIP}:${NetsisPort} ``
            ${SunucuKullanici}@${SunucuAdres}
    } catch {
        # yut, asagida yeniden denenecek
    }
    Start-Sleep -Seconds 10
}
"@
Set-Content -Path $DonguScript -Value $DonguIcerik -Encoding UTF8
Write-Host "  [OK] Dongu scripti yazildi: $DonguScript" -ForegroundColor Green

# --- 4) Zamanlanmis gorev ---
$mevcut = Get-ScheduledTask -TaskName $GorevAdi -ErrorAction SilentlyContinue
if ($mevcut) {
    Unregister-ScheduledTask -TaskName $GorevAdi -Confirm:$false
    Write-Host '  [OK] Eski gorev kaldirildi' -ForegroundColor Green
}

$action  = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$DonguScript`""
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$settings  = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit ([TimeSpan]::Zero)

Register-ScheduledTask -TaskName $GorevAdi -Action $action -Trigger $trigger `
    -Principal $principal -Settings $settings | Out-Null
Write-Host "  [OK] Zamanlanmis gorev kaydedildi: $GorevAdi" -ForegroundColor Green

# --- 5) Hemen baslat ---
Start-ScheduledTask -TaskName $GorevAdi
Start-Sleep -Seconds 5
$durum = (Get-ScheduledTask -TaskName $GorevAdi).State
Write-Host "  [OK] Gorev baslatildi (durum: $durum)" -ForegroundColor Green

Write-Host ''
Write-Host '=== KURULUM TAMAM ===' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Dogrulama — sunucuda su komutu calistirin:' -ForegroundColor Yellow
Write-Host '  sudo ss -tlnp | grep 17070'
Write-Host '  (bir satir donerse tunel ayakta demektir)'
Write-Host ''
Write-Host 'Gorevi durdurmak icin:  Stop-ScheduledTask -TaskName NetsisTunel'
Write-Host 'Gorevi silmek icin:     Unregister-ScheduledTask -TaskName NetsisTunel'
Write-Host ''
