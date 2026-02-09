import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TEST_EMAIL = 'demo@questeval.edu'
const TEST_PASSWORD = 'demo1234'

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: 'var(--qe-background)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 20,
  },
  logo: {
    height: 96,
    objectFit: 'contain',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: '16px 20px',
    borderRadius: 12,
    border: '1px solid var(--qe-outline)',
    background: 'var(--qe-surface)',
    color: 'var(--qe-on-surface)',
    fontSize: 16,
  },
  button: {
    width: '100%',
    padding: '18px 24px',
    borderRadius: 12,
    border: 'none',
    background: 'var(--qe-primary)',
    color: 'var(--qe-on-primary)',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
  link: {
    background: 'none',
    border: 'none',
    padding: 8,
    cursor: 'pointer',
    fontSize: 13,
    color: 'var(--qe-primary)',
    textDecoration: 'underline',
  },
  error: {
    fontSize: 13,
    color: 'var(--qe-error)',
    textAlign: 'center',
  },
  footer: {
    fontSize: 13,
    color: 'var(--qe-on-surface-variant)',
    textAlign: 'center',
  },
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [logoError, setLogoError] = useState(false)

  const fillTestData = () => {
    setEmail(TEST_EMAIL)
    setPassword(TEST_PASSWORD)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    if (!trimmedEmail) {
      setError('Introduce tu correo electrónico.')
      return
    }
    if (!trimmedPassword) {
      setError('Introduce tu contraseña.')
      return
    }

    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: trimmedPassword,
    })
    setLoading(false)

    if (signInError) {
      setError(signInError.message || 'Correo o contraseña incorrectos.')
      return
    }
    navigate('/app', { replace: true })
  }

  return (
    <div style={styles.wrap}>
      <form style={styles.card} onSubmit={handleSubmit}>
        {logoError ? (
          <h1 style={{ margin: '0 0 24px', fontSize: 26, fontWeight: 600, color: 'var(--qe-on-surface)', textAlign: 'center' }}>
            QuestEval
          </h1>
        ) : (
          <img
            src="/questeval.jpeg"
            alt="QuestEval"
            style={styles.logo}
            onError={() => setLogoError(true)}
          />
        )}
        <button type="button" style={styles.link} onClick={fillTestData}>
          Usar datos de prueba
        </button>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          autoComplete="email"
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          autoComplete="current-password"
          disabled={loading}
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </button>
        {error && <p style={styles.error}>{error}</p>}
        <p style={styles.footer}>Acceso para uso institucional</p>
      </form>
    </div>
  )
}
