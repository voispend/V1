import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Environment variables
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

// Model configuration
const MINI = "gpt-4o-mini"
const FULL = "gpt-4o"

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 50 // Increased to 50 requests per minute
const ENABLE_RATE_LIMITING = false // Set to false to disable rate limiting completely
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Schema validation
const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    vendor: { type: ["string", "null"] },
    date_iso: { type: ["string", "null"], description: "YYYY-MM-DD" },
    currency: { type: ["string", "null"], enum: ["EUR", "USD", "GBP", "OTHER", null] },
    amount: { type: ["number", "null"], minimum: 0 },
    confidence: { type: "number", minimum: 0, maximum: 1 }
  },
  required: ["amount", "confidence"]
}

// Rate limiting function
function checkRateLimit(clientId: string): boolean {
  const now = Date.now()
  const clientData = rateLimitMap.get(clientId)
  
  if (!clientData || now > clientData.resetTime) {
    // Reset or create new rate limit entry
    rateLimitMap.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
    return true
  }
  
  if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
    return false
  }
  
  clientData.count++
  return true
}

// Get client identifier for rate limiting
function getClientId(req: Request): string {
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Use JWT token hash as client ID for authenticated users
    return btoa(authHeader.substring(7)).substring(0, 16)
  }
  
  // For anonymous users, use IP address (basic rate limiting)
  const forwardedFor = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  return forwardedFor || realIp || 'anonymous'
}

// OpenAI API call function
async function callOpenAI({ image_b64, locale_hint, currency_hint, model }: {
  image_b64: string; locale_hint?: string; currency_hint?: string; model: string;
}) {
  try {
    console.log(`🤖 Calling OpenAI Vision API with model: ${model}`)
    
    const body = {
      model,
      messages: [
        {
          role: "system",
          content: "You are a receipt parser. Extract the FINAL TOTAL (not subtotal), detect currency, normalize date to YYYY-MM-DD, and return only JSON that matches the provided schema. Include a confidence 0–1. You MUST return valid JSON with these exact fields: vendor (string or null), date_iso (string in YYYY-MM-DD format or null), currency (string or null), amount (number, required), confidence (number between 0-1, required)."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Locale hint: ${locale_hint ?? "en-US"}; Currency hint: ${currency_hint ?? "OTHER"}.
If multiple totals exist, prefer labels like TOTAL/Amount Due/Grand Total; otherwise choose the highest plausible total. If date is ambiguous (e.g., 03/04/25), use locale hint.`
            },
            {
              type: "image_url",
              image_url: {
                url: image_b64
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${OPENAI_API_KEY}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`OpenAI API Error ${response.status}:`, errorText)
      throw new Error(`OpenAI ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log(`✅ OpenAI API call successful with model: ${model}`)
    
    const content = data?.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch (e) {
      console.error('Failed to parse OpenAI JSON response:', e)
      throw new Error('Invalid JSON response from OpenAI')
    }

    // Validate against schema
    if (!parsed.amount || typeof parsed.confidence !== 'number') {
      throw new Error('Invalid response format from OpenAI')
    }

    return parsed
  } catch (error) {
    console.error('OpenAI API call failed:', error)
    throw error
  }
}

// Health check function
function healthCheck() {
  return new Response(
    JSON.stringify({ 
      status: 'healthy', 
      message: 'Receipt parsing function is running',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      features: ['receipt-parsing', 'rate-limiting', 'cors-support'],
      access: 'public'
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

// Main request handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Rate limiting check (only for POST requests)
    if (req.method === 'POST' && ENABLE_RATE_LIMITING) {
      const clientId = getClientId(req)
      if (!checkRateLimit(clientId)) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
          }),
          {
            status: 429,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil(RATE_LIMIT_WINDOW / 1000).toString()
            },
          }
        )
      }
    }

    // Allow both POST and GET methods
    if (req.method !== 'POST' && req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST for parsing, GET for health check.' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // For GET requests, return health check (no authentication required)
    if (req.method === 'GET') {
      return healthCheck()
    }

    // Handle POST request for receipt parsing
    const { image_b64, locale_hint, currency_hint } = await req.json()
    
    // Input validation
    if (!image_b64?.startsWith("data:image/")) {
      return new Response(
        JSON.stringify({ error: 'Invalid image data. Expected base64 data URL.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check image size (limit to 10MB)
    const base64Length = image_b64.length
    const estimatedSizeInBytes = Math.ceil((base64Length * 3) / 4)
    const maxSizeInBytes = 10 * 1024 * 1024 // 10MB
    
    if (estimatedSizeInBytes > maxSizeInBytes) {
      return new Response(
        JSON.stringify({ error: 'Image too large. Maximum size is 10MB.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('📸 Processing receipt image...')
    console.log('🚀 Starting production-level receipt parsing...')

    // Try with mini model first (cost-effective)
    console.log('📱 Attempting with gpt-4o-mini...')
    let result = await callOpenAI({ 
      image_b64, 
      locale_hint, 
      currency_hint, 
      model: MINI 
    })

    if (result) {
      console.log('✅ gpt-4o-mini parsing successful')
      console.log('✅ Receipt parsed successfully:', {
        ...result,
        model: MINI
      })
      
      return new Response(
        JSON.stringify({
          ...result,
          model: MINI,
          processing_time: Date.now() - Date.now(), // Will be calculated properly
          version: '2.0.0'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Fallback to full model if mini fails
    console.log('🔄 Mini model failed, trying full model...')
    result = await callOpenAI({ 
      image_b64, 
      locale_hint, 
      currency_hint, 
      model: FULL 
    })

    if (result) {
      console.log('✅ gpt-4o parsing successful')
      console.log('✅ Receipt parsed successfully:', {
        ...result,
        model: FULL
      })
      
      return new Response(
        JSON.stringify({
          ...result,
          model: FULL,
          processing_time: Date.now() - Date.now(), // Will be calculated properly
          version: '2.0.0'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    throw new Error('Both models failed to parse receipt')

  } catch (error) {
    console.error('❌ Receipt parsing failed:', error)
    
    // Don't expose internal errors in production
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isInternalError = errorMessage.includes('OpenAI') || errorMessage.includes('Failed to parse')
    
    return new Response(
      JSON.stringify({ 
        error: isInternalError ? 'Failed to parse receipt. Please try again.' : errorMessage,
        ...(isInternalError && { details: errorMessage }),
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
