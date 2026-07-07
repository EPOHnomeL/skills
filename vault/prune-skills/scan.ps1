# prune-skills scanner — single source of truth for the skill inventory + load + usage scan.
# Emits a machine-readable TSV block (between <SCAN> markers) plus a human summary.
# All token figures are ~estimates (chars/4); no tokenizer is available cross-platform.
#
# Usage:  powershell -NoProfile -ExecutionPolicy Bypass -File scan.ps1
#         (optional)  -Home "C:\Users\<user>\.claude"   to override the config root.

param(
  [string]$ConfigRoot = "$env:USERPROFILE\.claude"
)

$ErrorActionPreference = 'Stop'
$skillsDir   = Join-Path $ConfigRoot 'skills'
$disabledDir = Join-Path $ConfigRoot 'skills-disabled'
$projectsDir = Join-Path $ConfigRoot 'projects'
$settingsF   = Join-Path $ConfigRoot 'settings.json'
$installedF  = Join-Path $ConfigRoot 'plugins\installed_plugins.json'

# --- helpers ----------------------------------------------------------------
function Get-Frontmatter([string]$path) {
  $lines = Get-Content -LiteralPath $path -ErrorAction SilentlyContinue
  if (-not $lines -or $lines[0].Trim() -ne '---') { return $null }
  $fm = @{ name=''; description=''; userInvoked=$false }
  for ($i = 1; $i -lt $lines.Count; $i++) {
    $l = $lines[$i]
    if ($l.Trim() -eq '---') { break }
    if ($l -match '^\s*name:\s*(.+?)\s*$')        { $fm.name = $matches[1].Trim('"',"'") }
    elseif ($l -match '^\s*description:\s*(.+?)\s*$') { $fm.description = $matches[1].Trim('"',"'") }
    elseif ($l -match '^\s*disable-model-invocation:\s*true\s*$') { $fm.userInvoked = $true }
  }
  return $fm
}

function Est-Tokens([string]$name, [string]$desc) {
  # what sits in the window per turn ≈ "- name: description"
  return [math]::Ceiling(($name.Length + $desc.Length + 4) / 4.0)
}

# --- 1. gather usage signal from transcripts (one pass) ---------------------
$useCount = @{}   # skillName -> invocation count
$useLast  = @{}   # skillName -> most-recent transcript mtime (DateTime)
if (Test-Path $projectsDir) {
  $jsonl = Get-ChildItem -Path $projectsDir -Recurse -Filter *.jsonl -ErrorAction SilentlyContinue
  foreach ($f in $jsonl) {
    $hits = Select-String -LiteralPath $f.FullName -AllMatches -Pattern `
      '"skill":"([^"]+)"', '<command-name>/([^<]+)</command-name>' -ErrorAction SilentlyContinue
    foreach ($h in $hits) {
      foreach ($m in $h.Matches) {
        $n = $m.Groups[1].Value
        $n = $n -replace '^.*:', ''      # strip plugin namespace (yknot:security-review -> security-review)
        $n = $n.Trim()
        if (-not $n) { continue }
        $useCount[$n] = ([int]$useCount[$n]) + 1
        if (-not $useLast.ContainsKey($n) -or $f.LastWriteTime -gt $useLast[$n]) {
          $useLast[$n] = $f.LastWriteTime
        }
      }
    }
  }
}

# --- 2. personal skills -----------------------------------------------------
$rows = @()
$personalNames = @()
$bodies = @{}   # name -> full text, for reachability grep
if (Test-Path $skillsDir) {
  foreach ($d in Get-ChildItem -Path $skillsDir -Directory) {
    $sk = Join-Path $d.FullName 'SKILL.md'
    if (-not (Test-Path $sk)) { continue }
    $fm = Get-Frontmatter $sk
    if (-not $fm) { continue }
    $nm = if ($fm.name) { $fm.name } else { $d.Name }
    $personalNames += $nm
    $bodies[$nm] = (Get-Content -LiteralPath $sk -Raw -ErrorAction SilentlyContinue)
    $tok = if ($fm.userInvoked) { 0 } else { Est-Tokens $fm.name $fm.description }
    $rows += [pscustomobject]@{
      name = $nm; category = 'personal'
      loadTok = $tok
      userInvoked = $fm.userInvoked
      timesUsed = [int]$useCount[$nm]
      lastUsed = if ($useLast.ContainsKey($nm)) { $useLast[$nm].ToString('yyyy-MM-dd') } else { 'never' }
      calledBy = ''
    }
  }
}

# --- 2b. reachability: which personal skills INVOKE this one?
# High-precision: only count invocation-shaped references — backticked `name`
# or slash /name — never bare prose (else common words like "design"/"learn"
# produce false callers and the guard cries wolf on everything).
foreach ($r in $rows) {
  if ($r.category -ne 'personal') { continue }
  $callers = @()
  $esc = [regex]::Escape($r.name)
  $pat = "(`` ?$esc ?``|/$esc\b|""skill"":""[^""]*$esc"")"
  foreach ($other in $personalNames) {
    if ($other -eq $r.name) { continue }
    if ($bodies[$other] -match $pat) { $callers += $other }
  }
  $r.calledBy = ($callers -join ',')
}

# --- 3. enabled-plugin skills (resolve ACTIVE installPath, not cache glob) --
$settings  = Get-Content -LiteralPath $settingsF  -Raw | ConvertFrom-Json
$installed = Get-Content -LiteralPath $installedF -Raw | ConvertFrom-Json
$enabled = @()
foreach ($p in $settings.enabledPlugins.PSObject.Properties) {
  if ($p.Value -eq $true) { $enabled += $p.Name }
}
foreach ($pluginKey in $enabled) {
  $entry = $installed.plugins.$pluginKey
  if (-not $entry) { continue }
  $installPath = $entry[0].installPath
  $pSkills = Join-Path $installPath 'skills'
  if (-not (Test-Path $pSkills)) { continue }
  foreach ($d in Get-ChildItem -Path $pSkills -Directory) {
    $sk = Join-Path $d.FullName 'SKILL.md'
    if (-not (Test-Path $sk)) { continue }
    $fm = Get-Frontmatter $sk
    if (-not $fm) { continue }
    $nm = if ($fm.name) { $fm.name } else { $d.Name }
    $rows += [pscustomobject]@{
      name = $nm; category = "plugin:$($pluginKey.Split('@')[0])"
      loadTok = (Est-Tokens $fm.name $fm.description)
      userInvoked = $fm.userInvoked
      timesUsed = [int]$useCount[$nm]
      lastUsed = if ($useLast.ContainsKey($nm)) { $useLast[$nm].ToString('yyyy-MM-dd') } else { 'never' }
      calledBy = 'PLUGIN'   # not individually editable
    }
  }
}

# --- 4. emit ----------------------------------------------------------------
$loaded = $rows | Where-Object { -not $_.userInvoked }
$total  = ($loaded | Measure-Object loadTok -Sum).Sum
$disabledCount = if (Test-Path $disabledDir) { (Get-ChildItem $disabledDir -Directory).Count } else { 0 }
$disabledPlugins = @($settings.enabledPlugins.PSObject.Properties | Where-Object { $_.Value -eq $false } | ForEach-Object { $_.Name })

Write-Output "<SCAN>"
Write-Output ("HOME`t{0}" -f $ConfigRoot)
Write-Output ("TOTAL_LOAD_TOK`t{0}" -f $total)
Write-Output ("MODEL_INVOCABLE_COUNT`t{0}" -f $loaded.Count)
Write-Output ("USER_INVOKED_COUNT`t{0}" -f ($rows | Where-Object userInvoked).Count)
Write-Output ("DISABLED_SKILLS`t{0}" -f $disabledCount)
Write-Output ("DISABLED_PLUGINS`t{0}" -f ($disabledPlugins -join ','))
Write-Output "name`tcategory`tloadTok`tuserInvoked`ttimesUsed`tlastUsed`tcalledBy"
foreach ($r in ($rows | Sort-Object @{e={$_.userInvoked}}, @{e={-$_.loadTok}})) {
  Write-Output ("{0}`t{1}`t{2}`t{3}`t{4}`t{5}`t{6}" -f `
    $r.name, $r.category, $r.loadTok, $r.userInvoked, $r.timesUsed, $r.lastUsed, $r.calledBy)
}
Write-Output "</SCAN>"
