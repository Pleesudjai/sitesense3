/**
 * EngineeringAssistant — AI-powered engineering Q&A with source attribution.
 * Answers building code, foundation, structural, and site condition questions.
 */

import { useState } from 'react'
import { askEngineering } from '../api'
import ProfessionalDisclaimer from './ProfessionalDisclaimer'

const SUGGESTED_QUESTIONS = [
  'What foundation type for expansive clay soil?',
  'Explain ASCE 7-22 seismic design categories',
  'What are the Arizona-specific construction considerations?',
  'How does soil bearing capacity affect foundation cost?',
]

const CONFIDENCE_STYLES = {
  HIGH:   'bg-green-900/50 border-green-700 text-green-300',
  MEDIUM: 'bg-yellow-900/50 border-yellow-700 text-yellow-300',
  LOW:    'bg-red-900/50 border-red-700 text-red-300',
}

const SOURCE_STYLES = {
  PUBLIC:     'bg-green-800 text-green-200',
  LICENSED:   'bg-yellow-800 text-yellow-200',
  CALCULATED: 'bg-blue-800 text-blue-200',
}

export default function EngineeringAssistant({ siteData, address }) {
  const [question, setQuestion]       = useState('')
  const [useSiteData, setUseSiteData] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [conversations, setConversations] = useState([])
  const [error, setError]             = useState(null)

  async function handleAsk(e) {
    e?.preventDefault()
    if (!question.trim()) return
    setLoading(true)
    setError(null)
    try {
      const context = useSiteData && siteData ? { ...siteData, address } : (address ? { address } : null)
      const res = await askEngineering(question, context)
      setConversations(prev => [{ q: question, ...res.data }, ...prev])
      setQuestion('')
    } catch (err) {
      setError(err.message || 'Engineering assistant request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-5">
      <div>
        <h2 className="font-bold text-lg text-teal">Engineering Q&A Assistant</h2>
        <p className="text-xs text-gray-400 mt-1">
          Ask about building codes, foundation design, structural loads, or site conditions
        </p>
      </div>

      {/* Suggested questions */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((sq, i) => (
          <button
            key={i}
            onClick={() => setQuestion(sq)}
            className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-full px-3 py-1.5 transition-colors"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Site data toggle */}
      {siteData && (
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={useSiteData}
            onChange={e => setUseSiteData(e.target.checked)}
            className="accent-teal-500"
          />
          Include site analysis data for grounded answers
        </label>
      )}

      {/* Input */}
      <form onSubmit={handleAsk} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Type your engineering question..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg px-5 py-2 transition-colors shrink-0"
        >
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-950/50 border border-red-700/50 rounded-lg p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          Analyzing your question...
        </div>
      )}

      {/* Conversation history */}
      <div className="space-y-4">
        {conversations.map((conv, i) => (
          <div key={i} className="space-y-2">
            {/* Question bubble — right aligned */}
            <div className="flex justify-end">
              <div className="bg-teal-900/20 border border-teal-700/30 rounded-lg px-4 py-2 max-w-[80%]">
                <p className="text-sm text-teal-200">{conv.q}</p>
              </div>
            </div>

            {/* Answer bubble — left aligned */}
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-lg px-4 py-3 max-w-[90%] space-y-2">
                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {conv.answer}
                </p>

                {/* Source badges */}
                {conv.sources && conv.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {conv.sources.map((src, j) => (
                      <span
                        key={j}
                        className={`text-xs font-medium rounded px-2 py-0.5 ${SOURCE_STYLES[src] || 'bg-gray-700 text-gray-300'}`}
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                )}

                {/* Confidence badge */}
                {conv.confidence && (
                  <div className="pt-1">
                    <span
                      className={`text-xs font-medium border rounded px-2 py-0.5 ${CONFIDENCE_STYLES[conv.confidence] || CONFIDENCE_STYLES.MEDIUM}`}
                    >
                      Confidence: {conv.confidence}
                    </span>
                  </div>
                )}

                <ProfessionalDisclaimer compact />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
