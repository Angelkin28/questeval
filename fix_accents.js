const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = "c:\\Users\\angel\\Desktop\\QuestEval\\Frontend\\src";
const MOBILE_DIR = "c:\\Users\\angel\\Desktop\\QuestEval\\mobile\\lib";

const wordsToFix = {
    'Evaluaciones': 'Evaluaciones', // fine
    'Evaluacion': 'Evaluación',
    'evaluaciones': 'evaluaciones', // We don't change 'evaluaciones' natively?? Wait, 'evaluacion' -> 'evaluación', 'evaluaciones' -> 'evaluaciones'. IN SPANISH, "evaluaciones" DOES NOT HAVE AN ACCENT! Yes! "evaluación" (singular) has accent, "evaluaciones" (plural) DOES NOT. Oh! This is why! I feel so dumb. "evaluación" -> "evaluaciones". The accent goes away in plural!
    
    'Configuraciones': 'Configuraciones', // No accent in plural
    'Configuracion': 'Configuración',
    'configuracion': 'configuración',
    
    'Exitos': 'Éxitos',
    'exitos': 'éxitos',
    'Exito': 'Éxito',
    'exito': 'éxito',
    
    'Acciones': 'Acciones', // No accent
    'Accion': 'Acción',
    'accion': 'acción',
    
    'Tambien': 'También',
    'tambien': 'también',
    
    'Aqui': 'Aquí',
    'aqui': 'aquí',
    
    'Rubrica': 'Rúbrica',
    'rubrica': 'rúbrica',
    'Rubricas': 'Rúbricas',
    'rubricas': 'rúbricas',
    
    'Calificacion': 'Calificación',
    'Calificaciones': 'Calificaciones', // No accent
    'calificacion': 'calificación',
    
    'Opcion': 'Opción',
    'Opciones': 'Opciones', // No accent
    'opcion': 'opción',
    
    'Version': 'Versión',
    'Versiones': 'Versiones', // No accent
    'version': 'versión',
    
    'Informacion': 'Información',
    'Informaciones': 'Informaciones', // No accent
    'informacion': 'información',
    
    'Descripcion': 'Descripción',
    'Descripciones': 'Descripciones', // No accent
    'descripcion': 'descripción',
    
    'Galeria': 'Galería',
    'galeria': 'galería',
    'Galerias': 'Galerías',
    'galerias': 'galerías', // Yes, retains accent
    
    'Atras': 'Atrás',
    'atras': 'atrás',
    'esito': 'éxito',
};

const riskyLowercase = ['evaluacion', 'configuracion', 'accion', 'rubrica', 'rubricas', 'calificacion', 'opcion', 'version', 'informacion', 'descripcion', 'galeria', 'atras', 'exito', 'galerias', 'exitos'];

function processContent(content, isDart) {
    let newContent = content;

    const replaceCb = (match) => {
        let replacedStr = match;
        for (const [bad, good] of Object.entries(wordsToFix)) {
            if (bad === good) continue;
            
            const regex = new RegExp(`\\b${bad}\\b`, 'g');
            replacedStr = replacedStr.replace(regex, (m, offset, str) => {
                if (!isDart) {
                    let openBrackets = 0;
                    for (let i = 0; i < offset; i++) {
                        if (str[i] === '{') openBrackets++;
                        if (str[i] === '}') openBrackets--;
                    }
                    if (openBrackets > 0) return m; 
                }
                
                if (riskyLowercase.includes(bad)) {
                    // For UI literal patches... prevent changing API paths or variable injections
                    if (match.startsWith("'") || match.startsWith('"') || match.startsWith('\`')) {
                        // Protect against API JSON keys or URLs like '/evaluacion'
                        return m; 
                    }
                }
                
                return good;
            });
        }
        return replacedStr;
    };

    newContent = newContent.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, replaceCb);
    newContent = newContent.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, replaceCb);
    if (!isDart) {
        newContent = newContent.replace(/>([^<]+)</g, replaceCb);
    }

    return newContent;
}

function processFile(filepath) {
    try {
        let content = fs.readFileSync(filepath, 'utf-8');
        let newContent = content;

        if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
            newContent = processContent(content, false);
        } else if (filepath.endsWith('.dart')) {
             newContent = processContent(content, true);
        }

        if (content !== newContent) {
            fs.writeFileSync(filepath, newContent, 'utf-8');
            console.log(`Fixed: ${filepath}`);
        }
    } catch (err) {
        console.error(`Error reading ${filepath}: ${err}`);
    }
}

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        if (filepath.includes('node_modules') || filepath.includes('.next')) continue;
        if (fs.statSync(filepath).isDirectory()) {
            walkDir(filepath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.dart')) {
            processFile(filepath);
        }
    }
}

walkDir(FRONTEND_DIR);
walkDir(MOBILE_DIR);
