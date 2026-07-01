import { useCallback, useEffect, useRef, useState } from "react"

/** One alternative transcription for a recognized chunk. */
interface SpeechRecognitionAlternativeLike {
    /** The transcribed text for this alternative. */
    transcript: string
}

/** A single recognition result (final or interim). */
interface SpeechRecognitionResultLike {
    /** Whether this result is final (true) or still being revised (false). */
    isFinal: boolean
    /** Indexable list of alternatives; `[0]` is the most confident. */
    [index: number]: SpeechRecognitionAlternativeLike
}

/** The result list carried by a recognition event. */
interface SpeechRecognitionResultListLike {
    /** Number of results accumulated so far. */
    length: number
    /** Indexable access to each result. */
    [index: number]: SpeechRecognitionResultLike
}

/** The `result` event fired as speech is transcribed. */
interface SpeechRecognitionEventLike {
    /** Index of the first result that changed in this event. */
    resultIndex: number
    /** All results recognized in the session. */
    results: SpeechRecognitionResultListLike
}

/** The `error` event fired when recognition fails. */
interface SpeechRecognitionErrorEventLike {
    /** Machine-readable error code (e.g. "not-allowed", "no-speech"). */
    error: string
}

/** Minimal shape of the browser `SpeechRecognition` instance we drive. */
interface SpeechRecognitionLike {
    /** BCP-47 language tag to recognize (e.g. "vi-VN", "en-US"). */
    lang: string
    /** Keep listening across pauses instead of stopping after the first phrase. */
    continuous: boolean
    /** Emit interim (not-yet-final) results for a live transcript. */
    interimResults: boolean
    /** Begin capturing from the microphone. */
    start: () => void
    /** Stop capturing and finalize the transcript. */
    stop: () => void
    /** Abort capturing without finalizing. */
    abort: () => void
    /** Called with each (interim/final) transcription update. */
    onresult: ((event: SpeechRecognitionEventLike) => void) | null
    /** Called when recognition errors. */
    onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
    /** Called when the recognition session ends. */
    onend: (() => void) | null
}

/** Constructor for a `SpeechRecognition` instance. */
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

/** Window augmented with the (vendor-prefixed) Speech Recognition constructors. */
interface WindowWithSpeechRecognition extends Window {
    /** Standard constructor (newer browsers). */
    SpeechRecognition?: SpeechRecognitionConstructor
    /** WebKit-prefixed constructor (Chrome/Safari). */
    webkitSpeechRecognition?: SpeechRecognitionConstructor
}

/** Options for {@link useSpeechRecognition}. */
export interface UseSpeechRecognitionOptions {
    /** BCP-47 language tag to recognize speech in (e.g. "vi-VN", "en-US"). */
    lang: string
}

/** Return value of {@link useSpeechRecognition}. */
export interface UseSpeechRecognitionResult {
    /** Whether the browser exposes the Web Speech API at all. */
    supported: boolean
    /** Whether the microphone is currently capturing. */
    listening: boolean
    /** The finalized transcript accumulated this session. */
    transcript: string
    /** The in-flight (not-yet-final) words, shown live while speaking. */
    interimTranscript: string
    /** Error code from the last failed recognition, or null. */
    error: string | null
    /** Start a fresh capture (clears the previous transcript). */
    start: () => void
    /** Stop capturing and finalize the transcript. */
    stop: () => void
    /** Clear the transcript + error without touching the mic. */
    reset: () => void
}

/**
 * Thin React wrapper over the browser Web Speech API (`SpeechRecognition`) for
 * speech-to-text. Keeps a finalized `transcript` plus a live `interimTranscript`
 * while the user is speaking. No audio is uploaded — transcription is fully
 * client-side; callers send the resulting `transcript` string to the backend.
 *
 * @param options - The language to recognize speech in.
 * @returns Recognition state + start/stop/reset controls.
 */
export const useSpeechRecognition = (
    { lang }: UseSpeechRecognitionOptions,
): UseSpeechRecognitionResult => {
    // the live recognition instance (null until the first start / when unsupported)
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
    // accumulates final chunks across the session so interim updates don't drop earlier words
    const finalRef = useRef("")

    const [supported, setSupported] = useState(false)
    const [listening, setListening] = useState(false)
    const [transcript, setTranscript] = useState("")
    const [interimTranscript, setInterimTranscript] = useState("")
    const [error, setError] = useState<string | null>(null)

    // detect support once on mount — the constructor only exists in the browser
    useEffect(() => {
        // SSR guard: `window` is undefined during server render
        if (typeof window === "undefined") {
            return
        }
        const speechWindow = window as WindowWithSpeechRecognition
        // prefer the standard constructor, fall back to the webkit-prefixed one
        const Ctor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
        setSupported(Boolean(Ctor))
    }, [])

    // tear down any live session when the component unmounts to release the mic
    useEffect(() => {
        return () => {
            recognitionRef.current?.abort()
        }
    }, [])

    const start = useCallback(() => {
        // no-op when the API is missing (UI shows an unsupported message instead)
        if (typeof window === "undefined") {
            return
        }
        const speechWindow = window as WindowWithSpeechRecognition
        const Ctor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
        if (!Ctor) {
            return
        }

        // reset accumulated state for a clean capture
        finalRef.current = ""
        setTranscript("")
        setInterimTranscript("")
        setError(null)

        const recognition = new Ctor()
        // recognize in the active UI locale; keep listening across natural pauses
        recognition.lang = lang
        recognition.continuous = true
        // surface interim words so the user sees their answer transcribed live
        recognition.interimResults = true

        recognition.onresult = (event) => {
            // rebuild the interim buffer each event; append only newly-final chunks
            let interim = ""
            for (let index = event.resultIndex; index < event.results.length; index++) {
                const result = event.results[index]
                const text = result[0]?.transcript ?? ""
                if (result.isFinal) {
                    // commit final text once; a trailing space keeps phrases separated
                    finalRef.current += text + " "
                } else {
                    // interim text is provisional and replaced on the next event
                    interim += text
                }
            }
            setTranscript(finalRef.current.trim())
            setInterimTranscript(interim)
        }

        recognition.onerror = (event) => {
            // store the code so the UI can explain (e.g. permission denied)
            setError(event.error)
            setListening(false)
        }

        recognition.onend = () => {
            // the session can end on its own (silence timeout) — reflect that in state
            setListening(false)
            setInterimTranscript("")
        }

        recognitionRef.current = recognition
        recognition.start()
        setListening(true)
    }, [lang])

    const stop = useCallback(() => {
        // graceful stop finalizes the last phrase via onend
        recognitionRef.current?.stop()
        setListening(false)
    }, [])

    const reset = useCallback(() => {
        // clear transcript + error but leave the mic untouched
        finalRef.current = ""
        setTranscript("")
        setInterimTranscript("")
        setError(null)
    }, [])

    return {
        supported,
        listening,
        transcript,
        interimTranscript,
        error,
        start,
        stop,
        reset,
    }
}
