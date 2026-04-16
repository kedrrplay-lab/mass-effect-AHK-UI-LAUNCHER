#NoEnv
#SingleInstance Force

if !A_IsAdmin
{
    Run *RunAs "%A_ScriptFullPath%"
    ExitApp
}


game := A_Args[1]
lang := A_Args[2]
vo := A_Args[3]

if (game = "")
{
    MsgBox, 16, Error, No game argument received!
    ExitApp
}

if (lang = "")
    lang := "Russian"

if (vo = "")
    vo := 0


base := ""

; --- EA App ---
RegRead, eaPath, HKLM\SOFTWARE\WOW6432Node\Electronic Arts\EA Desktop\Installed Games\Mass Effect Legendary Edition, InstallLocation
if (!ErrorLevel && FileExist(eaPath))
{
    base := eaPath "\Game"
}

if (!base)
{
    RegRead, steamPath, HKLM\SOFTWARE\WOW6432Node\Valve\Steam, InstallPath
    if (!ErrorLevel)
    {
        steamGame := steamPath "\steamapps\common\Mass Effect Legendary Edition\Game"
        if FileExist(steamGame)
            base := steamGame
    }
}

if (!base)
{
    drives := ["C:", "D:", "E:", "F:"]
    for i, d in drives
    {
        test := d "\Program Files (x86)\Mass Effect Legendary Edition\Game"
        if FileExist(test)
        {
            base := test
            break
        }
    }
}

if (!base)
{
    MsgBox, 16, Error, Game not found!
    ExitApp
}

; ========= КОНФИГ =========

Config := base "\MassEffectLauncher.ini"

; снять read-only если есть
FileSetAttrib, -R, %Config%

; запись
IniWrite, %lang%, %Config%, Language, Lang
IniWrite, %vo%, %Config%, Language, EnglishVO

; ========= ЯЗЫКИ =========

if (lang = "English")
{
    ME1Lang := "INT"
    ME2Lang := "INT"
    ME3Lang := "INT"
}
else if (lang = "Russian")
{
    ME1Lang := (vo = 1) ? "RU" : "RA"
    ME2Lang := "RUS"
    ME3Lang := "RUS"
}
else
{
    ME1Lang := "INT"
    ME2Lang := "INT"
    ME3Lang := "INT"
}


Commandline := " -NoHomeDir -SeekFreeLoadingPCConsole -Subtitles 20"
CommandlineOverrideLang := " -OVERRIDELANGUAGE="
CommandlineLang := " -language="

; ========= ЗАПУСК =========

if (game = "ME1")
{
    exe := base "\ME1\Binaries\Win64\MassEffect1.exe"

    if (!FileExist(exe))
    {
        MsgBox, 16, Error, ME1 not found:`n%exe%
        ExitApp
    }

    SetWorkingDir % base "\ME1\Binaries\Win64"
    RunWait, % exe . Commandline . CommandlineOverrideLang . ME1Lang
}

else if (game = "ME2")
{
    exe := base "\ME2\Binaries\Win64\MassEffect2.exe"

    if (!FileExist(exe))
    {
        MsgBox, 16, Error, ME2 not found:`n%exe%
        ExitApp
    }

    SetWorkingDir % base "\ME2\Binaries\Win64"
    RunWait, % exe . Commandline . CommandlineOverrideLang . ME2Lang
}

else if (game = "ME3")
{
    exe := base "\ME3\Binaries\Win64\MassEffect3.exe"

    if (!FileExist(exe))
    {
        MsgBox, 16, Error, ME3 not found:`n%exe%
        ExitApp
    }

    SetWorkingDir % base "\ME3\Binaries\Win64"
    RunWait, % exe . Commandline . CommandlineLang . ME3Lang
}