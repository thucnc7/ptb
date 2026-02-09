; Custom NSIS installer script - auto-kill running Photobooth before install/uninstall
!macro customInit
  ; Kill all Photobooth processes before installation
  ExecWait 'taskkill /f /im "Photobooth.exe"'
  Sleep 2000
!macroend

!macro customUnInit
  ; Kill all Photobooth processes before uninstallation
  ExecWait 'taskkill /f /im "Photobooth.exe"'
  Sleep 2000
!macroend
