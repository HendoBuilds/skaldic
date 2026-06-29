; Skaldic NSIS installer hooks.
; On uninstall, offer to also remove Skaldic's app-data (the saved, re-editable projects).
; The user's in-game songs live in Mordhau's SaveGames and are deliberately left untouched.

!macro NSIS_HOOK_PREINSTALL
!macroend

!macro NSIS_HOOK_POSTINSTALL
!macroend

!macro NSIS_HOOK_PREUNINSTALL
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  MessageBox MB_YESNO|MB_ICONQUESTION "Also delete Skaldic's saved projects (your editable track and octave settings)?$\n$\nYour songs already sent to Mordhau will NOT be affected and will keep working in-game." IDNO skaldic_keep_appdata
    SetShellVarContext current
    RMDir /r "$APPDATA\com.skaldic.bard"
  skaldic_keep_appdata:
!macroend
