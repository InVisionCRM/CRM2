import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Initialize Gemini AI with the API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

const CONSTRUCTION_SYSTEM_PROMPT = `You are an expert construction consultant specializing in roofing, siding, gutters, and general contracting in Southeast Michigan. 

Your expertise includes:
- Roofing systems (asphalt shingles, metal roofing, flat roofs, etc.)
- Siding installation and repair (vinyl, fiber cement, wood, etc.)
- Gutter systems and maintenance
- Insurance claims and storm damage assessment
- Michigan building codes and regulations
- Local weather considerations (snow loads, ice dams, wind resistance)
- Business practices for construction companies
- Project estimation and pricing
- Customer service best practices
- Material selection for Michigan climate

You should:
- Provide practical, actionable advice
- Consider Michigan's climate and building requirements
- Offer cost-effective solutions
- Emphasize safety and code compliance
- Be professional yet approachable
- Ask clarifying questions when needed
- Provide specific recommendations with reasoning

Keep responses concise but comprehensive. If you don't know something specific to Michigan regulations, recommend consulting local building officials.`

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate API key
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error('Google Gemini API key is not configured')
      return NextResponse.json(
        { error: 'AI service is not properly configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { message, conversationHistory = [] } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      )
    }

    // Get the generative model - using latest gemini-1.5-pro
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
    })

    // Build conversation context
    let conversationContext = CONSTRUCTION_SYSTEM_PROMPT + '\n\n'
    
    // Add conversation history
    if (conversationHistory.length > 0) {
      conversationContext += 'Previous conversation:\n'
      conversationHistory.forEach((msg: { role: string; content: string }) => {
        conversationContext += `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}\n`
      })
      conversationContext += '\n'
    }

    // Add current message
    conversationContext += `Human: ${message}\n\nAssistant:`

    console.log('Sending request to Gemini API...')
    
    // Generate content
    const result = await model.generateContent(conversationContext)
    const response = result.response
    const text = response.text()

    if (!text) {
      throw new Error('No response generated from Gemini API')
    }

    console.log('Successfully generated response from Gemini API')

    return NextResponse.json({
      message: text.trim(),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Gemini API Error:', error)
    
    // Handle specific API errors
    if (error instanceof Error) {
      if (error.message.includes('API key not valid')) {
        return NextResponse.json(
          { error: 'AI service authentication failed. Please check configuration.' },
          { status: 500 }
        )
      }
      
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'AI service quota exceeded. Please try again later.' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to process your request. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 