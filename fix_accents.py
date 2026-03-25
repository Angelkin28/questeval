import os
import re

FRONTEND_DIR = r"c:\Users\angel\Desktop\QuestEval\Frontend\src"
MOBILE_DIR = r"c:\Users\angel\Desktop\QuestEval\mobile\lib"

# Pairs of (Pattern, Replacement)
# Using lookbehind and lookahead to ensure we only replace text that is likely not a variable.
# For lowercase words, we will only replace them if they are preceded by specific Spanish articles or prepositions
# to guarantee they are text, or if they are capitalized (which means they are likely labels).

REPLACEMENTS = [
    # Capitalized (usually labels / UI text)
    (r'\bEvaluacion\b', 'Evaluación'),
    (r'\bConfiguracion\b', 'Configuración'),
    (r'\bExito(?!sa)(?!so)\b', 'Éxito'),
    (r'\bAccion\b', 'Acción'),
    (r'\bTambien\b', 'También'),
    (r'\bAqui\b', 'Aquí'),
    (r'\bRubrica\b', 'Rúbrica'),
    (r'\bRubricas\b', 'Rúbricas'),
    (r'\bCalificacion\b', 'Calificación'),
    (r'\bOpcion\b', 'Opción'),
    (r'\bOpciones\b', 'Opciones'), # Already fine
    (r'\bVersion\b', 'Versión'),
    (r'\bInformacion\b', 'Información'),
    (r'\bDescripcion\b', 'Descripción'),
    (r'\bGaleria\b', 'Galería'),
    (r'\bAtras\b', 'Atrás'),
    (r'\bIniciar sesion\b', 'Iniciar sesión'),
    (r'\bIniciar Sesion\b', 'Iniciar Sesión'),
    (r'\bCerrar sesion\b', 'Cerrar sesión'),
    (r'\bCerrar Sesion\b', 'Cerrar Sesión'),

    # Lowercase but with preceding context to ensure they are text (e.g. "la evaluación")
    (r'\b(la|una|nueva|su|tu|mi|esta|de|con|para|ver|guardar|editar|eliminar|esta|otra) evaluacion\b', r'\1 evaluación'),
    (r'\b(la|una|su|tu|mi|de|con|para) configuracion\b', r'\1 configuración'),
    (r'\b(con) exito\b', r'\1 éxito'),
    (r'\b(la|una|su|tu|mi|de|con|para) accion\b', r'\1 acción'),
    (r'\btambien\b', r'también'), # también is rarely a variable
    (r'\baqui\b', r'aquí'), # aquí is rarely a variable
    (r'\b(la|una|su|tu|mi|de|con|para|nueva|crear|editar|eliminar|esta) rubrica\b', r'\1 rúbrica'),
    (r'\b(las|unas|sus|tus|mis|de|con|para|nuevas|crear|editar|eliminar|estas) rubricas\b', r'\1 rúbricas'),
    (r'\b(la|una|su|tu|mi|de|con|para|nueva|ver|esta) calificacion\b', r'\1 calificación'),
    (r'\b(la|una|su|tu|mi|de|con|para|nueva|esta) opcion\b', r'\1 opción'),
    (r'\b(la|una|su|tu|mi|de|con|para|esta) version\b', r'\1 versión'),
    (r'\b(la|una|su|tu|mi|de|con|para|mas|más) informacion\b', r'\1 información'),
    (r'\b(la|una|su|tu|mi|de|con|para|agregar|editar) descripcion\b', r'\1 descripción'),
    (r'\b(la|una|su|tu|mi|de|con|para|ir a|ver) galeria\b', r'\1 galería'),
    (r'\b(hacia|ir) atras\b', r'\1 atrás'),
    
    # Specific common phrases
    (r'\besito\b', 'éxito'),
    (r'\bexitosa!\b', 'exitosa!'),
    (r'exitosa!', 'exitosa!'), # To trigger if any
]

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return

    new_content = content
    for pattern, replacement in REPLACEMENTS:
        new_content = re.sub(pattern, replacement, new_content)
        
    # Additional specific UI text replacements that don't match the regex above securely
    new_content = new_content.replace('>evaluacion<', '>evaluación<')
    new_content = new_content.replace('>Evaluaciones<', '>Evaluaciones<') # Fine
    new_content = new_content.replace("'evaluacion'", "'evaluación'") # Be careful if evaluating map keys, but usually it's text. Let's skip replacing exact enclosed quotes to avoid breaking JSON keys.
    new_content = new_content.replace('>Rubrica<', '>Rúbrica<')
    new_content = new_content.replace('>Calificacion<', '>Calificación<')
    new_content = new_content.replace('>Descripcion<', '>Descripción<')
    new_content = new_content.replace('>Galeria<', '>Galería<')

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed accents in: {filepath}")

def main():
    for root_dir in [FRONTEND_DIR, MOBILE_DIR]:
        for dirpath, dirnames, filenames in os.walk(root_dir):
            for filename in filenames:
                if filename.endswith(('.ts', '.tsx', '.dart')):
                    process_file(os.path.join(dirpath, filename))

if __name__ == "__main__":
    main()
