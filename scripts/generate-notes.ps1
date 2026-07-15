param(
    [string]$ScriptDir = $PSScriptRoot
)

$ProjectRoot = Split-Path $ScriptDir -Parent
$DocsPath = Join-Path $ProjectRoot "docs"
$OutputDir = Join-Path $ProjectRoot "data"
$OutputPath = Join-Path $OutputDir "notes.json"

if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null }

$categoryNames = @{
    'java' = 'Java'; 'spring' = 'Spring'; 'docker' = 'Docker'; 'kubernetes' = 'Kubernetes'
    'kafka' = 'Kafka'; 'sql' = 'SQL'; 'database' = 'Database'; 'system-design' = 'System Design'
    'microservices' = 'Microservices'; 'azure' = 'Azure'; 'aws' = 'AWS'; 'javascript' = 'JavaScript'
    'typescript' = 'TypeScript'; 'react' = 'React'; 'angular' = 'Angular'; 'html' = 'HTML'
    'css' = 'CSS'; 'authentication' = 'Authentication'; 'networking' = 'Networking'
    'algorithms' = 'Algorithms'; 'data-structures' = 'Data Structures'; 'interview' = 'Interview'; 'misc' = 'Misc'
}

function Get-Title([string]$name) {
    $t = [System.IO.Path]::GetFileNameWithoutExtension($name)
    $t = $t -replace '^[\d-]+\s*', ''
    $t = $t -replace '[-_]', ' '
    $t = (Get-Culture).TextInfo.ToTitleCase($t.ToLower())
    return $t.Trim()
}

function Get-Category([string]$dir) {
    $rel = $dir.Substring($DocsPath.Length + 1).Split('\')[0]
    if ($categoryNames.ContainsKey($rel.ToLower())) { return $categoryNames[$rel.ToLower()] }
    return (Get-Culture).TextInfo.ToTitleCase($rel.ToLower())
}

function Get-Level([string]$title) {
    $tl = $title.ToLower()
    if ($tl -match 'beginner|intro|fundamental|basic|cheat') { return 'Beginner' }
    if ($tl -match 'advanced|deep dive|master|expert|complex|performance') { return 'Advanced' }
    return 'Intermediate'
}

function Get-Tags([string]$title, [string]$cat, [string]$ext) {
    $tags = @($cat)
    $map = @{
        'interview' = 'Interview'; 'java' = 'Java'; 'spring' = 'Spring'; 'docker' = 'Docker'
        'kubernetes' = 'Kubernetes'; 'kafka' = 'Kafka'; 'sql' = 'SQL'; 'database' = 'Database'
        'design' = 'Design'; 'microservice' = 'Microservices'; 'azure' = 'Azure'; 'aws' = 'AWS'
        'javascript' = 'JavaScript'; 'typescript' = 'TypeScript'; 'react' = 'React'; 'angular' = 'Angular'
        'html' = 'HTML'; 'css' = 'CSS'; 'oauth' = 'OAuth'; 'security' = 'Security'; 'network' = 'Networking'
        'algorithm' = 'Algorithms'; 'data structure' = 'Data Structures'; 'architecture' = 'Architecture'
        'cloud' = 'Cloud'; 'devops' = 'DevOps'; 'testing' = 'Testing'; 'performance' = 'Performance'
    }
    $tl = $title.ToLower()
    foreach ($kv in $map.GetEnumerator()) { if ($tl -match $kv.Key) { $tags += $kv.Value } }
    if ($ext -eq 'pdf') { $tags += 'PDF' }
    elseif (@('png','jpg','jpeg','gif','webp','svg') -contains $ext) { $tags += 'Visual' }
    elseif ($ext -eq 'md') { $tags += 'Markdown' }
    return ($tags | Select-Object -Unique)
}

Write-Host "Scanning: $DocsPath`n"

$notes = @()
Get-ChildItem -Path $DocsPath -Recurse -File | Where-Object {
    $_.Extension -match '^\.(pdf|png|jpg|jpeg|gif|webp|svg|md|txt)$'
} | ForEach-Object {
    $title = Get-Title $_.Name
    $cat = Get-Category $_.DirectoryName
    $ext = $_.Extension.TrimStart('.').ToLower()
    $level = Get-Level $title
    $tags = Get-Tags $title $cat $ext
    $desc = "$title - A $ext document covering $cat topics for interview preparation."
    $date = $_.LastWriteTime.ToString('yyyy-MM-dd')
    $relPath = $_.FullName.Substring($ProjectRoot.Length + 1).Replace('\', '/')

    $notes += [PSCustomObject]@{
        title = $title
        description = $desc
        category = $cat
        tags = $tags
        type = $ext
        path = $relPath
        level = $level
        date = $date
        fileSize = $_.Length
    }
    Write-Host "  + $($_.Name) -> $cat ($level)"
}

$notes = $notes | Sort-Object date -Descending
$json = $notes | ConvertTo-Json -Depth 3
Set-Content -Path $OutputPath -Value $json -Encoding UTF8
Write-Host "`nGenerated: $OutputPath ($($notes.Count) notes)"

$notes | Group-Object category | Sort-Object Count -Descending | ForEach-Object {
    Write-Host "  $($_.Name): $($_.Count)"
}
Write-Host ""
