; Custom NSIS installer script - auto-kill running Photobooth before install
!macro customInit
  ; Kill running Photobooth process before installation
  nsExec::ExecToLog 'taskkill /f /im Photobooth.exe'
!macroend
