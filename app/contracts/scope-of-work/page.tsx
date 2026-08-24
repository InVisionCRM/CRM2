'use client'

import { useState } from 'react'
import { buildScopeOfWorkPayload } from '@/lib/scope-of-work-form'
import ScopeOfWorkForm from '@/components/forms/ScopeOfWorkForm'
import { getLeadById } from '@/lib/db/leads'
import { notFound } from 'next/navigation'

interface ScopeOfWorkPageProps {
  searchParams: {
    leadId?: string
  }
}

export default function ScopeOfWorkPage({ searchParams }: ScopeOfWorkPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const data = buildScopeOfWorkPayload(event.currentTarget, searchParams?.leadId)

      const response = await fetch('/api/docuseal/scope-of-work', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit scope of work')
      }

      const result = await response.json()
      setSubmitStatus('success')
      console.log('✅ Scope of work submitted successfully:', result)
      
      // Reset form
      event.currentTarget.reset()
      
    } catch (error) {
      console.error('❌ Error submitting scope of work:', error)
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Scope of Work</h1>
        
        {submitStatus === 'success' && (
          <div className="alert alert-success mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Scope of work submitted successfully!</span>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="alert alert-error mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Error: {errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <ScopeOfWorkForm />
          
          <div className="flex justify-end">
            <button 
              type="submit" 
              className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Scope of Work'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
