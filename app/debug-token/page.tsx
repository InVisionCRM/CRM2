"use client"

import { useState, useEffect } from "react"

export default function DebugTokenPage() {
  const [sessionData, setSessionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      // Try to get session data from multiple sources
      const sources = [
        () => localStorage.getItem('next-auth.session-token'),
        () => localStorage.getItem('__Secure-next-auth.session-token'),
        () => {
          const cookies = document.cookie.split(';')
          const sessionCookie = cookies.find(cookie => 
            cookie.trim().startsWith('next-auth.session-token=')
          )
          return sessionCookie ? sessionCookie.split('=')[1] : null
        },
        () => {
          const cookies = document.cookie.split(';')
          const sessionCookie = cookies.find(cookie => 
            cookie.trim().startsWith('__Secure-next-auth.session-token=')
          )
          return sessionCookie ? sessionCookie.split('=')[1] : null
        }
      ]

      let session = null
      let source = ''

      for (let i = 0; i < sources.length; i++) {
        try {
          const data = sources[i]()
          if (data) {
            session = JSON.parse(data)
            source = `Source ${i + 1}`
            break
          }
        } catch (e) {
          console.log(`Source ${i + 1} failed:`, e)
        }
      }

      setSessionData({ session, source })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert("Access token copied to clipboard!")
    } catch (err) {
      alert("Failed to copy token")
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading session data...</div>
      </div>
    )
  }

  const accessToken = sessionData?.session?.accessToken

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Google Access Token Debug</h1>
      
      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <h3>Access Token Status</h3>
        <p><strong>Found:</strong> {accessToken ? 'Yes' : 'No'}</p>
        <p><strong>Source:</strong> {sessionData?.source || 'None'}</p>
        <p><strong>Token Length:</strong> {accessToken ? accessToken.length : 0} characters</p>
        
        {accessToken && (
          <div style={{ marginTop: '10px' }}>
            <button 
              onClick={() => copyToClipboard(accessToken)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Copy Token
            </button>
            <button 
              onClick={() => {
                const textarea = document.createElement('textarea')
                textarea.value = accessToken
                document.body.appendChild(textarea)
                textarea.select()
                document.execCommand('copy')
                document.body.removeChild(textarea)
                alert('Token copied!')
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Copy (Fallback)
            </button>
          </div>
        )}
      </div>

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <h3>Session Data</h3>
        <pre style={{ 
          backgroundColor: 'white', 
          padding: '10px', 
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '12px'
        }}>
          {JSON.stringify(sessionData?.session, null, 2)}
        </pre>
      </div>

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <h3>LocalStorage Keys</h3>
        <p>NextAuth related keys:</p>
        <ul>
          {Object.keys(localStorage)
            .filter(key => key.includes('next-auth'))
            .map(key => (
              <li key={key}>{key}</li>
            ))}
        </ul>
      </div>

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <h3>Cookies</h3>
        <p>Session related cookies:</p>
        <ul>
          {document.cookie.split(';')
            .filter(cookie => cookie.includes('next-auth'))
            .map(cookie => (
              <li key={cookie}>{cookie.trim()}</li>
            ))}
        </ul>
      </div>

      {accessToken && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#d4edda', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>Next Steps</h3>
          <ol>
            <li>Copy the access token above</li>
            <li>Add it to your <code>.env.local</code> file:</li>
            <li style={{ marginLeft: '20px' }}>
              <code>GOOGLE_ACCESS_TOKEN=your_token_here</code>
            </li>
            <li>Run the migration script:</li>
            <li style={{ marginLeft: '20px' }}>
              <code>npm run create-chat-spaces</code>
            </li>
          </ol>
        </div>
      )}

      {!accessToken && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#fff3cd', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>No Access Token Found</h3>
          <p>Try these steps:</p>
          <ul>
            <li>Sign out and sign back in</li>
            <li>Make sure you granted Google permissions</li>
            <li>Check if you're properly authenticated</li>
            <li>Try accessing a different page first</li>
          </ul>
        </div>
      )}
    </div>
  )
} 