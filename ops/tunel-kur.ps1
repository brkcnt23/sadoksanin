# ============================================================
#  SADOKSAN — Netsis SSH Tuneli KALICI Kurulum (fabrika PC)
#
#  YONETICI PowerShell'de BIR KEZ calistirin:
#    powershell -ExecutionPolicy Bypass -File tunel-kur.ps1
#
#  Ne yapar (otomatik):
#    1. SSH anahtari yoksa olusturur
#    2. Anahtari sunucuya yukler (sifre BIR KEZ sorulur: sadok)
#    3. PC'nin uyku/hazirda-bekleme modunu kapatir (tunel kopmasin)
#    4. Tuneli acilista otomatik baslayan gorev yapar (koparsa 10sn'de doner)
#    5. Tuneli hemen baslatir
#
#  Kurulumdan sonra kimse oturum acmasa bile tunel calisir.
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
$KeyPath     = Join-Path $env:USERPROFILE '.ssh\id_ed25519'

Write-Host ''
Write-Host '=== Netsis Tuneli Kalici Kurulum ===' -ForegroundColor Cyan
Write-Host ''

# --- 0) Yonetici mi? ---
$admin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()
  ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) {
    Write-Host '  [HATA] Bu scripti YONETICI PowerShell ile calistirin.' -ForegroundColor Red
    Write-Host '         (Baslat > PowerShell > sag tik > Yonetici olarak calistir)' -ForegroundColor Yellow
    return
}

# --- 1) Klasor ---
if (-not (Test-Path $Klasor)) { New-Item -ItemType Directory -Path $Klasor -Force | Out-Null }
$sshDir = Join-Path $env:USERPROFILE '.ssh'
if (-not (Test-Path $sshDir)) { New-Item -ItemType Directory -Path $sshDir -Force | Out-Null }
Write-Host "  [OK] Klasorler hazir" -ForegroundColor Green

# --- 2) SSH anahtari ---
if (-not (Test-Path $KeyPath)) {
    Write-Host '  [..] SSH anahtari olusturuluyor...' -ForegroundColor Yellow
    ssh-keygen -t ed25519 -N '""' -f $KeyPath -C 'netsis-tunnel' | Out-Null
    Write-Host '  [OK] Anahtar olusturuldu' -ForegroundColor Green
} else {
    Write-Host '  [OK] SSH anahtari zaten var' -ForegroundColor Green
}

# --- 3) Anahtar zaten calisiyor mu? (Temmuz'dan kalmis olabilir) ---
Write-Host ''
Write-Host '  Baglanti kontrol ediliyor...' -ForegroundColor Cyan
$test = ssh -o BatchMode=yes -o StrictHostKeyChecking=no "$SunucuKullanici@$SunucuAdres" 'echo BAGLANTI_OK' 2>$null

if ($test -ne 'BAGLANTI_OK') {
    # Sifresiz calismiyor → anahtari yukle (sifre sorulur: sadok)
    Write-Host ''
    Write-Host '  >>> Sifre sorulacak. Yazin:  sadok  (yazarken gorunmez, normal)' -ForegroundColor Yellow
    Write-Host ''
    scp -o StrictHostKeyChecking=no "$KeyPath.pub" "${SunucuKullanici}@${SunucuAdres}:/tmp/fabrika_key.pub"
    $ekle = 'mkdir -p ~/.ssh; chmod 700 ~/.ssh; cat /tmp/fabrika_key.pub >> ~/.ssh/authorized_keys; sort -u ~/.ssh/authorized_keys -o ~/.ssh/authorized_keys; chmod 600 ~/.ssh/authorized_keys; rm -f /tmp/fabrika_key.pub'
    ssh -o StrictHostKeyChecking=no "${SunucuKullanici}@${SunucuAdres}" $ekle
    # tekrar test
    $test = ssh -o BatchMode=yes -o StrictHostKeyChecking=no "$SunucuKullanici@$SunucuAdres" 'echo BAGLANTI_OK' 2>$null
}

if ($test -eq 'BAGLANTI_OK') {
    Write-Host '  [OK] Sifresiz baglanti calisiyor' -ForegroundColor Green
} else {
    Write-Host '  [HATA] Baglanti kurulamadi. Sifreyi (sadok) dogru yazdiniz mi?' -ForegroundColor Red
    return
}

# --- 5) Uyku / hazirda bekleme kapat (tunel kopmasin) ---
try {
    powercfg /change standby-timeout-ac 0
    powercfg /change hibernate-timeout-ac 0
    powercfg /hibernate off 2>$null
    Write-Host '  [OK] Uyku/hazirda-bekleme kapatildi (prize takili modda)' -ForegroundColor Green
} catch {
    Write-Host '  [!] Uyku ayari degistirilemedi (kritik degil)' -ForegroundColor Yellow
}

# --- 6) Dongu scripti (koparsa yeniden baglanir) ---
$DonguIcerik = @"
# Netsis tuneli — koparsa yeniden baglanir. tunel-kur.ps1 tarafindan olusturuldu.
while (`$true) {
    ssh -N ``
        -o ExitOnForwardFailure=yes ``
        -o ServerAliveInterval=30 ``
        -o ServerAliveCountMax=3 ``
        -o StrictHostKeyChecking=no ``
        -o BatchMode=yes ``
        -R ${TunelPort}:${NetsisIP}:${NetsisPort} ``
        ${SunucuKullanici}@${SunucuAdres}
    Start-Sleep -Seconds 10
}
"@
Set-Content -Path $DonguScript -Value $DonguIcerik -Encoding UTF8
Write-Host "  [OK] Dongu scripti yazildi" -ForegroundColor Green

# --- 7) Zamanlanmis gorev (SYSTEM, acilista + oturumda + 3dk'da bir denetim) ---
$mevcut = Get-ScheduledTask -TaskName $GorevAdi -ErrorAction SilentlyContinue
if ($mevcut) { Unregister-ScheduledTask -TaskName $GorevAdi -Confirm:$false }

$action  = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$DonguScript`""

# 3 KATMANLI TETIKLEME (koprü hep açık kalsın):
#   1) Acilista  → PC kapanip acilinca otomatik baslar (SYSTEM, oturum gerekmez)
#   2) Oturumda  → biri giris yapinca da garanti calisir
#   3) 3 dk'da bir tekrar → gorev herhangi bir sebeple durursa Windows yeniden
#      baslatir. IgnoreNew sayesinde zaten calisiyorsa ikinci kopya acilmaz.
#      Boylece hem ic dongu (10sn) hem Windows denetimi (3dk) yedekli calisir.
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$settings  = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
    -MultipleInstances IgnoreNew -ExecutionTimeLimit ([TimeSpan]::Zero)

$tAcilis = New-ScheduledTaskTrigger -AtStartup
$tOturum = New-ScheduledTaskTrigger -AtLogOn

# 3dk'da bir denetim tetikleyicisi. DIKKAT: RepetitionDuration'a
# [TimeSpan]::MaxValue verilirse Windows "aralik disi deger" (0x80041318)
# hatasi verir. 3650 gun (10 yil) hem gecerli hem pratikte suresiz.
$tTekrar = New-ScheduledTaskTrigger -Once -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes 3) -RepetitionDuration (New-TimeSpan -Days 3650)

# Once 3 tetiklemeyle dene; olmazsa cekirdek dayaniklilik (acilis+oturum)
# ile yeniden dene ki gorev MUTLAKA kaydolsun. Ic 10sn dongusu + RestartCount
# zaten yeniden baglanmayi saglar, 3dk denetimi ekstra emniyet.
try {
    Register-ScheduledTask -TaskName $GorevAdi -Action $action `
        -Trigger @($tAcilis, $tOturum, $tTekrar) `
        -Principal $principal -Settings $settings -ErrorAction Stop | Out-Null
    Write-Host "  [OK] Gorev kaydedildi (acilis + oturum + 3dk denetim): $GorevAdi" -ForegroundColor Green
} catch {
    Write-Host "  [!] 3dk denetim tetigi kaydedilemedi, cekirdek dayaniklilikla devam" -ForegroundColor Yellow
    Register-ScheduledTask -TaskName $GorevAdi -Action $action `
        -Trigger @($tAcilis, $tOturum) `
        -Principal $principal -Settings $settings | Out-Null
    Write-Host "  [OK] Gorev kaydedildi (acilis + oturum): $GorevAdi" -ForegroundColor Green
}

# --- 8) Hemen baslat ---
Start-ScheduledTask -TaskName $GorevAdi
Start-Sleep -Seconds 6
$durum = (Get-ScheduledTask -TaskName $GorevAdi).State
Write-Host "  [OK] Tunel baslatildi (durum: $durum)" -ForegroundColor Green

Write-Host ''
Write-Host '========================================' -ForegroundColor Green
Write-Host '  KURULUM TAMAM — Tunel calisiyor.' -ForegroundColor Green
Write-Host '  PC acik oldugu surece otomatik ayakta kalir.' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Green
Write-Host ''
Write-Host 'Dogrulama (sunucuda): sudo ss -tlnp | grep 17070' -ForegroundColor DarkGray
Write-Host ''
