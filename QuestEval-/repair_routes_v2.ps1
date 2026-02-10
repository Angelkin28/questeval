$files = Get-ChildItem -Path "src\presentation\web" -Recurse -Include "*.tsx", "*.ts"
foreach ($f in $files) {
    if ($f.FullName -like "*node_modules*") { continue }
    $txt = Get-Content $f.FullName -Raw
    if (-not $txt) { continue }
    $orig = $txt
    $txt = $txt.Replace("'/rubrica'", "'/rubric'")
    $txt = $txt.Replace('"/rubrica"', '"/rubric"')
    $txt = $txt.Replace("'/evaluaciones'", "'/evaluations'")
    $txt = $txt.Replace('"/evaluaciones"', '"/evaluations"')
    $txt = $txt.Replace("'/proyecto'", "'/project'")
    $txt = $txt.Replace('"/proyecto"', '"/project"')
    $txt = $txt.Replace("'/perfil'", "'/profile'")
    $txt = $txt.Replace('"/perfil"', '"/profile"')
    $txt = $txt.Replace("'/grupos'", "'/groups'")
    $txt = $txt.Replace('"/grupos"', '"/groups"')
    $txt = $txt.Replace("'/notificaciones'", "'/notifications'")
    $txt = $txt.Replace('"/notificaciones"', '"/notifications'")
  $txt = $txt.Replace("'/galeria'", "'/gallery'")
  $txt = $txt.Replace('"/ galeria"', '"/gallery"')
  $txt = $txt.Replace("'/destacados'", "'/featured'")
  $txt = $txt.Replace('"/destacados"', '"/featured'")
  $txt = $txt.Replace("'/preguntas'", "'/questions'")
  $txt = $txt.Replace('"/preguntas"', '"/questions'")
    $txt = $txt.Replace("'/evaluacion-detalle'", "'/evaluation-details'")
    $txt = $txt.Replace('"/evaluacion-detalle"', '"/evaluation-details'")
  $txt = $txt.Replace("'/analisis-detallado'", "'/detailed-analysis'")
  $txt = $txt.Replace('"/ analisis-detallado"', '"/detailed-analysis'")
  $txt = $txt.Replace("'/proyecto/nuevo'", "'/project/new'")
  $txt = $txt.Replace('"/proyecto/nuevo"', '"/project/new"')
  
  if ($txt -ne $orig) {
    Set-Content -Path $f.FullName -Value $txt -NoNewline
    Write-Host "Fixed: $($f.Name)"
  }
}
