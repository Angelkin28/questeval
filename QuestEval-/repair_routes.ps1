$files = Get-ChildItem -Path "src/presentation/web" -Recurse -Include "*.tsx", "*.ts"
foreach ($file in $files) {
    # Skip node_modules just in case
    if ($file.FullName -like "*node_modules*") { continue }

    try {
        $content = Get-Content $file.FullName -Raw
        if ($null -eq $content) { continue }
        
        $newContent = $content
        
        # Replace Spanish routes with English ones
        $newContent = $newContent -replace "'/rubrica'", "'/rubric'"
        $newContent = $newContent -replace '"/rubrica"', '"/rubric"'
        $newContent = $newContent -replace "'/evaluaciones'", "'/evaluations'"
        $newContent = $newContent -replace '"/evaluaciones"', '"/evaluations"'
        $newContent = $newContent -replace "'/proyecto'", "'/project'"
        $newContent = $newContent -replace '"/proyecto"', '"/project"'
        $newContent = $newContent -replace "'/perfil'", "'/profile'"
        $newContent = $newContent -replace '"/perfil"', '"/profile"'
        $newContent = $newContent -replace "'/grupos'", "'/groups'"
        $newContent = $newContent -replace '"/grupos"', '"/groups"'
        $newContent = $newContent -replace "'/notificaciones'", "'/notifications'"
        $newContent = $newContent -replace '"/notificaciones"', '"/notifications"'
        $newContent = $newContent -replace "'/galeria'", "'/gallery'"
        $newContent = $newContent -replace '"/galeria"', '"/gallery"'
        $newContent = $newContent -replace "'/destacados'", "'/featured'"
        $newContent = $newContent -replace '"/destacados"', '"/featured"'
        $newContent = $newContent -replace "'/preguntas'", "'/questions'"
        $newContent = $newContent -replace '"/preguntas"', '"/questions"'
        $newContent = $newContent -replace "'/evaluacion-detalle'", "'/evaluation-details'"
        $newContent = $newContent -replace '"/evaluacion-detalle"', '"/evaluation-details"'
        $newContent = $newContent -replace "'/analisis-detallado'", "'/detailed-analysis'"
        $newContent = $newContent -replace '"/analisis-detallado"', '"/detailed-analysis"'
        $newContent = $newContent -replace "'/project/nuevo'", "'/project/new'"
        $newContent = $newContent -replace '"/project/nuevo"', '"/project/new"'

        if ($content -ne $newContent) {
            Set-Content -Path $file.FullName -Value $newContent -NoNewline
            Write-Host "Fixed routes in: $($file.Name)"
        }
    }
    catch {
        Write-Host "Error processing $($file.Name): $_"
    }
}
