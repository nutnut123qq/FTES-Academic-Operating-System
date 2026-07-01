# PUBLISH the FE skills you edited here (in the FE source) up to the shared plugin repo
# github.com/starci183/starci-fe-skills, so anyone can /plugin install the new version.
#
#   pwsh .claude/sync-skills.ps1 "feat: taught ux-brainstorm a new layout pattern"
#
# You edit skills in starci-academy/.claude/  →  run this  →  pushed to git  →  others install.

param([string]$Message = "chore: publish FE skills from app .claude")

$AppClaude  = "D:\Repositories\starci-academy\.claude"
$SkillsRepo = "D:\Repositories\starci-fe-skills"   # local clone of the public repo (the bridge)

if (-not (Test-Path $SkillsRepo)) {
    throw "Clone the plugin repo first: git clone https://github.com/starci183/starci-fe-skills $SkillsRepo"
}

git -C $SkillsRepo pull --ff-only   # avoid clobbering another machine's push

# copy what you edited in the FE source → the plugin repo
foreach ($skill in @("starci-fe-ux-brainstorm","starci-fe-ux-apply","starci-fe-cannon-audit","starci-fe-cannon-apply","starci-fe-update-mindset")) {
    $src = Join-Path $AppClaude "skills\$skill"
    $dst = Join-Path $SkillsRepo "skills\$skill"
    if (Test-Path $src) {
        if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
        Copy-Item $src $dst -Recurse -Force
    }
}
foreach ($dir in @("cannon","design","ui","decision")) {
    $src = Join-Path $AppClaude $dir
    $dst = Join-Path $SkillsRepo $dir
    if (Test-Path $src) {
        if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
        Copy-Item $src $dst -Recurse -Force
    }
}

git -C $SkillsRepo add -A
if ([string]::IsNullOrWhiteSpace((git -C $SkillsRepo status --porcelain))) {
    Write-Host "[publish] nothing changed." -ForegroundColor Yellow
} else {
    git -C $SkillsRepo -c user.name="starci183" -c user.email="pakoohacha588@gmail.com" commit -m $Message
    git -C $SkillsRepo push
    Write-Host "[publish] pushed → others can /plugin install the new version." -ForegroundColor Green
}
