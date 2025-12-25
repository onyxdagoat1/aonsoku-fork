import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { getSongStreamUrl } from '@/api/httpClient'
import { getProxyURL } from '@/api/podcastClient'
import { MiniPlayerButton } from '@/app/components/mini-player/button'
import { RadioInfo } from '@/app/components/player/radio-info'
import { TrackInfo } from '@/app/components/player/track-info'
import { useAudioContext } from '@/app/hooks/use-audio-context'
import { useAudioEqualizer } from '@/app/hooks/use-audio-equalizer'
import { useAudioCrossfade } from '@/app/hooks/use-audio-crossfade'
import { usePlaybackSpeed } from '@/app/hooks/use-playback-speed'
import { podcasts } from '@/service/podcasts'
import {
  getVolume,
  usePlayerActions,
  usePlayerIsPlaying,
  usePlayerLoop,
  usePlayerMediaType,
  usePlayerRef,
  usePlayerSonglist,
  usePlayerStore,
  useReplayGainState,
} from '@/store/player.store'
import { LoopState } from '@/types/playerContext'
import { hasPiPSupport } from '@/utils/browser'
import { logger } from '@/utils/logger'
import { ReplayGainParams } from '@/utils/replayGain'
import { AudioPlayer } from './audio'
import { PlayerClearQueueButton } from './clear-queue-button'
import { PlayerControls } from './controls'
import { PlayerLikeButton } from './like-button'
import { PlayerLyricsButton } from './lyrics-button'
import { PodcastInfo } from './podcast-info'
import { PodcastPlaybackRate } from './podcast-playback-rate'
import { PlayerProgress } from './progress'
import { PlayerQueueButton } from './queue-button'
import { PlayerVolume } from './volume'
import { EqualizerControls } from './equalizer-controls'
import { SpeedControls } from './speed-controls'
import { CrossfadeControls } from './crossfade-controls'

const MemoTrackInfo = memo(TrackInfo)
const MemoRadioInfo = memo(RadioInfo)
const MemoPodcastInfo = memo(PodcastInfo)
const MemoPlayerControls = memo(PlayerControls)
const MemoPlayerProgress = memo(PlayerProgress)
const MemoPlayerLikeButton = memo(PlayerLikeButton)
const MemoPlayerQueueButton = memo(PlayerQueueButton)
const MemoPlayerClearQueueButton = memo(PlayerClearQueueButton)
const MemoPlayerVolume = memo(PlayerVolume)
const MemoPodcastPlaybackRate = memo(PodcastPlaybackRate)
const MemoLyricsButton = memo(PlayerLyricsButton)
const MemoMiniPlayerButton = memo(MiniPlayerButton)
const MemoAudioPlayer = memo(AudioPlayer)
const MemoEqualizerControls = memo(EqualizerControls)
const MemoSpeedControls = memo(SpeedControls)
const MemoCrossfadeControls = memo(CrossfadeControls)

export function Player() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const radioRef = useRef<HTMLAudioElement>(null)
  const podcastRef = useRef<HTMLAudioElement>(null)
  const [crossfadeDuration, setCrossfadeDuration] = useState(2)
  const [crossfadeEnabled, setCrossfadeEnabled] = useState(false)
  
  const {
    setAudioPlayerRef,
    setCurrentDuration,
    setProgress,
    setPlayingState,
    handleSongEnded,
    getCurrentProgress,
    getCurrentPodcastProgress,
  } = usePlayerActions()
  const { currentList, currentSongIndex, radioList, podcastList } =
    usePlayerSonglist()
  const isPlaying = usePlayerIsPlaying()
  const { isSong, isRadio, isPodcast } = usePlayerMediaType()
  const loopState = usePlayerLoop()
  const audioPlayerRef = usePlayerRef()
  const currentPlaybackRate = usePlayerStore().playerState.currentPlaybackRate
  const { replayGainType, replayGainPreAmp, replayGainDefaultGain } =
    useReplayGainState()

  const song = currentList[currentSongIndex]
  const radio = radioList[currentSongIndex]
  const podcast = podcastList[currentSongIndex]

  const getAudioRef = useCallback(() => {
    if (isRadio) return radioRef
    if (isPodcast) return podcastRef

    return audioRef
  }, [isPodcast, isRadio])

  // Audio context for Web Audio API features
  const { audioContextRef } = useAudioContext(audioRef.current)

  // Equalizer hook
  const {
    enabled: eqEnabled,
    toggleEnabled: toggleEqualizer,
    gains,
    setGain,
    activePreset,
    applyPreset,
    resetEqualizer,
  } = useAudioEqualizer(audioRef.current, audioContextRef.current)

  // Speed control hook (for songs and podcasts)
  const {
    speed,
    changeSpeed,
    resetSpeed,
    preservePitch,
    togglePreservePitch,
  } = usePlaybackSpeed(getAudioRef().current)

  // Crossfade hook
  const { fadeOut, fadeIn } = useAudioCrossfade(
    audioRef.current,
    audioContextRef.current,
    { duration: crossfadeDuration, enabled: crossfadeEnabled },
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: audioRef needed
  useEffect(() => {
    if (!isSong && !song) return

    if (audioPlayerRef === null && audioRef.current)
      setAudioPlayerRef(audioRef.current)
  }, [audioPlayerRef, audioRef, isSong, setAudioPlayerRef, song])

  useEffect(() => {
    const audio = podcastRef.current
    if (!audio || !isPodcast) return

    audio.playbackRate = currentPlaybackRate
  }, [currentPlaybackRate, isPodcast])

  const setupDuration = useCallback(() => {
    const audio = getAudioRef().current
    if (!audio) return

    const audioDuration = Math.floor(audio.duration)
    const infinityDuration = audioDuration === Infinity

    if (!infinityDuration) {
      setCurrentDuration(audioDuration)
    }

    if (isPodcast && infinityDuration && podcast) {
      setCurrentDuration(podcast.duration)
    }

    if (isPodcast) {
      const podcastProgress = getCurrentPodcastProgress()

      logger.info('[Player] - Resuming episode from:', {
        seconds: podcastProgress,
      })

      setProgress(podcastProgress)
      audio.currentTime = podcastProgress
    } else {
      const progress = getCurrentProgress()
      audio.currentTime = progress
    }
  }, [
    getAudioRef,
    isPodcast,
    podcast,
    setCurrentDuration,
    getCurrentPodcastProgress,
    setProgress,
    getCurrentProgress,
  ])

  const setupProgress = useCallback(() => {
    const audio = getAudioRef().current
    if (!audio) return

    const currentProgress = Math.floor(audio.currentTime)
    setProgress(currentProgress)
  }, [getAudioRef, setProgress])

  const setupInitialVolume = useCallback(() => {
    const audio = getAudioRef().current
    if (!audio) return

    audio.volume = getVolume() / 100
  }, [getAudioRef])

  const sendFinishProgress = useCallback(() => {
    if (!isPodcast || !podcast) return

    podcasts
      .saveEpisodeProgress(podcast.id, podcast.duration)
      .then(() => {
        logger.info('Complete progress sent:', podcast.duration)
      })
      .catch((error) => {
        logger.error('Error sending complete progress', error)
      })
  }, [isPodcast, podcast])

  // Handle crossfade on song end
  const handleSongEndedWithCrossfade = useCallback(async () => {
    if (crossfadeEnabled && isSong) {
      await fadeOut(crossfadeDuration)
      handleSongEnded()
      await fadeIn(1, crossfadeDuration)
    } else {
      handleSongEnded()
    }
  }, [crossfadeEnabled, crossfadeDuration, fadeOut, fadeIn, handleSongEnded, isSong])

  function getTrackReplayGain(): ReplayGainParams {
    const preAmp = replayGainPreAmp
    const defaultGain = replayGainDefaultGain

    if (!song || !song.replayGain) {
      return { gain: defaultGain, peak: 1, preAmp }
    }

    if (replayGainType === 'album') {
      const { albumGain = defaultGain, albumPeak = 1 } = song.replayGain
      return { gain: albumGain, peak: albumPeak, preAmp }
    }

    const { trackGain = defaultGain, trackPeak = 1 } = song.replayGain
    return { gain: trackGain, peak: trackPeak, preAmp }
  }

  return (
    <footer className="h-[--player-height] w-full flex items-center fixed bottom-0 left-0 right-0 z-40 pointer-events-none px-4 pb-4">
      <div className="w-full h-full grid grid-cols-player gap-2 px-4 bg-background/95 backdrop-blur-md border rounded-2xl shadow-2xl pointer-events-auto">
        {/* Track Info */}
        <div className="flex items-center gap-2 w-full">
          {isSong && <MemoTrackInfo song={song} />}
          {isRadio && <MemoRadioInfo radio={radio} />}
          {isPodcast && <MemoPodcastInfo podcast={podcast} />}
        </div>
        {/* Main Controls */}
        <div className="col-span-2 flex flex-col justify-center items-center px-4 gap-1">
          <MemoPlayerControls
            song={song}
            radio={radio}
            podcast={podcast}
            audioRef={getAudioRef()}
          />

          {(isSong || isPodcast) && (
            <MemoPlayerProgress audioRef={getAudioRef()} />
          )}
        </div>
        {/* Remain Controls and Volume */}
        <div className="flex items-center w-full justify-end">
          <div className="flex items-center gap-1">
            {isSong && (
              <>
                <MemoPlayerLikeButton disabled={!song} />
                <MemoLyricsButton disabled={!song} />
                
                {/* New Audio Enhancement Controls */}
                <MemoEqualizerControls
                  enabled={eqEnabled}
                  onToggleEnabled={toggleEqualizer}
                  gains={gains}
                  onGainChange={setGain}
                  activePreset={activePreset}
                  onPresetChange={applyPreset}
                  onReset={resetEqualizer}
                />
                
                <MemoSpeedControls
                  speed={speed}
                  onSpeedChange={changeSpeed}
                  preservePitch={preservePitch}
                  onTogglePreservePitch={togglePreservePitch}
                  onReset={resetSpeed}
                />
                
                <MemoCrossfadeControls
                  enabled={crossfadeEnabled}
                  onToggleEnabled={() => setCrossfadeEnabled(prev => !prev)}
                  duration={crossfadeDuration}
                  onDurationChange={setCrossfadeDuration}
                />
                
                <MemoPlayerQueueButton disabled={!song} />
              </>
            )}
            {isPodcast && <MemoPodcastPlaybackRate />}
            {(isRadio || isPodcast) && (
              <MemoPlayerClearQueueButton disabled={!radio && !podcast} />
            )}

            <MemoPlayerVolume
              audioRef={getAudioRef()}
              disabled={!song && !radio && !podcast}
            />

            {isSong && hasPiPSupport && <MemoMiniPlayerButton />}
          </div>
        </div>
      </div>

      {isSong && song && (
        <MemoAudioPlayer
          replayGain={getTrackReplayGain()}
          src={getSongStreamUrl(song.id)}
          autoPlay={isPlaying}
          audioRef={audioRef}
          loop={loopState === LoopState.One}
          onPlay={() => setPlayingState(true)}
          onPause={() => setPlayingState(false)}
          onLoadedMetadata={setupDuration}
          onTimeUpdate={setupProgress}
          onEnded={handleSongEndedWithCrossfade}
          onLoadStart={setupInitialVolume}
          data-testid="player-song-audio"
        />
      )}

      {isRadio && radio && (
        <MemoAudioPlayer
          src={radio.streamUrl}
          autoPlay={isPlaying}
          audioRef={radioRef}
          onPlay={() => setPlayingState(true)}
          onPause={() => setPlayingState(false)}
          onLoadStart={setupInitialVolume}
          data-testid="player-radio-audio"
        />
      )}

      {isPodcast && podcast && (
        <MemoAudioPlayer
          src={getProxyURL(podcast.audio_url)}
          autoPlay={isPlaying}
          audioRef={podcastRef}
          preload="auto"
          onPlay={() => setPlayingState(true)}
          onPause={() => setPlayingState(false)}
          onLoadedMetadata={setupDuration}
          onTimeUpdate={setupProgress}
          onEnded={() => {
            sendFinishProgress()
            handleSongEnded()
          }}
          onLoadStart={setupInitialVolume}
          data-testid="player-podcast-audio"
        />
      )}
    </footer>
  )
}
