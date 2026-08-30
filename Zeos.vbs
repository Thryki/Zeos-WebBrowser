Option Explicit
Dim fs, sh, root, executable
Set fs = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
root = fs.GetParentFolderName(WScript.ScriptFullName)
executable = root & "\node_modules\electron\dist\electron.exe"
sh.Run Chr(34) & executable & Chr(34) & " " & Chr(34) & root & Chr(34), 0, False
