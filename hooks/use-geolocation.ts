"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

interface GeolocationState {
  location: { lat: number; lng: number } | null
  error: string | null
  loading: boolean
  accuracy: number | null
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  watch?: boolean
  onSuccess?: (position: GeolocationPosition) => void
  onError?: (error: GeolocationPositionError) => void
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000, // 5 minutes
    watch = false,
    onSuccess,
    onError,
  } = options

  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false,
    accuracy: null,
  })

  const [watchId, setWatchId] = useState<number | null>(null)

  const handleSuccess = useCallback(
    (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords

      setState({
        location: { lat: latitude, lng: longitude },
        error: null,
        loading: false,
        accuracy,
      })

      onSuccess?.(position)
    },
    [onSuccess],
  )

  const handleError = useCallback(
    (error: GeolocationPositionError) => {
      let errorMessage = "Unable to retrieve your location"

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location access denied by user"
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information is unavailable"
          break
        case error.TIMEOUT:
          errorMessage = "Location request timed out"
          break
      }

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }))

      onError?.(error)
    },
    [onError],
  )

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      const error = "Geolocation is not supported by this browser"
      setState((prev) => ({
        ...prev,
        error,
        loading: false,
      }))
      toast.error(error)
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    })
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError])

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser")
      return
    }

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    const id = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    })

    setWatchId(id)
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError, watchId])

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
  }, [watchId])

  const clearLocation = useCallback(() => {
    setState({
      location: null,
      error: null,
      loading: false,
      accuracy: null,
    })
  }, [])

  // Auto-start location detection
  useEffect(() => {
    if (watch) {
      startWatching()
    } else {
      getCurrentPosition()
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, []) // Only run on mount

  return {
    ...state,
    getCurrentPosition,
    startWatching,
    stopWatching,
    clearLocation,
    isSupported: typeof navigator !== "undefined" && "geolocation" in navigator,
  }
}
