; Custom NSIS installer script - auto-kill running Photobooth before install/uninstall
!macro customInit
  ; Kill all Photobooth processes before installation (ignore errors if not running)
  nsExec::ExecToLog 'taskkill /f /im "Photobooth.exe"'
  Sleep 1000
!macroend

!macro customUnInit
  ; Kill all Photobooth processes before uninstallation (ignore errors if not running)
  nsExec::ExecToLog 'taskkill /f /im "Photobooth.exe"'
  Sleep 1000
!macroend
